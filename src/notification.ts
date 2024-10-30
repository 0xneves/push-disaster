import {ethers} from 'ethers';
import {PushAPI} from '@pushprotocol/restapi';
import dotenv from 'dotenv';
import axios from 'axios';
import * as fs from 'fs';
dotenv.config();

const groupId = process.env.PUSH_GROUP_ID || "6fb4f0a95001a95b3474039cdd890dd1c77c0053184f9a66b59f7c2674b8d837";
const apiKey = process.env.WEATHERBIT_API_KEY;
const apiUrl = 'https://api.weatherbit.io/v2.0/alerts';
const citiesData: CountryCities = JSON.parse(fs.readFileSync('./src/southeast-asia.json', 'utf8'));

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
            type: 'Text',
          });
        console.log("Message sent:", message);
    } catch (error) {
        console.error("Error sending message:", error);
    }
}

// Function to fetch weather alerts for a given latitude and longitude
async function fetchWeatherAlerts(signer: any, lat: number, lon: number, cityName: string, country: string) {
    try {
        const response = await axios.get(apiUrl, {
            params: {
                lat,
                lon,
                key: apiKey
            },
            headers: {
                'Accept': 'application/json'
            }
        });
        await sendMessage(signer, groupId, response.data);
        console.log(`Weather Alerts for ${cityName}, ${country}:`, response.data);
    } catch (error) {
        console.error(`Error fetching weather alerts for ${cityName}, ${country}:`, error);
    }
}

// Iterate through each country and city to make the API request
async function fetchAlertsForAllCities(signer: any) {
    for (const [country, cities] of Object.entries(citiesData)) {
        for (const city of cities) {
            const [lat, lon] = city.coordinates;
            await fetchWeatherAlerts(signer, lat, lon, city.city, country);
        }
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
        env: 'prod',
      });
    await joinPushGroup(bot, groupId);      


    fetchAlertsForAllCities(bot);
    // Set an interval to send the message every minute
    // setInterval(() => {
    //     fetchAlertsForAllCities(bot);
    // }, 120 * 1000);
}

main().catch(console.error);
