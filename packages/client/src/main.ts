/**
 * Discord Mini App Framework - Client Entry Point
 *
 * This file handles the Discord SDK initialization and provides
 * a clean API for interacting with Discord features.
 */

import { DiscordSDK, type Types } from '@discord/embedded-app-sdk';

// ============================================================================
// Type Definitions
// ============================================================================

interface AuthResponse {
  access_token: string;
}

interface DiscordUser {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  global_name: string | null;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
}

// ============================================================================
// Discord SDK Setup
// ============================================================================

// Initialize the Discord SDK with your Client ID
const discordSdk = new DiscordSDK(import.meta.env.VITE_CLIENT_ID);

// Store authenticated user info
let currentUser: DiscordUser | null = null;
let accessToken: string | null = null;

/**
 * Main setup function for Discord SDK
 * Handles the complete authentication flow
 */
async function setupDiscordSdk(): Promise<string> {
  // Step 1: Wait for the SDK to be ready
  await discordSdk.ready();
  console.log('Discord SDK is ready!');

  // Step 2: Request authorization from Discord
  const { code } = await discordSdk.commands.authorize({
    client_id: import.meta.env.VITE_CLIENT_ID,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: [
      'identify',           // Access user info
      'guilds',             // Access guild list
      'rpc.voice.read',     // Read voice channel info
    ],
  });

  // Step 3: Exchange the code for an access token (via our server)
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    throw new Error('Failed to exchange code for token');
  }

  const { access_token }: AuthResponse = await response.json();
  accessToken = access_token;

  // Step 4: Authenticate with Discord using the token
  const auth = await discordSdk.commands.authenticate({ access_token });

  if (auth) {
    console.log('Authenticated successfully!');
    currentUser = auth.user as DiscordUser;
  }

  return access_token;
}

// ============================================================================
// Discord API Helpers
// ============================================================================

/**
 * Get the current voice channel information
 */
async function getVoiceChannelInfo(): Promise<Types.GetChannelResult | null> {
  if (!discordSdk.channelId) {
    console.log('Not in a voice channel');
    return null;
  }

  try {
    const channel = await discordSdk.commands.getChannel({
      channel_id: discordSdk.channelId,
    });
    return channel;
  } catch (error) {
    console.error('Failed to get channel info:', error);
    return null;
  }
}

/**
 * Get the current guild (server) information
 */
async function getGuildInfo(): Promise<DiscordGuild | null> {
  if (!accessToken || !discordSdk.guildId) {
    return null;
  }

  try {
    const response = await fetch('https://discord.com/api/v10/users/@me/guilds', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch guilds');
    }

    const guilds: DiscordGuild[] = await response.json();
    return guilds.find((g) => g.id === discordSdk.guildId) || null;
  } catch (error) {
    console.error('Failed to get guild info:', error);
    return null;
  }
}

/**
 * Build a Discord CDN URL for a guild icon
 */
function getGuildIconUrl(guildId: string, iconHash: string, size = 128): string {
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.webp?size=${size}`;
}

/**
 * Build a Discord CDN URL for a user avatar
 */
function getUserAvatarUrl(userId: string, avatarHash: string | null, size = 128): string {
  if (!avatarHash) {
    // Default avatar based on user ID
    const defaultIndex = Number(BigInt(userId) % BigInt(5));
    return `https://cdn.discordapp.com/embed/avatars/${defaultIndex}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.webp?size=${size}`;
}

// ============================================================================
// UI Updates
// ============================================================================

/**
 * Show/hide UI elements
 */
function showElement(id: string): void {
  document.getElementById(id)?.classList.remove('hidden');
}

function hideElement(id: string): void {
  document.getElementById(id)?.classList.add('hidden');
}

/**
 * Display output in the output panel
 */
function showOutput(data: unknown): void {
  const output = document.getElementById('output');
  const content = document.getElementById('output-content');

  if (output && content) {
    content.textContent = JSON.stringify(data, null, 2);
    showElement('output');
  }
}

/**
 * Update the UI with user information
 */
function updateUserInfo(): void {
  if (!currentUser) return;

  const avatar = document.getElementById('user-avatar') as HTMLImageElement;
  const name = document.getElementById('user-name');

  if (avatar) {
    avatar.src = getUserAvatarUrl(currentUser.id, currentUser.avatar);
  }

  if (name) {
    name.textContent = currentUser.global_name || currentUser.username;
  }
}

/**
 * Update the UI with channel information
 */
async function updateChannelInfo(): Promise<void> {
  const channel = await getVoiceChannelInfo();
  const channelName = document.getElementById('channel-name');

  if (channelName && channel) {
    channelName.textContent = `# ${channel.name}`;
  }
}

/**
 * Update the UI with guild information
 */
async function updateGuildInfo(): Promise<void> {
  const guild = await getGuildInfo();
  const guildAvatar = document.getElementById('guild-avatar');
  const appTitle = document.getElementById('app-title');

  if (guild) {
    if (appTitle) {
      appTitle.textContent = guild.name;
    }

    if (guildAvatar && guild.icon) {
      guildAvatar.style.backgroundImage = `url(${getGuildIconUrl(guild.id, guild.icon)})`;
    }
  }
}

// ============================================================================
// Event Handlers
// ============================================================================

/**
 * Set up button click handlers
 */
function setupEventHandlers(): void {
  // Voice channel info button
  document.getElementById('btn-voice-info')?.addEventListener('click', async () => {
    const channel = await getVoiceChannelInfo();
    showOutput(channel);
  });

  // Participants button
  document.getElementById('btn-participants')?.addEventListener('click', async () => {
    if (!discordSdk.channelId) {
      showOutput({ error: 'Not in a voice channel' });
      return;
    }

    try {
      const channel = await getVoiceChannelInfo();
      if (channel && 'voice_states' in channel) {
        showOutput({
          channel: channel.name,
          participants: channel.voice_states,
        });
      } else {
        showOutput({ message: 'No voice state information available' });
      }
    } catch (error) {
      showOutput({ error: String(error) });
    }
  });
}

// ============================================================================
// Main Application Entry Point
// ============================================================================

async function main(): Promise<void> {
  try {
    // Initialize Discord SDK and authenticate
    await setupDiscordSdk();

    // Hide loading, show content
    hideElement('loading');
    showElement('content');

    // Update UI with Discord information
    updateUserInfo();
    await updateChannelInfo();
    await updateGuildInfo();

    // Set up interactive elements
    setupEventHandlers();

    console.log('Discord Mini App initialized successfully!');
    console.log('Guild ID:', discordSdk.guildId);
    console.log('Channel ID:', discordSdk.channelId);

  } catch (error) {
    console.error('Failed to initialize Discord Mini App:', error);

    // Hide loading, show error
    hideElement('loading');
    showElement('error');

    const errorMessage = document.getElementById('error-message');
    if (errorMessage) {
      errorMessage.textContent = error instanceof Error
        ? error.message
        : 'Failed to connect to Discord. Please try again.';
    }
  }
}

// Start the application
main();

// Export for use in other modules if needed
export {
  discordSdk,
  getVoiceChannelInfo,
  getGuildInfo,
  currentUser,
  accessToken,
};
