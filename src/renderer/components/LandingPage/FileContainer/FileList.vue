<template>
  <div class="file-list__wrapper">
    <table class="table file-list-table is-hoverable" v-if="files.length > 0">
      <thead>
        <tr>
          <td class="file-list-table__cell file-list-table__cell_status"></td>
          <td class="file-list-table__cell file-list-table__cell_name">Name</td>
          <td class="file-list-table__cell file-list-table__cell_info">Timestamp</td>
          <td class="file-list-table__cell file-list-table__cell_controls">Duration</td>
          <td class="file-list-table__cell file-list-table__cell_controls">File size</td>
          <td class="file-list-table__cell file-list-table__cell_controls" v-if="selectedTab === 'Prepared'"></td>
        </tr>
      </thead>
      <tbody>
        <tr v-for="file in files" :key="file.id" :class="{ 'file-disable': file.disabled }">
          <td class="file-status file-list-table__cell file-list-table__cell_status">
            <img :class="{ 'file-failed': file.isError }" :src="getStateImgUrl(file.state)">
            <span class="file-status-state">{{ getStateName(file) }}</span>
          </td>
          <td class="file-row file-list-table__cell file-list-table__cell_name" :class="{ 'is-error': file.isError }" >
            {{ file.name }}
          </td>
          <td class="file-row file-list-table__cell file-list-table__cell_info" v-if="!file.isError">
            {{ getTimestamp(file) }}
          </td>
          <td class="is-error file-row file-list-table__cell file-list-table__cell_info" colspan="2" v-if="file.isError">
            {{ file.stateMessage }}
          </td>
          <td class="file-row file-list-table__cell file-list-table__cell_controls" v-if="!file.isError">
            {{ file.fileDuration }}
          </td>
          <td class="file-row file-list-table__cell file-list-table__cell_controls" v-if="!file.isError">
            {{ file.fileSize }}
          </td>
          <td class="file-row file-row-icons file-list-table__cell file-list-table__cell_controls" v-if="file.isError">
            <font-awesome-icon v-show="file.canRedo" class="iconRedo" :icon="iconRedo" @click="repeatUploading(file)"></font-awesome-icon>
          </td>
          <td class="file-row file-row-icons file-list-table__cell file-list-table__cell_controls" v-if="isInPreparedGroup(file)">
            <font-awesome-icon class="iconTrash" :icon="iconTrash" @click="remove(file)"></font-awesome-icon>
          </td>
        </tr>
      </tbody>
    </table>
    <!-- TODO: add empty view -->
    <empty-folder v-if="files.length === 0" :isDragging="isDragging"></empty-folder>
  </div>
</template>

<script>
import EmptyFolder from '../EmptyFolder'
import File from '../../../store/models/File'
import FileState from '../../../../../utils/fileState'
import dateHelper from '../../../../../utils/dateHelper'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faRedo, faTrash } from '@fortawesome/free-solid-svg-icons'

export default {
  data () {
    return {
      iconRedo: faRedo,
      iconTrash: faTrash
    }
  },
  props: {
    allFiles: Array,
    selectedTab: String,
    isDragging: Boolean
  },
  components: {
    FontAwesomeIcon, EmptyFolder
  },
  computed: {
    files () {
      if (!this.allFiles) return []
      switch (this.selectedTab) {
        case 'Prepared':
          return this.allFiles.filter(file => FileState.isInPreparedGroup(file.state))
        case 'Queued':
          return this.allFiles.filter(file => FileState.isInQueuedGroup(file.state))
        case 'Completed':
          return this.allFiles.filter(file => FileState.isInCompletedGroup(file.state))
      }
    }
  },
  methods: {
    getFile (fileId) {
      return new Promise((resolve, reject) => {
        const file = File.query().where((file) => {
          return file.id === fileId
        }).get()
        if (file != null) {
          resolve(file[0])
        } else {
          reject(new Error('Not found file'))
        }
      })
    },
    getStateName (file) {
      return FileState.getName(file.state, file.stateMessage)
    },
    getStateImgUrl (state) {
      if (state === 'preparing') return ''
      const s = state.includes('error') ? 'failed' : state
      return require(`../../../assets/ic-state-${s}.svg`)
    },
    getTimestamp (file) {
      const isoDate = file.timestamp
      const momentDate = dateHelper.getMomentDateFromISODate(isoDate)
      const appDate = dateHelper.convertMomentDateToAppDate(momentDate)
      return appDate
    },
    isInPreparedGroup (file) {
      return FileState.isInPreparedGroup(file.state)
    },
    isError (file) {
      return FileState.isError(file.state)
    },
    repeatUploading (file) {
      // if there is an active session id then reuse that, otherwise generate a new one
      const sessionId = this.$store.state.AppSetting.currentUploadingSessionId || '_' + Math.random().toString(36).substr(2, 9)
      this.$store.dispatch('setCurrentUploadingSessionId', sessionId)
      File.update({ where: file.id,
        data: { state: 'waiting', stateMessage: '', sessionId: sessionId }
      })
    },
    remove (file) {
      File.delete(file.id)
    }
  }
}
</script>

