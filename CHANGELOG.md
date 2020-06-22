# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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
