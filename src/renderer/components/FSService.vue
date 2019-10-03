<template>
<div id="wrapper">FS Service</div>
</template>

<script>
  import fileHelper from '../../../utils/fileHelper'
  // import dateHelper from '../../../utils/dateHelper'
  import cryptoJS from 'crypto-js'
  
  export default {
    created () {
      console.log('FS Service')
      this.$electron.ipcRenderer.on('hasNewFilesAdded', (event, path) => {
        console.log('on hasNewFilesAdded path: ', path)
        const files = fileHelper.getFilesFromDirectoryPath(path).map(fileName => {
          const hash = fileHelper.getMD5Hash(path, fileName)
          return {
            id: cryptoJS.MD5(path + fileName).toString(),
            name: fileName,
            hash: hash
          }
        })
        console.log(files)
        this.$electron.ipcRenderer.send('readNewFilesSuccess', files)
      })
    }
  }
</script>
