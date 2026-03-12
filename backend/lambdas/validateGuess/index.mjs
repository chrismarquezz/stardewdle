import fetch from "node-fetch";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const cropsResponse = await fetch(process.env.CROPS_API_URL + "/crops");
if (!cropsResponse.ok) {
    throw new Error(`Failed to fetch crops from Lambda: ${cropsResponse.statusText}`);
}
const crops = await cropsResponse.json();

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const compareNumbers = (a, b) => {
  if (a === b) return "match";
  return a > b ? "higher" : "lower";
};

const compareSeasons = (a, b) => {
  const SEASONS = ["spring", "summer", "fall", "winter"];

  const normalizeArray = (arr) => {
    if (arr.includes("all")) {
      return new Set(SEASONS);
    }
    return new Set(arr);
  };

  const aSet = normalizeArray(a);
  const bSet = normalizeArray(b);

  const overlap = [...aSet].filter(season => bSet.has(season));

  if (overlap.length === aSet.size && aSet.size === bSet.size) {
    return "match";
  }
  if (overlap.length > 0) {
    return "partial";
  }
  return "mismatch";
};

export const handler = async (event) => {
  try {
    const { guess, guessNum } = JSON.parse(event.body);

    if (!guess) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing or invalid 'guess'." }),
      };
    }

    if (guessNum !== undefined && (typeof guessNum !== 'number' || guessNum < 1)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid 'guessNum'. Must be a positive number." }),
        };
    }

    const guessedCrop = crops.find(c => c.name === guess.toLowerCase());
    if (!guessedCrop) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Invalid crop name." }),
      };
    }

    const today = new Date().toISOString().split("T")[0];
    const { Item } = await ddb.send(new GetCommand({
      TableName: "daily_words",
      Key: { date: today }
    }));

    if (!Item || !Item.word) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "No word found for today." }),
      };
    }

    const answerCrop = crops.find(c => c.name === Item.word);
    if (!answerCrop) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Answer crop not found in dataset." }),
      };
    }

    const result = {
      growth_time: compareNumbers(guessedCrop.growth_time, answerCrop.growth_time),
      base_price: compareNumbers(guessedCrop.base_price, answerCrop.base_price),
      regrows: guessedCrop.regrows === answerCrop.regrows ? "match" : "mismatch",
      type: guessedCrop.type === answerCrop.type ? "match" : "mismatch",
      season: compareSeasons(guessedCrop.season, answerCrop.season),
    };

    const isFullyCorrect = Object.values(result).every(val => val === "match");

    let UpdateExpression = "SET ";
    const ExpressionAttributeValues = {};
    const ExpressionAttributeNames = {};
    const UpdateExpressions = [];

    if (isFullyCorrect) {
      UpdateExpressions.push("correct_guesses = if_not_exists(correct_guesses, :zero) + :inc");
      ExpressionAttributeValues[":inc"] = 1;
      ExpressionAttributeValues[":zero"] = 0;
    }

    if (isFullyCorrect || guessNum === 6) {
        UpdateExpressions.push("totalAttempts = if_not_exists(totalAttempts, :zeroTotal) + :incTotal");
        ExpressionAttributeValues[":incTotal"] = 1;
        ExpressionAttributeValues[":zeroTotal"] = 0;
    }

    if (UpdateExpressions.length > 0) {
        await ddb.send(new UpdateCommand({
            TableName: "daily_words",
            Key: { date: today },
            UpdateExpression: UpdateExpression + UpdateExpressions.join(", "),
            ExpressionAttributeValues: ExpressionAttributeValues,
            ExpressionAttributeNames: Object.keys(ExpressionAttributeNames).length > 0 ? ExpressionAttributeNames : undefined,
        }));
    }

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ result }),
    };
  } catch (err) {
    console.error("Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Internal server error." }),
    };
  }
};