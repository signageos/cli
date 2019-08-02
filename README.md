# CLI program

signageOS command-line interface which helps you develop your applets locally and manage devices from terminal.

## Usage
```bash
npm install @signageos/cli -g
sos --help
```

## API reference
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
| Argument                   | Decription                   | Default value  |
|----------------------------|------------------------------|----------------|
| --name *(required)*        | Name your applet             | -              |
| --version *(optional)*     | Initial version              | 0.0.0          |
| --target-dir *(optional)*  | Generate applet to directory | ${PWD}/${name} |
