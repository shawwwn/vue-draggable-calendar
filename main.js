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

		// generate datetime spans from matrix
		genTimeSpan(mat) {
			var self = this;
			var spans = [];
			mat.forEach(function(col, coli) {
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
							spans.push(self.day_labels[coli]+", "+span);
							span = null;
						}
					}
				}

				// in case span didn't end
				if (span) {
					spans.push(self.day_labels[coli]+", "+span+" - 12am");
				}
			});

			return spans;
		}
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
		day_labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
		time_labels: [
			"12am", "1am", "2am", "3am", "4am", "5am",
			"6am", "7am", "8am", "9am", "10am", "11am",
			"12pm", "1pm", "2pm", "3pm", "4pm", "5pm",
			"6pm", "7pm", "8pm", "9pm", "10pm", "11pm"
		],
		half_hour_labels: true, // display half hour
		x_dim: null, // x dimension of the grid
		y_dim: null, // y dimension of the grid
		time_slot_mat: null, // actual timeslot fulfillment grid
		overlay_mat: null, // section box over the grid
	},

	methods: {
		// start dragging
		dragBegin: function(evt) {
			evt.stopPropagation();
			if ('which' in evt && evt.which != 1) return;
			this.dragging = true;
			this.set_avail = (this.isSlotAvailable(evt.target)) ? false : true;
			this.from_slot = evt.target;
			var [x, y] = this.getCoords(this.from_slot);
			this.overlay_mat[x][y] = this.set_avail;
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
				this.resetMatrix(this.overlay_mat, null);
				this.updateMatrix(this.overlay_mat, rect, this.set_avail) &&
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
				this.mergeMatrices(this.time_slot_mat, this.overlay_mat);
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
				this.mergeMatrices(this.time_slot_mat, this.overlay_mat);
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
		this.time_slot_mat = this.create2DMatrix(this.x_dim, this.y_dim, false);
		this.overlay_mat = this.create2DMatrix(this.x_dim, this.y_dim, null);

		// TODO: update time slot matrix from DB
		this.time_slot_mat[0][0]=true;
		this.time_slot_mat[2][3]=true;
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
