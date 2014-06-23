(function ($, _) {
	var dohodnina = {},
		lestvice = {};

	$.getJSON('data/lestvice.json', function (data) {
		lestvice = data;
	});
	$.getJSON('data/dohodnina.json', function (data) {
		dohodnina = data;
	});

	
}(jQuery, _));
