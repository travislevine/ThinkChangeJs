# BikePark (Sunshine Coast Council — ThinkChange)

BikePark is a web app designed for **community events** where Sunshine Coast Council provides free, secure parking for bicycles and other micromobility devices (e.g. e-bikes, scooters, prams).

It supports the full on-the-day workflow:
- **Patron pre-registration** (public form) to speed up drop-off
- **Operator check-in (drop-off)** with device details and a physical ticket/tag number
- **Operator pick-up** (partial or complete collections)
- **Ticket lookup** with notes and history
- **CSV export** for event reporting (protected by an export PIN)

The app is built to keep working even when event Wi‑Fi is unreliable (it saves to the device first, then syncs when online).

## Live demo

- **Demo site:** `https://think-change-js.vercel.app/pin?next=%2F`
- **Patron pre-registration page:** `https://think-change-js.vercel.app/pre-register`

## Run locally

First, install dependencies:

```bash
npm install
```

Then run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Pages

- **Operator app (PIN protected):** `/pin`, `/`, `/park`, `/pickup`, `/check-ticket`
- **Public patron form:** `/pre-register`

## Notes for reviewers

- This repository contains both the **operator** experience (used on the day) and the **patron** pre-registration form.
- SMS and cloud services in the hosted demo run in a **demo/trial** configuration (council production setup is a separate operational step).

