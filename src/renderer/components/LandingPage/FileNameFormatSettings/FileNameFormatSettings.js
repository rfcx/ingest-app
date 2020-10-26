import * as far from '@fortawesome/free-regular-svg-icons'
import fileFormat from '../../../../../utils/FileFormat'
export default {
  props: {
    format: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    selectedItems: [],
    lastInputText: '',
    shouldShowErrorMessage: false,
    selectedIndexCursor: null
  }),
  mounted () {
    this.checkRestoreFormatToField()
  },
  methods: {
    async save () {
      const format = this.selectedFormat
      if (this.isPassedValidation) {
        this.$emit('save', format)
      } else {
        this.shouldShowErrorMessage = true
        console.log('error not pass validation')
      }
    },
    closeModal () {
      this.$emit('onClose')
      this.clearSelectedItem()
    },
    deleteSelectedItem (idx) {
      // delete current index
      this.$delete(this.selectedItems, idx)

      const size = this.selectedItems.length
      if (this.selectedItems.length > 0) {
        // check last element is text then remove the last one
        const last = this.selectedItems[size - 1]
        if (last instanceof CustomInputFormat) {
          this.$delete(this.selectedItems, size - 1)
          this.lastInputText = last.value || ''
        }

        // check first element is text then remove the first one
        const first = this.selectedItems[0]
        if (first instanceof CustomInputFormat && first.value === '') {
          this.$delete(this.selectedItems, 0)
        }
      }
      let newSelected = []
      const newSize = this.selectedItems.length
      let index = 0
      while (index < newSize) {
        const nxIndex = index + 1
        const currentItem = this.selectedItems[index]
        if (nxIndex < newSize) {
          const nxItem = this.selectedItems[nxIndex]

          if (currentItem instanceof CustomInputFormat && nxItem instanceof CustomInputFormat) {
            const item = new CustomInputFormat(currentItem.value + nxItem.value)
            newSelected.push(item)
            index += 2
            continue
          }
        }

        newSelected.push(currentItem)
        index++
      }

      this.selectedItems = newSelected
    },
    keydown (e) {
      if (e.keyCode === 8 && this.lastInputText === '') {
        e.preventDefault()
        const s = this.selectedItems.length
        if (s > 0) {
          this.deleteSelectedItem(s - 1)
        }
      }
    },
    customInputKeydown (e, idx) {
      const item = this.selectedItems[idx]
      if (item instanceof CustomInputFormat && e.keyCode === 8 && item.value === '') {
        // if (idx > 0) {
        //   this.deleteSelectedItem(idx - 1)
        // }
      }
    },
    customInputBlur (e, idx) {
      console.log('customInputBlur', idx)
      this.selectedIndexCursor = idx
    },
    resetTheSelectedItems (newItem) {
      this.selectedItems = [newItem]
      this.lastInputText = ''
    },
    formatItemClick (type, item) {
      this.shouldShowErrorMessage = false
      if (item instanceof TimeFormat) {
        // check if format type has already selected
        const hasSelected = this.selectedItems.findIndex(si => {
          if (item.type === 'hours12' || item.group === 'Hour') { return si.group === item.group }
          return (si instanceof TimeFormat && si.type === item.type)
        }) > -1
        if (!hasSelected) {
          if (this.selectedItems.length > 0) { // if already has some items in the list
            console.log('formatItemClick: already has some items')
            if (this.lastInputText !== '') { // if last input text has some value, then add it to the list
              console.log('formatItemClick: last input text is not an empty string')
              const inputFormat = new CustomInputFormat(this.lastInputText)
              this.insertOrPushToSelectedItems(inputFormat, this.selectedIndexCursor)
            } else { // if not then add an empty string into the list
              console.log('formatItemClick: last input text is an empty string')
              this.insertOrPushToSelectedItems(new CustomInputFormat(''), this.selectedIndexCursor)
              this.lastInputText = ''
            }
          }
          // add selected item into the list
          const index = this.selectedIndexCursor ? this.selectedIndexCursor + 1 : null
          this.insertOrPushToSelectedItems(item, index)
        }
        this.selectedIndexCursor = null // reset index cursor
      }
    },
    insertOrPushToSelectedItems (item, index) {
      if (index) {
        this.selectedItems.splice(index, 0, item)
      } else {
        this.selectedItems.push(item)
      }
    },
    deleteSelectedFormatItem (optionItem) {
      if (optionItem instanceof TimeFormat) {
        const idx = this.selectedItems.findIndex(si => optionItem.type === si.type && optionItem.format === si.format && optionItem.label === si.label)
        if (idx > -1) {
          this.deleteSelectedItem(idx)
        }
      }
    },
    isFormatItem (item) {
      return item instanceof TimeFormat
    },
    isInputItem (item) {
      return item instanceof CustomInputFormat
    },
    fieldClick (e) {
      const { target } = e
      const tagName = String(target.tagName).toLowerCase()
      if (tagName === 'input') {
        target.focus()
      } else if (target.classList.contains('field')) {
        const input = this.$refs.fieldInput
        input.focus()
      }
    },
    clearSelectedItem () {
      this.selectedItems = []
      this.lastInputText = ''
    },
    checkRestoreFormatToField () {
      const { format } = this
      console.log(`restoring format '${format}'`)
      if (Object.values(fileFormat.fileFormat).includes(format)) return
      const size = format.length
      const selectedItems = []
      if (size > 0) {
        const selectFormat = formatText => {
          for (const formatItem of Object.values(TIME_FORMAT)) {
            const option = formatItem.options.find(op => op.format === formatText)
            if (option) {
              selectedItems.push(option)
              selectedItems.push(new CustomInputFormat(''))
              return
            }
          }
        }

        let idx = 0
        let count = 0
        this.selectedItems = []
        const CHAR = '%'
        while (idx < size) {
          if (format[idx] === CHAR && idx + 1 < size) {
            const fm = format.substr(idx, 2)
            idx += 2
            selectFormat(fm)
          } else {
            const strIdx = format.indexOf(CHAR, idx)
            let text = ''
            if (strIdx > -1) {
              text = format.substring(idx, strIdx)
              idx += strIdx - idx
            } else {
              text = format.substring(idx, size)
              idx += (size - idx)
            }

            if (selectedItems[selectedItems.length - 1] instanceof CustomInputFormat) {
              selectedItems[selectedItems.length - 1].value = text
            } else {
              selectedItems.push(new CustomInputFormat(text))
            }
          }
          count++
          // prevent infinite loop
          if (count > 50) {
            break
          }
        }

        const lastItem = selectedItems[selectedItems.length - 1]
        if (lastItem instanceof CustomInputFormat && lastItem.value === '') {
          selectedItems.splice(selectedItems.length - 1, 1)
        }

        this.selectedItems = selectedItems
      }
    }
  },
  computed: {
    ICON_CLOCK: () => far.faClock,
    TIME_FORMAT: () => TIME_FORMAT,
    requiredTimeFormatForCustomTimestamp: () => {
      return ['year', 'month', 'day', 'hour', 'minute']
    },
    errorMessageForRequiredTimeFormatForCustomTimestamp () {
      return this.requiredTimeFormatForCustomTimestamp.toString() + ' are required for a custom timestamp format'
    },
    isPassedValidation () {
      const allSelectedTimeFormatRequiredType = this.selectedItems
        .filter(item => this.isFormatItem(item))
        .map(item => item.group)
        .filter(item => item && this.requiredTimeFormatForCustomTimestamp.includes(item.toLowerCase()))
      return allSelectedTimeFormatRequiredType.length >= this.requiredTimeFormatForCustomTimestamp.length
    },
    isEmpty () {
      return this.lastInputText.trim() === '' && this.selectedItems.length === 0
    },
    is12Hour () {
      return this.selectedItems.some(si => (si instanceof TimeFormat) && si.format === 'hours12')
    },
    selectedFormat () {
      return this.selectedItems.reduce((acc, item) => {
        if (item instanceof TimeFormat) {
          return acc + item.format
        } else if (item instanceof CustomInputFormat) {
          return acc + item.value
        }
        return acc
      }, '') + this.lastInputText.trim()
    }
  },
  watch: {
    selectedItems (oldValue, newValue) {
      if (oldValue === newValue) return
      this.shouldShowErrorMessage = false
    }
  }
}

class TimeFormat {
  format = ''
  label = ''
  type = ''
  example = ''
  group = ''

  constructor (label, format, type, ex, group) {
    this.label = label
    this.format = format
    this.type = type
    this.example = ex
    this.group = group
  }
}

class CustomInputFormat {
  value = ''
  get type () {
    return 'input'
  }

  constructor (v) {
    this.value = v
  }
}

const TIME_FORMAT = {
  /** --------- Day number format ---------- */
  day_number: (() => {
    const group = 'Day'
    const type = 'day_number'
    const ex = 'D'
    return {
      label: group,
      type,
      options: [
        new TimeFormat('9', '%d', type, ex, group),
        new TimeFormat('09', '%D', type, ex, group)
      ]
    }
  })(),
  /** --------- Month format ---------- */
  month: (() => {
    const group = 'Month'
    const type = 'month'
    const ex = 'M'
    return {
      label: 'Month',
      type,
      options: [
        new TimeFormat('6', '%m', type, ex, group),
        new TimeFormat('06', '%M', type, ex, group),
        new TimeFormat('Jun', '%n', type, ex, group),
        new TimeFormat('June', '%N', type, ex, group)
      ]
    }
  })(),
  /** --------- Year format ---------- */
  year: (() => {
    const group = 'Year'
    const type = 'year'
    const ex = 'Y'
    return {
      label: 'Year',
      type,
      options: [
        new TimeFormat('20', '%y', type, ex, group),
        new TimeFormat('2020', '%Y', type, ex, group)
      ]
    }
  })(),
  /** --------- 12 Hours format ---------- */
  hours12: (() => {
    const group = 'Hour'
    const type = 'hours12'
    const ex = 'H12'
    return {
      label: '12 Hour',
      type,
      options: [
        new TimeFormat('6', '%g', type, ex, group),
        new TimeFormat('06', '%G', type, ex, group),
        new TimeFormat('A/P', '%a', type, '', 'ampm'),
        new TimeFormat('AM/PM', '%A', type, '', 'ampm')
      ]
    }
  })(),
  /** --------- 24 Hours format ---------- */
  hours24: (() => {
    const group = 'Hour'
    const type = 'hours24'
    const ex = 'H'
    return {
      label: '24 Hour',
      type,
      options: [
        new TimeFormat('6', '%h', type, ex, group),
        new TimeFormat('06', '%H', type, ex, group)
      ]
    }
  })(),
  /** --------- Minute format ---------- */
  minute: (() => {
    const group = 'Minute'
    const type = 'minute'
    const ex = 'min'
    return {
      label: 'Minutes',
      type,
      options: [
        new TimeFormat('5', '%i', type, ex, group),
        new TimeFormat('05', '%I', type, ex, group)
      ]
    }
  })(),
  /** --------- Second format ---------- */
  second: (() => {
    const group = 'Second'
    const type = 'second'
    const ex = 's'
    return {
      label: group,
      type,
      options: [
        new TimeFormat('5', '%s', type, ex, group),
        new TimeFormat('05', '%S', type, ex, group)
      ]
    }
  })(),
  /** --------- Timezone format ---------- */
  timezone: (() => {
    const group = 'Timezone'
    const type = 'timezone'
    const ex = 'tz'
    return {
      label: group,
      type,
      options: [
        new TimeFormat('+1000', '%z', type, ex, group),
        new TimeFormat('PDT', '%Z', type, ex, group)
      ]
    }
  })()
}
