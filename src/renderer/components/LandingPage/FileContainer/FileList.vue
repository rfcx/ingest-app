<template>
  <div>
    <div class="notification default-notice" v-if="isCompletedTab && !(hasClosedNotice)">
      <button class="delete" @click="onCloseNotice()"></button>
      Completed uploads are shown for up to 30 days. To see all uploads, open in Arbimon.
    </div>
    <loader :show="isFetching" v-if="isFetching"></loader>
    <table class="table file-list-table is-hoverable" v-else-if="files.length > 0">
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
        <file-row :selectedTab="selectedTab" v-for="file in files.slice(0, visibleRows)" :key="file.id" :file="file" @onTrashPressed="showConfirmToDeleteFileDialog(file)"></file-row>
      </tbody>
    </table>
    <empty-view v-else-if="files.length === 0" :hasFileInQueued="numberOfQueuingFiles > 0" :isDragging="isDragging" @onImportFiles="onImportFiles"></empty-view>
    <confirm-alert
      :content="deleteAlertTitle"
      confirmButtonText="Delete"
      :isProcessing="isDeleting"
      v-if="shouldShowConfirmToDeleteAlert"
      @onCancelPressed="hideConfirmToDeleteDialog"
      @onConfirmPressed="deleteFile"/>
  </div>
</template>

<script>
// import File from '../../../store/models/File'
// import Stream from '../../../store/models/Stream'
import ConfirmAlert from '../../Common/ConfirmAlert'
import Loader from '../../Common/Loader'
import EmptyView from '../EmptyView'
import FileRow from './FileRow'
import FileState from '../../../../../utils/fileState'
import ipcRendererSend from '../../../services/ipc'

const PAGE_SIZE = 20

export default {
  props: {
    files: Array,
    numberOfQueuingFiles: Number,
    selectedTab: String,
    isDragging: Boolean,
    isFetching: Boolean
  },
  data: () => ({
    isDeleting: false,
    deleteAlertTitle: 'Are you sure you want to remove this file?',
    shouldShowConfirmToDeleteAlert: false,
    fileToBeDeleted: null,
    hasClosedNotice: false,
    visibleRows: PAGE_SIZE
  }),
  components: {
    EmptyView, FileRow, ConfirmAlert, Loader
  },
  computed: {
    isPreparedTab () {
      if (this.selectedTab === 'Prepared') return true
    },
    isCompletedTab () {
      if (this.selectedTab === 'Completed') return true
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
      // if (!(this.fileToBeDeleted && this.fileToBeDeleted.canRemove)) return
      if (!(this.fileToBeDeleted && FileState.canRemove(this.fileToBeDeleted.state))) return
      this.isDeleting = true
      // await Stream.dispatch('filesRemovedFromPreparing', { streamId: this.fileToBeDeleted.streamId, amount: 1 })
      // await File.delete(this.fileToBeDeleted.id)
      await ipcRendererSend('db.files.delete', `db.files.delete.${Date.now()}`, { where: { id: this.fileToBeDeleted.id } })
      this.isDeleting = false
      this.$emit('onNeedResetFileList')
      this.hideConfirmToDeleteDialog()
    },
    onImportFiles (files) {
      this.$emit('onImportFiles', files)
    },
    onCloseNotice () {
      this.hasClosedNotice = true
    },
    loadMore () {
      if (this.visibleRows < this.files.length) {
        this.visibleRows = this.visibleRows + PAGE_SIZE
      }
    },
    resetLoadMore () {
      this.visibleRows = PAGE_SIZE
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

  .notification {
    margin: auto $default-padding-margin;
  }
</style>
