## Advanced Usage

### Power Action Types

| Action      | Description                 |
|-------------|----------------------------|
| reload      | Applet Reload              |
| displayOn   | Display power On           |
| displayOff  | Display power Off          |
| restart     | Application restart        |
| disable     | Applet disable             |
| enable      | Applet enable              |
| reboot      | System reboot              |
| refresh     | Applet Refresh             |

### Usage Scenarios

```bash
# Reload applet content
sos device power-action --device-uid device123 --type reload

# Turn display off for maintenance
sos device power-action --device-uid device123 --type displayOff

# Restart the device application
sos device power-action --device-uid device123 --type restart

# Reboot the entire system
sos device power-action --device-uid device123 --type reboot
```
