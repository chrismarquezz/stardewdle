import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, GetCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  const today = new Date().toISOString().split("T")[0];

  const wordParams = {
    TableName: "daily_words",
    Key: { date: today }
  };

  const statsParams = {
    TableName: "stardewdleCounts",
    Key: { word: "total_plays" }
  };

  try {
    const [wordData, statsData] = await Promise.all([
      docClient.send(new GetCommand(wordParams)),
      docClient.send(new GetCommand(statsParams))
    ]);

    if (!wordData.Item) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Word not found for today" }),
      };
    }

    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        word: wordData.Item.word,
        correct_guesses: wordData.Item.correct_guesses ?? 0,
        total_guesses: wordData.Item.totalAttempts ?? 0,

        global_total_plays: statsData.Item?.occurrences ?? 0
      }),
    };
  } catch (err) {
    console.error("Error fetching daily data:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal server error" }),
    };
  }
};