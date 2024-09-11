# GIVBack Winners Picker

A Next.js application for selecting and displaying GIVbacksV2 Raffle winners.

## Features

- Randomly fetches 5 winning transacton hashed from the list of eligible donations from a GIVbacks Round
- Each transaction hash inputted has a proportional proportional chance of winning, determined by its "USDvalueafterGIVbacksfactor" (i.e. the odds of winning are affected by the donation size & the givbacks % of the project donated to
- A single donor address can only win once (even if they are associated with multiple transaction hashes)
- Displays winners in a stylish Twitter-like interface)
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
