#!/usr/bin/env node

/**
 * Discord Mini App Framework - Interactive Setup Wizard
 *
 * This wizard guides non-technical users through the complete setup process
 * for creating Discord Mini Apps (Activities).
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../..');

// ASCII Art Banner
const banner = `
${chalk.blue('╔═══════════════════════════════════════════════════════════════╗')}
${chalk.blue('║')}  ${chalk.bold.cyan('🎮 Discord Mini App Framework')}                               ${chalk.blue('║')}
${chalk.blue('║')}  ${chalk.gray('Create Discord Activities with ease!')}                        ${chalk.blue('║')}
${chalk.blue('╚═══════════════════════════════════════════════════════════════╝')}
`;

// Helper to display section headers
function sectionHeader(title) {
  console.log('\n' + chalk.blue('━'.repeat(60)));
  console.log(chalk.bold.white(`  ${title}`));
  console.log(chalk.blue('━'.repeat(60)) + '\n');
}

// Helper to display info boxes
function infoBox(title, content) {
  console.log(chalk.cyan('┌─ ') + chalk.bold.cyan(title) + chalk.cyan(' ─'.padEnd(50, '─') + '┐'));
  content.split('\n').forEach(line => {
    console.log(chalk.cyan('│ ') + line.padEnd(58) + chalk.cyan('│'));
  });
  console.log(chalk.cyan('└' + '─'.repeat(60) + '┘'));
}

// Check if a command exists
function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Main wizard function
async function runWizard() {
  console.clear();
  console.log(banner);

  console.log(chalk.gray('Welcome! This wizard will help you set up everything you need'));
  console.log(chalk.gray('to create Discord Mini Apps (Activities).\n'));

  // Step 1: Check Prerequisites
  sectionHeader('📋 Step 1: Checking Prerequisites');

  const prerequisites = [
    { name: 'Node.js', cmd: 'node', version: 'node --version', required: true },
    { name: 'npm', cmd: 'npm', version: 'npm --version', required: true },
    { name: 'Git', cmd: 'git', version: 'git --version', required: false },
    { name: 'Cloudflared', cmd: 'cloudflared', version: 'cloudflared --version', required: false }
  ];

  let missingRequired = [];
  let missingOptional = [];

  for (const prereq of prerequisites) {
    const spinner = ora(`Checking ${prereq.name}...`).start();

    if (commandExists(prereq.cmd)) {
      try {
        const version = execSync(prereq.version, { encoding: 'utf8' }).trim().split('\n')[0];
        spinner.succeed(chalk.green(`${prereq.name}: ${version}`));
      } catch {
        spinner.succeed(chalk.green(`${prereq.name}: installed`));
      }
    } else {
      if (prereq.required) {
        spinner.fail(chalk.red(`${prereq.name}: NOT FOUND (required)`));
        missingRequired.push(prereq);
      } else {
        spinner.warn(chalk.yellow(`${prereq.name}: NOT FOUND (optional)`));
        missingOptional.push(prereq);
      }
    }
  }

  if (missingRequired.length > 0) {
    console.log('\n' + chalk.red.bold('❌ Missing required dependencies:'));
    console.log(chalk.yellow('\nPlease install the following before continuing:'));
    missingRequired.forEach(p => {
      console.log(chalk.white(`  • ${p.name}: Visit https://nodejs.org/`));
    });
    process.exit(1);
  }

  if (missingOptional.length > 0) {
    console.log('\n' + chalk.yellow('⚠️  Optional tools not installed:'));
    missingOptional.forEach(p => {
      if (p.name === 'Cloudflared') {
        console.log(chalk.gray(`  • ${p.name}: Required for tunneling. Install from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/`));
      }
    });
  }

  // Step 2: Discord Developer Portal Setup
  sectionHeader('🔧 Step 2: Discord Developer Portal Setup');

  infoBox('What you need',
`To create a Discord Mini App, you need:
1. A Discord account
2. A Discord Application (created at discord.com/developers)
3. Client ID and Client Secret from your app`);

  const { hasDiscordApp } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasDiscordApp',
      message: 'Do you already have a Discord Application created?',
      default: false
    }
  ]);

  if (!hasDiscordApp) {
    console.log('\n' + chalk.cyan.bold('📝 Let me guide you through creating a Discord Application:\n'));

    const steps = [
      '1. Go to https://discord.com/developers/applications',
      '2. Click "New Application" button (top right)',
      '3. Enter a name for your app (e.g., "My Mini App")',
      '4. Accept the terms and click "Create"',
      '5. Go to "OAuth2" in the left sidebar',
      '6. Copy your "Client ID" (you\'ll need this)',
      '7. Click "Reset Secret" and copy your "Client Secret"',
      '8. Under "Redirects", add: http://localhost:3000',
      '',
      '⚠️  IMPORTANT: For Activities, also do:',
      '9. Go to "Activities" in the left sidebar',
      '10. Enable "Activities" toggle',
      '11. Set "Default Activity URL" to your tunnel URL (we\'ll set this later)'
    ];

    steps.forEach(step => console.log(chalk.gray(`  ${step}`)));

    const { openBrowser } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'openBrowser',
        message: 'Would you like me to open the Discord Developer Portal in your browser?',
        default: true
      }
    ]);

    if (openBrowser) {
      const open = (await import('open')).default;
      await open('https://discord.com/developers/applications');
      console.log(chalk.green('\n✓ Opened Discord Developer Portal in your browser'));
    }

    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Press Enter when you\'ve created your application and have your credentials ready...'
      }
    ]);
  }

  // Step 3: Collect Credentials
  sectionHeader('🔑 Step 3: Configure Your Credentials');

  console.log(chalk.gray('Your credentials will be stored securely in a .env file.\n'));

  const credentials = await inquirer.prompt([
    {
      type: 'input',
      name: 'clientId',
      message: 'Enter your Discord Client ID:',
      validate: (input) => {
        if (!input || input.length < 10) {
          return 'Please enter a valid Client ID (it\'s a long number)';
        }
        return true;
      }
    },
    {
      type: 'password',
      name: 'clientSecret',
      message: 'Enter your Discord Client Secret:',
      mask: '*',
      validate: (input) => {
        if (!input || input.length < 10) {
          return 'Please enter a valid Client Secret';
        }
        return true;
      }
    }
  ]);

  // Step 4: Project Configuration
  sectionHeader('⚙️  Step 4: Project Configuration');

  const projectConfig = await inquirer.prompt([
    {
      type: 'input',
      name: 'appName',
      message: 'What would you like to name your Mini App?',
      default: 'My Discord Mini App',
      validate: (input) => input.length > 0 || 'Please enter a name'
    },
    {
      type: 'list',
      name: 'template',
      message: 'Choose a template:',
      choices: [
        { name: '🎯 Basic - Simple starter template', value: 'basic' },
        { name: '⚛️  React - React with TypeScript', value: 'react' },
        { name: '🎮 Game - Game-ready with canvas', value: 'game' },
        { name: '💬 Social - Voice/chat features', value: 'social' }
      ],
      default: 'basic'
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select additional features:',
      choices: [
        { name: 'Voice Channel Integration', value: 'voice', checked: true },
        { name: 'User Avatar Display', value: 'avatar', checked: true },
        { name: 'Guild/Server Info', value: 'guild', checked: false },
        { name: 'Multiplayer Support', value: 'multiplayer', checked: false }
      ]
    }
  ]);

  // Step 5: Generate Project
  sectionHeader('🚀 Step 5: Setting Up Your Project');

  const spinner = ora('Creating project files...').start();

  try {
    // Create .env file
    const envContent = `# Discord Mini App Configuration
# Generated by Discord Mini App Framework Wizard

# Your Discord Application Client ID (public)
VITE_CLIENT_ID=${credentials.clientId}

# Your Discord Application Client Secret (keep this secret!)
CLIENT_SECRET=${credentials.clientSecret}

# App Configuration
APP_NAME="${projectConfig.appName}"

# Server Configuration
PORT=3001
CLIENT_PORT=3000

# Development
NODE_ENV=development
`;

    await fs.writeFile(path.join(rootDir, '.env'), envContent);
    spinner.text = 'Created .env file...';

    // Create .env.example
    const envExampleContent = `# Discord Mini App Configuration
# Copy this file to .env and fill in your values

# Your Discord Application Client ID (public)
VITE_CLIENT_ID=your_client_id_here

# Your Discord Application Client Secret (keep this secret!)
CLIENT_SECRET=your_client_secret_here

# App Configuration
APP_NAME="My Discord Mini App"

# Server Configuration
PORT=3001
CLIENT_PORT=3000

# Development
NODE_ENV=development
`;

    await fs.writeFile(path.join(rootDir, '.env.example'), envExampleContent);

    // Update config file with project settings
    const configContent = {
      appName: projectConfig.appName,
      template: projectConfig.template,
      features: projectConfig.features,
      createdAt: new Date().toISOString(),
      clientId: credentials.clientId
    };

    await fs.writeFile(
      path.join(rootDir, 'miniapp.config.json'),
      JSON.stringify(configContent, null, 2)
    );

    spinner.succeed(chalk.green('Project files created!'));

    // Install dependencies
    spinner.start('Installing dependencies (this may take a minute)...');

    execSync('npm install', { cwd: rootDir, stdio: 'pipe' });

    spinner.succeed(chalk.green('Dependencies installed!'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to set up project'));
    console.error(chalk.red(error.message));
    process.exit(1);
  }

  // Step 6: Final Instructions
  sectionHeader('✅ Setup Complete!');

  console.log(chalk.green.bold('🎉 Your Discord Mini App is ready!\n'));

  console.log(chalk.white('To start developing, run these commands:\n'));

  console.log(chalk.cyan('  # Terminal 1 - Start the development server:'));
  console.log(chalk.white('  npm run dev\n'));

  console.log(chalk.cyan('  # Terminal 2 - Start the tunnel (for Discord to access your app):'));
  console.log(chalk.white('  npm run tunnel\n'));

  infoBox('Next Steps',
`1. Run "npm run dev" to start the development server
2. Run "npm run tunnel" in another terminal
3. Copy the tunnel URL (looks like: https://xxx.trycloudflare.com)
4. Go to Discord Developer Portal > Your App > Activities
5. Set the tunnel URL as your Activity URL
6. Test your app in Discord!`);

  console.log('\n' + chalk.gray('Need help? Run: npm run wizard -- --help'));
  console.log(chalk.gray('Documentation: https://github.com/discord/embedded-app-sdk\n'));

  // Ask if user wants to start dev server
  const { startDev } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'startDev',
      message: 'Would you like to start the development server now?',
      default: true
    }
  ]);

  if (startDev) {
    console.log('\n' + chalk.cyan('Starting development server...'));
    console.log(chalk.gray('(Press Ctrl+C to stop)\n'));

    const child = spawn('npm', ['run', 'dev'], {
      cwd: rootDir,
      stdio: 'inherit'
    });

    child.on('error', (err) => {
      console.error(chalk.red('Failed to start dev server:', err.message));
    });
  }
}

// Run the wizard
runWizard().catch(console.error);
