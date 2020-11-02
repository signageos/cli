# CLI program

signageOS command-line interface which helps you develop your applets locally and manage devices from terminal.

## Usage
```bash
npm install @signageos/cli -g
sos --help
```

### User Interface
cli tool allows you to run commands interactively for best user experience, please use standard bash terminal on *nix systems
and [gitbash](https://gitforwindows.org/), run it in [windows terminal](https://www.microsoft.com/en-us/p/windows-terminal/9n0dx20hk701?activetab=pivot:overviewtab).

## API reference
### General
| Argument                   | Description                     | Default value                                     |
|----------------------------|---------------------------------|---------------------------------------------------|
| --api-url *(optional)*     | URL address to use for REST API | ${SOS_API_URL~'https://api.signageos.io'}         |

### Login
```bash
sos login
```
- Login account to allow use REST API commands
- Logged account credentials are stored in `~/.sosrc` file.

| Argument                   | Description                     | Default value  |
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
| Argument                     | Description                          | Default value  |
|------------------------------|--------------------------------------|----------------|
| --name *(required)*          | Name your applet                     | STDIN          |
| --version *(optional)*       | Initial version                      | 0.0.0          |
| --target-dir *(optional)*    | Generate applet project to directory | ${PWD}/${name} |
| --npm-registry *(optional)*  | NPM registry URL (for private npm)   |                |

> ! Windows users note:
> There are unresolved issue with NPX tool on Windows clients when your username contains spaces (e.g.: `John Doe`).
> https://stackoverflow.com/a/58354623/4609457
> To prevent this issue there is simple hotfix. Run following command in your Command Line (replace `John` with your real first name):
> Sometimes the Administrator privileges are required (Run as Administrator)
```cmd
npm config set cache "C:\Users\John~1\AppData\Roaming\npm-cache" --global
```

#### Applet Upload
```bash
npm run upload
# Uploads all files in the applet directory
# Or alternatively you can use direct cli: `sos applet upload`

#Deprecated
sos applet upload --applet-path=dist/index.html
# This will upload only the one specified file
# Rest of the files will be removed from our servers
```
- If applet is not created yet, it will create it
- The applet version is used from `package.json`
- Applet UID will be stored in `package.json` sos.appletUid
- Ignore files priority (from top to bottom) `.sosignore` > `.npmignore` > `.gitignore`
- Only one ignore file is used or non

| Argument                       | Description                   | Default value          |
|--------------------------------|-------------------------------|------------------------|
| --applet-path *(optional)*     | Path of project directory     | ${PWD}                 |
| --entry-file-path *(optional)* | Path of applet entry file     | ${PWD}/dist/index.html |

#### Applet Start
```bash
sos applet start
```
- It's meant to be used with applets not created using the cli
- Doesn't have a hot reload at the moment
- Default values work for applet created using the cli

| Argument                       | Description                           | Default value          |
|--------------------------------|---------------------------------------|------------------------|
| --port *(optional)*            | Port where the applet will run        | 8090                   |
| --applet-dir *(optional)*      | Root path of built applet             | ${PWD}/dist            |
| --project-dir *(optional)*     | Root path of applet project directory | ${PWD}                 |
| --entry-file-path *(optional)* | Path of built applet entry file       | ${PWD}/dist/index.html |

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
| Argument                        | Description                  | Default value  |
|---------------------------------|------------------------------|----------------|
| --organization-uid *(required)* | Organization UID             | STDIN          |

#### Organization Set Default
- Sets default organization for current logged in account. This organization will be used for example in webpack plugin of applet to register emulator
```bash
sos organization set-default
```
| Argument                        | Description                  | Default value  |
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
| Argument                        | Description                  | Default value  |
|---------------------------------|------------------------------|----------------|
| --organization-uid *(required)* | Organization UID             | STDIN          |
| --device-uid *(required)*       | Device UID                   | STDIN          |

### Device
```bash
sos device --help
```

#### Device Power action
Perform specified power action on a device.
```bash
sos device power-action
```
| Argument                        | Description                  | Default value  |
|---------------------------------|------------------------------|----------------|
| --organization-uid *(required)* | Organization UID             | STDIN          |
| --device-uid *(required)*       | Device UID                   | STDIN          |
| --type *(required)*             | Type of power-action         | STDIN          |

##### Device Power action types
| Argument                        | Description                  | 
|---------------------------------|------------------------------|
| reload       | Applet Reload                                   |
| displayOn    | Display power On                                | 
| displayOff   | Display power Of                                |
| restart      | Application restart                             |
| disable      | Applet disable                                  |
| enable       | Applet enable                                   |
| reboot       | System reboot                                   |
| refresh      | Applet Refresh                                  |

## Contribution
Clone the repository and install dev dependencies
```sh
git clone git@github.com:signageos/cli.git # or https://github.com/signageos/cli.git
npm install
```

To try `sos` command directly from source code, use `ts-node src/index.ts` instead of `sos` in project directory.

*Global requirements*
```sh
npm install ts-node -g
```
