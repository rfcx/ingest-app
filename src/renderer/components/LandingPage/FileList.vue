<template>
  <div>
    <span> {{ selectedStream.folderPath }} </span>
    <ul v-for="file in getFiles()" :key="file.id">
      <li :class="{ 'has-text-danger': !isValid(getTimestamp(file.name)) }"> {{ file.name }} | {{ getTimestamp(file.name) }} | {{ file.state.id }} </li>
    </ul>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import fs from 'fs'
  import dateHelper from '../../../../utils/dateHelper'
  import File from '../../store/models/File'

  export default {
    props: {
      streamId: { type: String, required: true }
    },
    computed: {
      ...mapState({
        selectedStream: state => state.Stream.selectedStream
      }),
      files () {
        return File.query().where('streamId', this.streamId).get()
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
      }
    },
    mounted () {
      // update file
      const fileList = fs.readdirSync(this.selectedStream.folderPath)
      console.log(fileList)
    }
  }
</script>
