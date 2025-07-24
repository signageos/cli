# Documentation Generator

Automated TypeScript-based documentation generation system for the signageOS CLI.

## Features

- **CLI Command Discovery** - Recursively scans and discovers all commands and subcommands
- **JSDoc Parsing** - Comprehensive extraction of descriptions, examples, metadata, and cross-references
- **Docusaurus Integration** - Generates frontmatter with IDs, titles, and automatic sidebar positioning
- **Static Content Merging** - Integrates additional examples and content from static template files
- **Link Validation** - Validates internal markdown references and external HTTP/HTTPS URLs
- **Private Command Filtering** - Excludes commands marked with `@group Private` from documentation
- **Centralized Configuration** - Single configuration file for all customizable settings

## Quick Start

```bash
# Full documentation pipeline (generate + validate)
npm run docs

# Generate documentation from source code
npm run docs:generate

# Validate all documentation links
npm run docs:validate
```

## Architecture

### Template Sections
- `generateTitle()` - Command titles with full paths
- `generateDescription()` - Command descriptions with deprecation warnings
- `generateRemarks()` - Implementation notes from `@remarks` JSDoc
- `generateUsage()` - Command syntax and usage patterns
- `generateOptionsTable()` - Formatted options with types and defaults
- `generateParameters()` - Function parameter documentation
- `generateSubcommands()` - Categorized subcommand listings
- `generateExamples()` - Code examples and additional content
- `generateMetadata()` - Version, author, and since information
- `generateGlobalOptions()` - Global CLI options sections
- `generateRelatedCommands()` - Cross-references to related commands
- `generateSeeAlso()` - External documentation links

## How It Works

1. **Command Discovery** - Scans `src/` directory recursively for command definitions
2. **AST Parsing** - Extracts command metadata using TypeScript compiler API
3. **JSDoc Processing** - Parses JSDoc annotations with type validation
4. **Template Generation** - Applies sections to create documentation
5. **Docusaurus Integration** - Generates compatible frontmatter and sidebar positioning
6. **Link Validation** - Verifies internal references and external URL accessibility

## JSDoc Support

### Core Documentation Tags
- `@description` - Command description and overview
- `@example` - Usage examples with syntax highlighting
- `@remarks` - Implementation notes and additional details
- `@throws` - Error conditions and exception handling
- `@see` - External references and related documentation
- `@since` - Version information and availability
- `@deprecated` - Deprecation warnings with migration guidance

### Command Organization
- `@group CategoryName:Position` - Categorizes commands for sidebar organization
  - Example: `@group Development:1` - First item in Development category
  - Example: `@group Private` - Excludes command from documentation completely

### JSDoc Example
```javascript
/**
 * Generate a new applet project with scaffolding
 * 
 * @group Development:1
 * 
 * @remarks
 * Creates complete project structure with TypeScript support.
 * Requires proper permissions in target directory.
 * 
 * @example
 * # Generate with React template
 * sos applet generate my-app --template react
 * 
 * @throws {Error} When template not found or directory exists
 * 
 * @since 2.0.0
 * 
 * @see {@link https://docs.signageos.io/development/applets/} Link
 */
```

## Output

### Docusaurus Integration
- **Sidebar Positioning**: Automatic ordering from `@group` tags
- **Category Organization**: Commands grouped by workflow
- **Private Exclusion**: Commands marked `@group Private` are hidden

## Development

### Configuration
The generator uses a centralized configuration file (`config.ts`) for all customizable settings:
- **Paths**: Source directories, output locations, template paths
- **Commands**: Root command name, private markers, category ordering
- **Sidebar**: Position multipliers for documentation hierarchy
- **Validation**: Link checking timeouts and settings
- **Formatting**: Section headers, code block languages, file extensions

### Adding New Commands
1. Create TypeScript command file with JSDoc annotations
2. Include `@group CategoryName:Position` for organization
3. Add optional static template in `templates/static/`
4. Run `npm run docs` to generate and validate