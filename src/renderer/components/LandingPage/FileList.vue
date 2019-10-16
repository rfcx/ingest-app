<template>
  <div>
    <span class="has-text-weight-semibold"> {{ selectedStream.folderPath }} | {{ selectedStream.timestampFormat }} </span>
    <table class="table is-hoverable">
      <thead>
        <tr>
          <td></td>
          <td>Name</td>
          <td>Timestamp</td>
          <td>File size</td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in getFiles()" :key="file.id">
          <td><img :src="getStateImgUrl(file.state)"></td>
          <td>{{ file.name }}</td>
          <td>{{ getTimestamp(file.name) }}</td>
          <td>{{ file.fileSize }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
  import fs from 'fs'
  import dateHelper from '../../../../utils/dateHelper'
  import fileHelper from '../../../../utils/fileHelper'
  import File from '../../store/models/File'
  import Stream from '../../store/models/Stream'

  export default {
    computed: {
      ...mapState({
        selectedStreamId: state => state.Stream.selectedStreamId
      }),
      selectedStream () {
        return Stream.find(this.selectedStreamId)
      },
      files () {
        return File.query().where('streamId', this.selectedStreamId).orderBy('name').get()
      }
    },
    methods: {
      getFiles () {
        return this.files
        // return fs.readdirSync(this.selectedStream.folderPath)
      },
      getStateImgUrl (state) {
        return require(`../../assets/ic-file-state-${state}.svg`)
      },
      getTimestamp (fileFullName) {
        const fileName = fileHelper.getFileName(fileFullName)
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
      }
    },
    created () {
      // update file
      const fileList = fs.readdirSync(this.selectedStream.folderPath)
      console.log(fileList)
    }
  }
</script>
