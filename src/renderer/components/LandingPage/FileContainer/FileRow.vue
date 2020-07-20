<template>
  <tr>
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
      <font-awesome-icon v-if="file.canRedo" class="iconRedo" :icon="iconRedo" @click="repeatUploading(file)"></font-awesome-icon>
      <font-awesome-icon v-if="file.canRemove" class="iconTrash" :icon="iconTrash" @click="remove(file)"></font-awesome-icon>
    </td>
  </tr>
</template>

<script>
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
    file: File
  },
  components: { FontAwesomeIcon },
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
    },
    repeatUploading (file) {
      if (!file.canRedo) return
      File.update({ where: file.id,
        data: { state: 'waiting', stateMessage: '' }
      })
    },
    remove (file) {
      if (!file.canRemove) return
      File.delete(file.id)
    }
  }
}
</script>

<style lang="scss" scoped>

  td.is-error {
    color: $secondary-text-color;
  }

  .iconRedo {
    color: #ffffff;
    font-size: 13px;
    cursor: pointer;
  }
  .iconTrash {
    margin-left: 4px;
    cursor: pointer;
  }
</style>
