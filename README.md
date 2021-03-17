# RFCx Ingest App

> Desktop application for ingesting audio to RFCx platform

- 🖥 Built with [electron-vue](https://github.com/SimulatedGREG/electron-vue)
- 🗂 Managed states and reactive data with [vuex-orm](https://github.com/vuex-orm/vuex-orm)
- 🚦Created routes with [vue-router](https://github.com/vuejs/vue-router)
- 💅 Made over with [Bulma CSS](https://bulma.io/)
- 🔍 Analysed source code with [ESLint](https://eslint.org/)

## Getting started

### Requirements

- Node 8.11.0+

### Start development environment

1. Install dependencies

    ``` bash
    npm install
    ```

2. Start the electron browser/app with hot reload (auto restarts app on file changes)

    ``` bash
    npm run dev
    ```
    If you need to set your own URL to API use

    ``` bash
    npm run dev --url=`http://localhost:3030`
    ```

### Build

Build electron application for production

## Build a notarized version of the app on Mac

1. Get a certificate (.pem) with the password (.p12) from DevOps or Team Lead. Check the certificate in the Keychain: Developer ID Application: Rainforest Connection with the private key. (see the example: https://help.apple.com/xcode/mac/current/#/dev97211aeac).
2. Also, Get an API Key (.p8) with API Key ID and API Key ISSUER ID from DevOps or Team Lead, or generate a new one at https://appstoreconnect.apple.com/access/api. The name of the p8 file should be `AuthKey_<api_key_id>.p8`
3. Put the API Key (.p8) into one of these directory in your local development machine.
* `./private_keys`
* `~/private_keys`
* `~/.private_keys`
* `~/.appstoreconnect/private_keys`
Based on the `API Key ID`, `altool` will look in the above places for the API Key file.
3. Add to the .env the following:
APPLE_API_KEY_ID=**API Key ID**
APPLE_API_KEY_ISSUER_ID=**API Key Issuer ID**
4. Use ```npm run build``` command for building the app.
(The `after-sign-hook.js` will do its job, to notarize the app for you with the configuaration above)

## Build the app on Windows

1. Get a certificate with the password from DevOps or Team Lead.
Add this information to your package.json of the app:
``` bash
    “win”: {
        “certificateFile”: “./build/certs/######.p12”,
        “certificatePassword”: “######”
    }
```
2. Paste static files from the previous build into `./node-server/public`. After every build, we should put 4 files with the last version in the folder: `./node-server/public` and includes following files: RELEASES, .exe, *-delta.nupkg and -full.nupkg (If a new version of the app v1.1.1 you should put v1.1.0 to the folder).
3. Run ```npm run start``` in `./node-server` to start serving those static files from the previous build.
3. Check you Node.js port  to the package.json of the app:
``` bash
    “squirrelWindows”: {
        “remoteReleases”: “http://localhost:5000/public”
    }
```
4. Use ```npm run build``` command for building the app in another terminal.
5. After building we you see two folders for windows in the `./app/build` folder:
    - squirrel windows
    - squirrel-windows-ia32
These folders keep a new release for WinX64 and WinX86.
6. Upload assets for releases to the GitHub: __RELEASES, .exe, *-delta.nupkg and -full.nupkg__.
For supporting the WinX86 system we should only publish one version for the 32-bit system. Both assets files (ia32, x64) have similar names, but the 32-bit system doesn’t support a 64-bit system.

## Build Windows on Mac
1. Install required library (ffprobe) that needed on Windows by running ```npm install --force```
2. Make sure the `@ffprobe-installer` folder in `node_modules` has got the Windows related folders: `win32-ia32` `win32-x64`
3. Temporary remove `"afterSign": "./after-sign-hook.js",` line out from `package.json` file
4. Follow steps in "Build the app on Windows" above, but use ```npm run build:win``` instead of normal ```npm run build``` in #4 step.

Note: You have to remove `node_modules` folder and do `npm install` again before you start your development after built Windows app successfully.

## Linting

Lint all JS/Vue component files in `src/`
``` bash
npm run lint
```

---

## Project structure
In electron, there are 2 processes: main & renderer. Both processes are stored in `src` folder.

## Renderer process
With electron-vue, we are using vue components to make our large complex applications more organization. Each component has the ability to encapsulate its own CSS, template, and JavaScript functionality. Components are stored in `src/renderer/components`.

## Main process
`src/main/index.js` file is the app’s main file, the file in which electron boots with.

