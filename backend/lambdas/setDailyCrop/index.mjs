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
const BASE_URL = process.env.BASE_URL;

const getRandomValidIndex = (totalLength, recentSet) => {
  const validIndices = [];
  for (let i = 0; i < totalLength; i++) {
    if (!recentSet.has(i)) validIndices.push(i);
  }

  if (validIndices.length === 0) {
    return Math.floor(Math.random() * totalLength);
  }

  return validIndices[Math.floor(Math.random() * validIndices.length)];
};

export const handler = async () => {
  try {
    const [cropsRes, cookingRes, fishRes, geologyRes, quotesRes] = await Promise.all([
      fetch(`${BASE_URL}/crops.json`),
      fetch(`${BASE_URL}/cooking.json`),
      fetch(`${BASE_URL}/fish.json`),
      fetch(`${BASE_URL}/geology.json`),
      fetch(`${BASE_URL}/quotes.json`)
    ]);

    if (!cropsRes.ok || !cookingRes.ok || !fishRes.ok || !geologyRes.ok || !quotesRes.ok) {
      throw new Error("Failed to fetch one or more JSON files from R2");
    }

    const [crops, cooking, fish, geology, quotes] = await Promise.all([
      cropsRes.json(),
      cookingRes.json(),
      fishRes.json(),
      geologyRes.json(),
      quotesRes.json()
    ]);

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

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoISO = sevenDaysAgo.toISOString().split("T")[0];

    const { Items } = await ddb.send(new ScanCommand({
      TableName: WORDS_TABLE,
      FilterExpression: "#date >= :sevenDaysAgo",
      ExpressionAttributeNames: { "#date": "date" },
      ExpressionAttributeValues: { ":sevenDaysAgo": sevenDaysAgoISO },
      ProjectionExpression: "word, daily_items",
    }));

    const recentWords = new Set();
    const recentCooking = new Set();
    const recentFish = new Set();
    const recentGeology = new Set();
    const recentVillagers = new Set();

    Items.forEach(item => {
      recentWords.add(item.word);
      if (item.daily_items) {
        if (item.daily_items.cooking !== undefined) recentCooking.add(item.daily_items.cooking);
        if (item.daily_items.fish !== undefined) recentFish.add(item.daily_items.fish);
        if (item.daily_items.geology !== undefined) recentGeology.add(item.daily_items.geology);
        if (item.daily_items.villager && item.daily_items.villager.index !== undefined) {
          recentVillagers.add(item.daily_items.villager.index);
        }
      }
    });

    const availableCrops = crops.filter((crop) => !recentWords.has(crop.name));
    if (availableCrops.length === 0) {
      return { statusCode: 200, body: JSON.stringify({ message: "No new crops available." }) };
    }
    const randomCrop = availableCrops[Math.floor(Math.random() * availableCrops.length)];

    const cookingArray = cooking.foods ? cooking.foods : cooking;
    const cookingIndex = getRandomValidIndex(cookingArray.length, recentCooking);
    const fishIndex = getRandomValidIndex(fish.length, recentFish);
    const geologyIndex = getRandomValidIndex(geology.length, recentGeology);
    const villagerIndex = getRandomValidIndex(quotes.length, recentVillagers);

    const selectedVillager = quotes[villagerIndex];
    const shuffledQuotes = [...selectedVillager.quotes].sort(() => 0.5 - Math.random());
    const selectedQuoteIndices = shuffledQuotes.slice(0, 5).map(q => q.index);

    await ddb.send(new PutCommand({
      TableName: WORDS_TABLE,
      Item: {
        date: todayISO,
        word: randomCrop.name,
        correct_guesses: 0,
        totalAttempts: 0,
        daily_items: {
          cooking: cookingIndex,
          fish: fishIndex,
          geology: geologyIndex,
          villager: {
            index: villagerIndex,
            quotes: selectedQuoteIndices
          }
        },
        bundle_completions: 0
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