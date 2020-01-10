# CLI program

signageOS command-line interface which helps you develop your applets locally and manage devices from terminal.

## Usage
```bash
npm install @signageos/cli -g
sos --help
```

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
| Argument                   | Description                  | Default value  |
|----------------------------|------------------------------|----------------|
| --name *(required)*        | Name your applet             | STDIN          |
| --version *(optional)*     | Initial version              | 0.0.0          |
| --target-dir *(optional)*  | Generate applet to directory | ${PWD}/${name} |

#### Applet Upload
```bash
sos applet upload
# Uploads all files in the applet directory

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
| --applet-path *(optional)*     | Path of applet directory root | ${PWD}                 |
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
