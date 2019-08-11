# CLI program

signageOS command-line interface which helps you develop your applets locally and manage devices from terminal.

## Usage
```bash
npm install @signageos/cli -g
sos --help
```

## API reference
### Login
```bash
sos login
```
- Login account to allow use REST API commands
- Logged account credentials are stored in `~/.sosrc` file.

| Argument                   | Decription                      | Default value  |
|----------------------------|---------------------------------|----------------|
| --username *(required)*    | Username or e-mail user for box | STDIN          |

### Applet
```bash
sos applet --help
```

#### Applet Generation
```bash
sos applet generate --name my-sample-applet
cd my-sample-applet
# Develop your applet with watching changes
npm start
# Build your applet production environment
npm run build
```
| Argument                   | Decription                   | Default value  |
|----------------------------|------------------------------|----------------|
| --name *(required)*        | Name your applet             | STDIN          |
| --version *(optional)*     | Initial version              | 0.0.0          |
| --target-dir *(optional)*  | Generate applet to directory | ${PWD}/${name} |

### Organization
```bash
sos organization --help
```

#### Organization List
- Output is printed to STDOUT as JSON
```bash
sos organization list
```

#### Organization Get
- Output is printed to STDOUT as JSON
```bash
sos organization get
```
| Argument                        | Decription                   | Default value  |
|---------------------------------|------------------------------|----------------|
| --organization-uid *(required)* | Organization UID             | STDIN          |

### Timing
```bash
sos timing --help
```

#### Timing List
- Output is printed to STDOUT as JSON
```bash
sos timing list
```
| Argument                        | Decription                   | Default value  |
|---------------------------------|------------------------------|----------------|
| --organization-uid *(required)* | Organization UID             | STDIN          |
| --device-uid *(required)*       | Device UID                   | STDIN          |
