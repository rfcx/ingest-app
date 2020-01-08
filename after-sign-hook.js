const fs = require('fs')
const path = require('path')
let electron_notarize = require('electron-notarize')
const { build: { appId } } = require('./package.json')

module.exports = async function (params) {
    // Only notarize the app on Mac OS only.
    if (process.platform !== 'darwin') {
        return
    }
    console.log('afterSign hook triggered', params)
    // Same appId in electron-builder.
    let appId = 'org.rfcx.ingest'
    let ascProvider = 'TWEGNU8HTW'
    let appPath = path.join(params.appOutDir, `${params.packager.appInfo.productFilename}.app`)
    if (!fs.existsSync(appPath)) {
        throw new Error(`Cannot find application at: ${appPath}`)
    }
    console.log(`Notarizing ${appId} found at ${appPath}`)
    console.log(appId, appPath, process.env.appleId, process.env.appleIdPassword, ascProvider)
    try {
        await electron_notarize.notarize({
            appBundleId: appId,
            appPath: appPath,
            appleId: process.env.appleId,
            appleIdPassword: process.env.appleIdPassword,
            ascProvider: ascProvider
        })
    } catch (error) {
        console.error('Error notarizing', error)
    }
    console.log(`Notarizing ${appId} is finished`)
}
