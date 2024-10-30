# push-disaster

## Setup

1. Install dependencies: `yarn`
2. Create a `.env` file with the following variables:
   - `WEATHERBIT_API_KEY`: The API key for the Weatherbit API
   - `PRIVATE_KEY`: Your private key of the wallet to send messages
   - `PUSH_GROUP_ID`: The ID of the group to send messages to

## Run

`yarn start`

## Notes

- The script will send a message to the group every 4 hours
- The script will only send a message if there are any weather alerts for the cities
- The script will send a message if there are no weather alerts for all cities
