# SignalPilot

Read-only Paytm Money market-data connector with a paper-trading foundation.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Add `PAYTM_JWT_TOKEN` locally after completing Paytm Money authentication. Never commit `.env`.
4. Run `npm start`.
5. Open `http://localhost:3000`.

The first build intentionally exposes no order, withdrawal, or automated-trading endpoint. Historical candles use Paytm Money's documented `/data/v1/price-charts/sym` API.
