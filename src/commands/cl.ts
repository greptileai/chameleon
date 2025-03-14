import chalk from 'chalk'
import ChangelogGenerator from '../chameleon_utils'
import { execSync } from 'child_process'
import path from 'path'
import dotenv from 'dotenv'
import boxen from 'boxen'
import clipboardy from 'clipboardy'
import figures from 'figures'
import inquirer from 'inquirer'
import fs from 'fs'
import open from 'open'
import { Octokit } from '@octokit/rest'

// Use require for the datepicker since types aren't available
// @ts-ignore - ignore the missing type declaration
const inquirerDatepicker = require('inquirer-datepicker-prompt');

inquirer.registerPrompt('datepicker', inquirerDatepicker)

dotenv.config({ debug: process.env.DEBUG === 'true', path: path.resolve(__dirname, '../../.env') })

// ASCII spinner frames
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']

export const command = 'cl'
export const describe = 'Generate a beautiful changelog for a repository'
export const aliases = ['changelog']

function getCurrentRepoInfo(): { owner: string; repo: string } | null {
  try {
    // Get the remote URL
    const remoteUrl = execSync('git config --get remote.origin.url', { encoding: 'utf8' }).trim()

    // Extract owner/repo from different Git URL formats
    const match = remoteUrl.match(/github\.com[:/]([^/]+)\/([^/.]+)/)
    if (match) {
      return {
        owner: match[1] || '',
        repo: match[2] || '',
      }
    }
  } catch (error) {
    return null
  }
  return null
}

// Function to display a spinner with a message
function createSpinner() {
  let frameIndex = 0
  let intervalId: NodeJS.Timeout | null = null
  
  return {
    start: (message: string) => {
      frameIndex = 0
      intervalId = setInterval(() => {
        process.stdout.write(`\r${chalk.cyan(spinnerFrames[frameIndex])} ${message}`)
        frameIndex = (frameIndex + 1) % spinnerFrames.length
      }, 80)
    },
    stop: () => {
      if (intervalId) {
        clearInterval(intervalId)
        process.stdout.write('\r\x1b[K') // Clear the line
      }
    }
  }
}

// Add a function to verify repository exists
async function repositoryExists(owner: string, repo: string, token: string): Promise<boolean> {
  try {
    const octokit = new Octokit({ auth: token });
    await octokit.repos.get({ owner, repo });
    return true;
  } catch (error) {
    return false;
  }
}

export async function handler() {

  const currentRepo = getCurrentRepoInfo()

  // Load tokens early to validate the repository
  const githubToken = process.env.GITHUB_TOKEN
  const greptileToken = process.env.GREPTILE_API_KEY

  if (!githubToken || !greptileToken) {
    console.log(boxen(
      chalk.red(`${figures.cross} Missing required environment variables: GITHUB_TOKEN and/or GREPTILE_API_KEY`),
      {
        padding: 1,
        margin: 1,
        borderColor: 'red',
        borderStyle: 'round'
      }
    ))
    return
  }

  // Improved prompt for repository with clearer message
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'repository',
      message: chalk.blue(`${figures.pointer} Enter repository in format owner/repo:`),
      default: currentRepo ? `${currentRepo.owner}/${currentRepo.repo}` : undefined,
      validate: async (input: string) => {
        // Check if input contains a slash to separate owner and repo
        if (!input.includes('/')) {
          return 'Please enter in owner/repo format';
        }
        
        const [owner, repo] = input.split('/');
        if (!owner || !repo) {
          return 'Invalid repository format. Use owner/repo format.';
        }
        
        // Verify repository exists
        const exists = await repositoryExists(owner, repo, githubToken);
        if (!exists) {
          return `Repository ${owner}/${repo} not found. Please check the name and your permissions.`;
        }
        
        return true;
      }
    },
    {
      type: 'list',
      name: 'dateRangeType',
      message: chalk.blue(`${figures.pointer} How would you like to specify the date range?`),
      choices: [
        { name: 'Preset ranges', value: 'preset' },
        { name: 'Custom date range', value: 'custom' }
      ]
    }
  ])

  // Split the repository input to get owner and repo
  const [owner, repo] = answers.repository.split('/')

  let startDate: Date, endDate = new Date()
  
  if (answers.dateRangeType === 'preset') {
    const presetAnswer = await inquirer.prompt([
      {
        type: 'list',
        name: 'preset',
        message: chalk.blue(`${figures.pointer} Select date range:`),
        choices: [
          { name: 'Last 24 hours', value: '1' },
          { name: 'Last 7 days', value: '7' },
          { name: 'Last 14 days', value: '14' },
          { name: 'Last 30 days', value: '30' },
          { name: 'Last 90 days', value: '90' }
        ]
      }
    ])
    
    const daysAgo = parseInt(presetAnswer.preset)
    startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  } else {
    // Custom date range
    const customDateRange = await inquirer.prompt([
      {
        type: 'datepicker',
        name: 'startDate',
        message: chalk.blue(`${figures.pointer} Select start date:`),
        format: ['mm', '/', 'dd', '/', 'yyyy']
      },
      {
        type: 'datepicker',
        name: 'endDate',
        message: chalk.blue(`${figures.pointer} Select end date:`),
        format: ['mm', '/', 'dd', '/', 'yyyy'],
        default: new Date()
      }
    ])
    
    startDate = customDateRange.startDate
    endDate = customDateRange.endDate
  }

  // Updated changelog type selection with custom option
  const formatAnswer = await inquirer.prompt([
    {
      type: 'list',
      name: 'format',
      message: chalk.blue(`${figures.pointer} Select changelog format:`),
      choices: [
        { name: 'Internal (Technical details for developers)', value: 'internal' },
        { name: 'External (User-facing changes)', value: 'external' },
        { name: 'Mintlify (Changelog format for Mintlify)', value: 'mintlify' },
        { name: 'Custom format', value: 'custom' }
      ]
    }
  ])
  
  let instructions: string
  
  if (formatAnswer.format === 'custom') {
    const customAnswer = await inquirer.prompt([
      {
        type: 'editor',
        name: 'customInstructions',
        message: chalk.blue(`${figures.pointer} Enter custom instructions for generating the changelog:`),
        default: 'Generate a user-friendly changelog that highlights major features, bug fixes, and improvements.'
      }
    ])
    instructions = customAnswer.customInstructions
  } else {
    instructions = (() => {
      switch (formatAnswer.format) {
        case 'internal':
          return 'Generate a short technical changelog that contains no more than 5 bullet points in markdown.'
        case 'external':
          return 'Generate a user-friendly changelog that contains no more than 5 bullet points in markdown.'
        case 'mintlify':
          return `Generate a user-friendly changelog with no more than 5 items in the following format:
<Update label="${new Date().toISOString().split('T')[0]}" description="[VERSION]">
  [changelog content in markdown here]
</Update>`
        default:
          return 'Generate a user-friendly changelog that contains no more than 5 bullet points.'
      }
    })()
  }

  try {
    const generator = new ChangelogGenerator(githubToken, greptileToken)

    const config = {
      owner,
      repo,
      startDate,
      endDate,
      customInstructions: instructions,
    }

    const spinner = createSpinner()
    spinner.start('Generating changelog, please wait...')

    try {
      const changelog = await generator.generateChangelog(config)
      spinner.stop()
      
      // Check if this is a "No Changes" response
      const isNoChanges = changelog.includes('No Changes Found') || 
                         changelog.includes('No code changes were found');
      
      // Display the changelog in a nice box with conditional styling
      const changelogBox = boxen(
        // Parse markdown for bold and italics
        changelog
          .replace(/\*\*(.*?)\*\*/g, (_, text) => chalk.bold(text))        // Bold
          .replace(/\*(.*?)\*/g, (_, text) => chalk.italic(text))          // Italic
          .replace(/^## No Changes Found$/m, chalk.red.bold('NO CHANGELOG')) // Replace title
          .replace(/\*Generated on (.*?)\*/, (_, date) => 
            chalk.dim(`Generated on ${date}`))                             // Style date
          .replace(/- (.*)/g, (_, text) => `- ${text}`),                   // Keep bullet points
        {
          title: isNoChanges ? '❌' : '📝 Changelog',
          titleAlignment: 'center',
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: isNoChanges ? 'red' : 'green',
        }
      )
      
      console.log(changelogBox)
      
      // Don't copy to clipboard if no changes found
      if (!isNoChanges) {
        // Copy to clipboard functionality
        await clipboardy.write(changelog)
        console.log(chalk.green(`${figures.tick} Changelog copied to clipboard!`))
        
        // Ask if user wants to save the changelog
        const { saveChangelog } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'saveChangelog',
            message: chalk.blue(`${figures.pointer} Would you like to save the changelog to a file?`),
            default: false
          }
        ])
        
        if (saveChangelog) {
          const { filename } = await inquirer.prompt([
            {
              type: 'input',
              name: 'filename',
              message: chalk.blue(`${figures.pointer} Enter filename:`),
              default: 'CHANGELOG.md'
            }
          ])
          
          fs.writeFileSync(filename, changelog)
          console.log(chalk.green(`${figures.tick} Changelog saved to ${filename}`))
          
          // Ask if user wants to open the file
          const { openFile } = await inquirer.prompt([
            {
              type: 'confirm',
              name: 'openFile',
              message: chalk.blue(`${figures.pointer} Would you like to open the file?`),
              default: false
            }
          ])
          
          if (openFile) {
            await open(filename)
          }
        }
      }
      
      console.log(chalk.green('\nThank you for using Chameleon!'))
      console.log(chalk.green('Check out more on https://github.com/greptileai'))
      console.log(chalk.green('Made with ❤️ by Greptile'))
      console.log(chalk.green(''))
      
    } catch (error) {
      // Stop spinner first
      spinner.stop()
      
      // Display error in a nicely formatted box
      console.log(boxen(
        chalk.red(`${figures.cross} Failed to generate changelog: ${error instanceof Error ? error.message : String(error)}`),
        {
          padding: 1,
          margin: 1,
          borderColor: 'red',
          borderStyle: 'round'
        }
      ))
      
      // Exit the function to prevent further processing
      return
    }
    
  } catch (error) {
    console.log(boxen(
      chalk.red(`${figures.cross} Failed to generate changelog: ${error instanceof Error ? error.message : String(error)}`),
      {
        padding: 1,
        margin: 1,
        borderColor: 'red',
        borderStyle: 'round'
      }
    ))
  }
}
