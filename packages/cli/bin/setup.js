#!/usr/bin/env node

/**
 * Discord Mini App Framework - Quick Setup
 *
 * A streamlined setup script for users who already know what they're doing.
 * For guided setup, use the wizard instead: npm run wizard
 */

import { program } from 'commander';
import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import ora from 'ora';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

program
  .name('dm-setup')
  .description('Quick setup for Discord Mini App Framework')
  .option('-c, --client-id <id>', 'Discord Client ID')
  .option('-s, --client-secret <secret>', 'Discord Client Secret')
  .option('-n, --name <name>', 'App name', 'My Discord Mini App')
  .option('--skip-install', 'Skip npm install')
  .option('-y, --yes', 'Skip confirmation prompts')
  .parse();

const options = program.opts();

async function quickSetup() {
  console.log(chalk.blue.bold('\n🚀 Discord Mini App - Quick Setup\n'));

  // Validate required options
  if (!options.clientId) {
    console.log(chalk.red('Error: --client-id is required'));
    console.log(chalk.gray('\nUsage: npm run setup -- --client-id YOUR_ID --client-secret YOUR_SECRET'));
    console.log(chalk.gray('Or use the interactive wizard: npm run wizard'));
    process.exit(1);
  }

  if (!options.clientSecret) {
    console.log(chalk.red('Error: --client-secret is required'));
    console.log(chalk.gray('\nUsage: npm run setup -- --client-id YOUR_ID --client-secret YOUR_SECRET'));
    process.exit(1);
  }

  const spinner = ora('Setting up project...').start();

  try {
    // Create .env file
    const envContent = `# Discord Mini App Configuration
VITE_CLIENT_ID=${options.clientId}
CLIENT_SECRET=${options.clientSecret}
APP_NAME="${options.name}"
PORT=3001
CLIENT_PORT=3000
NODE_ENV=development
`;

    await fs.writeFile(path.join(rootDir, '.env'), envContent);
    spinner.text = 'Created .env file';

    // Create config file
    const configContent = {
      appName: options.name,
      template: 'basic',
      features: ['voice', 'avatar'],
      createdAt: new Date().toISOString(),
      clientId: options.clientId
    };

    await fs.writeFile(
      path.join(rootDir, 'miniapp.config.json'),
      JSON.stringify(configContent, null, 2)
    );
    spinner.text = 'Created config file';

    // Install dependencies
    if (!options.skipInstall) {
      spinner.text = 'Installing dependencies...';
      execSync('npm install', { cwd: rootDir, stdio: 'pipe' });
    }

    spinner.succeed(chalk.green('Setup complete!'));

    console.log(chalk.cyan('\nNext steps:'));
    console.log(chalk.white('  1. npm run dev        - Start development server'));
    console.log(chalk.white('  2. npm run tunnel     - Start tunnel for Discord'));
    console.log(chalk.white('  3. npm run check-env  - Verify configuration\n'));

  } catch (error) {
    spinner.fail(chalk.red('Setup failed'));
    console.error(error.message);
    process.exit(1);
  }
}

quickSetup();
