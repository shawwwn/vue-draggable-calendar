// calender-overlay.vue

<template>
<div class="ds-overlay" ref='container_dom'>
	<div class="ds-patch"
	ref="patches"
	v-for="(rect, index) in coords"
	v-bind:style="genStyle(rect)"
	></div>
</div>
</template>

<style scoped>
h1 {
	position: absolute;
}

.ds-overlay {
	position: relative;
	pointer-events: none;
}

.ds-patch {
	position: absolute;
	background-color: #4682b4bf;
	border: 3px solid #2196f3;
	border-radius: 10px;
	box-sizing: border-box;
}

</style>

<script>
import util_funcs from './utils.js'

export default {
	mixins: [util_funcs],

	props: {
		cur_week: {
			type: Array,
			default: null,
		},
		color: {
			type: String,
			default: 'blue',
		},
	},

	watch: {
		cur_week: function(m) {
			this.loadOverlayData();
		}
	},

	created() {
		this.loadOverlayData();
	},

	data() {
		return {
			coords: [], // matrix coordinates of current overlay view
			spans: {}, // span data of all overlays
		}
	},

	methods: {
		log(evt) {
			// this.loadOverlayData();

			console.log('cur_week', this.cur_week);
			console.log('coords', this.coords);
			console.log('spans', this.spans);
		},

		genStyle(rect) {
			var table_dom = this.$parent.$refs.table;
			let start_dom = getTableCell(table_dom, rect.start[0], rect.start[1]);
			let end_dom = getTableCell(table_dom, rect.end[0], rect.end[1]);

			let x0 = start_dom.offsetLeft;
			let y0 = start_dom.offsetTop;
			let x1 = end_dom.offsetLeft + end_dom.offsetWidth;
			let y1 = end_dom.offsetTop + end_dom.offsetHeight;

			return {
				top: `${y0}px`,
				left: `${x0}px`,
				width: `${x1-x0}px`,
				height: `${y1-y0}px`,
				display: 'block',
			};

			function getTableCell(table, x, y) {
				return table.querySelector(`[row-index="${y-1}"] > [col-index="${x}"]`);
			}
		},

		// Load internal(cached) span data and render view
		// also fetch span data from server to decide whether view
		// needs to be updated.
		loadOverlayData() {
			var self = this;
			var cached = null;

			// filter current week data from internal(cached) data
			var spans_local = {};
			self.cur_week.forEach(function(m, mi) {
				let key = m.format('YYYY-MM-DD');
				if (self.spans.hasOwnProperty(key)) {
					spans_local[key] = self.spans[key];
				}
			});
			updateView(spans_local);

			// make parent fetch current week's data
			new Promise((resolve, reject) => {
				self.$emit('pull_overlay',
					self.cur_week[0].startOf('week'), // from_date (moment obj)
					self.cur_week.slice(-1).pop(), // to_date (moment obj)
					resolve, reject);
			}).then(
				(spans_remote) => {
					updateView(spans_remote) &&
					Object.assign(this.spans, spans_remote);
				},
				(reason) => {
					console.error(`Failed to fetch overlay: ${reason}`);
				}
			);

			// compare and decide wether to update view
			function updateView(spans) {
				if (cached) {
					// compare & update
					var current = JSON.stringify(spans);
					if (cached != current) {
						cached = current;
						self.coords = self.span2coords(spans);
						return true;
					} else {
						return false;
					}
				} else {
					// update
					cached = JSON.stringify(spans);
					self.coords = self.span2coords(spans);
					return true;
				}
			}
		},
	},
}
</script>
