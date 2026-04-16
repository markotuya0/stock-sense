# StockSense AI — API Keys & Environment Setup Guide

To power the AI agents, payments, and notifications, you need to acquire and configure the following keys in your `.env` file.

## 1. AI Agents (The "Brain")

### Groq API Key (Speed Layer)
- **Used for**: Daily Scanner, Researcher, and Macro agents.
- **How to get**: 
  1. Go to [Groq Console](https://console.groq.com/).
  2. Create an account and go to **API Keys**.
  3. Generate a new key.
- **Env Variable**: `GROQ_API_KEY`

### Google Gemini API Key (Reasoning Layer)
- **Used for**: Deep Analyst and Arbiter agents.
- **How to get**:
  1. Go to [Google AI Studio](https://aistudio.google.com/).
  2. Create a project and click **Get API Key**.
  3. Copy the key for "Gemini 2.0 Flash" or "Gemini 1.5 Pro".
- **Env Variable**: `GOOGLE_API_KEY`

---

## 2. Infrastructure (Data & Performance)

### Supabase (Database)
- **Used for**: Permanent storage of users, signals, and reports.
- **How to get**:
  1. Create a project on [Supabase.com](https://supabase.com/).
  2. Go to **Project Settings > Database**.
  3. Copy the **Connection String** (use the Transaction Mode URL).
- **Env Variable**: `DATABASE_URL`

### Upstash Redis (Cache)
- **Used for**: High-speed price caching and rate limiting.
- **How to get**:
  1. Go to [Upstash Console](https://console.upstash.com/).
  2. Create a "Redis" database.
  3. Copy the **REST URL** and **REST Token** from the dashboard.
- **Env Variables**: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

---

## 3. Operations (Payments & Alerts)

### Paystack Keys
- **Used for**: Subscription payments and tier management.
- **How to get**:
  1. Go to [Paystack Dashboard](https://dashboard.paystack.com/).
  2. Go to **Settings > API Keys & Webhooks**.
  3. Copy your **Test Secret Key** and **Test Public Key** for local development.
- **Env Variables**: `PAYSTACK_SECRET_KEY`, `PAYSTACK_PUBLIC_KEY`

### Telegram Bot Token
- **Used for**: Sending morning briefings and real-time alerts.
- **How to get**:
  1. Search for `@BotFather` on Telegram.
  2. Send `/newbot` and follow the instructions.
  3. Copy the **HTTP API Token** provided.
- **Env Variable**: `TELEGRAM_BOT_TOKEN`

---

## 4. Local Security

### App Secret Key
- **Used for**: JWT signing and cookie encryption.
- **How to get**: Run this in your terminal:
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- **Env Variable**: `SECRET_KEY`

---

## Where to add them?
1. Open the file named `.env` in the root of the `stock-sense-1` folder.
2. If you don't have one, copy `.env.example` to `.env`.
3. Paste each key into its corresponding line.
4. **Restart your backend server** once done!
