## Advanced Usage

### Environment Variables

You can override certain values using environment variables:

- **`SOS_APPLET_UID`**: Specify applet UID to upload to (overrides `sos.appletUid` in package.json)
- **`SOS_APPLET_VERSION`**: Specify applet version to upload (overrides `version` in package.json)

```bash
# Upload to specific applet using environment variable
SOS_APPLET_UID=abc123def456 sos applet upload

# Upload with specific version
SOS_APPLET_VERSION=1.2.3 sos applet upload
```

### File Handling

- **Applet Creation**: If applet doesn't exist, it will be created automatically
- **Version Management**: Applet version is read from `package.json`
- **Applet UID Storage**: Generated applet UID is stored in `package.json` under `sos.appletUid`
- **Ignore Files**: File exclusion priority (top to bottom): `.sosignore` > `.npmignore` > `.gitignore`
- **Single Ignore File**: Only one ignore file is used, or none

### Alternative Upload Methods

```bash
# Upload using npm script (recommended)
npm run upload

# Upload all files in applet directory (deprecated method)
sos applet upload --applet-path=dist/index.html
# Note: This will upload only the specified file and remove others from servers
```
