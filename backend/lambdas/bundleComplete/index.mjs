import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event = {}) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const body = event.body ? JSON.parse(event.body) : {};
    const wasSuccessful = body.success === true;

    const updateExpressionParts = [
      "bundle_completions = if_not_exists(bundle_completions, :zero) + :inc",
    ];

    if (wasSuccessful) {
      updateExpressionParts.push("bundle_successes = if_not_exists(bundle_successes, :zero) + :inc");
    }

    const { Attributes } = await ddb.send(new UpdateCommand({
      TableName: "daily_words",
      Key: { date: today },
      UpdateExpression: `SET ${updateExpressionParts.join(", ")}`,
      ExpressionAttributeValues: { ":inc": 1, ":zero": 0 },
      ReturnValues: "ALL_NEW",
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({
        newTotal: Attributes.bundle_completions,
        newSuccesses: Attributes.bundle_successes ?? 0,
      }),
    };
  } catch (err) {
    console.error("Error incrementing bundle completions:", err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Internal server error." }),
    };
  }
};
