# Changelog Generator CLI

A command-line tool that generates intelligent changelogs from your GitHub repository using Greptile AI.

## Features

- 🤖 AI-powered changelog generation
- 📅 Flexible date range selection (24h, 7d, 14d, 30d)
- 🎯 Multiple changelog formats:
  - Internal (technical details for developers)
  - External (user-facing changes)
  - Mintlify (formatted for Mintlify documentation)
- 🔍 Auto-detection of current repository
- ⚡ Real-time progress indicator

## Prerequisites

Before using this tool, you'll need:

- Node.js installed
- GitHub Personal Access Token
- Greptile API Key

## Installation

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Create a `.env` file in the root directory:

   ```bash
   GITHUB_TOKEN=your_github_token
   GREPTILE_API_KEY=your_greptile_api_key
   ```

## Usage

Run `pnpm run cl` to start the CLI. Now follow the on-terminal instructions.
