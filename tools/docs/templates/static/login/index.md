## Advanced Usage

### Configuration Management

#### Run Control File

Login credentials are stored in `~/.sosrc` file. For the default profile, it contains:

```ini
identification=xxxxxxxxxxxxxxxxxxxx
apiSecurityToken=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Multiple Profiles

You can manage multiple accounts/configurations using profiles with the `SOS_PROFILE` environment variable or `--profile` argument:

```bash
# Login with specific profile
sos login --profile production

# Use profile in subsequent commands
sos --profile production applet upload
```

The configuration file uses INI sections for named profiles:

```ini
[profile production]
identification=xxxxxxxxxxxxxxxxxxxx
apiSecurityToken=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

[profile staging]
identification=yyyyyyyyyyyyyyyyyyyy
apiSecurityToken=yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy
```

#### Environment Variables

You can override login credentials using environment variables:

- **`SOS_API_IDENTIFICATION`**: Override stored identification
- **`SOS_API_SECURITY_TOKEN`**: Override stored security token  
- **`SOS_PROFILE`**: Specify which profile to use

Generate tokens at: https://box.signageos.io/settings

### Requirements

- Active account. It can be obtained by manual sign-up in [https://box.signageos.io](https://box.signageos.io)
- Login account credentials are stored in `~/.sosrc` file
