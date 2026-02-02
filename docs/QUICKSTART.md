# Quick Start Guide

Get your Discord Mini App running in 5 minutes!

## Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher
- A [Discord account](https://discord.com/)
- [Cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) (for tunneling)

## Step 1: Create Discord Application (2 minutes)

1. Open [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** → Enter a name → Click **"Create"**
3. Copy your **Client ID** (you'll need this)
4. Go to **OAuth2** → Click **"Reset Secret"** → Copy the **Client Secret**
5. Under **Redirects**, add: `http://localhost:3000`
6. Go to **Activities** → Enable the toggle

## Step 2: Configure Your App (1 minute)

```bash
# Copy the environment template
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
VITE_CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
```

## Step 3: Install & Run (2 minutes)

```bash
# Install dependencies
npm install

# Start the development server
npm run dev
```

Open a **second terminal** and run:

```bash
# Start the tunnel
npm run tunnel
```

Copy the tunnel URL (looks like `https://xxx-xxx.trycloudflare.com`).

## Step 4: Connect to Discord

1. Go back to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your app → **Activities**
3. Paste your tunnel URL in **"Default Activity URL"**
4. Save changes

## Step 5: Test Your App

1. Open Discord
2. Join a voice channel
3. Click the **Activities** button (rocket icon)
4. Find and launch your app

## That's it!

Your Mini App is now running. Edit `packages/client/src/main.ts` to customize it.

## Common Issues

| Problem | Solution |
|---------|----------|
| "Client ID invalid" | Check `.env` file has correct values |
| App not showing in Discord | Make sure Activities is enabled and URL is set |
| Tunnel disconnects | Restart `npm run tunnel` |

## Next Steps

- Read the full [README](../README.md) for more details
- Check the [Discord SDK docs](https://discord.com/developers/docs/activities/overview)
- Explore the example code in `packages/client/src/main.ts`
