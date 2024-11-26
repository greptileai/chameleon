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

  async generateChangelog({ owner, repo, startDate, endDate, customInstructions }: ChangelogConfig): Promise<string> {
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
    // Query Greptile with the diff and custom instructions
    const queryResponse = await this.greptile.queryRepository({
      messages: [
        {
          role: 'user',
          content: `${customInstructions}\n\n The response should contain only the changelog with nothing before or after it. There should not be a title. Reference the following changes:\n${commits.data.files
            ?.map((file) => `${file.filename}:\n${file.patch}`)
            .join('\n\n')}`,
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

    return queryResponse.message
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
