## Advanced Usage

### Shell Compatibility

signageOS CLI autocomplete supports:
- **Zsh** (.zshrc)
- **Bash** (.bashrc, .bash_profile)
- **Fish** (.config/fish/config.fish)

### Setup Process

1. **Install completion script**: Adds script to home directory
2. **Configure shell**: Adds source line to shell configuration file
3. **Activate immediately**: Source the completion script without restart

```bash
# Install and activate immediately
sos autocomplete install
source ~/.sos-completion.sh
```

### Usage Examples

```bash
# Show all top-level commands
sos [TAB]

# Show all applet subcommands  
sos applet [TAB]

# Autocomplete partial commands
sos applet up[TAB]    # Completes to "sos applet upload"
sos org l[TAB]        # Completes to "sos organization list"
```

### Troubleshooting

If autocomplete isn't working:

```bash
# Verify installation
ls -la ~/.sos-completion.sh

# Check shell configuration
grep "sos-completion" ~/.zshrc  # or ~/.bashrc

# Reload shell configuration
source ~/.zshrc  # or ~/.bashrc

# Reinstall if needed
sos autocomplete uninstall
sos autocomplete install
```
