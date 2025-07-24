## Advanced Usage

### Platform Notes

#### Windows Users

There is an unresolved issue with NPX tool on Windows when your username contains spaces (e.g., `John Doe`). To prevent this issue, run the following command in your Command Line (replace `John` with your real first name). Administrator privileges may be required:

```cmd
npm config set cache "C:\Users\John~1\AppData\Roaming\npm-cache" --global
```

For more details, see: https://stackoverflow.com/a/58354623/4609457

### Development Workflow

```bash
# Complete workflow from generation to deployment
sos applet generate --name my-sample-applet --language typescript --bundler webpack --git yes
cd my-sample-applet

# Start development with hot reload
npm start

# Build for production
npm run build

# Upload to platform
npm run upload
```
