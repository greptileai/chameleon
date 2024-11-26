import { Argv } from 'yargs'
import { logger } from '../logger'
import { green } from 'picocolors'
import ChangelogGenerator from '../chameleon_utils'

import { execSync } from 'child_process'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ debug: process.env.DEBUG === 'true', path: path.resolve(__dirname, '../../.env') })

interface CLArgv {}

export const command = 'cl'
export const describe = 'Generate a changelog for a repository'
export const aliases = ['changelog']

export function builder(yargs: Argv<CLArgv>): Argv {
  return yargs
}

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

export async function handler() {
  const currentRepo = getCurrentRepoInfo()

  // Get repository information
  const repoString = await logger.prompt('Enter repository (owner/repo)', {
    type: 'text',
    default: currentRepo ? `${currentRepo.owner}/${currentRepo.repo}` : undefined,
  })

  const [owner, repo] = repoString.split('/')
  if (!owner || !repo) {
    logger.error('Invalid repository format. Please use owner/repo format.')
    return
  }

  // New date range selection
  const dateRange = await logger.prompt('Select date range', {
    type: 'select',
    options: [
      { label: 'Last 24 hours', value: '1' },
      { label: 'Last 7 days', value: '7' },
      { label: 'Last 14 days', value: '14' },
      { label: 'Last 30 days', value: '30' },
    ],
  })

  const endDate = new Date().toISOString().split('T')[0]
  const daysAgo = parseInt(dateRange.toString()) // Will be 1, 7, 14, or 30
  const startDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  // Updated changelog type selection with custom option
  const changelogType = await logger.prompt('Select changelog type', {
    type: 'select',
    options: [
      { label: 'Internal', value: 'internal', hint: 'Technical details for developers' },
      { label: 'External', value: 'external', hint: 'User-facing changes' },
      { label: 'Mintlify', value: 'mintlify', hint: 'Changelog format for Mintlify' },
    ],
  })
  const instructions = await (async () => {
    switch (changelogType.toString()) {
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

  try {
    // Load tokens from environment
    const githubToken = process.env.GITHUB_TOKEN
    const greptileToken = process.env.GREPTILE_API_KEY

    if (!githubToken || !greptileToken) {
      logger.error('Missing required environment variables: GITHUB_TOKEN and/or GREPTILE_API_KEY')
      return
    }

    const generator = new ChangelogGenerator(githubToken, greptileToken)

    const config = {
      owner,
      repo,
      startDate: new Date(startDate as string),
      endDate: new Date(endDate as string),
      customInstructions: instructions,
    }

    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏']
    let frameIndex = 0
    const spinner = setInterval(() => {
      process.stdout.write(`\r${frames[frameIndex]} Generating changelog...`)
      frameIndex = (frameIndex + 1) % frames.length
    }, 80)

    const changelog = await generator.generateChangelog(config)

    clearInterval(spinner)
    process.stdout.write('\r') // Clear the spinner line

    logger.log('\nChangelog:')
    logger.log(green(changelog))
  } catch (error) {
    logger.error('Failed to generate changelog:', error instanceof Error ? error.message : String(error))
  }
}
