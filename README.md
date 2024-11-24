# 🌲 Flash Hydrate

Flash Hydrate is a friendly VS Code extension that helps you quickly scaffold new repositories using Claude's AI capabilities. Think of it as your helpful forest friend who knows how to build cozy homes for all your code! 

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support-yellow?style=flat&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/conscious.robot)

## 🎋 Features

- **One-Command Scaffolding**: Just describe what you want to build, and watch the magic happen!
- **Smart Structure Generation**: Creates a well-organized repository structure with best practices
- **Ecosystem Awareness**: Understands modern development patterns and tools
- **Forest-Friendly Setup**: 
  - Generates all necessary configuration files
  - Sets up testing infrastructure
  - Creates meaningful documentation
  - Adds appropriate gitignores and other essentials

## 🦊 Usage

1. Open the Command Palette (Ctrl+Shift+P or Cmd+Shift+P)
2. Type "Flash Hydrate"
3. Select "Flash Hydrate: Scaffold Repository"
4. Describe your desired repository, for example:
   - "A React todo app with TypeScript and Tailwind"
   - "A Python Flask API for managing a book library"
   - "A Node.js CLI tool for converting markdown to PDF"

### 🦉 Example Input/Output

```bash
# Input:
"Create a React component library with TypeScript and Storybook"

# Output:
📁 my-component-lib/
  ├── 📄 package.json
  ├── 📄 tsconfig.json
  ├── 📄 .storybook/
  ├── 📄 src/
  │   ├── components/
  │   ├── tests/
  │   └── stories/
  └── 📄 README.md
```

## 🦫 Configuration

Configure through VS Code settings:

- `claude-vscode.model`: Choose your Claude model
  - Default: "claude-3-opus-20240229"
  - Options: ["claude-3-opus-20240229", "claude-3-sonnet-20240229"]
  
- `claude-vscode.apiKey`: Your Claude API key (required)

## 🦁 Tips for Good Scaffolding

1. **Be Specific**: The more details you provide, the better the scaffolding
   - Good: "A React app with TypeScript, Tailwind, and React Query for a todo list manager"
   - Less Good: "A React app"

2. **Mention Key Technologies**: Include important frameworks or tools you want to use

3. **Indicate Purpose**: Describe what the project is for to get appropriate structuring

## 🐢 Installation

1. Open VS Code
2. Visit Extensions (Ctrl+Shift+X)
3. Search for "Flash Hydrate"
4. Click Install

## 🦊 Development

```bash
# Install dependencies
pnpm install

# Build the extension
pnpm run build

# Run tests
pnpm test

# Package the extension
vsce package --no-dependencies
```

## 🦝 Support

If Flash Hydrate helps you build your forest of code, consider buying me a coffee! Every contribution helps keep the forest growing.

<a href="https://www.buymeacoffee.com/conscious.robot" target="_blank">
  <img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" height="60" width="217" style="height: 60px !important;width: 217px !important;" />
</a>

## 🦡 License

MIT

## 🐻 Contributing

All forest friends are welcome to contribute! Please check our [contribution guidelines](CONTRIBUTING.md).

## 🦌 Release Notes

See [CHANGELOG.md](CHANGELOG.md) for the full journey through our forest.

## 🦔 Known Issues

- The extension needs a Claude API key to work
- Some scaffolding operations might take a little time as Claude thinks about the best structure
- Currently only supports single-workspace scaffolding

## 🐿️ Roadmap

- Support for more complex project structures
- Template saving and reuse
- Custom scaffolding recipes
- Multi-workspace support

Made with 💚 by Conscious Robot 🌲