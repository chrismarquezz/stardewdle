import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async () => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { Attributes } = await ddb.send(new UpdateCommand({
      TableName: "daily_words",
      Key: { date: today },
      UpdateExpression: "SET bundle_completions = if_not_exists(bundle_completions, :zero) + :inc",
      ExpressionAttributeValues: { ":inc": 1, ":zero": 0 },
      ReturnValues: "UPDATED_NEW",
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ newTotal: Attributes.bundle_completions }),
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
