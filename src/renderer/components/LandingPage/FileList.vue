<template>
  <div>
    <span> {{ selectedStream.folderPath }} </span>
    <ul v-for="file in getFiles()" :key="file">
      <li :class="{ 'has-text-danger': !isValid(getTimestamp(file)) }"> {{ file }} | {{ getTimestamp(file) }} </li>
    </ul>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import fs from 'fs'
  import dateHelper from '../../../../utils/dateHelper'

  export default {
    methods: {
      getFiles () {
        return fs.readdirSync(this.selectedStream.folderPath)
      },
      getTimestamp (file) {
        const fileName = file.split('.', 1)[0] || ''
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
    computed: {
      ...mapState({
        selectedStream: state => state.Stream.selectedStream
      })
    }
  }
</script>
