## Global Options

All commands support the following global options:

| Option | Alias | Description |
|--------|-------|-------------|
| `--help` | `-h` | Display help information for any command |
| `--version` | `-v` | Display the installed version of the CLI |
| `--api-url` | `-u` | Override the API URL for REST requests |
| `--profile` | | Use a specific profile from ~/.sosrc config |

### Examples

```bash
# Show version
sos --version

# Get help for any command
sos applet --help
sos applet upload --help

# Use custom API endpoint
sos --api-url https://api.example.com applet upload

# Use specific profile
sos --profile production organization list
```
