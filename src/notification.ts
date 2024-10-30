import { ethers } from "ethers";
import { PushAPI } from "@pushprotocol/restapi";
import dotenv from "dotenv";
import axios from "axios";
import * as fs from "fs";
dotenv.config();

const groupId =
  process.env.PUSH_GROUP_ID ||
  "6fb4f0a95001a95b3474039cdd890dd1c77c0053184f9a66b59f7c2674b8d837";
const apiKey = process.env.WEATHERBIT_API_KEY;
const apiUrl = "https://api.weatherbit.io/v2.0/alerts";
const citiesData: CountryCities = JSON.parse(
  fs.readFileSync("./src/southeast-asia.json", "utf8")
);

// Function to join the Push group
async function joinPushGroup(signer: any, groupId: any) {
  try {
    // Connect to the Push group as the signer
    await signer.chat.group.join(groupId);
    console.log(`Joined Push group with ID: ${groupId}`);
  } catch (error) {
    console.error("Error joining Push group:", error);
  }
}

// Function to send a message to the Push group
async function sendMessage(signer: any, groupId: any, message: any) {
  try {
    await signer.chat.send(groupId, {
      content: message,
      type: "Text",
    });
    console.log("Message sent:", message);
  } catch (error) {
    console.error("Error sending message:", error);
  }
}

// Function to fetch weather alerts for a given latitude and longitude
async function fetchWeatherAlerts(
  signer: any,
  lat: number,
  lon: number,
  cityName: string,
  country: string
) {
  let someMessageSent = false;
  try {
    const response = await axios.get(apiUrl, {
      params: {
        lat,
        lon,
        key: apiKey,
      },
      headers: {
        Accept: "application/json",
      },
    });

    // Format the message as a readable string
    const alertData = response.data;
    const message =
      `Weather Update for ${alertData.city_name}, ${alertData.country_code}:\n` +
      `Alerts: ${
        alertData.alerts.length === 0
          ? "No active alerts"
          : alertData.alerts.join(", ")
      }\n` +
      `Location: ${alertData.lat}, ${alertData.lon}\n` +
      `Timezone: ${alertData.timezone}`;

    if (alertData.alerts.length > 0) {
      await sendMessage(signer, groupId, message);
      someMessageSent = true;
      console.log(`Weather Alerts for ${cityName}, ${country}:`, response.data);
    } else {
      console.log(`No weather alerts for ${cityName}, ${country}`);
    }
    return someMessageSent;
  } catch (error) {
    console.error(
      `Error fetching weather alerts for ${cityName}, ${country}:`,
      error
    );
  }
}

// Iterate through each country and city to make the API request
async function fetchAlertsForAllCities(signer: any) {
  let someMessageSentCount = 0;
  for (const [country, cities] of Object.entries(citiesData)) {
    for (const city of cities) {
      const [lat, lon] = city.coordinates;
      const someMessageSent = await fetchWeatherAlerts(
        signer,
        lat,
        lon,
        city.city,
        country
      );
      if (someMessageSent) {
        someMessageSentCount++;
      }
    }
  }
  console.log(`Some message sent count: ${someMessageSentCount}`);
  if (someMessageSentCount === 0) {
    sendMessage(
      signer,
      groupId,
      `There are no sever weather alerts in Southeast Asia.`
    );
  }
}

// Define the interface for a city structure
interface City {
  city: string;
  coordinates: [number, number];
}

// Define the main structure of cities.json
interface CountryCities {
  [country: string]: City[];
}

// Main function to join group and send message every 1 minute for testing (should be 1 hour or something)
async function main() {
  const privateKey = process.env.PRIVATE_KEY || "";
  const provider = ethers.getDefaultProvider();
  const signer = new ethers.Wallet(privateKey, provider);

  const bot = await PushAPI.initialize(signer, {
    // @ts-ignore
    env: "prod",
  });
  await joinPushGroup(bot, groupId);

  setInterval(() => {
    fetchAlertsForAllCities(bot);
  }, 4 * 60 * 60 * 1000); // 4 hours
}

main().catch(console.error);
