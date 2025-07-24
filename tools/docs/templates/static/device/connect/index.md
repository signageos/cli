## Advanced Usage

### Prerequisites

Before connecting a device:

1. **Build and upload applet**: The applet must be built and uploaded to the platform at least once
2. **Device configuration**: Ensure the device is properly configured and accessible
3. **Network access**: Device should be accessible via local network or use `--use-forward-server` for remote access

### Development Workflow

```bash
# Typical development workflow
sos applet generate --name my-applet
cd my-applet
npm run build
sos applet upload
sos device connect --device-uid device123 --hot-reload
```

### Network Considerations

- **Local Network (LAN)**: Default behavior, requires device and development machine on same network
- **Forward Server**: Use `--use-forward-server` when device is remote or behind different network
- **Custom Forward Server**: Override with `--forward-server-url` for private deployments
- **Public URL**: Set `--server-public-url` when behind reverse proxy or custom domain

## Configuration Tips

```bash
# Update package.json with applet UID when created
sos device connect --device-uid device123 --update-package-config

# Use custom ports for development
sos device connect --device-uid device123 --server-port 8080

# Run server in background for multiple sessions
sos device connect --device-uid device123 --detach
```
