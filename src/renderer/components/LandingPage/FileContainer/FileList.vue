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
      </tbody>
    </table>
    <empty-view v-if="files.length === 0" :hasFileInQueued="queuingFiles.length > 0" :isDragging="isDragging"></empty-view>
  </div>
</template>

<script>
import EmptyView from '../EmptyView'
import FileRow from './FileRow'
import FileState from '../../../../../utils/fileState'
import dateHelper from '../../../../../utils/dateHelper'

export default {
  props: {
    preparingFiles: Array,
    queuingFiles: Array,
    completedFiles: Array,
    selectedTab: String,
    isDragging: Boolean
  },
  components: {
    EmptyView, FileRow
  },
  computed: {
    files () {
      switch (this.selectedTab) {
        case 'Prepared': return this.preparingFiles
        case 'Queued': return this.queuingFiles
        case 'Completed': return this.completedFiles
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
