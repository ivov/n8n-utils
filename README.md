# n8n utils

`n8n-utils` is a collection of utilities for developing on [n8n](https://n8n.io), the workflow automation tool.

## Features

### Launcher

Launch n8n inside VSCode, with hot reload for changes during node development. Accessible via the Command Palette: `n8n-utils: Launch n8n in VSCode`.

<img src="https://raw.githubusercontent.com/ivov/n8n-utils/master/media/launcher.png">

### Node parameter navigator

View the tree of node params in a node or resource file on the extension's `Node Params` tab. Navigate quickly to the param in the open editor. Accessible via the Command Palette: `n8n-utils: Navigate to node parameter`.

<img src="https://raw.githubusercontent.com/ivov/n8n-utils/master/media/param-nav.png">

### n8n endpoint navigator

View the list of controller endpoints in the `cli` package on the extension's `n8n controllers` tab. Navigate quickly to a controller or endpoint. Accessible via the Command Palette: `n8n-utils: Navigate to endpoint`.

<img src="https://raw.githubusercontent.com/ivov/n8n-utils/master/media/endpoint-nav.png">

### Environment variables tooltips

Hover over references to env vars like `config.getEnv('MY_VAR')` and `process.env.MY_VAR` references to view their current values, with annotations specifying if they have been overridden, if they are part of the schema, and if they remain with the schema default value.

<img src="https://raw.githubusercontent.com/ivov/n8n-utils/master/media/env-vars.gif">

### Stored workflow viewer

View the list of locally stored workflows on the extension's `Stored workflows` tab. Node types are linked through VSCode's definition provider to the node class, allowing for peeking definitions and jumping to definition with F12.

<img src="https://raw.githubusercontent.com/ivov/n8n-utils/master/media/workflow-viewer.png">

### Node stats

Hover over any node class with a comment icon to view a summary of the node's stats, including overall popularity and resource and operation usage.

<img src="https://raw.githubusercontent.com/ivov/n8n-utils/master/media/node-stats.png">

## Notes

- **Launcher** requires a local database with no owner account set up.
- **Node param navigator** supports `*.node.ts` and `*Description.ts` files.
- **n8n endpoint navigator** supports `*.controller.ts` files.
- **Env vars tooltips** may only access env vars provided via the VSCode terminal.
- **Node stats** are only available for the n8n team and require adding `"n8n-utils.nodeStats.token": "<token>"` to `.vscode/settings.json`. Find the token in the internal vault under `VSCode extension`.

## Development

To develop this extension:

1. Run `npm run watch`
2. Launch debugger with `F5`
3. Make a change
4. Restart debugger with `cmd+shift+F5`
5. View logs in `Debug Console`

## Publishing

To publish a new version of this extension:

1. Install `vsce`: `npm install -g vsce`
2. Package the extension: `vsce package`
3. Obtain a [personal access token](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#get-a-personal-access-token).
4. Publish [with version](https://code.visualstudio.com/api/working-with-extensions/publishing-extension#autoincrementing-the-extension-version): `vsce publish <version>`

## Author

© 2023 Iván Ovejero

## License

Distributed under the [MIT License](./LICENSE.md).
