<template>
  <div>
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
        <file-row :selectedTab="selectedTab" v-for="file in files" :key="file.id" :file="file" @onTrashPressed="showConfirmToDeleteFileDialog(file)"></file-row>
      </tbody>
    </table>
    <empty-view v-if="files.length === 0" :hasFileInQueued="queuingFiles.length > 0" :isDragging="isDragging"></empty-view>
    <confirm-alert
      :title="deleteAlertTitle"
      confirmButtonText="Delete"
      :isProcessing="isDeleting"
      v-if="shouldShowConfirmToDeleteAlert"
      @onCancelPressed="hideConfirmToDeleteDialog"
      @onConfirmPressed="deleteFile"/>
  </div>
</template>

<script>
import File from '../../../store/models/File'
import ConfirmAlert from '../../Common/ConfirmAlert'
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
  data: () => ({
    isDeleting: false,
    deleteAlertTitle: 'Are you sure you want to remove this file?',
    shouldShowConfirmToDeleteAlert: false,
    fileToBeDeleted: null
  }),
  components: {
    EmptyView, FileRow, ConfirmAlert
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
  },
  methods: {
    showConfirmToDeleteFileDialog (file) {
      this.deleteAlertTitle = `Are you sure you want to remove ${file.name}?`
      this.shouldShowConfirmToDeleteAlert = true
      this.fileToBeDeleted = file
    },
    hideConfirmToDeleteDialog () {
      this.shouldShowConfirmToDeleteAlert = false
      this.fileToBeDeleted = null
    },
    async deleteFile () {
      if (!(this.fileToBeDeleted && this.fileToBeDeleted.canRemove)) return
      this.isDeleting = true
      await File.delete(this.fileToBeDeleted.id)
      this.isDeleting = false
      this.hideConfirmToDeleteDialog()
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
    padding: 0.5em $default-padding !important;
  }
  .table tbody {
    overflow-y: auto;
  }
  .file-list-table {
    &__cell {
      &_name,
      &_error {
        width: 35%;
        width: 28%;
      }
      &_timestamp {
        width: 22%;
      }
      &_info {
        width: 15%;
        width: 16%;
      }
      &_controls {
        width: 10%;
        width: 8%;
        text-align: right;
        padding-right: 24px;
      }
    }
  }
</style>
