<template>
  <div class="modal-card">
		<header class="modal-card-head">
			<font-awesome-icon :icon="ICON_CLOCK" size="2x"/>
			<h1 class="title">Custom Filename Format</h1>
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
            :disabled="isAutoDetect || isUnixHex"
						:size="lastInputText.length"
						@keydown="keydown($event)"
						type="text"
						v-model="lastInputText"
						ref="fieldInput"
						class="last-input" />
				</div>
        <span class="help is-warning" v-if="shouldShowErrorMessage">{{errorMessageForRequiredTimeFormatForCustomTimestamp}}</span>
			</div>

			<div class="columns is-multiline is-gapless">
				<div class="column is-half" v-for="(formatItem, index) in TIME_FORMAT" :key="'time-format-' + index" :data-type="formatItem.type">
					<div class="is-flex flex-row align-center">
						<table class="w100 time-format-table">
							<tr>
								<td class="label-col">
									<span>{{ formatItem.label }}</span>
								</td>
								<td class="col-options">
									<div class="is-flex flex-row">
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
			<button class="button is-rounded" @click="closeModal()">Cancel</button>
			<button class="button is-rounded is-success" @click="save()" :disabled="isEmpty">Apply</button>
		</footer>
	</div>
</template>
<script src="./FileNameFormatSettings.js"></script>
<style src="./FileNameFormatSettings.scss"></style>