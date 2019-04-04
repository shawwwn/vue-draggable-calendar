/*!
 * demo.js
 * Shawwwn (shawwwn1@gmail.com)
 */

document.addEventListener('DOMContentLoaded', function(event){
	// time
	document.querySelector('#p1 > span')
		.innerText = app.date;

	// button click
	document.getElementById('btn1')
		.addEventListener('click', function(evt) {
			var data = app.matrix2span(app.mat);
			if (!data) { return; }

			var txt = [];
			Object.keys(data).forEach(function(date, i) {
				txt.push(date + ": " + JSON.stringify(data[date]));
			});

			txt = txt.join("\n");
			alert(txt);
		});
	document.getElementById('btn2')
		.addEventListener('click', function(evt) {
			var data = app.matrix2span(app.mat);
			console.log(data);
		});
	document.getElementById('btn3')
		.addEventListener('click', function(evt) {
			var date = prompt("Enter the date you wish to navigate to:", moment().format('YYYY-MM-DD'));
			app.navigateToDate(moment(date));
		});

	// checkbox
	document.getElementById('cb1')
		.addEventListener('change', function(evt) {
			var cb = evt.target;
			app.display_half_hour_labels = cb.checked;
		});
});
