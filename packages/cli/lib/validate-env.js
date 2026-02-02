/**
 * Discord Mini App Framework - Environment Validator
 *
 * Validates environment configuration
 */

import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

/**
 * Validation result object
 */
const createResult = (valid, errors = [], warnings = []) => ({
  valid,
  errors,
  warnings,
});

/**
 * Validate environment configuration
 *
 * @param {string} rootDir - Project root directory
 * @returns {Promise<{valid: boolean, errors: string[], warnings: string[]}>}
 */
async function validateEnv(rootDir) {
  const errors = [];
  const warnings = [];

  // Check .env file exists
  const envPath = path.join(rootDir, '.env');

  try {
    await fs.access(envPath);
  } catch {
    errors.push('.env file not found');
    return createResult(false, errors, warnings);
  }

  // Load and parse .env
  const envConfig = dotenv.config({ path: envPath });

  if (envConfig.error) {
    errors.push(`Failed to parse .env file: ${envConfig.error.message}`);
    return createResult(false, errors, warnings);
  }

  const env = envConfig.parsed || {};

  // Check required variables
  const required = {
    VITE_CLIENT_ID: 'Discord Client ID',
    CLIENT_SECRET: 'Discord Client Secret',
  };

  for (const [key, desc] of Object.entries(required)) {
    if (!env[key]) {
      errors.push(`Missing required variable: ${key} (${desc})`);
    } else if (env[key].includes('your_') || env[key].includes('_here')) {
      errors.push(`${key} appears to be a placeholder value`);
    } else if (env[key].length < 10) {
      errors.push(`${key} appears to be invalid (too short)`);
    }
  }

  // Check optional variables
  const optional = {
    APP_NAME: { desc: 'Application Name', default: 'My Discord Mini App' },
    PORT: { desc: 'Server Port', default: '3001' },
    CLIENT_PORT: { desc: 'Client Port', default: '3000' },
  };

  for (const [key, { desc, default: defaultVal }] of Object.entries(optional)) {
    if (!env[key]) {
      warnings.push(`${key} (${desc}) not set, using default: ${defaultVal}`);
    }
  }

  return createResult(errors.length === 0, errors, warnings);
}

export default validateEnv;
