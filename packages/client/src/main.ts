/**
 * Discord Mini App Framework - Client Entry Point
 *
 * This file handles the Discord SDK initialization and provides
 * a clean API for interacting with Discord features.
 */

import { DiscordSDK, type Types } from '@discord/embedded-app-sdk';

// ============================================================================
// Debug Logging
// ============================================================================

function debugLog(message: string, data?: unknown): void {
  console.log(`[MiniApp] ${message}`, data ?? '');

  // Also show on screen for debugging in Discord
  const debugEl = document.getElementById('debug-log');
  if (debugEl) {
    const time = new Date().toLocaleTimeString();
    debugEl.innerHTML += `<div>[${time}] ${message}</div>`;
    if (data) {
      debugEl.innerHTML += `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }
  }
}

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

// Check if we're running inside Discord's iframe
const urlParams = new URLSearchParams(window.location.search);
const frameId = urlParams.get('frame_id');
const instanceId = urlParams.get('instance_id');
const platform = urlParams.get('platform');

debugLog('URL params:', { frameId, instanceId, platform, fullUrl: window.location.href });

// If not in Discord iframe, show helpful message
if (!frameId) {
  const tunnelUrl = window.location.origin;
  document.body.innerHTML = `
    <div style="padding: 40px; color: #f2f3f5; font-family: 'gg sans', sans-serif; background: #313338; min-height: 100vh;">
      <h2 style="color: #57f287; margin-bottom: 16px;">✓ Server is running!</h2>
      <p style="color: #b5bac1; margin-bottom: 24px;">
        This app must be launched from inside Discord, not directly in a browser.
      </p>

      <div style="background: #2b2d31; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
        <h3 style="color: #f2f3f5; margin-bottom: 12px;">Setup Instructions:</h3>
        <ol style="color: #b5bac1; line-height: 2;">
          <li>Go to <a href="https://discord.com/developers/applications" target="_blank" style="color: #5865f2;">Discord Developer Portal</a></li>
          <li>Select your application</li>
          <li>Go to <strong>Activities</strong> in the sidebar</li>
          <li>Enable <strong>Activities</strong> if not already enabled</li>
          <li>Under <strong>URL Mappings</strong>, set Root to: <code style="background: #1e1f22; padding: 4px 8px; border-radius: 4px; color: #57f287;">${tunnelUrl}</code></li>
          <li>Open Discord desktop app → Join a voice channel</li>
          <li>Click the <strong>Activities</strong> rocket icon 🚀</li>
          <li>Find and launch your app</li>
        </ol>
      </div>

      <div style="background: #2b2d31; padding: 20px; border-radius: 8px;">
        <h3 style="color: #f2f3f5; margin-bottom: 12px;">Your Configuration:</h3>
        <p style="color: #b5bac1;">Tunnel URL: <code style="background: #1e1f22; padding: 4px 8px; border-radius: 4px; color: #57f287;">${tunnelUrl}</code></p>
        <p style="color: #b5bac1;">Client ID: <code style="background: #1e1f22; padding: 4px 8px; border-radius: 4px; color: #57f287;">${import.meta.env.VITE_CLIENT_ID || 'NOT SET'}</code></p>
      </div>
    </div>
  `;
  throw new Error('Not running inside Discord - this is expected in browser');
}

// Check for Client ID
const clientId = import.meta.env.VITE_CLIENT_ID;
debugLog('Client ID:', clientId ? `${clientId.substring(0, 8)}...` : 'MISSING!');

if (!clientId) {
  document.body.innerHTML = `
    <div style="padding: 20px; color: #ed4245; font-family: sans-serif;">
      <h2>Configuration Error</h2>
      <p>VITE_CLIENT_ID is not set. Please check your .env file.</p>
    </div>
  `;
  throw new Error('VITE_CLIENT_ID is not configured');
}

// Initialize the Discord SDK with your Client ID
let discordSdk: DiscordSDK;
try {
  discordSdk = new DiscordSDK(clientId);
  debugLog('Discord SDK initialized');
} catch (error) {
  document.body.innerHTML = `
    <div style="padding: 20px; color: #ed4245; font-family: sans-serif;">
      <h2>SDK Initialization Error</h2>
      <p>${error instanceof Error ? error.message : 'Unknown error'}</p>
    </div>
  `;
  throw error;
}

// Store authenticated user info
let currentUser: DiscordUser | null = null;
let accessToken: string | null = null;

/**
 * Main setup function for Discord SDK
 * Handles the complete authentication flow
 */
async function setupDiscordSdk(): Promise<string> {
  // Step 1: Wait for the SDK to be ready
  debugLog('Step 1: Waiting for SDK ready...');
  await discordSdk.ready();
  debugLog('SDK is ready!');

  // Step 2: Request authorization from Discord
  debugLog('Step 2: Requesting authorization...');
  const { code } = await discordSdk.commands.authorize({
    client_id: clientId,
    response_type: 'code',
    state: '',
    prompt: 'none',
    scope: [
      'identify',           // Access user info
      'guilds',             // Access guild list
      'rpc.voice.read',     // Read voice channel info
    ],
  });
  debugLog('Got authorization code');

  // Step 3: Exchange the code for an access token (via our server)
  debugLog('Step 3: Exchanging code for token...');
  const response = await fetch('/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    debugLog('Token exchange failed:', { status: response.status, error: errorText });
    throw new Error(`Failed to exchange code for token: ${response.status}`);
  }

  const { access_token }: AuthResponse = await response.json();
  accessToken = access_token;
  debugLog('Got access token');

  // Step 4: Authenticate with Discord using the token
  debugLog('Step 4: Authenticating with Discord...');
  const auth = await discordSdk.commands.authenticate({ access_token });

  if (auth) {
    debugLog('Authenticated successfully!', { user: auth.user });
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
  debugLog('Main function started');

  try {
    // Initialize Discord SDK and authenticate
    debugLog('Calling setupDiscordSdk...');
    await setupDiscordSdk();
    debugLog('setupDiscordSdk completed');

    // Hide loading, show content
    hideElement('loading');
    showElement('content');

    // Update UI with Discord information
    debugLog('Updating UI...');
    updateUserInfo();
    await updateChannelInfo();
    await updateGuildInfo();

    // Set up interactive elements
    setupEventHandlers();

    debugLog('Discord Mini App initialized successfully!');
    debugLog('Guild ID:', discordSdk.guildId);
    debugLog('Channel ID:', discordSdk.channelId);

  } catch (error) {
    debugLog('ERROR in main:', error instanceof Error ? error.message : String(error));
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
