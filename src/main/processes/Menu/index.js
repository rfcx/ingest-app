import { app, Menu } from 'electron'
import settings from 'electron-settings'
import commonProcess from '../Common/index'

function createMenu (logoutFunction, preferenceFunction, aboutFunction, updateFunction) {
  /* MENU */
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Clear data',
          click: async () => {
            console.log('clear data')
            commonProcess.clearAllData()
          }
        },
        { label: 'Auto start',
          type: 'checkbox',
          checked: settings.get('settings.auto_start'),
          click: async (item) => {
            const existingSettings = settings.get('settings')
            existingSettings['auto_start'] = item.checked
            settings.set('settings', existingSettings)
            commonProcess.setLoginItem(item.checked)
          }
        },
        { label: 'Log out',
          type: 'checkbox',
          click: logoutFunction
        },
        { label: 'Quit',
          click: function () {
            app.exit()
            app.quit()
          }
        },
        { type: 'separator' },
        { label: 'Preferences',
          click: preferenceFunction
        },
        { label: 'Check for Updates',
          click: updateFunction
        },
        { label: 'About RFCx Uploader',
          click: aboutFunction
        }
      ]
    },
    {
      label: 'Edit',
      submenu: [
        { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
        { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
        { type: 'separator' },
        { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
        { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
        { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
        { label: 'Select All', accelerator: 'CmdOrCtrl+A', selector: 'selectAll:' }
      ]
    }
  ]
  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  return menu
}

export default { createMenu }
