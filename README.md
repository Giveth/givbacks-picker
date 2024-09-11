# GIVBack Winners Picker

A Next.js application for selecting and displaying GIVBack winners.

## Features

- Fetches top 5 winners for GIVBack Round 69
- Displays winners in a stylish Twitter-like interface
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
