# GIVbacksV2 Winners Picker

A Next.js application for selecting and displaying GIVbacksV2 Raffle winners.

## Features

- Randomly fetches up to 20 winning donations from the list of eligible donations from a GIVbacks Round
- Each donation has a proportional chance of winning, determined by its "valueUsdAfterGivbackFactor" (i.e. the odds of winning are affected by the donation size & the givbacks % of the project donated to)
- A single donor address can only win once (even if they are associated with multiple transaction hashes)
- Displays each winning donation ID and transaction hash in a stylish Twitter-like interface
- Allows copying all winners to clipboard
- Responsive design with loading and error states

## Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## API

The application expects a `/api/raffle` endpoint that returns winner data in the following format:

```json
{
  "message": "Data fetched successfully",
  "data": [
    ["donationId", "giverAddress", "valueUsdAfterGivbackFactor", "txHash"],
    ["123", "0xgiver", "42.5", "0xtxhash"]
  ]
}
```
