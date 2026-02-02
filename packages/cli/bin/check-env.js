#!/usr/bin/env node

/**
 * Discord Mini App Framework - Environment Checker
 *
 * Validates that all required configuration is in place
 * and provides helpful suggestions for fixing issues.
 */

import chalk from 'chalk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

async function checkEnvironment() {
  console.log(chalk.blue.bold('\n🔍 Discord Mini App - Environment Check\n'));

  let hasErrors = false;
  let hasWarnings = false;

  // Check .env file exists
  const envPath = path.join(rootDir, '.env');
  let envExists = false;

  try {
    await fs.access(envPath);
    envExists = true;
    console.log(chalk.green('✓ .env file found'));
  } catch {
    console.log(chalk.red('✗ .env file not found'));
    console.log(chalk.gray('  Run "npm run wizard" to create one'));
    hasErrors = true;
  }

  if (envExists) {
    // Load and check environment variables
    const envConfig = dotenv.config({ path: envPath });

    if (envConfig.error) {
      console.log(chalk.red('✗ Failed to parse .env file'));
      hasErrors = true;
    } else {
      const env = envConfig.parsed || {};

      // Check required variables
      const requiredVars = [
        { key: 'VITE_CLIENT_ID', desc: 'Discord Client ID' },
        { key: 'CLIENT_SECRET', desc: 'Discord Client Secret' }
      ];

      for (const { key, desc } of requiredVars) {
        if (!env[key] || env[key].includes('your_') || env[key].includes('_here')) {
          console.log(chalk.red(`✗ ${key} (${desc}) is not configured`));
          hasErrors = true;
        } else {
          // Mask the value for display
          const masked = env[key].substring(0, 4) + '...' + env[key].substring(env[key].length - 4);
          console.log(chalk.green(`✓ ${key}: ${masked}`));
        }
      }

      // Check optional variables
      const optionalVars = [
        { key: 'APP_NAME', desc: 'Application Name', default: 'My Discord Mini App' },
        { key: 'PORT', desc: 'Server Port', default: '3001' }
      ];

      for (const { key, desc, default: defaultVal } of optionalVars) {
        if (!env[key]) {
          console.log(chalk.yellow(`⚠ ${key} (${desc}) not set, using default: ${defaultVal}`));
          hasWarnings = true;
        } else {
          console.log(chalk.green(`✓ ${key}: ${env[key]}`));
        }
      }
    }
  }

  // Check for required files
  console.log(chalk.blue('\n📁 Checking project files...\n'));

  const requiredFiles = [
    { path: 'packages/client/package.json', desc: 'Client package.json' },
    { path: 'packages/server/package.json', desc: 'Server package.json' },
    { path: 'packages/client/src/main.ts', desc: 'Client main.ts' },
    { path: 'packages/server/src/app.ts', desc: 'Server app.ts' }
  ];

  for (const file of requiredFiles) {
    try {
      await fs.access(path.join(rootDir, file.path));
      console.log(chalk.green(`✓ ${file.desc}`));
    } catch {
      console.log(chalk.red(`✗ ${file.desc} not found`));
      hasErrors = true;
    }
  }

  // Check node_modules
  console.log(chalk.blue('\n📦 Checking dependencies...\n'));

  try {
    await fs.access(path.join(rootDir, 'node_modules'));
    console.log(chalk.green('✓ node_modules found'));
  } catch {
    console.log(chalk.yellow('⚠ node_modules not found'));
    console.log(chalk.gray('  Run "npm install" to install dependencies'));
    hasWarnings = true;
  }

  // Summary
  console.log(chalk.blue('\n' + '─'.repeat(50)));

  if (hasErrors) {
    console.log(chalk.red.bold('\n❌ Environment check failed'));
    console.log(chalk.yellow('\nTo fix issues, run: npm run wizard\n'));
    process.exit(1);
  } else if (hasWarnings) {
    console.log(chalk.yellow.bold('\n⚠️  Environment check passed with warnings'));
    console.log(chalk.gray('Your app should work, but consider fixing the warnings.\n'));
  } else {
    console.log(chalk.green.bold('\n✅ Environment check passed!'));
    console.log(chalk.gray('Your Discord Mini App is ready to run.\n'));
    console.log(chalk.cyan('Start development with: npm run dev\n'));
  }
}

checkEnvironment().catch(console.error);
