// calender.vue

<template>
<div id="calender">
	<div class='ds-control'>
		<table>
			<tr class='ds-nav'>
				<th class='ds-nav-btn' @click='navigateToDate(cur_week[0].subtract(7, "day"))'><<</th>
				<th class='ds-nav-info'>
					<p>{{ cur_week[0].format('L') + " - " + cur_week.slice(-1).pop().format('l') }}</p>
					<calender-dropdown :today="today"></calender-dropdown>
				</th>
				<th class='ds-nav-btn' @click='navigateToDate(cur_week[0].add(7, "day"))'>>></th>
			</tr>
		</table>
	</div>

	<div class="ds-calender">
		<table>
			<tr class='ds-row-header'>
				<th class='placeholder'></th>
				<th 
				scope='col' 
				v-for="(label, i) in day_labels" 
				:class="{ 'ds-today': cur_week && today.isSame(cur_week[i], 'day') }"
				:key="label" 
				:col-index="i">
					<span v-if="cur_week">{{ label + " " + cur_week[i].format('M/D') }}</span>
					<span v-else>{{ label }}</span>
				</th>
			</tr>

			<tr 
			v-for="(time, i) in time_labels" 
			:class="{ 'ds-minor': (time.indexOf(':') != -1) }" 
			:key="i" 
			:row-index="i">
				<td scope='row'>{{ (time.indexOf(':30')==-1 || display_half_hour_labels) ? time : "" }}</td>
				<td 
				class="ds-slot" 
				v-for="(slots, j) in mat" 
				:key="j" 
				:class="{ 'ds-avail':(mat_overlay[j][i]!=null) ? mat_overlay[j][i] : mat[j][i] }"></td>
			</tr>
		</table>
	</div>
</div> <!-- calendar -->
</template>

<style scoped>
#calender {
	margin: auto;
	width: 100%;
	height: 100%;
	min-width: 500px;
	box-sizing: border-box;
	display: flex;
	flex-direction: column;
}

.ds-calender {
	box-sizing: border-box;
	overflow: auto;
}

table {
	border-collapse: collapse;
	border-spacing: 0;
	width: 100%;
	border-color: #ddd;
	border-width: 1px;
	table-layout: fixed;
	box-sizing: border-box;
	height: 100%;
}

th {
	min-height: 20px;
	padding: 0;
	margin: 0;
	border: 1px solid #ddd;
	box-sizing: border-box;
	padding: 5px;
}

td {
	height: 20px;
	min-height: 20px;
	padding: 0;
	margin: 0;
	border-color: inherit;
	border-width: 1px;
	border-style: none solid;
	box-sizing: border-box;
}

tr [scope="row"], .placeholder {
	width: 50px;
	text-align: center;
	overflow: hidden;
}

tr {
	border: none;
	border-style: none solid none solid;
	border-color: inherit;
	border-width: 1px;
	box-sizing: border-box;
}

tr.ds-minor {
	border-width: 1px;
	border-style: dotted solid solid solid;
}

.ds-slot {
	user-select: none;
}

.ds-avail {
	background-color: green;
}

.ds-today {
	background-color: #fffacd87;
}

.ds-nav {
	margin: 0;
	padding: 0;

}

.ds-nav > th {
	padding: 0;
	font-weight: normal;
}

.ds-control {
	flex: 1 0;
}

.ds-nav-btn {
	width: 10%;
	user-select: none;
}

.ds-nav-btn:hover {
	background-color: #57a3f3;
	color: white;
}

.ds-nav-btn:active {
	background-color: #2b85e4;
	color: white;
}

.ds-nav-info {
	position: relative;
}

.ds-nav-info p {
	padding: 5px 0;
}
</style>

<script>
import util_funcs from './utils.js'
import dropdown from './calender-dropdown.vue'

export default {
	mixins: [util_funcs],

	components: {
		'calender-dropdown': dropdown,
	},

	data () {
		return {
			dragging: false, // is curently dragging
			set_avail: false, // current selection is to set slot available or not
			from_slot: null, // drag from slot
			to_slot: null, // drag to slot
			day_labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
			cur_week: null, // [moment(), moment(), ...x7]
			time_labels: [
				"12am", "1am", "2am", "3am", "4am", "5am",
				"6am", "7am", "8am", "9am", "10am", "11am",
				"12pm", "1pm", "2pm", "3pm", "4pm", "5pm",
				"6pm", "7pm", "8pm", "9pm", "10pm", "11pm"
			],
			half_hour_labels: true, // include half-hour labels in time_labels
			display_half_hour_labels: false, // show half-hour label name
			x_dim: null, // x dimension of the grid/matrix
			y_dim: null, // y dimension of the grid/matrix
			mat: null, // actual timeslot fulfillment grid
			mat_overlay: null, // section box over the grid
			today: moment(),
			data: {}, // date time spans
		}
	},

	methods: {
		// render current week from input date
		navigateToDate(date) {
			date = moment(date);
			var week = [];
			this.day_labels.forEach(function(label, i) {
				let wd = moment(label, 'ddd').weekday();
				week.push(moment(date).weekday(wd));
			}); 
			this.cur_week = week;

			// render view
			this.loadData();
		},

		// Convert current view to span data and then save it 
		// to caldendar's internal(cached) storage while push
		// to remote.
		saveData() {
			var self = this;
			var spans = self.matrix2span(self.mat);
			Object.entries(spans).forEach(function([key, val], i) {
				if (val!=null) {
					self.data[key] = val;
				} else if (val==null && self.data.hasOwnProperty(key)) {
					delete self.data[key]; // remove on null val
				}
			});

			this.$emit('push', spans);
		},

		// Load internal(cached) span data and render view
		// also fetch span data from server to decide whether view
		// needs to be updated.
		loadData() {
			var self = this;
			var cached = null;

			// filter current week data from internal(cached) data
			var spans_local = {};
			self.cur_week.forEach(function(m, mi) {
				let key = m.format('YYYY-MM-DD');
				if (self.data.hasOwnProperty(key)) {
					spans_local[key] = self.data[key];
				}
			});
			updateView(spans_local);

			// make parent fetch current week's data
			new Promise((resolve, reject) => {
				self.$emit('pull',
					self.cur_week[0], // from_date (moment obj)
					self.cur_week.slice(-1).pop(), // to_date (moment obj)
					resolve, reject);
			}).then(
				(spans_remote) => {
					updateView(spans_remote) &&
					self.saveData();
				},
				(reason) => {
					console.error(`Failed to fetch: ${reason}`)
				}
			);

			// compare and decide wether to update view
			function updateView(spans) {
				if (cached) {
					// compare & update
					var current = JSON.stringify(spans);
					if (cached != current) {
						cached = current;
						self.mat = self.span2matrix(spans);
						return true;
					} else {
						return false;
					}
				} else {
					// update
					cached = JSON.stringify(spans);
					self.mat = self.span2matrix(spans);
					return true;
				}
			}
		},

		// start dragging
		dragBegin: function(evt) {
			evt.stopPropagation();
			if ('which' in evt && evt.which != 1) { return; }
			this.dragging = true;
			this.set_avail = (this.isSlotAvailable(evt.target)) ? false : true;
			this.from_slot = evt.target;
			var [x, y] = this.getCoords(this.from_slot);
			this.mat[x][y] = this.set_avail;
			this.$forceUpdate();
			// console.log(`drag begin(${this.set_avail})`, this.from_slot, this.getCoords(this.from_slot));
		},

		// during dragging
		dragAt: function(evt) {
			evt.stopPropagation();
			if (this.dragging) {
				this.to_slot = evt.target;
				var rect = [
					this.getCoords(this.from_slot),
					this.getCoords(this.to_slot)
				];
				this.resetMatrix(this.mat_overlay, null);
				this.updateMatrix(this.mat_overlay, rect, this.set_avail) &&
				this.$forceUpdate();
				// console.log(`drag at(${this.set_avail})`, this.to_slot, this.getCoords(this.to_slot));
			}
		},

		// stop dragging
		dragEnd: function(evt) {
			evt.stopPropagation();
			if ('which' in evt && evt.which != 1) return;
			if (this.dragging) {
				this.dragging = false;
				this.to_slot = evt.target;
				this.mergeMatrices(this.mat, this.mat_overlay);
				this.resetMatrix(this.mat_overlay, null);
				this.$forceUpdate();
				this.saveData();
				// console.log(`drag end(${this.set_avail})`, this.to_slot, this.getCoords(this.to_slot));
			}
		},

		// mouse up outside of table
		dragOut: function(evt) {
			if ('which' in evt && evt.which != 1) return;
			if (this.dragging) {
				this.dragging = false;
				this.to_slot = null;
				this.mergeMatrices(this.mat, this.mat_overlay);
				this.resetMatrix(this.mat_overlay, null);
				this.$forceUpdate();
				this.saveData();
				// console.log(`drag out(${this.set_avail})`, this.to_slot);
			}
		}
	},

	created() {
		// generate half hour labels
		if (this.half_hour_labels) {
			var re = /(\d+)(am|pm)/;
			this.time_labels = this.time_labels.reduce((accu, curv, curi) => {
				return accu.concat(curv, curv.replace(re, '$1:30$2'));
			}, []);
		}
		// console.log(this.time_labels);

		// generate time slot matrix (column major)
		this.x_dim = this.day_labels.length;
		this.y_dim = this.time_labels.length;
		this.mat = this.create2DMatrix(this.x_dim, this.y_dim, false);
		this.mat_overlay = this.create2DMatrix(this.x_dim, this.y_dim, null);

		this.navigateToDate(); // today

		// TODO: update time slot matrix from DB
	},

	mounted() {
		// register drag events
		var container = this.$el;
		var self = this;
		container.querySelectorAll('.ds-slot')
			.forEach(function(el) {
				el.addEventListener('mousedown', self.dragBegin);
				el.addEventListener('mouseup', self.dragEnd);
				el.addEventListener('mouseover', self.dragAt);
			});
		document.addEventListener('mouseup', self.dragOut);
	},

	beforeDestroy() {
		// un-register drag events
		var container = this.$el;
		var self = this;
		container.querySelectorAll('.ds-slot')
			.forEach(function(el) {
				el.removeEventListener('mousedown', self.dragBegin);
				el.removeEventListener('mouseup', self.dragEnd);
			});
		document.removeEventListener('mouseup', self.dragOut);
	}
}
</script>
