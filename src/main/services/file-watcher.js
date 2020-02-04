import * as chokidar from 'chokidar'
import fileService from '../../renderer/services/file'

// We are going to store all watchers in this objects by stream guid
// This will let us close and remove previous watcher when we press "Refresh" button for stream
let watchers = {}

async function subscribeStream (selectedStream) {
  await createWatcher(
    selectedStream.id,
    selectedStream.folderPath,
    async (newFilePath) => {
      await fileService.newFilePath(newFilePath, selectedStream)
    },
    (removedFilePath) => {
      fileService.removedFilePath(removedFilePath)
    })
}

async function createWatcher (guid, path, addCallback, removeCallback) {
  // close and remove previous watcher if exists
  if (watchers[guid]) {
    await watchers[guid].close()
    watchers[guid] = null
  }
  const watcher = chokidar.watch(path, {
    ignored: /(^|[\/\\])\../, //eslint-disable-line
    persistent: true,
    awaitWriteFinish: true
  })
  watcher
    .on('add', (path) => {
      console.log(`File ${path} has been added`)
      return addCallback(path)
    })
    .on('unlink', (path) => {
      console.log(`File ${path} has been removed`)
      return removeCallback(path)
    })
  // save watcher to global object so we can access to it later
  watchers[guid] = watcher
}

export default {
  subscribeStream,
  createWatcher
}
