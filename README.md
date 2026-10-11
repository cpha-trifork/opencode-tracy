# OpenCode tracing plugin

To install link the script into the opencode plugins directory:

```sh
mkdir -p ~/.config/opencode/plugins/
ln -s <root-path>/plugin/opencode-balrog.ts ~/.config/opencode/plugins/
```

Then register the plugin in the opencode config,

```json
{
  "plugin": ["opencode-balrog"]
}
```

To run the log receiver service run

```sh
npm run serve
```
