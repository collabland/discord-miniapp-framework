#!/usr/bin/env node

/**
 * Discord Mini App Framework - Create Command
 *
 * Create a new Discord Mini App project
 */

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

program
  .name('dm-create')
  .description('Create a new Discord Mini App project')
  .argument('[name]', 'Project name')
  .option('-t, --template <template>', 'Template to use (basic, react, game, social)', 'basic')
  .option('-d, --dir <directory>', 'Target directory', '.')
  .option('-y, --yes', 'Skip prompts and use defaults')
  .parse();

const args = program.args;
const options = program.opts();

async function createNewProject() {
  console.log(chalk.blue.bold('\n🎮 Create Discord Mini App\n'));

  let projectName = args[0];
  let template = options.template;
  let targetDir = options.dir;

  // Interactive mode if name not provided
  if (!projectName && !options.yes) {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: 'my-discord-miniapp',
        validate: (input) => {
          if (!input || input.length < 1) return 'Please enter a name';
          if (!/^[a-zA-Z0-9-_\s]+$/.test(input)) {
            return 'Name can only contain letters, numbers, dashes, and underscores';
          }
          return true;
        },
      },
      {
        type: 'list',
        name: 'template',
        message: 'Choose a template:',
        choices: [
          { name: 'Basic - Simple starter template', value: 'basic' },
          { name: 'React - React with TypeScript', value: 'react' },
          { name: 'Game - Game-ready with canvas', value: 'game' },
          { name: 'Social - Voice/chat features', value: 'social' },
        ],
      },
    ]);

    projectName = answers.name;
    template = answers.template;
  }

  projectName = projectName || 'my-discord-miniapp';
  const projectSlug = projectName.toLowerCase().replace(/\s+/g, '-');
  const projectPath = path.resolve(targetDir, projectSlug);

  // Check if directory exists
  try {
    await fs.access(projectPath);
    console.log(chalk.red(`\n❌ Directory "${projectSlug}" already exists!`));
    process.exit(1);
  } catch {
    // Directory doesn't exist, which is good
  }

  const spinner = ora('Creating project...').start();

  try {
    // Create project directory structure
    await fs.mkdir(path.join(projectPath, 'packages/client/src'), { recursive: true });
    await fs.mkdir(path.join(projectPath, 'packages/server/src'), { recursive: true });

    // Copy from framework (this is the parent directory)
    const frameworkDir = path.resolve(__dirname, '../../..');

    // Copy client files
    spinner.text = 'Setting up client...';
    await copyFile(frameworkDir, projectPath, 'packages/client/package.json');
    await copyFile(frameworkDir, projectPath, 'packages/client/vite.config.ts');
    await copyFile(frameworkDir, projectPath, 'packages/client/tsconfig.json');
    await copyFile(frameworkDir, projectPath, 'packages/client/index.html');
    await copyFile(frameworkDir, projectPath, 'packages/client/src/main.ts');
    await copyFile(frameworkDir, projectPath, 'packages/client/src/styles.css');
    await copyFile(frameworkDir, projectPath, 'packages/client/src/vite-env.d.ts');

    // Copy server files
    spinner.text = 'Setting up server...';
    await copyFile(frameworkDir, projectPath, 'packages/server/package.json');
    await copyFile(frameworkDir, projectPath, 'packages/server/tsconfig.json');
    await copyFile(frameworkDir, projectPath, 'packages/server/src/app.ts');
    await copyFile(frameworkDir, projectPath, 'packages/server/src/environment.d.ts');

    // Create root package.json
    spinner.text = 'Creating configuration...';
    const packageJson = {
      name: projectSlug,
      version: '1.0.0',
      private: true,
      description: `Discord Mini App - ${projectName}`,
      type: 'module',
      workspaces: ['packages/*'],
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
      dependencies: {
        'npm-run-all2': '^7.0.0',
      },
      engines: {
        node: '>=18.0.0',
      },
    };

    await fs.writeFile(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create .env.example
    const envExample = `# Discord Mini App Configuration
# Copy this file to .env and fill in your values

VITE_CLIENT_ID=your_client_id_here
CLIENT_SECRET=your_client_secret_here
APP_NAME="${projectName}"
PORT=3001
CLIENT_PORT=3000
NODE_ENV=development
`;

    await fs.writeFile(path.join(projectPath, '.env.example'), envExample);

    // Create .gitignore
    const gitignore = `# Dependencies
node_modules/

# Build output
dist/
build/

# Environment files
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*

# Cloudflare tunnel
.cloudflared/
`;

    await fs.writeFile(path.join(projectPath, '.gitignore'), gitignore);

    // Create README
    const readme = `# ${projectName}

A Discord Mini App (Activity) built with the Discord Mini App Framework.

## Quick Start

1. Copy \`.env.example\` to \`.env\` and fill in your Discord credentials
2. Run \`npm install\`
3. Run \`npm run dev\` to start the development server
4. Run \`npm run tunnel\` in another terminal to expose your app

## Scripts

- \`npm run dev\` - Start development server
- \`npm run build\` - Build for production
- \`npm run tunnel\` - Start Cloudflare tunnel

## Getting Discord Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Copy your Client ID and Client Secret
4. Enable Activities in the Activities tab

## Learn More

- [Discord Embedded App SDK](https://discord.com/developers/docs/activities/overview)
- [Discord Developer Portal](https://discord.com/developers/applications)
`;

    await fs.writeFile(path.join(projectPath, 'README.md'), readme);

    // Create config file
    const config = {
      appName: projectName,
      template,
      createdAt: new Date().toISOString(),
    };

    await fs.writeFile(
      path.join(projectPath, 'miniapp.config.json'),
      JSON.stringify(config, null, 2)
    );

    spinner.succeed(chalk.green('Project created successfully!'));

    // Print next steps
    console.log(chalk.cyan('\n📁 Project created at:'), chalk.white(projectPath));

    console.log(chalk.cyan('\n🚀 Next steps:\n'));
    console.log(chalk.white(`  cd ${projectSlug}`));
    console.log(chalk.white('  cp .env.example .env'));
    console.log(chalk.white('  # Edit .env with your Discord credentials'));
    console.log(chalk.white('  npm install'));
    console.log(chalk.white('  npm run dev'));

    console.log(chalk.gray('\nFor guided setup, run: npm run wizard\n'));

  } catch (error) {
    spinner.fail(chalk.red('Failed to create project'));
    console.error(error);
    process.exit(1);
  }
}

async function copyFile(srcBase, destBase, relativePath) {
  const srcPath = path.join(srcBase, relativePath);
  const destPath = path.join(destBase, relativePath);

  try {
    const content = await fs.readFile(srcPath, 'utf8');
    await fs.mkdir(path.dirname(destPath), { recursive: true });
    await fs.writeFile(destPath, content);
  } catch (error) {
    // If source file doesn't exist, skip silently
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

createNewProject();
