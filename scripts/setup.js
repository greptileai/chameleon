#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const inquirer = require('inquirer');
const chalk = require('chalk');
const boxen = require('boxen');
const gradient = require('gradient-string');
const figlet = require('figlet');

// Create a beautiful header
const appName = figlet.textSync('GREPLOG SETUP', {
  font: 'Standard',
  horizontalLayout: 'full'
});

// Create a gradient effect for the heading
const rainbowTitle = gradient.pastel.multiline(appName);

// Welcome message
console.log(boxen(
  `${rainbowTitle}\n\n${chalk.bold('Welcome to the Greplog Setup Wizard!')}\n
${chalk.dim('This wizard will help you set up your environment variables for the CLI.')}`,
  {
    margin: 1,
    padding: 1,
    borderStyle: 'round',
    borderColor: 'cyan',
    backgroundColor: '#222',
  }
));

async function main() {
  // Check if .env file exists
  const envPath = path.resolve(process.cwd(), '.env');
  const envExamplePath = path.resolve(process.cwd(), '.env.example');
  
  let existingEnv = {};
  
  if (fs.existsSync(envPath)) {
    console.log(chalk.blue('An existing .env file was found. We will update it.'));
    
    // Read existing .env
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line && line.includes('=')) {
        const [key, value] = line.split('=');
        existingEnv[key.trim()] = value.trim();
      }
    });
  } else if (fs.existsSync(envExamplePath)) {
    // Copy the example file if it exists
    console.log(chalk.blue('No .env file found. Creating a new one from .env.example.'));
    fs.copyFileSync(envExamplePath, envPath);
  } else {
    // Create a new file if no example exists
    console.log(chalk.blue('No .env file or template found. Creating a new one.'));
    fs.writeFileSync(envPath, '# Greplog Environment Variables\n\n');
  }
  
  // Ask for GitHub token
  const githubToken = await inquirer.prompt([
    {
      type: 'input',
      name: 'token',
      message: chalk.green('Enter your GitHub token:'),
      default: existingEnv.GITHUB_TOKEN || '',
      validate: input => input ? true : 'GitHub token is required'
    }
  ]);
  
  // Ask for Greptile API key
  const greptileKey = await inquirer.prompt([
    {
      type: 'input',
      name: 'key',
      message: chalk.green('Enter your Greptile API key:'),
      default: existingEnv.GREPTILE_API_KEY || '',
      validate: input => input ? true : 'Greptile API key is required'
    }
  ]);
  
  // Write to .env file
  const envContent = `# Greplog Environment Variables
GITHUB_TOKEN=${githubToken.token}
GREPTILE_API_KEY=${greptileKey.key}
`;

  fs.writeFileSync(envPath, envContent);
  
  console.log(boxen(
    chalk.green('✅ Setup complete! Your environment variables have been saved to .env file.'),
    {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'green',
    }
  ));
  
  // Ask if the user wants to test the CLI now
  const shouldTest = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'test',
      message: chalk.blue('Would you like to test the CLI now?'),
      default: true
    }
  ]);
  
  if (shouldTest.test) {
    console.log(chalk.blue('Starting the CLI...'));
    try {
      execSync('npm run start', { stdio: 'inherit' });
    } catch (error) {
      console.error(chalk.red('Failed to start the CLI. Please run it manually with npm run start'));
    }
  } else {
    console.log(chalk.blue('To start the CLI, run: npm run start'));
  }
}

main().catch(error => {
  console.error(chalk.red('Error during setup:'), error);
  process.exit(1);
}); 