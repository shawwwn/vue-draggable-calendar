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
			var spans = app.genTimeSpan(app.time_slot_mat);
			var txt = spans.join("\n");
			alert(txt);
		});
	document.getElementById('btn2')
		.addEventListener('click', function(evt) {
			var spans = app.genTimeSpan(app.time_slot_mat);
			console.log(spans);
		});
	document.getElementById('btn3')
		.addEventListener('click', function(evt) {
			app.navigateToDate();
		});

	// checkbox
	document.getElementById('cb1')
		.addEventListener('change', function(evt) {
			var cb = evt.target;
			app.display_half_hour_labels = cb.checked;
		});
});
