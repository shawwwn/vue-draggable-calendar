// utils.js

var util_funcs = {
	methods: {
		isSlotAvailable: function(dom) {
			return dom.classList.contains('ds-avail');
		},

		// counting from top-left corner
		getCoords: function(slot_dom) {
			let x = slot_dom.cellIndex - 1;
			let y = slot_dom.parentElement.rowIndex - 1;
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

		// generate matrix from span data (for current week)
		span2matrix(data) {
			if (!this.cur_week) { return; } // exit if not initialized
			var self = this;
			var mat = self.create2DMatrix(self.x_dim, self.y_dim, false);
			
			self.cur_week.forEach(function(m, mi) {
				let key = m.format('YYYY-MM-DD');
				if (data[key]) {
					data[key].forEach(function(span, si) {
						let idx_pair = self.parseSpan(span); // [starti, stopi]
						if (idx_pair) {
							mat[mi].fill(true, idx_pair[0], idx_pair[1]);
						}
					});
				}
			});

			return mat;
		},

		// generate matrix coordinates[start(x,y), end(x,y)] 
		// from span data (for current week)
		span2coords(spans) {
			if (!this.cur_week) { return; } // exit if not initialized
			var self = this;
			var coords = [];

			self.cur_week.forEach(function(m, x) {
				let key = m.format('YYYY-MM-DD');
				if (spans[key]) {
					spans[key].forEach(function(span, si) {
						let ys = self.parseSpan(span); // [starti, stopi]
						coords.push({
							start: [x, ys[0]],
							end: [x, ys[1]-1],
						});
					}); // end of spans[key].forEach()
				}
			}); // end of cur_week.forEach()

			return coords;
		},

		// text of time span to matrix index
		parseSpan(span) {
			var time_pair = span.split(' - ');
			var idx_pair = time_pair.map(this.time2index);
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
		},

		// time text to matrix index
		time2index(time) {
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
		},

	}
}

export default util_funcs;
