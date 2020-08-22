<template>
  <div class="file-list__wrapper">
    <table class="table file-list-table is-hoverable" v-if="files.length > 0">
      <thead>
        <tr>
          <td v-if="!isPreparedTab" class="file-list-table__cell file-list-table__cell_status"></td>
          <td class="file-list-table__cell file-list-table__cell_name">Name</td>
          <td class="file-list-table__cell file-list-table__cell_timestamp">Timestamp</td>
          <td class="file-list-table__cell file-list-table__cell_info">Duration</td>
          <td class="file-list-table__cell file-list-table__cell_info">File size</td>
          <td class="file-list-table__cell file-list-table__cell_controls"></td>
        </tr>
      </thead>
      <tbody>
        <file-row :selectedTab="selectedTab" v-for="file in files" :key="file.id" :file="file"></file-row>
      </tbody>
    </table>
    <empty-view v-if="files.length === 0" :hasFileInQueued="queuingFiles.length > 0" :isDragging="isDragging"></empty-view>
  </div>
</template>

<script>
import EmptyView from '../EmptyView'
import FileRow from './FileRow'

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
    },
    isPreparedTab () {
      if (this.selectedTab === 'Prepared') return true
    }
  }
}
</script>

<style lang="scss" scoped>
thead {
  text-transform: uppercase;
}

thead td,
thead th {
  color: $secondary-text-color !important;
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
        width: 28%;
      }
      &_timestamp {
        width: 22% !important;
      }
      &_info {
        width: 16%;
      }
      &_controls {
        width: 8%;
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
