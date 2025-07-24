## Advanced Usage

### Environment Variables

You can override the default organization using environment variables:

- **`SOS_ORGANIZATION_UID`**: Override default organization for commands

```bash
# Use specific organization for commands
SOS_ORGANIZATION_UID=abc123def456 sos applet upload
```

### Default Organization Behavior

- If no default organization is set, you'll be prompted to select from available organizations
- The default organization is used in commands like applet upload and device management
- You can find your organization UID at: https://box.signageos.io/organizations

### Multi-Tenant Management

The organization system allows you to:
- Switch between different client environments
- Manage resources across multiple organizations
- Set organization-specific defaults for streamlined workflows
