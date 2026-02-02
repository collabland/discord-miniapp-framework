/**
 * Discord Mini App Framework - Project Creator
 *
 * Creates a new Discord Mini App project from templates
 */

import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

/**
 * Create a new Discord Mini App project
 *
 * @param {Object} options - Project options
 * @param {string} options.name - Project name
 * @param {string} options.template - Template to use
 * @param {string[]} options.features - Features to include
 * @param {string} options.targetDir - Target directory
 */
async function createProject(options) {
  const {
    name = 'my-discord-miniapp',
    template = 'basic',
    features = [],
    targetDir = process.cwd(),
  } = options;

  const projectDir = path.join(targetDir, name.toLowerCase().replace(/\s+/g, '-'));

  // Create project directory
  await fs.mkdir(projectDir, { recursive: true });

  // Copy template files
  const templateDir = path.resolve(__dirname, '../../templates', template);

  try {
    await copyDirectory(templateDir, projectDir);
  } catch {
    // If template doesn't exist, use the main project as template
    console.log('Using default template...');
  }

  // Create package.json
  const packageJson = {
    name: name.toLowerCase().replace(/\s+/g, '-'),
    version: '1.0.0',
    private: true,
    description: `Discord Mini App - ${name}`,
    type: 'module',
    scripts: {
      dev: 'npm-run-all --parallel dev:*',
      'dev:client': 'cd packages/client && npm run dev',
      'dev:server': 'cd packages/server && npm run dev',
      build: 'npm-run-all build:*',
      'build:client': 'cd packages/client && npm run build',
      'build:server': 'cd packages/server && npm run build',
      start: 'cd packages/server && npm start',
      tunnel: 'cloudflared tunnel --url http://localhost:3000',
    },
    workspaces: ['packages/*'],
    engines: {
      node: '>=18.0.0',
    },
  };

  await fs.writeFile(
    path.join(projectDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // Create .env.example
  const envExample = `# Discord Mini App Configuration
VITE_CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
APP_NAME="${name}"
PORT=3001
CLIENT_PORT=3000
NODE_ENV=development
`;

  await fs.writeFile(path.join(projectDir, '.env.example'), envExample);

  // Create config file
  const config = {
    appName: name,
    template,
    features,
    createdAt: new Date().toISOString(),
  };

  await fs.writeFile(
    path.join(projectDir, 'miniapp.config.json'),
    JSON.stringify(config, null, 2)
  );

  return {
    projectDir,
    name,
    template,
    features,
  };
}

/**
 * Copy a directory recursively
 */
async function copyDirectory(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

export default createProject;
