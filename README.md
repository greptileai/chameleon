# Chameleon: Beautiful Changelog Generator

<p align="center">
  <img src="https://avatars.githubusercontent.com/u/140149887?s=280&v=4" alt="Chameleon Logo" width="200"/>
</p>

<p align="center">
  <b>A beautiful, modern CLI for generating intelligent changelogs from Git repositories</b>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.x-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-18.x%2B-green" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
</p>

---

## ✨ Features

- 🎨 **Beautiful UI** - Modern terminal interface with colors, gradients, and stylish boxes
- 📋 **Clipboard Support** - Generated changelogs are automatically copied to your clipboard
- 📅 **Flexible Date Ranges** - Choose from preset ranges or select custom dates with a date picker
- 🖼️ **Image Display** - Show repository logos or any image directly in your terminal
- 💾 **Save to File** - Save generated changelogs to local files and open them afterward
- 🔧 **Easy Setup** - Interactive setup wizard for environment variables
- 🔄 **Multiple Formats** - Generate internal, external, or Mintlify-compatible changelogs
- 🤖 **AI-powered** - Uses Greptile AI to generate intelligent, context-aware changelogs

## 📦 Installation

```bash
# Clone the repository
git clone https://github.com/greptileai/chameleon.git
cd greplog

# Install dependencies
npm install

# Run setup wizard
npm run setup
```

## 🔑 Prerequisites

You'll need the following API tokens:

- **GitHub Token** - For accessing GitHub repositories ([create one here](https://github.com/settings/tokens))
- **Greptile API Key** - For AI-powered changelog generation ([get it here](https://app.greptile.com/settings/api))

The setup wizard will guide you through obtaining and configuring these tokens.

## 🚀 Usage

```bash
# Display help
npm start -- --help

# Generate a changelog
npm start -- cl

```

After building and installing globally:

```bash
# Display help
chameleon --help

# Generate a changelog
chameleon cl
```

### Command Options

- `cl, changelog` - Generate a changelog for a repository
  - `--logo <url>` - Display a logo image from a URL

## 🌟 Interactive Features

Chameleon offers a fully interactive experience:

1. **Repository Selection** - Automatically detects current repo or enter any GitHub repo
2. **Date Range** - Choose from preset ranges or select custom dates with an interactive calendar
3. **Format Selection** - Pick from different changelog formats or create a custom one
4. **Clipboard Integration** - Results are automatically copied to your clipboard
5. **File Export** - Save to file with your preferred filename
6. **Terminal Images** - View repository logos or custom images right in your terminal

## 🧩 Changelog Formats

Choose from multiple formatting options:

- **Internal** - Technical details targeting developers and internal teams
- **External** - User-friendly changes suitable for customer-facing release notes
- **Mintlify** - Special format compatible with Mintlify documentation
- **Custom** - Provide your own custom instructions for tailored results

## 🛠️ Development

```bash
# Run in development mode
npm run start

# Build the project
npm run build

# Watch for changes
npm run build:watch

# Run tests
npm run test
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgements

- Built with [cli-typescript-starter](https://github.com/kucherenko/cli-typescript-starter)
- Powered by [Greptile](https://greptile.com) for intelligent changelog generation

---

<p align="center">
  Made with ❤️ by Greptile
</p>

