import { Octokit } from '@octokit/rest'
import GreptileAPI from './greptile'

interface ChangelogConfig {
  owner: string
  repo: string
  startDate: Date
  endDate: Date
  customInstructions: string
}

class ChangelogGenerator {
  private octokit: Octokit
  private greptile: GreptileAPI

  constructor(githubToken: string, greptileToken: string) {
    this.octokit = new Octokit({ auth: githubToken })
    this.greptile = new GreptileAPI(greptileToken, githubToken)
  }

  async generateChangelog(config: ChangelogConfig): Promise<string> {
    const { owner, repo, startDate, endDate, customInstructions } = config;
    
    // Get commits between dates
    const commits = await this.octokit.repos.compareCommits({
      owner,
      repo,
      base: await this.getCommitFromDate(owner, repo, startDate),
      head: await this.getCommitFromDate(owner, repo, endDate),
    })

    // Index repository in Greptile
    await this.greptile.indexRepository({
      remote: 'github',
      repository: `${owner}/${repo}`,
      branch: 'main', // You might want to make this configurable
    })

    // Check if there are any changes before making the API call
    const noChangesFound = !commits.data.files || commits.data.files.length === 0;
    
    // Construct the prompt based on whether changes were found
    let prompt: string;
    
    if (noChangesFound) {
      prompt = `
Generate a changelog for the following repository: ${owner}/${repo}
Time period: From ${startDate.toISOString()} to ${endDate.toISOString()}

${customInstructions || "Generate a user-friendly changelog in markdown format."}

There are NO CHANGES found in this repository during the specified time period.
Please generate a message indicating that no changes were found.

Your response should follow this format:
${customInstructions?.includes('mintlify') 
  ? `<Update label="${new Date().toISOString().split('T')[0]}" description="No Changes">
  - No code changes were found in the repository during the specified time period.
  - This could be due to no commits being made or the selected date range not containing any activity.
</Update>`
  : `## No Changes Found

- No code changes were found in the repository during the specified time period.
- This could be due to no commits being made or the selected date range not containing any activity.
- Try selecting a different date range or repository to view changes.

*Generated on ${new Date().toLocaleString()}*`
}

Do not include any explanations outside of this format. Only return the formatted message.
`;
    } else {
      // Normal case with changes
      prompt = `
Generate a changelog for the following repository: ${owner}/${repo}
Time period: From ${startDate.toISOString()} to ${endDate.toISOString()}

${customInstructions || "Generate a user-friendly changelog in markdown format."}

The response should contain only the changelog with nothing before or after it.
There should not be any additional explanations or notes.

Reference the following changes:
${commits.data.files
  ?.map((file) => `${file.filename}:\n${file.patch}`)
  .join('\n\n')}`;
    }

    // Make API call with the constructed prompt - use the prompt variable we created
    const queryResponse = await this.greptile.queryRepository({
      messages: [
        {
          role: 'user',
          content: prompt,
          id: Date.now().toString(),
        },
      ],
      repositories: [
        {
          remote: 'github',
          repository: `${owner}/${repo}`,
          branch: 'main',
        },
      ],
      sessionId: Date.now().toString(),
    })
    
    // Return the response message
    return queryResponse.message;
  }

  private async getCommitFromDate(owner: string, repo: string, date: Date): Promise<string> {
    const commits = await this.octokit.repos.listCommits({
      owner,
      repo,
      until: date.toISOString(),
      per_page: 1,
    })

    if (commits.data.length === 0) {
      throw new Error(`No commits found before ${date.toISOString()}`)
    }

    return commits.data[0]?.sha || ''
  }
}

export default ChangelogGenerator
