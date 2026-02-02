/**
 * Discord Mini App Framework - Server
 *
 * This server handles the OAuth2 token exchange for Discord authentication.
 * The client-side SDK gets an authorization code from Discord, which we
 * exchange for an access token using the client secret (kept secure on server).
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// Type definitions
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

// Load environment variables from root .env file
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// ============================================================================
// Configuration
// ============================================================================

const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  clientPort: parseInt(process.env.CLIENT_PORT || '3000', 10),
  clientId: process.env.VITE_CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  isProduction: process.env.NODE_ENV === 'production',
  appName: process.env.APP_NAME || 'Discord Mini App',
};

// Validate required environment variables
if (!config.clientId || !config.clientSecret) {
  console.error('❌ Missing required environment variables!');
  console.error('   Please run: npm run wizard');
  console.error('   Or create a .env file with VITE_CLIENT_ID and CLIENT_SECRET');
  process.exit(1);
}

// ============================================================================
// Express App Setup
// ============================================================================

const app = express();

// Middleware
app.use(express.json());

// CORS configuration
app.use(
  cors({
    origin: config.isProduction
      ? undefined // In production, served from same origin
      : `http://localhost:${config.clientPort}`,
    credentials: true,
  })
);

// Request logging in development
if (!config.isProduction) {
  app.use((req: Request, _res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
    next();
  });
}

// ============================================================================
// API Routes
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: config.appName,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Token Exchange Endpoint
 *
 * This is the critical endpoint that exchanges the authorization code
 * from Discord for an access token. The client secret is kept secure
 * on the server side.
 */
app.post('/api/token', async (req: Request, res: Response) => {
  const { code } = req.body;

  if (!code) {
    res.status(400).json({ error: 'Authorization code is required' });
    return;
  }

  try {
    // Exchange the code for an access token with Discord
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId!,
        client_secret: config.clientSecret!,
        grant_type: 'authorization_code',
        code: code,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Discord token exchange failed:', errorData);
      res.status(response.status).json({
        error: 'Failed to exchange token with Discord',
        details: errorData,
      });
      return;
    }

    const tokenData = await response.json() as TokenResponse;

    // Return only the access token to the client
    // (refresh_token and other sensitive data stay on server)
    res.json({
      access_token: tokenData.access_token,
    });
  } catch (error) {
    console.error('Token exchange error:', error);
    res.status(500).json({
      error: 'Internal server error during token exchange',
    });
  }
});

/**
 * Get application configuration (non-sensitive)
 */
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({
    appName: config.appName,
    clientId: config.clientId,
  });
});

// ============================================================================
// Static Files (Production)
// ============================================================================

if (config.isProduction) {
  // Serve the built client files
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));

  // SPA fallback - serve index.html for all non-API routes
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// ============================================================================
// Error Handling
// ============================================================================

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Global error handler
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: config.isProduction ? 'Internal server error' : err.message,
  });
});

// ============================================================================
// Server Startup
// ============================================================================

app.listen(config.port, () => {
  console.log('');
  console.log('🎮 Discord Mini App Server');
  console.log('━'.repeat(40));
  console.log(`   App:     ${config.appName}`);
  console.log(`   Server:  http://localhost:${config.port}`);
  console.log(`   Mode:    ${config.isProduction ? 'production' : 'development'}`);
  console.log('━'.repeat(40));

  if (!config.isProduction) {
    console.log('');
    console.log('📝 API Endpoints:');
    console.log(`   POST /api/token  - Exchange OAuth code for token`);
    console.log(`   GET  /api/health - Health check`);
    console.log(`   GET  /api/config - Get app configuration`);
    console.log('');
  }
});

export default app;
