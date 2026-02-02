/**
 * Discord Mini App Framework - Logger Utility
 *
 * Provides consistent logging across CLI tools
 */

import chalk from 'chalk';

const logger = {
  info: (message) => console.log(chalk.blue('ℹ'), message),
  success: (message) => console.log(chalk.green('✓'), message),
  warning: (message) => console.log(chalk.yellow('⚠'), message),
  error: (message) => console.log(chalk.red('✗'), message),

  // Section headers
  section: (title) => {
    console.log('\n' + chalk.blue('━'.repeat(50)));
    console.log(chalk.bold.white(`  ${title}`));
    console.log(chalk.blue('━'.repeat(50)) + '\n');
  },

  // Detailed logs
  debug: (message) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray('[DEBUG]'), message);
    }
  },

  // Step progress
  step: (current, total, message) => {
    const progress = `[${current}/${total}]`;
    console.log(chalk.cyan(progress), message);
  },

  // Code blocks
  code: (content) => {
    console.log(chalk.gray('  ' + content.split('\n').join('\n  ')));
  },

  // Blank line
  blank: () => console.log(''),
};

export default logger;
