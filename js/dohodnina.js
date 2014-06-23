(function ($, _) {
	var olajsave = null,
		lestvice = null,
		olajsaveUser = {},
		olajsavaTemplate = '<li>'
			+ '<label>'
			+ '<input class="olajsava olajsava-<%- id %>" type="checkbox" value="<%- id %>" />'
			+ ' <%- name %> (<%- value %>)'
			+ '</label>'
			+ '</li>',
		getValue = function (value, condition) {
			if (!_.isArray(value) || !condition) { return value; }
			return _.filter(value, function (elt) {
				return elt.cond <= condition;
			});
		},
		loadLestvice = function (data) {
			lestvice = data;
			tryInit();
		},
		loadOlajsave = function (data) {
			olajsave = data;
			tryInit();
		},
		calcDohodnina = function (total, out, types) {
			
		},
		displayDohodnina = function () {

		},
		eur = function (val) {
			return numeral(val).format('0,0.00') + ' €';
		},
		init = _.once(function () {
			_.each(olajsave, function (specs, id) {
				var value = '';
				if (_.isArray(specs.value)) {
					_.each(specs.value, function (elt) {
						if (value.length > 0) { value += ' ali '; }
						value += eur(elt.then);
					});
				}
				else {
					value = eur(specs.value);
				}
				$('.olajsave-control').before(_.template(olajsavaTemplate, {
					name: specs.name,
					value: value,
					id: id
				}));
			});
		}),
		tryInit = function () {
			if (olajsave && lestvice) { init(); }
		};

	//$.getJSON('data/lestvice.json', loadLestvice);
	//$.getJSON('data/olajsave.json', loadOlajsave);

	$('span#dodaj-olajsavo-box').hide();

	$('#dodaj-olajsavo-open').on('click', function () {
		$('#dodaj-olajsavo-open').hide(function () {
			$('span#dodaj-olajsavo-box').fadeIn('slow');
		});
	});
	$('#dodaj-olajsavo-commit').on('click', function () {
		var id = _.uniqueId('olajsava_'),
			newOlajsava = {
				name: $('#olajsava-name').val(),
				value: $('#olajsava-value').val()
			};
		if (!newOlajsava.name || !newOlajsava.value) {
			return;
		}
		olajsaveUser[id] = newOlajsava;
		$('.olajsave-control').before(_.template(olajsavaTemplate, {
			name: newOlajsava.name,
			value: numeral(newOlajsava.value).format('0,0.00'),
			id: id
		}));
	});
	$('.izracun').on('click', function () {
		var value = $('.izracun:checked').val(),
			additional = null;
		if (value == 'studentsko-delo') {
			additional = $('.studentsko-delo:checked').val();
			if (additional) { additional = '-' + additional; }
		}
		value = value + (additional || '');
		$('.olajsava').attr('checked', false);
		$('.olajsava').prop('checked', false);
		_.each(lestvice.paketi[value], function (type) {
			$('.olajsava-' + type).attr('checked', 'checked');
			$('.olajsava-' + type).prop('checked', 'checked');
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


	window['loadOlajsave'] = loadOlajsave;
	window['loadLestvice'] = loadLestvice;

	tryInit();
}(jQuery, _));
