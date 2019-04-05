/*!
 * Main.js
 * Shawwwn (shawwwn1@gmail.com)
 */

/*
 * Class methods for the Vue instance
 */
var util_funcs = {
	methods: {
		isSlotAvailable: function(dom) {
			return dom.classList.contains('ds-avail');
		},

		// counting from top-left corner
		getCoords: function(slot_dom) {
			x = slot_dom.cellIndex - 1;
			y = slot_dom.parentElement.rowIndex - 1;
			return [x, y];
		},

		// generate time slot matrix (column major)
		create2DMatrix(x_dim, y_dim, val=false) {
			var mat = new Array(x_dim);
			for (var i=0; i<x_dim; i++) {
				mat[i] = new Array(y_dim).fill(val);
			}
			return mat;
		},

		// fill a rectangular area with the 2d @matrix with @val.
		updateMatrix(mat, rect, val) {
			var [[x0, y0], [x1, y1]] = rect;
			if (x1<x0) { x0 = [x1, x1=x0][0]; } // swap
			if (y1<y0) { y0 = [y1, y1=y0][0]; } // swap
			if (x0<0 || y0<0 || 
				x1>mat.length-1 || y1>mat[0].length-1) {
				return false; // out of bound coordinates
			}

			for (var i=x0; i<=x1; i++) {
				mat[i].fill(val, y0, y1+1);
			}
			return true;
		},

		// set all values in a matrix
		resetMatrix(mat, val) {
			mat.forEach((col) => col.fill(val));
		},

		// merge mat2 to mat1
		mergeMatrices(mat1, mat2) {
			mat1.forEach(function(col1, coli) {
				let col2 = mat2[coli];
				for (let rowi=0; rowi<col1.length; rowi++) {
					if (col2[rowi] != null) {
						col1[rowi] = col2[rowi];
					}
				}
			});
		},

		// generate span data from matrix of current week
		matrix2span(mat, drop_null=false) {
			if (!this.cur_week) { return; } // exit if not initialized
			var self = this;
			var data = {}; // key is day, value is array of time spans
			mat.forEach(function(col, coli) {
				let spans = [];
				let span = null;
				for (var rowi=0; rowi<col.length; rowi++) {
					if (col[rowi]) {
						if (!span) {
							// span starts at green
							span = self.time_labels[rowi]
						}
					} else {
						if (span) {
							// span ends at white
							span += " - "+self.time_labels[rowi];
							spans.push(span);
							span = null;
						}
					}
				}

				if (span) {
					// span to very last row
					spans.push(span+" - 12am");
				}

				let date = self.cur_week[coli].format('YYYY-MM-DD');
				if (spans.length > 0) {
					// day has time spans
					data[date] = spans;
				} else if (!drop_null) {
					data[date] = null;
				}
			});

			return data;
		},

		// generate matrix from span data (current week)
		span2matrix(data) {
			if (!this.cur_week) { return; } // exit if not initialized
			var self = this;
			var mat = self.create2DMatrix(self.x_dim, self.y_dim, val=false);
			
			self.cur_week.forEach(function(m, mi) {
				let key = m.format('YYYY-MM-DD');
				if (data[key]) {
					data[key].forEach(function(span, si) {
						let idx_pair = parseSpan(span); // [starti, stopi]
						if (idx_pair) {
							mat[mi].fill(true, idx_pair[0], idx_pair[1]);
						}
					});
				}
			});

			return mat;

			// text of time span to matrix index
			function parseSpan(span) {
				var time_pair = span.split(' - ');
				var idx_pair = time_pair.map(time2index);
				if (idx_pair[1] == 0) {
					idx_pair[1] = 48;
				}
				if ((typeof idx_pair[0] != 'number') ||
					(typeof idx_pair[1] != 'number') ||
					(idx_pair[0] > idx_pair[1]) || 
					(idx_pair[0] < 0) ||
					(idx_pair[1] > 48)) {
					return;
				}
				return idx_pair;

				// time text to matrix index
				function time2index(time) {
					var match = time.match(/(\d+)(?::(\d+))?(am|pm)/i);
					if (match) {
						let hr = parseInt(match[1])
						let min = parseInt((match[2] == undefined) ? 0 : match[2]);
						let ampm = match[3];
						if (hr == 12 && ampm == "am") { hr = 0; }
						let idx = (hr * 2)
								+ (min / 30 >> 0)
								+ ((ampm == "am") ? 0 : 24);
						return idx;
					}
					return;
				}
			}
		},
	}
}

var app = new Vue({
	el: '#calender',
	mixins: [util_funcs],

	data: {
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
		},

		// Convert current week's matrix data to span data and 
		// save them to caldendar's internal storage while sync 
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

			// push to server
			var xhr = new XMLHttpRequest();
			xhr.onload = function() {
				// one-way sync, we don't care about server's return
				console.log("pushed", JSON.parse(this.responseText));
			};
			xhr.open("PUT", "api/calendar");
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.send(JSON.stringify(spans));
		},

		// Load current week's span data and convert it into matrix data
		// also load from server and decide whether view needs to be updated.
		loadData() {
			var self = this;
			var cached = null;

			// filter current week data from internal data
			var spans_local = {};
			self.cur_week.forEach(function(m, mi) {
				let key = m.format('YYYY-MM-DD');
				if (self.data.hasOwnProperty(key)) {
					spans_local[key] = self.data[key];
				}
			});
			updateView(spans_local);

			// fetch current week data from server
			var from_date = self.cur_week[0].format('YYYY-MM-DD');
			var to_date = self.cur_week.slice(-1).pop().format('YYYY-MM-DD');
			var xhr = new XMLHttpRequest();
			xhr.onload = function() {
				if (this.status>=200 && this.status<=300) {
					var spans_remote = JSON.parse(this.responseText);
					console.log("fetched", spans_remote);
					updateView(spans_remote);
				}
			};
			xhr.open("GET", `api/calendar?from=${from_date}&to=${to_date}`);
			xhr.setRequestHeader('Content-Type', 'application/json');
			xhr.send();
			

			// compare and decide wether to update view
			function updateView(spans) {
				if (cached) {
					// compare & update
					var current = JSON.stringify(spans);
					if (cached != current) {
						cached = current;
						self.mat = self.span2matrix(spans);
					}
				} else {
					// update
					cached = JSON.stringify(spans);
					self.mat = self.span2matrix(spans);
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
				// console.log(`drag out(${this.set_avail})`, this.to_slot);
			}
		},
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
	},
})
