import fetch from "node-fetch";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  GetCommand,
  UpdateCommand,
} from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

const ANALYTICS_TABLE = "stardewdleCounts";
const WORDS_TABLE = "daily_words";

export const handler = async () => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayISO = today.toISOString().split("T")[0];

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayISO = yesterday.toISOString().split("T")[0];

    const { Item: yesterdayItem } = await ddb.send(new GetCommand({
      TableName: WORDS_TABLE,
      Key: { date: yesterdayISO },
    }));

    if (yesterdayItem) {
      const yesterdayPlays = yesterdayItem.totalAttempts || 0;

      await Promise.all([
        ddb.send(new UpdateCommand({
          TableName: ANALYTICS_TABLE,
          Key: { word: "total_plays" },
          UpdateExpression: "ADD #plays :val",
          ExpressionAttributeNames: { "#plays": "occurrences" },
          ExpressionAttributeValues: { ":val": yesterdayPlays },
        })),
        ddb.send(new UpdateCommand({
          TableName: ANALYTICS_TABLE,
          Key: { word: yesterdayItem.word },
          UpdateExpression: "ADD #count :inc",
          ExpressionAttributeNames: { "#count": "occurrences" },
          ExpressionAttributeValues: { ":inc": 1 },
        }))
      ]);
      console.log(`Archived ${yesterdayPlays} plays for ${yesterdayItem.word} from ${yesterdayISO}`);
    }

    const cropsResponse = await fetch(process.env.CROPS_API_URL + "/crops");
    if (!cropsResponse.ok) {
      throw new Error(`Failed to fetch crops: ${cropsResponse.statusText}`);
    }
    const crops = await cropsResponse.json();

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString().split("T")[0];

    const { Items } = await ddb.send(new ScanCommand({
      TableName: WORDS_TABLE,
      FilterExpression: "#date >= :sevenDaysAgo",
      ExpressionAttributeNames: { "#date": "date" },
      ExpressionAttributeValues: { ":sevenDaysAgo": sevenDaysAgoISO },
      ProjectionExpression: "word",
    }));

    const recentWords = new Set(Items.map((item) => item.word));
    const availableCrops = crops.filter((crop) => !recentWords.has(crop.name));

    if (availableCrops.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: "No new crops available." }) };
    }

    const randomCrop = availableCrops[Math.floor(Math.random() * availableCrops.length)];
    await ddb.send(new PutCommand({
      TableName: WORDS_TABLE,
      Item: {
        date: todayISO,
        word: randomCrop.name,
        correct_guesses: 0,
        totalAttempts: 0, 
      },
    }));

    console.log(`Success! Today's word (${todayISO}) is: ${randomCrop.name}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Rollover complete.", word: randomCrop.name }),
    };

  } catch (err) {
    console.error("Critical error during daily rollover:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to process daily rollover." }),
    };
  }
};