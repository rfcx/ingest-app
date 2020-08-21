<template>
  <tr>
    <td class="file-status file-list-table__cell file-list-table__cell_status">
      <img :class="{ 'file-failed': file.isError }" :src="getStateImgUrl(file.state)">
      <span class="file-status-state">{{ getStateName(file) }}</span>
    </td>
    <td class="file-row file-list-table__cell file-list-table__cell_name" :class="{ 'is-error': file.isError, 'is-editing': isEdit }" >
      <div class="is-flex flex-row filename-content">
        <template v-if="isEdit">
          <!-- filename input -->
          <div class="file-name-input-container">
            <input @keypress="onInputKeyPress($event)" :disabled="isDisabled" ref="inputFileName" v-model="fileName" type="text" placeholder="File name" class="input file-name-input" />
          </div>

          <!-- cancel edit button -->
          <button
            class="button is-rounded cancel-edit-filename-btn is-cancel"
            @click="isEdit = false"
            :disabled="isDisabled">
            Cancel
          </button>

          <!-- save filename button -->
          <button
            class="button is-rounded save-edit-filename-btn is-primary"
            :disabled="isDisabled || !canSave || !fileExtensionValid"
            @click="saveEditFileName()"
            :class="{'is-loading': loading }">
            Save
          </button>
        </template>
        <template v-else>
          <div class="cell-file-name" v-text="file.name" />
          <button class="button edit-file-name-btn" @click="editClick()" title="Edit file name">
            <fa-icon class="icon-redo" :icon="icons.edit" />
          </button>
        </template>
      </div>
    </td>
    <td class="file-row file-list-table__cell file-list-table__cell_info" v-if="!file.isError">
      {{ getTimestamp(file) }}
    </td>
    <td class="file-row file-list-table__cell file-list-table__cell_info" v-if="!file.isError">
      {{ file.fileDuration }}
    </td>
    <td class="file-row file-list-table__cell file-list-table__cell_info" v-if="!file.isError">
      {{ file.fileSize }}
    </td>
    <td class="is-error file-row file-list-table__cell file-list-table__cell_error" colspan="3" v-if="file.isError">
      {{ file.stateMessage }}
    </td>
    <td class="file-row file-row-icons file-list-table__cell file-list-table__cell_controls">
      <fa-icon v-if="file.canRedo" class="icon-redo" :icon="icons.redo" @click="repeatUploading(file)" />
      <fa-icon v-if="file.canRemove" class="icon-trash" :icon="icons.trash" @click="remove(file)" />
    </td>
  </tr>
</template>

<script>
import File from '../../../store/models/File'
import fileState from '../../../../../utils/fileState'
import dateHelper from '../../../../../utils/dateHelper'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import { faRedo, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons'

export default {
  props: {
    file: File
  },
  data: () => ({
    isEdit: false,
    fileName: '',
    loading: false
  }),
  components: {
    'fa-icon': FontAwesomeIcon
  },
  mounted () {
    this.fileName = this.file.name || ''
  },
  methods: {
    onInputKeyPress (e) {
      // trigger update when key 'Enter' presses
      if (e.keyCode === 13) {
        e.preventDefault()
        if (this.canSave && this.fileExtensionValid) {
          this.saveEditFileName()
        }
      }
    },
    async saveEditFileName () {
      this.loading = true
      try {
        const newFilename = this.fileName.trim()
        await this.$file.renameFile(this.file, newFilename)
        this.isEdit = false
      } catch (e) {
        console.log('Save file name error', e)
        // TODO: notify error
      }
      this.loading = false
    },
    editClick () {
      this.fileName = this.file.name || ''
      this.isEdit = true
      setTimeout(() => {
        const input = this.$refs.inputFileName
        input && input.focus()
      }, 50)
    },
    getStateName (file) {
      return fileState.getName(file.state, file.stateMessage)
    },
    getStateImgUrl (state) {
      if (fileState.isPreparing(state)) return ''
      const iconName = fileState.getIconName(state)
      return require(`../../../assets/${iconName}`)
    },
    getTimestamp (file) {
      const isoDate = file.timestamp
      const momentDate = dateHelper.getMomentDateFromISODate(isoDate)
      const appDate = dateHelper.convertMomentDateToAppDate(momentDate)
      return appDate
    },
    repeatUploading (file) {
      if (!file.canRedo) return
      this.$file.putFilesIntoUploadingQueue([file])
    },
    remove (file) {
      if (!file.canRemove) return
      File.delete(file.id)
    }
  },
  computed: {
    icons: () => ({
      redo: faRedo,
      trash: faTrash,
      edit: faPencilAlt
    }),
    isDisabled () {
      return this.loading
    },
    canSave () {
      const fname = this.fileName.trim()
      return !this.loading && fname !== '' && fname !== this.file.name
    },
    fileExtensionValid () {
      const arr = this.fileName.trim().split('.')
      if (arr.length <= 1) {
        return false
      }
      return String(this.file.extension).toLowerCase() === String(arr[arr.length - 1]).toLowerCase()
    }
  }
}
</script>

<style lang="scss" scoped>

  td.is-error {
    color: $secondary-text-color;
  }

  .icon-redo {
    color: #ffffff;
    font-size: 13px;
    cursor: pointer;
  }
  .icon-trash {
    margin-left: 4px;
    cursor: pointer;
  }

  .flex-row {
    flex-direction: row;
  }

  .file-list-table__cell_name {
    &:hover {
      .edit-file-name-btn {
        display: flex;
      }
    }

    .file-name-input-container {
      flex-grow: 1;
      min-width: 40px;
      max-width: 320px;
      input {
        width: 100%;
        &:hover {
          border-color: transparent;
        }

        &[disabled] {
          background: #232436;
          border-color: #232436;
        }
      }
    }

    .edit-file-name-btn {
      margin-left: 8px;
      background-color: transparent;
      height: 20px;
      width: 20px;
      border: 0 !important;
      box-shadow: unset !important ;
      display: none;
    }

    .save-edit-filename-btn, .cancel-edit-filename-btn {
      margin-left: 8px;
      color: #ffffff;
      min-width: 90px;
    }

    .cancel-edit-filename-btn[disabled] {
      background: #232436;
      border-color: #232436;
    }
  }

  .filename-content {
    align-items: center;
  }
</style>
