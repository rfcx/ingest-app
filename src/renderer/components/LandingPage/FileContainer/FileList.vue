<template>
  <div class="file-list__wrapper">
    <table class="table file-list-table is-hoverable" v-if="files.length > 0">
      <thead>
        <tr>
          <td class="file-list-table__cell file-list-table__cell_status"></td>
          <td class="file-list-table__cell file-list-table__cell_name">Name</td>
          <td class="file-list-table__cell file-list-table__cell_info">Timestamp</td>
          <td class="file-list-table__cell file-list-table__cell_info">Duration</td>
          <td class="file-list-table__cell file-list-table__cell_info">File size</td>
          <td class="file-list-table__cell file-list-table__cell_controls"></td>
        </tr>
      </thead>
      <tbody>
        <file-row v-for="file in files" :key="file.id" :file="file"></file-row>
        <!-- <tr v-for="file in files" :key="file.id" :class="{ 'file-disable': file.disabled }">
          <td class="file-status file-list-table__cell file-list-table__cell_status">
            <img :class="{ 'file-failed': file.isError }" :src="getStateImgUrl(file.state)" />
            <span class="file-status-state">{{ getStateName(file) }}</span>
          </td>
          <td
            class="file-row file-list-table__cell file-list-table__cell_name"
            :class="{ 'is-error': file.isError }"
          >{{ file.name }}</td>
          <td
            class="file-row file-list-table__cell file-list-table__cell_info"
            v-if="!file.isError"
          >{{ getTimestamp(file) }}</td>
          <td
            class="is-error file-row file-list-table__cell file-list-table__cell_info"
            colspan="3"
            v-if="file.isError"
          >{{ file.stateMessage }}</td>
          <td
            class="file-row file-list-table__cell file-list-table__cell_controls"
            v-if="!file.isError"
          >{{ file.fileDuration }}</td>
          <td
            class="file-row file-list-table__cell file-list-table__cell_controls"
            v-if="!file.isError"
          >{{ file.fileSize }}</td>
          <td
            class="file-row file-row-icons file-list-table__cell file-list-table__cell_controls"
            v-if="file.isError && selectedTab === 'Completed'"
          >
            <font-awesome-icon
              v-show="file.canRedo"
              class="iconRedo"
              :icon="iconRedo"
              @click="repeatUploading(file)"
            ></font-awesome-icon>
          </td>
          <td
            class="file-row file-row-icons file-list-table__cell file-list-table__cell_controls"
            v-if="isInPreparedGroup(file)"
          >
            <font-awesome-icon class="iconTrash" :icon="iconTrash" @click="remove(file)"></font-awesome-icon>
          </td>
        </tr>-->
      </tbody>
    </table>
    <!-- TODO: add empty view -->
    <empty-folder v-if="files.length === 0" :isDragging="isDragging"></empty-folder>
  </div>
</template>

<script>
import EmptyFolder from '../EmptyFolder'
import FileRow from './FileRow'
import FileState from '../../../../../utils/fileState'
import dateHelper from '../../../../../utils/dateHelper'

export default {
  props: {
    allFiles: Array,
    selectedTab: String,
    isDragging: Boolean
  },
  components: {
    EmptyFolder, FileRow
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
    }
  }
}
</script>

<style lang="scss">
thead {
  text-transform: uppercase;
  font-weight: $title-font-weight;
}

thead td,
thead th {
  color: $body-text-color !important;
}

.file-list-table {
  &_head {
    margin-bottom: 0 !important;
    .file-list-table {
      &__cell {
        white-space: nowrap;
      }
    }
  }
  .file-list-table {
    &__cell {
      &_status {
        width: 10%;
        vertical-align: middle !important;
      }
      &_name,
      &_error {
        width: 35%;
      }
      &_info {
        width: 15%;
      }
      &_controls {
        width: 10%;
        text-align: right !important;
        padding-right: 24px !important;
      }
    }
  }
}
.table tbody {
  overflow-y: auto !important;
}
</style>
