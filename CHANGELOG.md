# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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
- Deploy applet do device using `sos device set-content --applet-uid < > --device-uid < >`
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
