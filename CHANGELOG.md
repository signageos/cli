# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [2.5.0] - 2025-07-30
### Fixed
- Upgrade underlying SDK

### Added
- Logic for automatic `/docs` generation - documentation available online at `https://developers.signageos.io`

### Security
- FIxed security issue when `sos login` authentication fails
- Audit fixes and dependency updates based on `npm audit`

## [2.4.0] - 2025-05-29
### Fixed
- Issue when using flag `--no-default-organization`, where user was prompted to make selection as default

### Added
- Added basic `CHANGELOG.md` and `README.md` files to generated applets
- Prepared for applet authorship support
- Updated dependencies for applet generator
- Support for shell auto-completion feature (`sos autocomplete install`)

## [2.3.1] - 2025-04-25
### Fixed
- Issue with `sos device connect --hot-reload` command for older devices (e.g.: Tizen 2.4) with initial build

## [2.3.0] - 2025-04-17
### Added
- Added support for preferred package manager (npm, pnpm, bun, yarn)
- Updated project dependencies
- Windows build and test environment

### Fixed
- Improved strategy to detect cli and interactive arguments

## [2.2.0] - 2025-04-10
### Added
- New command `sos custom-script generate` to generate local repository with Custom Script boilerplate

### Fixed
- Fixed issue on `sos applet generate` when optional `--git` property was required
- Fixed issue on `sos applet generate` with Git support detection on Windows 
- Fixed missing template files for `sos applet generate` command

## [2.1.0] - 2025-04-08
### Added
- Added option to support Rspack for generated applets
- Removed support for Esbuild

## [2.0.0] - 2025-03-28
### Changed
- Updated `tsconfig.js` rules to match current framework features
- Updated `package.json` minimal supported node/npm engine versions
- Updated dependencies
- Updated documentation

## [1.10.0] - 2025-03-24
### Added
- New feature to init generated applet as git repository (through wizard or `--git yes`) when `git` command is present on machine

### Fixed
- Updated required node engine definition
- Fixed error message when applet is not built

## [1.9.1] - 2025-03-20
### Fixed
- Fixed `escheck` npm command by adding npx

## [1.9.0] - 2025-03-03
### Added
- Command `sos applet start` starts the http server within the same process (not detached) as a default behavior (better management of the process)

### Fixed
- Faster and more reliable hot-reload of applet code in the emulator

## [1.8.0] - 2025-02-28
### Added
- New command `sos custom-script upload` to upload code for Custom Scripts to signageOS.

## [1.7.1] - 2025-02-24
### Fixed
- Dependency on non existing package `@signageos/forward-server-bridge@0.0.1`

## [1.7.0] - 2025-02-21
### Fixed
- Insert script tag in applet and emulator with live reload properly to prevent browser to parse html in quirks mode

### Added
- New option for `sos device connect` command `--use-forward-server` to proxy traffic from local machine to the device through the forward server. This is useful when the device is not directly accessible from the local machine.

### Deprecated
- Applet Generate command renamed the script `npm run connect` with `npm run watch` instead because it's more descriptive

## [1.6.4] - 2025-02-17
### Fixed
- Upgrade underlying SDK

## [1.6.3] - 2024-11-19
### Fixed
- Optimised the `sos applet upload` command to upload multi-file applets faster and more reliably

## [1.6.2] - 2024-11-13
### Fixed
- Upload applet `deprecated` and `published` versions are now correctly handled and show an info message

## [1.6.1] - 2024-09-30
### Fixed
- Generate applet with `--language=typescript` will generate correct `webpack.config.js` file (with `fileExtensions` and `rules`)

## [1.6.0] - 2024-09-26
### Added
- Upgrade underlying SDK

### Fixed
- Improved the error message when an applet upload fails
- Stop running applet server on device disconnect

## [1.5.1] - 2024-08-21
### Fixed
- Removed tslint
- Added eslint and eslint-plugin-prettier to harmonize the codestyle checking with company standards

## [1.5.0] - 2024-08-20
### Added
- A bundler flag to the `applet generate` command to enable bundler selection for the generated applet - the options are `webpack` and `esbuild`, defaulting to `webpack`
### Fixed
- Updated `Node.js` version to 20 and `npm` version to 10

## [1.4.3] - 2024-08-19
### Fixed
- Reverted the change of the `--update-package-config` argument. It is updated in `package.json` only when the argument is specified

## [1.4.2] - 2024-07-11
### Fixed
- Applet UID is now always inserted in the `package.json` file during the applet upload process if not found or the `--update-package-config` argument is specified

## [1.4.1] - 2023-10-02
### Fixed
- Auth0 compatibility (auto select)

## [1.4.0] - 2023-09-25
### Added
- Update readme
- Auth0 compatibility

## [1.3.1] - 2023-08-29

## [1.3.0] - 2023-05-19
### Fixed
- New version announcement has a link to the changelog
- Command for Applet Generate will produce correct RegExp in `webpack.config.js` with proper escaping of dots using backslashes
- ES check for ES5 output applet code is done after every build (to prevent problems in real devices)
- Use `apiUrl` config from `~/.sosrc` file if specified for all commands (rather than default value `https://api.signageos.io`)

### Added
- New argument for commands Applet Generate `--language=typescript` that will produce the sample code written in TypeScript rather than JavaScript. Default is `--language=javascript`.

## [1.2.1] - 2023-04-01
### Fixed
- `sos applet start --hot-reload` Reload devices when no one has connected yet
- `sos applet start --hot-reload` works correctly even on Windows systems

## [1.2.0] - 2023-03-29
### Fixed
- Console output of `npm start` of generated applet shows correct URL of emulator
- The `--entry-file` can be now ommited when the `package.json` has the `main` property set
- The `sos device connect` is looking for the applet in server by `name` instead of required `uid` in `package.json` `sos.appletUid` property
- The `.git` folder is ignored automatically when the `.gitignore` file is used

### Added
- Allow customize `--server-port` and `--server-public-url` for `sos device connect` command
- New `sos applet build` command that will build current applet as a `.package.zip` file (same that is built and used on device when uploading applet)

### Deprecated
- Remove support of experimental version of webpack-plugin v0.2. Use version v1+ instead

## [1.1.5] - 2023-01-02
### Fixed
- Respect argument `--api-url` as priority over `SOS_API_URL` environment variable and default value
- Log info/warning output into stderr instead of stdout

## [1.1.4] - 2022-11-25
### Fixed
- Removed unused `display.appcache` file from Emulator (replaced with `serviceWorker.js`)

## [1.1.3] - 2022-10-31
### Fixed
- Removed `--module=false` argument from es-check of `sos applet generate` sample applet

## [1.1.2] - 2022-10-21
### Fixed
- Loading of emulators for command `sos applet start` from currently configured organization (via `~/.sosrc` file, `defaultOrganizationUid` property).

## [1.1.1] - 2022-08-04
### Fixed
- Invoke rebuild applet version after upload only when some files were changed

## [1.1.0] - 2022-07-20
### Added
- Config API url via the config file `~/.sosrc`

### Fixed
- Parametrizing Applet UID using `--applet-uid` option
- Ignoring `node_modules/` from applet uploading

## [1.0.4] - 2022-07-18
### Fixed
- Uploading single file applet with front-applet version
- Uploading applet files will invoke building applet only once at the end
- CLI version in User-Agent header (e.g.: `signageOS_CLI/1.0.4`)

## [1.0.3] - 2022-06-14
### Fixed
- Applet generate using Webpack 5

## [1.0.2] - 2022-05-06
### Fixed
- Usage of @signageos/lib dependency

## [1.0.1] - 2022-05-06
### Fixed
- Upgrade underlying SDK

## [1.0.0] - 2022-04-06
### Added
- The appletUid does not have to be hardcoded inside package.json and is auto-detected from current organization based on name
- Support for profiles inside the ~/.sosrc file using ini `[profile xxx]` sections and SOS_PROFILE env. var. or `--profile` argument

### Fixed
- When default organization is not set it asks for saving it to the current ~/.sosrc file

### Changed
- The option `--no-update-package-config` is reversed into option `--update-package-config` and by default the package.json is not updated. See README.
- The `defaultOrganizationUid` is now always used as default for all commands instead of selecting one. Use argument `--no-default-organization` or remove line `defaultOrganizationUid` from `~/.sosrc` to prevent this.

## [0.10.3] - 2022-01-18
### Fixed
- Compatibility with peer dependency for front-display version 9.13.0+ (because of changed API)

## [0.10.2] - 2021-12-17
### Fixed
- Listing timings
- Creating applet without sos.appletUid in package.json

## [0.10.1] - 2021-12-12
### Fixed
- Bug showing error `Invalid ecmascript version` when building generated applet

## [0.10.0] - 2021-11-05
### Added
- Applet uid & version can be specified as environment variables `SOS_APPLET_UID` & `SOS_APPLET_VERSION`.
- Command `sos applet upload` optionally accepts `--no-update-package-config` argument which prevents updating package.json config.
- Allow parametrize credentials using environment variables `SOS_API_IDENTIFICATION` & `SOS_API_SECURITY_TOKEN`.
- Allow parametrize default organization using environment variable `SOS_ORGANIZATION_UID`.
- Uploading applet tests command
- Running applet tests command

### Fixed
- When uploading new applet, package.json sos is merged recursively.

## [0.9.3] - 2021-10-20
### Fixed
- Command `sos applet upload` works stably even on win32 platform

## [0.9.2] - 2021-03-11
### Fixed
- Uploading firmware specifying type (`android` & `linux` accepts firmware type. E.g.: `rpi`, `rpi4`, `benq_sl550`)

## [0.9.1] - 2021-02-17
### Fixed
- `sos applet start` works properly even for remote machine using IP address (not just for localhost)

## [0.9.0] - 2021-02-02
### Added
- Deploy applet to device using `sos device set-content --applet-uid < > --device-uid < >`
- New command for Applet reload `sos device power-action`
- Connecting to device and upload applet from local computer
- One emulator per account is used and its uid is stored in .sosrc file

## [0.8.4] - 2021-01-05
### Fixed
- Command for generation of applet is generating multi-file applet now (not deprecated single-file).
- Add missing useful NPM scripts into generated applet

## [0.8.3] - 2020-10-22
### Fixed
- Optimize authentication for all REST API requests with new token ID (please do the `sos login` again to perform this changes on your machine)
- Make checking new available version of CLI only once in an hour

## [0.8.2] - 2020-10-13
### Security
- Fix dependabot alerts

## [0.8.1] - 2020-09-24
### Fixed
- applet upload won't fail with error "Request failed with status code 404. Body: Could not delete the file"

## [0.8.0] - 2020-08-27
### Added
- `verbose` flag to show all files when uploading multifile applet
- `yes` flag to skip confirmation process and upload right away
- in package.json file of the uploaded applet specify files to upload in `files` list (they will be uploaded regardless of all ignores), also supports glob patterns
- in generated applet, `files` list is already added with `dist` directry by default

### Fixed
- show error on particular file when upload was unsuccessfull (i.e when uploading empty file)

## [0.7.1] - 2020-06-22
### Fixed
- Applet file upload sets the content type of files as well

## [0.7.0] - 2020-03-05
### Changed
- Applet generate version option renamed to applet-version

### Removed
- `@signageos/webpack-plugin` is separated to self repository

### Added
- Version option
- Applet generate accepts optional argument for `--npm-registry`

### Fixed
- Warnings during installation `npm i @signageos/cli -g`

### Security
- Audit fixes based on `npm audit`
- Upgrade base node version engine to LTS 12

## [0.6.2] - 2020-02-06
### Fixed
- Issues with entry file paths on Windows

## [0.6.1] - 2020-01-17
### Fixed
- Discrepancy between project and applet dirs naming
- Issues with file paths on Windows
- Configure webpack plugin with options. `https`, `port`, `public`, `useLocalIp`, `host`

## [0.6.0] - 2020-01-13
### Added
- Upload multi file applet
- Firmware upload
- Multi file applet emulator

## [0.5.0] - 2019-11-28
### Added
- Support multiple files of applet in Webpack Plugin

### Fixed
- Allow CORS in webpack plugin 8090 emulator proxy port for develop applet externally
- Universal assets supported for webpack plugin (images, fonts, binaries etc.)
- Make more memory efficient proxy of emulator webpack plugin
- Compatibility with Node.js >= 8 (no upper limit)

## [0.4.4] - 2019-09-24
### Fixed
- Do transpile applet code always with babel-loader to allow run it on any old device out of box

## [0.4.3] - 2019-09-24
### Fixed
- Upgrade versions of front-applet (JS API) & front-display (Emulator) for generated applet

## [0.4.2] - 2019-09-23
### Fixed
- Applet generator will generate applet which works on older platforms (SSSP, Tizen 2, WebOS 3, BrightSign 7)

## [0.4.1] - 2019-09-23
### Fixed
- Default API & BOX url are api.signageos.io & box.signageos.io

## [0.4.0] - 2019-09-21
### Added
- Upload applet to cloud using `sos applet upload`

### Fixed
- Build production webpack will not start emulator
- Live Reload webpack plugin of applet will trigger sos.onReady event
- Errors are printed in red color

## [0.3.2] - 2019-09-05
### Fixed
- Default env variables for sos command (for example api.signageos.io host)

## [0.3.1] - 2019-09-05
### Fixed
- Private dependency from private npm registry (now it can install any user)

## [0.3.0] - 2019-09-05
### Added
- Login account using username/email and password to access other REST resources `sos login`
- Organization listing of currently logged account `sos organization list` & `sos organization get`
- Timing listing of specific device and organization `sos timing list`
- Webpack Plugin which allows run generated applet in local emulator
- Allow set-default organization of current logged user (useful for Webpack Plugin)

### Fixed
- New UI for `--help` guide
- `--api-url` will change the base url for REST API
- .env file is looked for in default location first
- Publishing public npm registry

## [0.1.0] - 2019-08-02
### Added
- Package is available in npm registry https://www.npmjs.com/package/@signageos/cli
- Applet generation command to create vanilla JS applet `sos applet generate --name my-new-applet`
