interface RepositoryConfig {
  remote: string
  repository: string
  branch: string
  reload?: boolean
  notify?: boolean
}

interface Message {
  id: string
  content: string
  role: string
}

interface QueryConfig {
  messages: Message[]
  repositories: RepositoryConfig[]
  sessionId: string
  stream?: boolean
  genius?: boolean
}

interface RepositoryStatus {
  repository: string
  remote: string
  branch: string
  private: boolean
  status: string
  filesProcessed: number
  numFiles: number
  sha: string
}

interface Source {
  repository: string
  remote: string
  branch: string
  filepath: string
  linestart: number
  lineend: number
  summary: string
}

interface QueryResponse {
  message: string
  sources: Source[]
}

interface IndexResponse {
  message: string
  statusEndpoint: string
}

class GreptileAPI {
  private baseUrl = 'https://api.greptile.com/v2'
  private token: string
  private githubToken: string

  constructor(token: string, githubToken: string) {
    this.token = token
    this.githubToken = githubToken
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      'X-GitHub-Token': this.githubToken,
      'Content-Type': 'application/json',
    }
  }

  async indexRepository(config: RepositoryConfig): Promise<IndexResponse> {
    const response = await fetch(`${this.baseUrl}/repositories`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`Failed to index repository: ${response.statusText}`)
    }

    return response.json() as Promise<IndexResponse>
  }

  async queryRepository(config: QueryConfig): Promise<QueryResponse> {
    const response = await fetch(`${this.baseUrl}/query`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(config),
    })

    if (!response.ok) {
      throw new Error(`Failed to query repository: ${response.statusText}`)
    }

    return response.json() as Promise<QueryResponse>
  }

  async getRepositoryStatus(repository: RepositoryConfig): Promise<RepositoryStatus> {
    const repositoryId = `${encodeURIComponent(repository.remote)}:${encodeURIComponent(repository.branch)}:${encodeURIComponent(repository.repository)}`
    const response = await fetch(`${this.baseUrl}/repositories/${repositoryId}`, {
      method: 'GET',
      headers: this.getHeaders(),
    })

    if (!response.ok) {
      throw new Error(`Failed to get repository status: ${response.statusText}`)
    }

    return response.json() as Promise<RepositoryStatus>
  }
}

export default GreptileAPI
