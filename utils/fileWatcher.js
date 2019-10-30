const chokidar = require('chokidar')

let watcher

const watch = (path, addCallback, removeCallback) => {
  console.log('--> ', path)
  watcher = chokidar.watch(path, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true,
    awaitWriteFinish: true
  })
  watcher
    .on('add', path => addCallback(path))
    .on('unlink', path => removeCallback(path))
}
export default {
  watch
}
