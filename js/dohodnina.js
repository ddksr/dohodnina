(function ($, _) {
	var olajsave = null,
		lestvice = null,
		olajsaveUser = {},
		olajsavaTemplate = '<li>'
			+ '<label class="pure-checkbox">'
			+ '<input class="olajsava olajsava-<%- id %>" type="checkbox" value="<%- id %>" />'
			+ ' <%- name %> (<%- value %>)'
			+ '</label>'
			+ '</li>',
		getValue = function (value, condition) {
			if (!_.isArray(value) || !condition) { return value; }
			return _.filter(value, function (elt) {
				return elt.cond < condition;
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
		loadLocalStorage = function () {
			var storage;
			if (! window.JSON || window.localStorage === undefined || window.localStorage === null) { return null; }
			storage = localStorage['state'];
			return storage && $.parseJSON(storage) || null;
		},
		saveLocalStorage = function (data) {
			if (! window.JSON || window.localStorage === undefined || window.localStorage === null) { return; }
			localStorage['state'] = JSON.stringify(data);
		},
		getFloat = function (flt) {
			flt = flt + "";
			flt.replace(/,/g, '.');
			flt.replace(/./g, '');
			return parseFloat(flt);
		},
		calcDohodnina = function (totalStr, outStr) {
			var output = [],
				total = totalStr && getFloat(totalStr) || 0,
				out = outStr && getFloat(outStr) || 0,
				exp = lestvice.normiraniStroski * total,
				norm = total - exp,
				tax = norm,
				olajsavePickedList = _.map($('.olajsava:checked'), function (elt) {
					return $(elt).val();
				}),
				olajsavePicked = (function (obj) {
					var newAry = {};
					_.each(olajsavePickedList, function (val) {
						if(obj[val]) { newAry[val] = obj[val]; }
					});
					return newAry;
				}($.extend(olajsave, olajsaveUser))),
				razredi = [];
			saveLocalStorage({
				total: total,
				out: out,
				olajsaveUser: olajsaveUser,
				olajsavePickedList: olajsavePickedList
			});
			output.push([
				'Zaslužek', total
			]);
			output.push([
				'Normirani stroški', exp
			]);
			_.each(olajsavePicked, function (specs, idOlajsave) {
				var value = getValue(specs.value, norm);
				if (_.isArray(value)) {
					value = _.last(value);
					value = value && value.then || 0;
				}
				output.push([
					specs.name, value
				]);
				tax -= value;
				
			});
			tax = tax > 0 ? tax : 0;
			output.push(['Davčna osnova za dohodnino', tax]);
			razredi = getValue(lestvice.razredi, tax);
			tax = (function (taxInt) {
				_.each(razredi, function (elt) {
					var value = taxInt >= elt.cond ? (elt.cond * elt.then) : (taxInt * elt.then);
					output.push([
						'Odmerjena dohodnina po ' + parseInt(elt.then * 100) + '%',
						value
					]);
					taxInt -= value;
					if (taxInt < 0) { taxInt = 0; }
				});
				return taxInt;
			}(tax));

			output.push([
				'SKUPAJ dohodnina', tax, 'end'
			]);
			output.push([
				'Akontacija dohodnine', out, 'end'
			]);

			tax = tax - out;
			
			output.push([
				'DOHODNINA ' + (tax < 0 ? '(vračilo)' : '(dolg)'),
				tax,
				'end last'
			]);
			console.log(output);
			return output;
		},
		displayDohodnina = function (output) {
			var table = $(document.createElement('table')).addClass('pure-table');
			$('#calculations').empty();
			_.each(output, function (row) {
				var tr = $(document.createElement('tr'));
				tr.append($(document.createElement('td')).append(row[0]));
				tr.append($(document.createElement('td')).append(eur(row[1])));
				if (row[2]) {
					_.each(row[2].split(' '), function () {
						tr.addClass(row[2]);
					});
				}
				table.append(tr);
			});
			$('#calculations').append(table);
		},
		eur = function (val) {
			return numeral(val).format('0,0.00 $');
		},
		init = _.once(function () {
			var storage = loadLocalStorage();
			
			_.each($.extend(olajsave, olajsaveUser), function (specs, id) {
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
			
			if (storage) {
				olajsaveUser = storage.olajsaveUser;

				$('#letni-zasluzek').val(storage.total);
				$('#akontacija-dohodnine').val(storage.out);
				_.each(storage.olajsavePickedList, function (picked) {
					console.log($('olajsava-' + picked).length)
					$('.olajsava-' + picked).attr('checked', true);
					$('.olajsava-' + picked).prop('checked', true);
				});
			}
		}),
		tryInit = function () {
			if (olajsave && lestvice) { init(); }
		};

	//$.getJSON('data/lestvice.json', loadLestvice);
	//$.getJSON('data/olajsave.json', loadOlajsave);

	numeral.language('sl', {
		delimiters: {
			thousands: '.',
			decimal: ','
		},
		abbreviations: {
			thousand: 'k',
			million: 'M',
			billion: 'G',
			trillion: 't'
		},
		currency: {
			symbol: '€'
		}
	});

	// switch between languages
	numeral.language('sl');
	
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
		var total = $('#letni-zasluzek').val(),
			out = $('#akontacija-dohodnine').val();
		displayDohodnina(calcDohodnina(total, out));
	});


	window['loadOlajsave'] = loadOlajsave;
	window['loadLestvice'] = loadLestvice;

	tryInit();
}(jQuery, _));
