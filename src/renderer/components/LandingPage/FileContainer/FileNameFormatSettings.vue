<template>
	<div class="modal-card">
		<header class="modal-card-head">
			<font-awesome-icon :icon="ICON_CLOCK" size="2x"/>
			<span class="pl-2">TIMESTAMP FORMAT</span>
		</header>
		<section class="modal-card-body">

			<!-- Custom file input picker -->
			<div class="d-flex w100 input-container">
				<div class="field is-grouped is-grouped-multiline" @click.stop="fieldClick($event)">
					<template v-for="(item, idx) in selectedItems">
						<div class="control" v-if="isFormatItem(item)" :key="'item-' + idx" :data-index="idx">
							<div class="tags has-addons">
								<a class="tag is-link tag-label">
									<span>{{ item.label }}</span>
									<span v-if="item.example">({{ item.example }})</span>
								</a>
								<a class="tag is-delete" @click="deleteSelectedFormatItem(item)"></a>
							</div>
						</div>
            <input
              :data-index="idx"
              @blur="customInputBlur($event, idx)"
              v-model="item.value"
              :key="'format-input-' + idx"
              v-else
              :size="item.value.length"
              class="custom-input"
              @keydown="customInputKeydown($event, idx)"
              />
					</template>
					<input
            :disabled="isAutoDetect"
						:size="lastInputText.length"
						@keydown="keydown($event)"
						type="text"
						v-model="lastInputText"
						ref="fieldInput"
						class="last-input" />
				</div>
			</div>
			
			<div class="columns is-multiline is-gapless">
				<div class="column is-half" v-for="(formatItem, index) in TIME_FORMAT" :key="'time-format-' + index" :data-type="formatItem.type">
					<div class="d-flex flex-row align-center">
						<table class="w100 time-format-table">
							<tr>
								<td class="label-col">
									<span>{{ formatItem.label }}</span>
								</td>
								<td class="col-options">
									<div class="d-flex flex-row">
										<button @click="formatItemClick(formatItem.type, option)" class="button is-light is-small option-btn" v-for="(option, optIdx) in formatItem.options" :key="'format-btn-' + formatItem.type + '-' + optIdx">
											<span>{{ option.label }}</span>
										</button>
									</div>
								</td>
							</tr>
						</table>
					</div>
				</div>
			</div>
		</section>
		<footer class="modal-card-foot">
			<button class="button" @click="closeModal()">Cancel</button>
			<button class="button is-success" @click="save()" :disabled="isEmpty">Apply</button>
		</footer>
	</div>
</template>

<script>
import * as far from '@fortawesome/free-regular-svg-icons'
const AUTO_DETECT = 'Auto-detect'
export default {
  props: {
    format: {
      type: String,
      default: ''
    }
  },
  data: () => ({
    selectedItems: [],
    lastInputText: ''
  }),
  mounted () {
    this.checkRestoreFormatToField()
  },
  methods: {
    async save () {
      const format = this.selectedFormat
      this.$emit('save', format)
    },
    closeModal () {
      console.log('closeModal')
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
      console.log('customInputBlur', e, idx)
    },
    formatItemClick (type, item) {
      if (item instanceof TimeFormat) {
        if (item.format === AUTO_DETECT) {
          this.selectedItems = [item]
          this.lastInputText = ''
        } else {
          if (this.isAutoDetect) {
            return
          }
          // check format type is already selected
          const isSelected = this.selectedItems.findIndex(si => (si instanceof TimeFormat && si.type === item.type)) > -1
          if (!isSelected) {
            if (this.selectedItems.length > 0) {
              if (this.lastInputText !== '') {
                this.selectedItems.push(new CustomInputFormat(this.lastInputText))
                this.lastInputText = ''
              } else {
                this.selectedItems.push(new CustomInputFormat(''))
              }
            }
            this.selectedItems.push(item)
          }
        }
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
      if (format === AUTO_DETECT) {
        // Select auto detect item
        this.selectedItems = [TIME_FORMAT.auto_detect.options[0]]
      } else {
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
    }
  },
  computed: {
    ICON_CLOCK: () => far.faClock,
    TIME_FORMAT: () => TIME_FORMAT,
    isEmpty () {
      return this.lastInputText.trim() === '' && this.selectedItems.length === 0
    },
    isAutoDetect () {
      return this.selectedItems.some(si => (si instanceof TimeFormat) && si.format === AUTO_DETECT)
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
  }
}

class TimeFormat {
  format = ''
  label = ''
  type = ''
  example = ''

  constructor (label, format, type, ex) {
    this.label = label
    this.format = format
    this.type = type
    this.example = ex
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
  /** --------- 12 Hours format ---------- */
  // hours12: (() => {
  //   const type = 'hours12'
  //   const ex = 'H12'
  //   return {
  //     label: '12 Hour',
  //     type,
  //     options: [
  //       new TimeFormat('6', 'h', type, ex),
  //       new TimeFormat('06', 'hh', type, ex),
  //       new TimeFormat('AM/PM', 'A', type, ''),
  //       new TimeFormat('A/P', 'A', type, ''),
  //       new TimeFormat('am/pm', 'a', type, '')
  //     ]
  //   }
  // })(),
  /** --------- 24 Hours format ---------- */
  hours24: (() => {
    const type = 'hours24'
    const ex = 'H'
    return {
      label: 'Hour',
      type,
      options: [
        new TimeFormat('06', '%H', type, ex)
        // new TimeFormat('06', 'HH', type, ex)
      ]
    }
  })(),

  /** --------- Minute format ---------- */
  minute: (() => {
    const type = 'minute'
    const ex = 'min'
    return {
      label: 'Minutes',
      type,
      options: [
        new TimeFormat('5', '%m', type, ex)
        // new TimeFormat('05', 'mm', type, ex)
      ]
    }
  })(),

  /** --------- Second format ---------- */
  second: (() => {
    const type = 'second'
    const ex = 's'
    return {
      label: 'Seconds',
      type,
      options: [
        new TimeFormat('05', '%s', type, ex)
      ]
    }
  })(),

  /** --------- Day number format ---------- */
  day_number: (() => {
    const type = 'day_number'
    const ex = 'D'
    return {
      label: 'Day',
      type,
      options: [
        new TimeFormat('9', '%D', type, ex)
        // new TimeFormat('29', 'DD', type, ex),
        // new TimeFormat('nd', 'Do', type, ex),
        // new TimeFormat('ND', 'Do', type, ex)
      ]
    }
  })(),

  /** --------- Day Name format ---------- */
  // day_name: (() => {
  //   const type = 'day_name'
  //   const ex = 'Day'
  //   return {
  //     label: 'Day Name',
  //     type,
  //     options: [
  //       new TimeFormat('Fri', 'ddd', type, ex),
  //       new TimeFormat('Friday', 'dddd', type, ex),
  //       new TimeFormat('F', 'd', type, ex),
  //       new TimeFormat('U', 'd', type, ex)
  //     ]
  //   }
  // })(),

  /** --------- Month format ---------- */
  month: (() => {
    const type = 'month'
    const ex = 'M'
    return {
      label: 'Month',
      type,
      options: [
        // new TimeFormat('6', 'M', type, ex),
        // new TimeFormat('06', 'MM', type, ex),
        // new TimeFormat('J', 'M', type, ex),
        // new TimeFormat('Jun', 'MMM', type, ex),
        // new TimeFormat('June', 'MMMM', type, ex)
        new TimeFormat('06', '%M', type, ex)
      ]
    }
  })(),

  /** --------- Year format ---------- */
  year: (() => {
    const type = 'year'
    const ex = 'Y'
    return {
      label: 'Year',
      type,
      options: [
        new TimeFormat('20', '%y', type, ex),
        new TimeFormat('2020', '%Y', type, ex)
      ]
    }
  })(),

  /** --------- Year format ---------- */
  auto_detect: (() => {
    const type = 'auto_detect'
    return {
      label: 'Auto detect',
      type,
      options: [
        new TimeFormat('Auto detect', AUTO_DETECT, type, '')
      ]
    }
  })()

  /** --------- Timezone format ---------- */
  // timezone: (() => {
  //   const type = 'timezone'
  //   const ex = 'tz'
  //   return {
  //     label: 'Timezone',
  //     type,
  //     options: [
  //       new TimeFormat('+1000', '+1000', type, ex),
  //       new TimeFormat('PDT', 'PDT', type, ex),
  //       new TimeFormat('Pacific Time', 'Pacific Time', type, ex)
  //     ]
  //   }
  // })(),

  // /** --------- Fuzzy clock format ---------- */
  // fuzzy_clock: (() => {
  //   const type = 'fuzzy_clock'
  //   const ex = ''
  //   return {
  //     label: 'Fuzzy Clock',
  //     type,
  //     options: [
  //       new TimeFormat('quarter of five', 'fuzzy_clock', type, ex)
  //     ]
  //   }
  // })(),

  // /** --------- Week/Day format ---------- */
  // week_day_of_year: (() => {
  //   const type = 'week_day_of_year'
  //   const ex = 'W'
  //   return {
  //     label: 'Week/Day of year',
  //     type,
  //     options: [
  //       new TimeFormat('52', 'W', type, ex),
  //       new TimeFormat('365', 'W', type, ex)
  //     ]
  //   }
  // })(),

  // /** --------- System time offset format ---------- */
  // system_time_offset: (() => {
  //   const type = 'system_time_offset'
  //   const ex = ''
  //   return {
  //     label: 'System time offset',
  //     type,
  //     options: [
  //       new TimeFormat('+6', AUTO_DETECT, type, ex)
  //     ]
  //   }
  // })()
}
</script>
<style lang="scss" scoped>
.modal-card {
	width: 640px !important;
}
.pl-2 {
	padding-left: 12px;
}

.input-container {
	margin-bottom: 16px;
	$field-offset: 8px;
	.field {
		cursor: text;
        width: 100%;
        border-radius: 8px;
        border: 1px solid #b2bec3;
        min-height: 40px;
        position: relative;
        padding-left: $field-offset;
        padding-right: $field-offset;
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-bottom: 0 !important;
        padding-top: $field-offset;

        input {
          height: 24px;
          background: transparent !important;
          border: 0 !important;
          font-size: 16px;
          color: white;
          margin-bottom: $field-offset;
          min-width: 10px;

          &.custom-input {
            text-align: center;
          }
          &:focus {
              border: 0 !important;
              outline: unset !important;
          }

          &[size="0"] {
            width: 10px !important;
          }

          &.last-input {
            margin-left: 8px;
          }
    }

    .input-text {
      display: flex;
      align-items: center;
      padding-right: 8px;
      font-size: 16px;
      height: 24px;
      margin-bottom: $field-offset;
		}
		
		$tag-size: 24px;
		.control {
			margin-bottom: $field-offset !important;
      height: $tag-size;
      margin-right: 0 !important;
			.tags {
				a {
					margin-bottom: 0 !important;
					height: $tag-size;
					text-decoration: unset !important;

					&.tag-label {
						background: white;
						color: black;
					}
				}
			}
		}
		
    }
}

table.time-format-table {
	tr {
		td {
			border: 0 !important;
			&.label-col {
				text-align: right;
				width: 140px;
			}

			&.col-options {
				button.option-btn {
					&:not(:first-child) {
						margin-left: 8px;
					}
				}
			}
		}
	}
}

.modal-card-foot {
	padding-top: 24px !important;
	button {
		min-width: 110px;
	}
}

.modal-card-head {
	padding-bottom: 8px !important;
}
</style>