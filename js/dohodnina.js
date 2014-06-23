(function ($, _) {
	var dohodnina = {},
		lestvice = {},
		getValue = function (value, condition) {
			if (!_.isArray(value) || !condition) { return value; }
			return _.filter(value, function (elt) { return elt.cond <= condition; });
		},
		calcDohodnina = function (total, out, types) {
			
		},
		displayDohodnina = function () {

		};

	$.getJSON('data/lestvice.json', function (data) {
		lestvice = data;
	});
	$.getJSON('data/olajsave.json', function (data) {
		dohodnina = data;
	});

	$('span#dodaj-olajsavo.box').hide();

	$('#dodaj-olajsavo-open').on('click', function () {
		$('span#dodaj-olajsavo-open').hide(function () {
			$('span#dodaj-olajsavo-box').fadeIn('slow');
		});
	});
	
	$('.izracun').on('click', function () {
		var value = $('.izracun:checked').val(),
			additional = null;
		if (value == 'studentsko-delo') {
			additional = $('.studentsko-delo:checked').val();
			if (additional) { additional = '-' + additional; }
		}
		value = value + (additional || '');
		_.each(lestvice.paketi[value], function (type) {
			$('.olajsava[value="' + type + '"]').attr('checked', true);
		});
		
	});
	$('#izracun-dohodnine').on('click', function () {
		var types = [],
			total = $('#letni-zasluzek').val() || 0,
			out = $('#akontacija-dohodnine').val() || 0;
		$('.olajsava:checked').each(function () {
			types.push($(this).val());
		});
		displayDohodnina(calcDohodnina(total, out, types));
	});
}(jQuery, _));
