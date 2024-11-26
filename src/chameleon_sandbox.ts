/* eslint-disable no-console */
import ChangelogGenerator from './chameleon_utils'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables with path relative to project root
dotenv.config({ debug: process.env.DEBUG === 'true', path: path.resolve(__dirname, '../.env') })

async function runChangelogDemo() {
  // Ensure environment variables are set
  const githubToken = process.env.GITHUB_TOKEN
  const greptileToken = process.env.GREPTILE_API_KEY

  if (!githubToken || !greptileToken) {
    throw new Error('Missing required environment variables: GITHUB_TOKEN and/or GREPTILE_API_KEY')
  }

  // Initialize the changelog generator
  const generator = new ChangelogGenerator(githubToken, greptileToken)

  // Configure the changelog parameters
  const config = {
    owner: 'greptileai',
    repo: 'greptile',
    startDate: new Date('2024-11-18'), // Example start date
    endDate: new Date(), // Current date
    customInstructions: `Generate a user-friendly changelog with no more than 5 items in the following format:
<Update label="2024-11-26" description="v0.1.0">
  [changelog content here]
</Update>`,
  }

  try {
    console.log('Generating changelog...')
    const changelog = await generator.generateChangelog(config)
    console.log('Generated Changelog:')
    console.log(changelog)
  } catch (error) {
    console.error('Error generating changelog:', error)
  }
}

// Run the demo
runChangelogDemo().catch(console.error)
