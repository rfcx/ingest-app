const chokidar = require('chokidar')

const createWatcher = (path, addCallback, removeCallback) => {
  console.log('watcher path', path)
  const watcher = chokidar.watch(path, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
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
}
export default { createWatcher }
