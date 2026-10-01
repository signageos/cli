# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/) and this project adheres to
[Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [4.4.0] - 2026-09-17
### Added
- (public) `sos custom-script upload` reports a custom script name that is already taken and offers to upload into the existing script, instead of failing with a raw API error.

## [4.3.1] - 2026-09-02
### Fixed
- (public) Org-scoped API credentials now work with all organization-level commands.
- (public) Applet test runs now stop polling when remote execution fails or is canceled.

## [4.3.0] - 2026-08-04
### Added
- (internal) `sos custom-script upload --managed` uploads the script as a signageOS-managed global custom script that has no owning organization and can be run by any organization; reserved for signageOS admin accounts

## [4.2.1] - 2026-07-28
### Fixed
- (public) `sos applet upload` no longer fails with HTTP 400 `Metadata part is too large.`

## [4.2.0] - 2026-07-17
### Added
- (public) `sos applet version publish|deprecate|renew` commands to set an applet version's lifecycle status. Target a version directly with `--applet-uid` and `--applet-version` (no local applet directory required, so it can be scripted across many organizations), or run interactively; `--yes` skips confirmation

## [4.1.0] - 2026-07-17
### Added
- (public) `sos login` now lets you choose the region from a predefined list

## [4.0.7] - 2026-07-12
### Fixed
- (public) `sos device connect --hot-reload` now passes the resolved applet UID (from `--applet-uid`, `SOS_APPLET_UID` or `sos.appletUid` in package.json) to the hot reload, so it no longer fails with "Multiple applets with name ... found" when duplicate applet names exist
- (public) `sos applet generate` and `sos applet build` now fail fast with a clear message on Windows when the target path contains shell metacharacters (`& | < > ^`), which otherwise break the shell-invoked build tooling (no-op on macOS/Linux, where these are valid in paths)
- (public) `sos applet upload` now streams file uploads through a shared progress tracker and ignores zero-delta progress updates, making upload progress reporting smoother and less noisy
- (public) `SOS_PROFILE` fallback now works like `--profile` again: active profile precedence is `--profile` > `SOS_PROFILE` > default profile, and profile selection remains mutually exclusive with `--api-url`

## [4.0.6] - 2026-06-08
### Fixed
- (public) Fix pagination for high organizations count
- (public) Generated pnpm applets now build under pnpm 10+ — added `pnpm-workspace.yaml` with `verifyDepsBeforeRun: false` so `pnpm run build` doesn't re-run the `prepare` build via the pre-run dependency check

## [4.0.5] - 2026-05-13
### Fixed
- (public) Fix version 4.0.4 bug, where default configuration failed to load

## [4.0.4] - 2026-05-06

## [4.0.3] - 2026-05-05
### Fixed
- (public) `sos device connect`, `sos applet start`, and `sos applet build` now work with Auth0 JWT authentication (pass `accessToken` to SDK `createDevelopment()`)
- (public) `sos device set-content` no longer fails with `INVALID_BODY_PROPERTIES` error (SDK strips `organizationUid` from timing POST body)

## [4.0.2] - 2026-04-29

## [4.0.1] - 2026-04-29

### Fixed
- (public) Pass `organizationUid` as query parameter on all SDK requests to support JWT auth with organization-authenticated API endpoints (applet versions, device settings, etc.)

## [4.0.0] - 2026-04-28

### Added
- (public) Auth0 Device Authorization Flow for `sos login` — replaces legacy username/password authentication
- (public) JWT access token support for all API interactions
- (public) Automatic token refresh on expiration
- (public) Browser auto-open during Auth0 login flow
- (public) `organizationUid` passthrough for plugin, custom script, runner, applet, and timing create operations (required for JWT auth)

### Changed
- (public) Authentication now uses Auth0 Device Flow instead of legacy username/password login
- (internal) SDK dependency updated to support JWT access tokens in `X-Auth` header

### Removed
- (public) removed `sos firmware upload` feature

### Fixed

- (public) All paginated list endpoints are now fully traversed - devices, applet versions, and applet test suites spanning multiple pages are no
  longer silently truncated
- (public) `sos applet upload` reupload correctly fetches all existing remote files across pages before diffing

## [3.0.0] - 2026-04-10
### Added
- (public) Interactive lists (`emulator`, `applet`, or default `organization`), you can now type either the human-readable `name` or the `UID`; lookups are case-insensitive.
- (public) Validation for non-applet directory on `sos applet upload` (or `--applet-path`)

### Fixed
- (public) Fixed file handling on `sos applet upload` for applets with many files
- (public) Priority for `--profile <name>` even when environment variables are present.
- (public) Graceful interactive prompt exits

## [2.9.0] - 2026-02-26
### Fixed
- (public) `sos applet upload` now correctly show progress, file size, ETA, box url
- (public) Fixed `--profile` selection flag feature for edge-cases
- (public) Applet Generate `.gitignore` file content is updated to ignore `/dist` directory instead of `./dist`

### Added
- (public) CI/CD pipeline setup guide documentation page with GitLab CI and GitHub Actions examples
- (public) Enhanced autocomplete search to match both names and UIDs
- (public) Applet directory validation to prevent accidental wrong uploads of non-applet projects (respects `--applet-path` option)
- (public) Graceful cancellation handling for all interactive prompts
- (public) Support for `sos.config.local.json` on real connected devices (require support on Core App)
  
## [2.8.0] - 2026-01-15
### Added
- (public) Support for `sos.config.local.json` file in applet directory for local development configuration
- (public) Generated applets now include a blank `sos.config.local.json` file for easier local configuration testing
- (public) Added `sos.config.local.json` to `.gitignore` in generated applets to keep local configuration private

## [2.7.1] - 2025-10-20
### Fixed
- (public) Typo in device power action type `display0ff` to `displayOff`

## [2.7.0] - 2025-10-02
### Added
- (public) Added `--yes` flag and CLI options to eliminate interactive prompts in CI/CD automation
- (public) `sos custom-script generate` now supports `--name`, `--description`, `--danger-level`, and `--yes` options for non-interactive generation
- (public) `sos runner generate` now supports `--name`, `--description`, and `--yes` options for non-interactive generation
- (public) `sos plugin generate` now supports `--name`, `--description`, and `--yes` options for non-interactive generation
- (public) `sos runner upload` now supports `--yes` flag to skip confirmation prompts for runner/version creation
- (public) `sos plugin upload` now supports `--yes` flag to skip confirmation prompts for plugin/version creation
- (internal) Enhanced JSDoc documentation with comprehensive CI/CD usage examples for all automation-enabled commands

### Fixed
- (public) Fixed CLI argument validation, making command to fail if contains invalid arguments (e.g.`sos runner generate --invalid`)
- (public) Removed support for `--legacy-enabled` authentication flag from `sos login` command
- (internal) Pinned `es-check` to `9.4.0` (9.4.1 introduced parsing bug)

## [2.6.0] - 2025-09-23
### Added
- (public) New commands `sos runner generate` to generate local repository with Runner boilerplate and `sos plugin generate` to generate local repository with Plugin boilerplate

### Security
- (public) Improved security and updated dependencies for CLI
- (public) Improved security and updated dependencies for generated applet

### Fixed
- (internal) Upgrade underlying SDK to latest `@signageos/sdk`

## [2.5.0] - 2025-07-30
### Fixed
- (internal) Upgrade underlying SDK

### Added
- (public) Logic for automatic `/docs` generation - documentation available online at `https://developers.signageos.io`

### Security
- (public) FIxed security issue when `sos login` authentication fails
- (public) Audit fixes and dependency updates based on `npm audit`

## [2.4.0] - 2025-05-29
### Fixed
- (public) Issue when using flag `--no-default-organization`, where user was prompted to make selection as default

### Added
- (public) Added basic `CHANGELOG.md` and `README.md` files to generated applets
- (internal) Prepared for applet authorship support
- (internal) Updated dependencies for applet generator
- (public) Support for shell auto-completion feature (`sos autocomplete install`)

## [2.3.1] - 2025-04-25
### Fixed
- (public) Issue with `sos device connect --hot-reload` command for older devices (e.g.: Tizen 2.4) with initial build

## [2.3.0] - 2025-04-17
### Added
- (public) Added support for preferred package manager (npm, pnpm, bun, yarn)
- (internal) Updated project dependencies
- (internal) Windows build and test environment

### Fixed
- (public) Improved strategy to detect cli and interactive arguments

## [2.2.0] - 2025-04-10
### Added
- (public) New command `sos custom-script generate` to generate local repository with Custom Script boilerplate

### Fixed
- (public) Fixed issue on `sos applet generate` when optional `--git` property was required
- (public) Fixed issue on `sos applet generate` with Git support detection on Windows 
- (public) Fixed missing template files for `sos applet generate` command

## [2.1.0] - 2025-04-08
### Added
- (public) Added option to support Rspack for generated applets
- (public) Removed support for Esbuild

## [2.0.0] - 2025-03-28
### Changed
- (internal) Updated `tsconfig.js` rules to match current framework features
- (internal) Updated `package.json` minimal supported node/npm engine versions
- (internal) Updated dependencies
- (public) Updated documentation

## [1.10.0] - 2025-03-24
### Added
- (public) New feature to init generated applet as git repository (through wizard or `--git yes`) when `git` command is present on machine

### Fixed
- (public) Updated required node engine definition
- (public) Fixed error message when applet is not built

## [1.9.1] - 2025-03-20
### Fixed
- (public) Fixed `escheck` npm command by adding npx

## [1.9.0] - 2025-03-03
### Added
- (public) Command `sos applet start` starts the http server within the same process (not detached) as a default behavior (better management of the process)

### Fixed
- (public) Faster and more reliable hot-reload of applet code in the emulator

## [1.8.0] - 2025-02-28
### Added
- (public) New command `sos custom-script upload` to upload code for Custom Scripts to signageOS.

## [1.7.1] - 2025-02-24
### Fixed
- (public) Dependency on non existing package `@signageos/forward-server-bridge@0.0.1`

## [1.7.0] - 2025-02-21
### Fixed
- (public) Insert script tag in applet and emulator with live reload properly to prevent browser to parse html in quirks mode

### Added
- (public) New option for `sos device connect` command `--use-forward-server` to proxy traffic from local machine to the device through the forward server. This is useful when the device is not directly accessible from the local machine.

### Deprecated
- (public) Applet Generate command renamed the script `npm run connect` with `npm run watch` instead because it's more descriptive

## [1.6.4] - 2025-02-17
### Fixed
- (internal) Upgrade underlying SDK

## [1.6.3] - 2024-11-19
### Fixed
- (public) Optimised the `sos applet upload` command to upload multi-file applets faster and more reliably

## [1.6.2] - 2024-11-13
### Fixed
- (public) Upload applet `deprecated` and `published` versions are now correctly handled and show an info message

## [1.6.1] - 2024-09-30
### Fixed
- (public) Generate applet with `--language=typescript` will generate correct `webpack.config.js` file (with `fileExtensions` and `rules`)

## [1.6.0] - 2024-09-26
### Added
- (internal) Upgrade underlying SDK

### Fixed
- (public) Improved the error message when an applet upload fails
- (public) Stop running applet server on device disconnect

## [1.5.1] - 2024-08-21
### Fixed
- (internal) Removed tslint
- (internal) Added eslint and eslint-plugin-prettier to harmonize the codestyle checking with company standards

## [1.5.0] - 2024-08-20
### Added
- (public) A bundler flag to the `applet generate` command to enable bundler selection for the generated applet - the options are `webpack` and `esbuild`, defaulting to `webpack`
### Fixed
- (public) Updated `Node.js` version to 20 and `npm` version to 10

## [1.4.3] - 2024-08-19
### Fixed
- (public) Reverted the change of the `--update-package-config` argument. It is updated in `package.json` only when the argument is specified

## [1.4.2] - 2024-07-11
### Fixed
- (public) Applet UID is now always inserted in the `package.json` file during the applet upload process if not found or the `--update-package-config` argument is specified

## [1.4.1] - 2023-10-02
### Fixed
- (public) Auth0 compatibility (auto select)

## [1.4.0] - 2023-09-25
### Added
- (public) Update readme
- (public) Auth0 compatibility

## [1.3.1] - 2023-08-29

## [1.3.0] - 2023-05-19
### Fixed
- (public) New version announcement has a link to the changelog
- (public) Command for Applet Generate will produce correct RegExp in `webpack.config.js` with proper escaping of dots using backslashes
- (public) ES check for ES5 output applet code is done after every build (to prevent problems in real devices)
- (public) Use `apiUrl` config from `~/.sosrc` file if specified for all commands (rather than default value `https://api.signageos.io`)

### Added
- (public) New argument for commands Applet Generate `--language=typescript` that will produce the sample code written in TypeScript rather than JavaScript. Default is `--language=javascript`.

## [1.2.1] - 2023-04-01
### Fixed
- (public) `sos applet start --hot-reload` Reload devices when no one has connected yet
- (public) `sos applet start --hot-reload` works correctly even on Windows systems

## [1.2.0] - 2023-03-29
### Fixed
- (public) Console output of `npm start` of generated applet shows correct URL of emulator
- (public) The `--entry-file` can be now ommited when the `package.json` has the `main` property set
- (public) The `sos device connect` is looking for the applet in server by `name` instead of required `uid` in `package.json` `sos.appletUid` property
- (public) The `.git` folder is ignored automatically when the `.gitignore` file is used

### Added
- (public) Allow customize `--server-port` and `--server-public-url` for `sos device connect` command
- (public) New `sos applet build` command that will build current applet as a `.package.zip` file (same that is built and used on device when uploading applet)

### Deprecated
- (public) Remove support of experimental version of webpack-plugin v0.2. Use version v1+ instead

## [1.1.5] - 2023-01-02
### Fixed
- (public) Respect argument `--api-url` as priority over `SOS_API_URL` environment variable and default value
- (public) Log info/warning output into stderr instead of stdout

## [1.1.4] - 2022-11-25
### Fixed
- (public) Removed unused `display.appcache` file from Emulator (replaced with `serviceWorker.js`)

## [1.1.3] - 2022-10-31
### Fixed
- (public) Removed `--module=false` argument from es-check of `sos applet generate` sample applet

## [1.1.2] - 2022-10-21
### Fixed
- (public) Loading of emulators for command `sos applet start` from currently configured organization (via `~/.sosrc` file, `defaultOrganizationUid` property).

## [1.1.1] - 2022-08-04
### Fixed
- (public) Invoke rebuild applet version after upload only when some files were changed

## [1.1.0] - 2022-07-20
### Added
- (public) Config API url via the config file `~/.sosrc`

### Fixed
- (public) Parametrizing Applet UID using `--applet-uid` option
- (public) Ignoring `node_modules/` from applet uploading

## [1.0.4] - 2022-07-18
### Fixed
- (public) Uploading single file applet with front-applet version
- (public) Uploading applet files will invoke building applet only once at the end
- (public) CLI version in User-Agent header (e.g.: `signageOS_CLI/1.0.4`)

## [1.0.3] - 2022-06-14
### Fixed
- (public) Applet generate using Webpack 5

## [1.0.2] - 2022-05-06
### Fixed
- (public) Usage of @signageos/lib dependency

## [1.0.1] - 2022-05-06
### Fixed
- (internal) Upgrade underlying SDK

## [1.0.0] - 2022-04-06
### Added
- (public) The appletUid does not have to be hardcoded inside package.json and is auto-detected from current organization based on name
- (public) Support for profiles inside the ~/.sosrc file using ini `[profile xxx]` sections and SOS_PROFILE env. var. or `--profile` argument

### Fixed
- (public) When default organization is not set it asks for saving it to the current ~/.sosrc file

### Changed
- (public) The option `--no-update-package-config` is reversed into option `--update-package-config` and by default the package.json is not updated. See README.
- (public) The `defaultOrganizationUid` is now always used as default for all commands instead of selecting one. Use argument `--no-default-organization` or remove line `defaultOrganizationUid` from `~/.sosrc` to prevent this.

## [0.10.3] - 2022-01-18
### Fixed
- (public) Compatibility with peer dependency for front-display version 9.13.0+ (because of changed API)

## [0.10.2] - 2021-12-17
### Fixed
- (public) Listing timings
- (public) Creating applet without sos.appletUid in package.json

## [0.10.1] - 2021-12-12
### Fixed
- (public) Bug showing error `Invalid ecmascript version` when building generated applet

## [0.10.0] - 2021-11-05
### Added
- (public) Applet uid & version can be specified as environment variables `SOS_APPLET_UID` & `SOS_APPLET_VERSION`.
- (public) Command `sos applet upload` optionally accepts `--no-update-package-config` argument which prevents updating package.json config.
- (public) Allow parametrize credentials using environment variables `SOS_API_IDENTIFICATION` & `SOS_API_SECURITY_TOKEN`.
- (public) Allow parametrize default organization using environment variable `SOS_ORGANIZATION_UID`.
- (public) Uploading applet tests command
- (public) Running applet tests command

### Fixed
- (public) When uploading new applet, package.json sos is merged recursively.

## [0.9.3] - 2021-10-20
### Fixed
- (public) Command `sos applet upload` works stably even on win32 platform

## [0.9.2] - 2021-03-11
### Fixed
- (public) Uploading firmware specifying type (`android` & `linux` accepts firmware type. E.g.: `rpi`, `rpi4`, `benq_sl550`)

## [0.9.1] - 2021-02-17
### Fixed
- (public) `sos applet start` works properly even for remote machine using IP address (not just for localhost)

## [0.9.0] - 2021-02-02
### Added
- (public) Deploy applet to device using `sos device set-content --applet-uid < > --device-uid < >`
- (public) New command for Applet reload `sos device power-action`
- (public) Connecting to device and upload applet from local computer
- (public) One emulator per account is used and its uid is stored in .sosrc file

## [0.8.4] - 2021-01-05
### Fixed
- (public) Command for generation of applet is generating multi-file applet now (not deprecated single-file).
- (public) Add missing useful NPM scripts into generated applet

## [0.8.3] - 2020-10-22
### Fixed
- (public) Optimize authentication for all REST API requests with new token ID (please do the `sos login` again to perform this changes on your machine)
- (public) Make checking new available version of CLI only once in an hour

## [0.8.2] - 2020-10-13
### Security
- (public) Fix dependabot alerts

## [0.8.1] - 2020-09-24
### Fixed
- (public) applet upload won't fail with error "Request failed with status code 404. Body: Could not delete the file"

## [0.8.0] - 2020-08-27
### Added
- (public) `verbose` flag to show all files when uploading multifile applet
- (public) `yes` flag to skip confirmation process and upload right away
- (public) in package.json file of the uploaded applet specify files to upload in `files` list (they will be uploaded regardless of all ignores), also supports glob patterns
- (public) in generated applet, `files` list is already added with `dist` directry by default

### Fixed
- (public) show error on particular file when upload was unsuccessfull (i.e when uploading empty file)

## [0.7.1] - 2020-06-22
### Fixed
- (public) Applet file upload sets the content type of files as well

## [0.7.0] - 2020-03-05
### Changed
- (public) Applet generate version option renamed to applet-version

### Removed
- (public) `@signageos/webpack-plugin` is separated to self repository

### Added
- (public) Version option
- (public) Applet generate accepts optional argument for `--npm-registry`

### Fixed
- (public) Warnings during installation `npm i @signageos/cli -g`

### Security
- (public) Audit fixes based on `npm audit`
- (public) Upgrade base node version engine to LTS 12

## [0.6.2] - 2020-02-06
### Fixed
- (public) Issues with entry file paths on Windows

## [0.6.1] - 2020-01-17
### Fixed
- (public) Discrepancy between project and applet dirs naming
- (public) Issues with file paths on Windows
- (public) Configure webpack plugin with options. `https`, `port`, `public`, `useLocalIp`, `host`

## [0.6.0] - 2020-01-13
### Added
- (public) Upload multi file applet
- (public) Firmware upload
- (public) Multi file applet emulator

## [0.5.0] - 2019-11-28
### Added
- (public) Support multiple files of applet in Webpack Plugin

### Fixed
- (public) Allow CORS in webpack plugin 8090 emulator proxy port for develop applet externally
- (public) Universal assets supported for webpack plugin (images, fonts, binaries etc.)
- (public) Make more memory efficient proxy of emulator webpack plugin
- (public) Compatibility with Node.js >= 8 (no upper limit)

## [0.4.4] - 2019-09-24
### Fixed
- (public) Do transpile applet code always with babel-loader to allow run it on any old device out of box

## [0.4.3] - 2019-09-24
### Fixed
- (public) Upgrade versions of front-applet (JS API) & front-display (Emulator) for generated applet

## [0.4.2] - 2019-09-23
### Fixed
- (public) Applet generator will generate applet which works on older platforms (SSSP, Tizen 2, WebOS 3, BrightSign 7)

## [0.4.1] - 2019-09-23
### Fixed
- (public) Default API & BOX url are api.signageos.io & box.signageos.io

## [0.4.0] - 2019-09-21
### Added
- (public) Upload applet to cloud using `sos applet upload`

### Fixed
- (public) Build production webpack will not start emulator
- (public) Live Reload webpack plugin of applet will trigger sos.onReady event
- (public) Errors are printed in red color

## [0.3.2] - 2019-09-05
### Fixed
- (public) Default env variables for sos command (for example api.signageos.io host)

## [0.3.1] - 2019-09-05
### Fixed
- (public) Private dependency from private npm registry (now it can install any user)

## [0.3.0] - 2019-09-05
### Added
- (public) Login account using username/email and password to access other REST resources `sos login`
- (public) Organization listing of currently logged account `sos organization list` & `sos organization get`
- (public) Timing listing of specific device and organization `sos timing list`
- (public) Webpack Plugin which allows run generated applet in local emulator
- (public) Allow set-default organization of current logged user (useful for Webpack Plugin)

### Fixed
- (public) New UI for `--help` guide
- (public) `--api-url` will change the base url for REST API
- (public) .env file is looked for in default location first
- (public) Publishing public npm registry

## [0.1.0] - 2019-08-02
### Added
- (public) Package is available in npm registry https://www.npmjs.com/package/@signageos/cli
- (public) Applet generation command to create vanilla JS applet `sos applet generate --name my-new-applet`
