# API Reference

## Client SDK Helpers

The client code in `packages/client/src/main.ts` exports several helpful functions:

### `discordSdk`

The initialized Discord SDK instance.

```typescript
import { discordSdk } from './main';

// Get current channel ID
console.log(discordSdk.channelId);

// Get current guild ID
console.log(discordSdk.guildId);
```

### `getVoiceChannelInfo()`

Get information about the current voice channel.

```typescript
const channel = await getVoiceChannelInfo();
console.log(channel?.name); // "General"
```

Returns:
- `null` if not in a voice channel
- Channel object with `name`, `id`, `voice_states`, etc.

### `getGuildInfo()`

Get information about the current guild (server).

```typescript
const guild = await getGuildInfo();
console.log(guild?.name); // "My Server"
console.log(guild?.icon); // Icon hash for CDN URL
```

### `currentUser`

The authenticated user object.

```typescript
import { currentUser } from './main';

console.log(currentUser?.username);
console.log(currentUser?.avatar);
console.log(currentUser?.global_name);
```

### `accessToken`

The OAuth access token (use for Discord API calls).

```typescript
import { accessToken } from './main';

const response = await fetch('https://discord.com/api/v10/users/@me', {
  headers: {
    Authorization: `Bearer ${accessToken}`,
  },
});
```

## Server API Endpoints

### `POST /api/token`

Exchange an authorization code for an access token.

**Request:**
```json
{
  "code": "authorization_code_from_sdk"
}
```

**Response:**
```json
{
  "access_token": "user_access_token"
}
```

### `GET /api/health`

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "app": "My Discord Mini App",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### `GET /api/config`

Get non-sensitive application configuration.

**Response:**
```json
{
  "appName": "My Discord Mini App",
  "clientId": "123456789"
}
```

## Discord SDK Commands

Common SDK commands you can use:

### `authorize()`

Request authorization from the user.

```typescript
const { code } = await discordSdk.commands.authorize({
  client_id: import.meta.env.VITE_CLIENT_ID,
  response_type: 'code',
  state: '',
  prompt: 'none',
  scope: ['identify', 'guilds', 'rpc.voice.read'],
});
```

### `authenticate()`

Authenticate with an access token.

```typescript
const auth = await discordSdk.commands.authenticate({
  access_token: token,
});
```

### `getChannel()`

Get channel information.

```typescript
const channel = await discordSdk.commands.getChannel({
  channel_id: discordSdk.channelId,
});
```

### `setActivity()`

Set the user's activity/presence.

```typescript
await discordSdk.commands.setActivity({
  state: 'Playing a game',
  details: 'Level 5',
});
```

## OAuth Scopes

Available scopes for your Mini App:

| Scope | Description |
|-------|-------------|
| `identify` | Access user's basic info (username, avatar) |
| `guilds` | Access user's guild list |
| `rpc.voice.read` | Read voice channel info |
| `rpc.activities.write` | Set user's activity |

## CDN URLs

### User Avatar
```typescript
const avatarUrl = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp?size=128`;
```

### Guild Icon
```typescript
const iconUrl = `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.webp?size=128`;
```

### Default Avatar (no custom avatar)
```typescript
const defaultIndex = Number(BigInt(userId) % BigInt(5));
const defaultUrl = `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
```
