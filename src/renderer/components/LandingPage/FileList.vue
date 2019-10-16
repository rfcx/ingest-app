<template>
  <div>
    <div v-show="isEmptyFolder()" class="container-box empty has-text-centered">
        <img src="~@/assets/ic-folder-empty.svg" style="margin-bottom: 0.75em"><br>
        <span>Your synced folder is empty</span><br>
        <a class="button is-rounded is-primary" style="margin-top: 0.75em" @click="openFolder(selectedStream.folderPath)">Open Folder</a>
    </div>
    <!-- <span class="has-text-weight-semibold"> {{ selectedStream.folderPath }} | {{ selectedStream.timestampFormat }} </span> -->
    <table v-show="!isEmptyFolder()" class="table is-hoverable">
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
          <td :class="{ 'is-error': isError(file.state) }" >{{ file.name }}</td>
          <td v-show="!isError(file.state)">{{ getTimestamp(file.name) }}</td>
          <td v-show="!isError(file.state)">{{ file.fileSize }}</td>
          <td class="is-error" v-show="isError(file.state)">{{ file.stateMessage }}</td>
          <td v-show="isError(file.state)"></td>
        </tr>
      </tbody>
    </table>
    <a v-show="!isEmptyFolder()" class="button is-circle is-primary" @click="openFolder(selectedStream.folderPath)"><img src="~@/assets/ic-open.svg"></a>
  </div>
</template>

<script>
  import { mapState } from 'vuex'
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
      },
      isError (state) {
        return state === 'failed'
      },
      isEmptyFolder () {
        return this.files.length === 0
      },
      openFolder (link) {
        this.$electron.shell.openItem(link)
      }
    }
  }
</script>

<style lang="scss">

  thead {
    text-transform: uppercase;
    font-weight: $title-font-weight;
  }

  thead td, thead th {
    color: $body-text-color !important;
  }

  td.is-error {
    color: $body-text-color;
  }

</style>
