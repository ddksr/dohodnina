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
		cleanJSON = function (json) {
			var cleaned = _.isArray(json) ? [] : {};
			_.each(json, function (val, key) {
				if (_.isObject(val)) {
					cleaned[key] = cleanJSON(val);
				} else if(val === "inf") {
					cleaned[key] = Infinity;
				} else if(val === "-inf") {
					cleaned[key] = -Infinity;
				} else {
					cleaned[key] = val;
				}
			});
			return cleaned;
		},
		getValue = function (value, condition) {
			var out = [],
				i = 0;
			if (!_.isArray(value) || condition === undefined) { return value; }
			for (i = 0; i < value.length; i++) {
				out.push(value[i]);
				if (condition < value[i].cond) {
					return out;
				}
			}
			return [];
		},
		loadLestvice = function (data) {
			lestvice = cleanJSON(data);
			tryInit();
		},
		loadOlajsave = function (data) {
			olajsave = cleanJSON(data);
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
			if ($('#nic-zgodovine:checked').length) { return; }
			localStorage['state'] = JSON.stringify(data);
		},
		getFloat = function (flt) {
			flt = flt + "";
			flt = flt.replace(/\./g, '');
			flt = flt.replace(/,/g, '.');
			flt = flt.replace(/ |€/g, '');
			return parseFloat(flt);
		},
		calcDohodnina = function (totalStr, outStr) {
			var output = [],
				hasExp = !!$('.studentskoDelo:checked').length,
				total = totalStr && getFloat(totalStr) || 0,
				out = outStr && getFloat(outStr) || 0,
				exp = hasExp ? lestvice.normiraniStroski * total : 0,
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
				'Osnova dohodkov', total
			]);
			output.push([
				'Normirani stroški', hasExp ? exp : 'Odšteto v dohodkih',
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
			output.push(['NETO osnova za obdavčitev', tax]);
			razredi = getValue(lestvice.razredi, tax);
			tax = (function (taxIn) {
				var taxOut = 0,
					condPrev = 0;
				_.each(razredi, function (elt) {
					var value = taxIn >= elt.cond ? ((elt.cond-condPrev) * elt.then) : ((taxIn - condPrev) * elt.then);
					condPrev = elt.cond;
					
					output.push([
						'Obračunana dohodnina po ' + parseInt(elt.then * 100) + '%',
						value
					]);
					taxOut += value;
					if (taxIn < 0) { taxIn = 0; }
				});
				return taxOut;
			}(tax));

			output.push([
				'Obveznost za dohodnino', tax, 'end'
			]);
			output.push([
				'Plačane akontacije dohodnine', out, 'end'
			]);

			tax = tax - out;
			
			output.push([
				'DOHODNINA ' + (tax < 0 ? '(za vračilo)' : '(doplačilo)'),
				Math.abs(tax),
				'end last'
			]);
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
			return isNaN(+val) ? val : numeral(val).format('0,0.00 $');
		},
		init = _.once(function () {
			var storage = loadLocalStorage();
			if (storage && storage.olajsaveUser) {
				olajsaveUser = storage.olajsaveUser;
			}
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

				$('#letni-zasluzek').val(eur(storage.total));
				$('#akontacija-dohodnine').val(eur(storage.out));
				_.each(storage.olajsavePickedList, function (picked) {
					$('.olajsava-' + picked).attr('checked', true);
					$('.olajsava-' + picked).prop('checked', true);
				});

				displayDohodnina(calcDohodnina(storage.total, storage.out));
			}
		}),
		tryInit = function () {
			if (olajsave && lestvice) { init(); }
		};

	$.getJSON('data/lestvice.json', loadLestvice).error(function (a, b, c) {
		console.log([a, b, c])
	});
	$.getJSON('data/olajsave.json', loadOlajsave).error(function (a, b, c) {
		console.log([a, b, c])
	});

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
		$('#dodaj-olajsavo-open').fadeOut(function () {
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
			value: eur(newOlajsava.value),
			id: id
		}));
	});
	$('.izracun').on('click', function () {
		var value = $('.izracun:checked').val(),
			additional = null;
		if (value == 'studentskoDelo') {
			additional = $('.studentskoDelo:checked').val();
			if (additional) {
				value += additional;
			}
		}
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
	if (window.localStorage !== undefined && window.localStorage !== null) {
		$('#pobrisi-zgodovino').on('click', function () {
			localStorage.clear();
			window.location.reload();
		});
	} else {
		$('#pobrisi-zgodovino').hide();
	}

	tryInit();
}(jQuery, _));


