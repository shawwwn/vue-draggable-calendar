/*!
 * demo.js
 * Shawwwn (shawwwn1@gmail.com)
 */

document.addEventListener('DOMContentLoaded', (event) => setTimeout(() => {

	let app = document.querySelector('#calender').__vue__;

	// time
	document.querySelector('#p1 > span')
		.innerText = app.today;

	// button click
	document.getElementById('btn1')
		.addEventListener('click', function(evt) {
			var data = app.matrix2span(app.mat, true);
			if (!data) { return; }
			console.log(data);

			var txt = [];
			Object.keys(data).forEach(function(date, i) {
				txt.push(date + ": " + JSON.stringify(data[date]));
			});

			txt = txt.join("\n");
			alert(txt);
		});
	document.getElementById('btn2')
		.addEventListener('click', function(evt) {
			app.resetMatrix(app.mat, false);
			app.saveData();
			app.$forceUpdate();
			var data = app.matrix2span(app.mat);
			console.log(data);
		});
	document.getElementById('btn3')
		.addEventListener('click', function(evt) {
			var date = prompt("Enter the date you wish to navigate to:", moment().format('YYYY-MM-DD'));
			if (date) {
				app.navigateToDate(moment(date));
			}
		});
	document.getElementById('btn4')
		.addEventListener('click', function(evt) {
			console.log(app.data)
		});
	// document.getElementById('btn5')
	// 	.addEventListener('click', function(evt) {
	// 		app.saveData()
	// 	});
	// document.getElementById('btn6')
	// 	.addEventListener('click', function(evt) {
	// 		app.loadData()
	// 	});


	// checkbox
	document.getElementById('cb1')
		.addEventListener('change', function(evt) {
			var cb = evt.target;
			app.display_half_hour_labels = cb.checked;
		});
}, 100));
