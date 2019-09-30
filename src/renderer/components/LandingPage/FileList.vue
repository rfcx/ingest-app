<template>
  <div>
    <span> {{ selectedStream.folderPath }} </span>
    <ul v-for="file in getFiles()" :key="file.id">
      <li :class="{ 'has-text-danger': !isValid(getTimestamp(file.name)) }"> {{ file.name }} | {{ getTimestamp(file.name) }} | {{ file.state.id }} ({{ file.state.message }}) </li>
    </ul>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import fs from 'fs'
  import dateHelper from '../../../../utils/dateHelper'
  import File from '../../store/models/File'
  import axios from 'axios'

  export default {
    props: {
      streamId: { type: String, required: true }
    },
    computed: {
      ...mapState({
        selectedStream: state => state.Stream.selectedStream
      }),
      files () {
        const files = File.query().where('streamId', this.streamId).get()
        const states = files.map((file) => {
          return file.state.id
        })
        console.log(states)
        return files
      }
    },
    methods: {
      getFiles () {
        return this.files
        // return fs.readdirSync(this.selectedStream.folderPath)
      },
      getTimestamp (fileFullName) {
        const fileName = fileFullName.split('.', 1)[0] || ''
        const isoDate = dateHelper.getDateTime(fileName, this.selectedStream.timestampFormat)
        const momentDate = dateHelper.getMomentDateFromISODate(isoDate)
        const appDate = dateHelper.convertMomentDateToAppDate(momentDate)
        return appDate
      },
      isValid (date) {
        const momentDate = dateHelper.getMomentDateFromAppDate(date)
        return dateHelper.isValidDate(momentDate)
      },
      updateState (file, state) {
        File.update({ where: file.name,
          data: { state: state }
        })
      },
      uploadFile (file) {
        console.log('upload file')
        /* API.uploadFile() */
        const config = {
          onUploadProgress: function (progressEvent) {
            var percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            console.log(percentCompleted)
            File.update({ where: file.name,
              data: {state: {id: 'uploading', message: '100'}}
            })
            // this.updateState(file, {id: 'uploading', message: '100'})
          }
        }

        axios.post('https://jsonplaceholder.typicode.com/posts', {}, config).then(function (response) {
          console.log(response)
          File.update({ where: file.name,
            data: {state: {id: 'completed', message: ''}}
          })
          // this.updateState(file, {id: 'completed', message: null})
        }).catch(function (error) {
          File.update({ where: file.name,
            data: {state: {id: 'failed', message: 'error'}}
          })
          // this.updateState(file, {id: 'failed', message: 'error'})
          console.log('request error')
          console.log(error)
        })
      }
    },
    created () {
      // update file
      const fileList = fs.readdirSync(this.selectedStream.folderPath)
      console.log(fileList)
      const unsyncFiles = File.query().where('state', 'waiting').get()
      console.log(unsyncFiles)
      this.files.forEach((file) => {
        console.log(file)
        // this.updateState(file, {id: 'uploading', message: '100'})
        this.uploadFile(file)
      })
    }
  }
</script>
