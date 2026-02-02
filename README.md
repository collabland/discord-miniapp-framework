# Discord Mini App Framework

An agentic framework for easily creating Discord Mini Apps (Activities). Designed for non-technical users who want to build Discord experiences without the complexity.

## What are Discord Mini Apps?

Discord Mini Apps (also called Activities) are embedded applications that run inside Discord voice channels. They allow users to play games, watch videos together, or use collaborative tools without leaving Discord.

## Features

- **Interactive Setup Wizard** - Guided setup process that walks you through everything
- **Zero-Config Development** - Just run `npm run dev` and start building
- **Built-in Tunneling** - Expose your local app to Discord with one command
- **Type-Safe** - Full TypeScript support for client and server
- **Discord SDK Integration** - Pre-configured Discord Embedded App SDK

## Platform Compatibility

| Platform | Status | Notes |
|----------|--------|-------|
| iOS | ✅ Works | Fully supported |
| Android | ✅ Works | Fully supported |
| Web (discord.com) | ✅ Works | Fully supported |
| Discord Canary (Mac/Windows) | ✅ Works | Recommended for desktop development |
| Discord Stable (Mac) | ⚠️ Issues | May show white screen - use Canary instead |
| Discord Stable (Windows) | ✅ Works | Fully supported |

> **Warning**: If you experience a white screen when launching your Activity on **Discord Stable for Mac**, please use [Discord Canary](https://discord.com/api/downloads/distributions/app/installers/latest?channel=canary&platform=osx&arch=universal) instead. This is a known issue with the stable Mac client.

## Quick Start

### Option 1: Interactive Wizard (Recommended for Beginners)

```bash
# Clone this repository
git clone https://github.com/your-repo/discord-miniapp-framework.git
cd discord-miniapp-framework

# Run the interactive setup wizard
npm run wizard
```

The wizard will guide you through:
1. Checking your system requirements
2. Creating a Discord Application
3. Configuring your credentials
4. Starting the development server

### Option 2: Manual Setup

```bash
# Clone and install
git clone https://github.com/your-repo/discord-miniapp-framework.git
cd discord-miniapp-framework
npm install

# Copy environment template and add your credentials
cp .env.example .env
# Edit .env with your Discord Client ID and Secret

# Start development
npm run dev

# In another terminal, start the tunnel
npm run tunnel
```

## Getting Your Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click **"New Application"** and give it a name
3. In **General Information**, copy your **Client ID**
4. Go to **OAuth2** and click **"Reset Secret"** to get your **Client Secret**
5. Add `http://localhost:3000` to **Redirects**
6. Go to **Activities** and enable the **Activities** toggle
7. Under **Supported Platforms**, enable: Web, iOS, Android
8. Under **URL Mappings**, add your tunnel URL (from `npm run tunnel`)

## Testing Your Activity

### On iOS/Android
1. Open Discord mobile app
2. Join a voice channel
3. Tap the **Activities** button (rocket icon 🚀)
4. Find and launch your app

### On Web (discord.com)
1. Go to https://discord.com/app in your browser
2. Join a voice channel
3. Click the **Activities** button
4. Find and launch your app

### On Desktop (Recommended: Discord Canary)

If you're developing on Mac, we recommend using Discord Canary for the best experience:

**Install Discord Canary:**
- **Mac**: [Download Discord Canary](https://discord.com/api/downloads/distributions/app/installers/latest?channel=canary&platform=osx&arch=universal)
- **Windows**: [Download Discord Canary](https://discord.com/api/downloads/distributions/app/installers/latest?channel=canary&platform=win&arch=x64)

**Launch your Activity:**
1. Open Discord Canary
2. Join a voice channel
3. Click the **Activities** button (rocket icon 🚀)
4. Find and launch your app

> **Note**: Discord Canary is Discord's testing/developer version with the latest features and bug fixes. It's safe to use alongside the stable version.

## Project Structure

```
discord-miniapp-framework/
├── packages/
│   ├── client/           # Frontend (Vite + TypeScript)
│   │   ├── src/
│   │   │   ├── main.ts   # Discord SDK integration
│   │   │   └── styles.css
│   │   ├── index.html
│   │   └── vite.config.ts
│   │
│   ├── server/           # Backend (Express + TypeScript)
│   │   └── src/
│   │       └── app.ts    # Token exchange endpoint
│   │
│   └── cli/              # CLI tools
│       └── bin/
│           ├── wizard.js  # Interactive setup
│           ├── check-env.js
│           └── create.js
│
├── .env.example          # Environment template
├── package.json          # Root workspace config
└── README.md
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run wizard` | Interactive setup wizard |
| `npm run dev` | Start development server (client + server) |
| `npm run tunnel` | Start Cloudflare tunnel for Discord |
| `npm run build` | Build for production |
| `npm run start` | Run production build |
| `npm run check-env` | Validate environment configuration |
| `npm run create` | Create a new Mini App project |

## How It Works

### Authentication Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Discord Client │───▶│   Your Client   │───▶│   Your Server   │
│   (in iframe)   │    │   (Vite app)    │    │   (Express)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                       │                      │
        │ 1. SDK.ready()        │                      │
        │◀──────────────────────│                      │
        │                       │                      │
        │ 2. authorize()        │                      │
        │   returns code        │                      │
        │◀──────────────────────│                      │
        │                       │                      │
        │                       │ 3. POST /api/token   │
        │                       │   with code          │
        │                       │─────────────────────▶│
        │                       │                      │ 4. Exchange with
        │                       │                      │    Discord OAuth2
        │                       │◀─────────────────────│
        │                       │   access_token       │
        │ 5. authenticate()     │                      │
        │   with token          │                      │
        │◀──────────────────────│                      │
        │                       │                      │
        │ 6. Ready to use!      │                      │
        │   RPC commands        │                      │
```

### Why a Server?

The server exists to securely exchange authorization codes for access tokens. The Client Secret must never be exposed to the client-side code, so we handle the token exchange on the server.

## Customization

### Adding Features

The client code in `packages/client/src/main.ts` includes helpers for:
- Getting voice channel information
- Displaying user avatars
- Showing guild (server) information

You can extend these by using the [Discord Embedded App SDK](https://discord.com/developers/docs/activities/overview).

### Changing the UI

Styles are in `packages/client/src/styles.css`. The default theme uses Discord-inspired colors but you can customize everything.

### Adding API Endpoints

Add new routes in `packages/server/src/app.ts`:

```typescript
app.get('/api/my-endpoint', (req, res) => {
  res.json({ message: 'Hello!' });
});
```

## Troubleshooting

### White screen on Discord Mac (Stable)

This is a known issue with Discord Stable on Mac. **Solutions:**

1. **Use Discord Canary** (recommended): [Download here](https://discord.com/api/downloads/distributions/app/installers/latest?channel=canary&platform=osx&arch=universal)

2. **Use Discord Web**: Go to https://discord.com/app in your browser

3. **Clear Discord cache** (if you want to try fixing Stable):
   ```bash
   # Quit Discord first, then run:
   rm -rf ~/Library/Application\ Support/discord/Cache
   rm -rf ~/Library/Application\ Support/discord/Code\ Cache
   rm -rf ~/Library/Application\ Support/discord/GPUCache
   ```

4. **Test on iOS/Android**: The mobile apps work reliably

### "Failed to connect to Discord"

1. Make sure your `.env` file has the correct `VITE_CLIENT_ID` and `CLIENT_SECRET`
2. Verify your Discord Application has Activities enabled
3. Check that your tunnel URL is set in **URL Mappings** in Discord Developer Portal

### "Tunnel not working"

1. Install Cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Make sure port 3000 is available
3. Try restarting the tunnel
4. Note: Tunnel URLs change each time you restart - update your URL Mapping in Discord Developer Portal

### "npm run dev fails"

1. Run `npm run check-env` to validate your configuration
2. Make sure Node.js 18+ is installed
3. Try deleting `node_modules` and running `npm install` again

### Activity not showing in Discord

1. Make sure **Activities** is enabled in Discord Developer Portal
2. Check that **Supported Platforms** includes your platform (Web, iOS, Android)
3. Verify the **URL Mapping** points to your current tunnel URL
4. Make sure you're in a **voice channel** (Activities only appear in voice channels)
5. Your app must be added to the server (check Installation settings in Developer Portal)

## Resources

- [Discord Developer Portal](https://discord.com/developers/applications)
- [Discord Embedded App SDK Documentation](https://discord.com/developers/docs/activities/overview)
- [Discord Activity Examples](https://github.com/discord/embedded-app-sdk-examples)
- [Vite Documentation](https://vitejs.dev/)

## License

MIT
