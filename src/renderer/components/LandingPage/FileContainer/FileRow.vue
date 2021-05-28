<template>
  <tr>
    <td class="file-status file-list-table__cell file-list-table__cell_status" v-if="!isPreparedTab">
      <img :class="{ 'file-failed': file.isError }" :src="getStateImgUrl(file.state)">
      <span class="file-status__state">{{ getStateName(file) }}</span>
    </td>
    <td :colspan="isEdit ? 5 : ''" class="file-list-table__cell file-list-table__cell_name" :class="{ 'is-error': file.isError, 'is-editing': isEdit }" >
      <div class="is-flex flex-row filename-content">
        <template v-if="isEdit && canEdit">
          <!-- filename input -->
          <div class="file-name-input-container">
            <input @keypress="onInputKeyPress($event)" :disabled="isDisabled" ref="inputFileName" v-model="fileName" type="text" placeholder="File name" class="input file-name-input" />
          </div>

          <div class="rename-action">
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
          </div>

          <!-- error rename file modal -->
          <div class="modal is-active" v-if="error" :data-file="file.id">
            <div class="modal-background" />
            <div class="modal-card">
              <section class="modal-card-body is-flex flex-column justify-center align-center">
                <div class="error-message">{{ error.message }}</div>
                <button class="button close-modal-btn" @click="error = null">OK</button>
              </section>
            </div>
          </div>

        </template>
        <template v-else>
          <div class="cell-file-name" v-text="file.name" />
          <AudioMothTag :show="file.deviceId" isSelected="true" />
          <button class="button edit-file-name-btn" @click="editClick()" title="Edit file name" v-if="canEdit">
            <fa-icon class="icon-redo" :icon="icons.edit" />
          </button>
        </template>
      </div>
    </td>
    <template v-if="!isEdit">
      <td class="file-list-table__cell file-list-table__cell_info" v-if="!file.isError">
        {{ file.displayTimestamp }}
      </td>
      <td class="file-list-table__cell file-list-table__cell_info" v-if="!file.isError">
        {{ file.fileDuration }}
      </td>
      <td class="file-list-table__cell file-list-table__cell_info" v-if="!file.isError">
        {{ file.fileSize }}
      </td>
      <td class="file-list-table__cell file-list-table__cell_error error-message" colspan="3" v-if="file.isError">
        {{ file.stateMessage }}
      </td>
      <td class="file-list-table__cell file-list-table__cell_controls">
        <fa-icon v-if="file.canRedo" class="icon-redo" :icon="icons.redo" @click="repeatUploading(file)" />
        <fa-icon v-if="file.canRemove" class="icon-trash" :icon="icons.trash" @click="remove(file)" />
      </td>
    </template>
  </tr>
</template>

<script>
import fileState from '../../../../../utils/fileState'
import fileHelper from '../../../../../utils/fileHelper'
import { faRedo, faTrash, faPencilAlt } from '@fortawesome/free-solid-svg-icons'
import AudioMothTag from '../../Common/AudioMothTag'

export default {
  props: {
    initialFile: Object,
    selectedTab: String
  },
  data: function () {
    return {
      isEdit: false,
      fileName: '',
      loading: false,
      error: null,
      file: this.initialFile
    }
  },
  components: {
    AudioMothTag
  },
  mounted () {
    this.fileName = this.file.name || ''
  },
  created () {
    this.formatAttributes()
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
        const updatedFields = await this.$file.renameFile(this.file, newFilename)
        console.log('rename success: ', updatedFields)
        if (typeof updatedFields === 'object') {
          this.file = {...this.file, ...updatedFields}
          console.log('rename success: ', this.file)
        }
        this.isEdit = false
      } catch (e) {
        let message
        if (e instanceof Error) {
          message = e.message
        } else {
          message = 'Unknow error'
        }
        console.log('Rename file error', message)
        this.error = {
          message
        }
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
    async repeatUploading (file) {
      if (!file.canRedo) return
      console.log('repeat', file)
      if (file.durationInSecond === -2) { // get duration error
        await this.$file.updateFilesDuration([file])
      }
      await this.$file.putFilesIntoUploadingQueue([file])
    },
    remove (file) {
      this.$emit('onTrashPressed', file)
    },
    formatAttributes () {
      this.file.displayTimestamp = fileHelper.getDisplayTimestamp(this.file)
      this.file.fileDuration = fileHelper.getDisplayFileDuration(this.file)
      this.file.fileSize = fileHelper.getDisplayFileSize(this.file)
      this.file.isError = this.file.state.includes('error')
      this.file.canRedo = fileState.canRedo(this.file.state, this.file.stateMessage)
      this.file.canRemove = fileState.canRemove(this.file.state)
    }
  },
  computed: {
    isPreparedTab () {
      return this.selectedTab === 'Prepared'
    },
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
    },
    canEdit () {
      return ['local_error', 'preparing'].includes(this.file.state) && !this.file.deviceId
    }
  },
  watch: {
    initialFile: {
      handler: async function (newValue, previousValue) {
        if (newValue === previousValue) return
        this.file = newValue
      }
    },
    file: {
      handler: function () {
        this.formatAttributes()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
  td.is-error {
    color: $secondary-text-color;
  }
  .table td {
    padding: 0.5em $default-padding !important;
    vertical-align: middle !important;
  }
  .file-status {
    text-align: center !important;
    padding: 0.4rem 0.75rem 0.7rem 0 !important;
    &__state {
      display: block;
      font-size: 9px;
      height: auto;
      line-height: 1;
    }
    img {
      display: block;
      margin: 0 auto;
    }
  }
  .file-failed {
    margin: 7px auto 5px !important;
  }
  .error-message {
    color: $error-text-color;
  }
  .iconRedo {
    color: $white-color;
    font-size: 13px;
    cursor: pointer;
  }
  .icon-trash {
    margin-left: 4px;
    cursor: pointer;
  }
  .modal {
    .modal-card {
      border-radius: 8px;
      .error-message {
        color: white;
        font-size: 16px;
      }

      .close-modal-btn {
        margin-top: 12px;
        color: white;
      }
    }
  }
  .flex-row {
    flex-direction: row;
  }

  .flex-column {
    flex-direction: column;
  }

  .justify-center {
    justify-content: center;
  }

  .align-center {
    align-items: center;
  }

  .file-list-table__cell_name {
    &:hover {
      .edit-file-name-btn {
        display: flex;
      }
    }

    .file-name-input-container {
      flex-grow: 1;
      min-width: 180px;
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
      margin-right: 8px;
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

  .icon-redo {
    cursor: pointer;
  }

  .filename-content {
    align-items: center;
  }
</style>
