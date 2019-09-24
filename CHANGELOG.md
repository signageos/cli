
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
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
