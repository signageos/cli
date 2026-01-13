## Overview

The signageOS CLI is a command-line tool for managing applets, devices, organizations, and other signageOS resources. It provides a comprehensive set of commands for the complete development lifecycle from applet creation to deployment.

### Key Features

- **Applet Development**: Create, build, test, and deploy applets
- **Development Tools**: Connect to devices for testing, upload custom scripts and debug
- **Device Management**: Control device power states and applet timings
- **Organization Management**: Handle multi-tenant environments
- **Authentication**: Secure login and profile management

### Installation

```bash
npm install -g @signageos/cli
```

### Getting Started

1. **Login to your account**: `sos login`
2. **Generate a new applet**: `sos applet generate --name my-applet`
3. **Start development**: `cd my-applet && sos applet start`

### Local Configuration

You can create a `sos.config.local.json` file in your applet directory to provide configuration values during local development:

```json
{
  "myConfigKey": "myConfigValue",
  "anotherSetting": true
}
```

This configuration is automatically loaded when running `sos applet start` and passed to your applet, making it easy to test different configuration scenarios without deploying to a device.

## Usage

```bash
sos [options] <command>
```

## Debugging

To enable debugging for specific modules, use the `DEBUG` environment variable:

```bash
# Debug applet upload module
DEBUG=@signageos/cli:Applet:Upload:appletUploadFacade sos applet upload

# Debug all signageOS modules
DEBUG=@signageos/* sos applet upload

# Set debug environment variable
export DEBUG=@signageos/*
```
