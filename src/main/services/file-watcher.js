import * as chokidar from 'chokidar'
import fileService from '../../renderer/services/file'
import fileHelper from '../../../utils/fileHelper'
import File from '../../renderer/store/models/File'

// We are going to store all watchers in this objects by stream guid
// This will let us close and remove previous watcher when we press "Refresh" button for stream
let watchers = {}

async function checkFilesExistense (files) {
  for (const file of files) {
    if (!fileHelper.isExist(file.path)) {
      await File.delete(file.id)
    }
  }
}

async function getFiles (selectedStream) {
  return File.query().where('streamId', selectedStream.id).orderBy('name').get()
}

async function subscribeStream (selectedStream) {
  let newFiles = []
  let timeout
  try {
    let files = await getFiles(selectedStream)
    await checkFilesExistense(files)
  } catch (e) { console.log(e) }
  await createWatcher(selectedStream.id, selectedStream.folderPath,
    async (newFilePath) => {
      if (await fileService.fileIsExist(newFilePath)) return
      if (timeout) { clearTimeout(timeout) }
      const file = await fileService.createFileObject(newFilePath, selectedStream)
      if (file) {
        newFiles.push(file)
        timeout = setTimeout(() => {
          if (newFiles && newFiles.length) {
            // Insert array of files to the db
            fileService.insertNewFiles(newFiles, selectedStream)
            newFiles = []
          }
        }, 2000)
      }
    },
    (removedFilePath) => {
      fileService.removedFilePath(removedFilePath)
    })
}

async function createWatcher (guid, path, addCallback, removeCallback) {
  // close and remove previous watcher if exists
  await closeWatcher(guid)
  const watcher = chokidar.watch(path, {
    ignored: /(^|[\/\\])\../, //eslint-disable-line
    persistent: true,
    awaitWriteFinish: true
  })
  watcher
    .on('add', (path) => {
      // console.log(`File ${path} has been added`)
      return addCallback(path)
    })
    .on('unlink', (path) => {
      console.log(`File ${path} has been removed`)
      return removeCallback(path)
    })
  // save watcher to global object so we can access to it later
  watchers[guid] = watcher
  console.log('watchers', watchers)
}

async function closeWatcher (guid) {
  if (watchers[guid]) {
    await watchers[guid].close()
    watchers[guid] = null
  }
}

export default {
  subscribeStream,
  createWatcher,
  closeWatcher
}
