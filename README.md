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

### Build

Build electron application for production

``` bash
npm run build
```

Lint all JS/Vue component files in `src/`
``` bash
npm run lint
```

---

## Project structure
In electron, there are 2 processes: main & renderer. Both processes are stored in `src` folder.

### Renderer process
With electron-vue, we are using vue components to make our large complex applications more organization. Each component has the ability to encapsulate its own CSS, template, and JavaScript functionality. Components are stored in `src/renderer/components`. 

In this project, there are 2 components for UI, and 2 other components for services.
- Landing page (UI)
- Add stream page (UI)
- FS Service (Service)
- API Service (Service)

### Main process
`src/main/index.js` file is the app’s main file, the file in which electron boots with. There are 3 windows running in this project:
- `mainWindow` for the UI components, starting with the landing page
- `backgroundFSWindow` to watch files change in the directory
- `backgroundAPIWindow` to queue and upload the files to the RFCx platform
