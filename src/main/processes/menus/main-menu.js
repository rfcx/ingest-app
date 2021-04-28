import { app, Menu } from 'electron'
import settings from 'electron-settings'
import sharedProcess from '../shared/index'
import sharedMenu from './shared'

function createMenu (clearDataFunction, logoutFunction, preferenceFunction, aboutFunction, updateFunction) {
  /* MENU */
  const template = [
    {
      label: 'File',
      submenu: [
        { label: 'Clear data',
          click: clearDataFunction
        },
        { label: 'Auto start',
          type: 'checkbox',
          checked: settings.get('settings.auto_start'),
          click: async (item) => {
            const existingSettings = settings.get('settings')
            existingSettings['auto_start'] = item.checked
            settings.set('settings', existingSettings)
            sharedProcess.setLoginItem(item.checked)
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
    sharedMenu.getEditMenuTemplate()
  ]
  let menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
  return menu
}

export default { createMenu }
