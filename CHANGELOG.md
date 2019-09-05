
# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]
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
