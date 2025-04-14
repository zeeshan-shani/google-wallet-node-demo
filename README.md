# google-wallet-node-demo
A Node.js + Express demo for generating and saving event tickets to Google Wallet using Google Wallet Objects API and service account authentication.

# 🎟️ Google Wallet Node.js Demo

This project is a simple Node.js + Express app that integrates with **Google Wallet** (formerly Google Pay Passes). It allows you to generate **event tickets** and send users a **"Save to Google Wallet"** link.

---

## 🚀 Features

- Authenticate with Google using a Service Account
- Create and manage Google Wallet Event Tickets
- Generate a "Save to Google Wallet" link
- Clean controller-based code structure
- Extendable to support all Google Wallet pass types

---

🔐 Get service-account-key.json
Google requires a service account to access the Wallet API.

How to generate it:
Go to Google Cloud Console

Create a project or select an existing one.

Enable the Google Wallet API:

Go to APIs & Services > Library

Search for "Google Wallet API"

Click Enable

Go to IAM & Admin > Service Accounts

Click + Create Service Account

Give it a name, e.g., wallet-api-svc

Grant the role: Project > Editor

After creation, go to the Keys tab → Add Key > Create New Key > JSON

Save the downloaded file as service-account-key.json in the project root.

⚠️ Keep this file secret. Never commit it to version control.

-----------------

🎫 Google Wallet Pass Types
This demo covers Event Tickets, but Google Wallet supports multiple pass types:

Pass Type	Description
🎟️ Event Ticket	Concerts, conferences, sports
🛫 Boarding Pass	Flight and airline boarding cards
💳 Gift Card	Store or restaurant prepaid cards
🎁 Offer	Discounts, coupons
🎯 Loyalty Card	Rewards memberships (e.g., Starbucks)
🚍 Transit Pass	Metro, train, or bus cards

-----------------

📦 Dependencies
express - Web server

google-auth-library - Auth to Google APIs

uuid - To generate unique IDs

dotenv (optional) - For managing environment variables

--------

🧩 Future Ideas
Want to extend this? You could:

Support other pass types (gift cards, offers, transit)

Integrate with a frontend to scan QR codes

Add database storage for users and passes

Allow users to generate and save their own custom tickets
