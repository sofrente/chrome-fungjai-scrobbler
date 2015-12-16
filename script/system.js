/***
 * Basic definitions
 */

var scrobbler = {

	key: 'c312b7e4ea0b9e79f3066401fedb972c',
	secret: 'd5e83575f666ac06111bf71e92fda7ad',

	_cachedTemplates: [],

	renderTemplate: function(template, callback, data) {
		var self = this;

		var aggregateCallback = function(rendered) {
			if (typeof callback === 'function') {
				callback(rendered);
			}
			if (typeof callback === 'string') {
				$(callback).html(rendered);
			}
		};

		if (!self._cachedTemplates[template]) {
			$.get(chrome.extension.getURL('template/' + template + '.mst'), function(content) {
				self._cachedTemplates[template] = content;
				aggregateCallback(Mustache.render(content, data));
			});
		} else {
			aggregateCallback(Mustache.render(self._cachedTemplates[template], data));
		}
	},

	askLastFm: function(data, callback) {
		data.api_key = scrobbler.key;
		data.api_sig = scrobbler.getLastFmApiSignature(data);

		$.ajax({
			url: '//ws.audioscrobbler.com/2.0/',
			dataType: "xml",
			method: "POST",
			data: data,
			success: callback,
			error: function(data) {

				// Last.fm said we should authenticate extension again
				if ($(data.responseXML).find('error').attr('code') === "9") {
					localStorage.removeItem('scrobbler-key');
					localStorage.removeItem('scrobbler-name');
				}

			}
		});
	},

	getLastFmApiSignature: function(data) {
		var keys = Object.keys(data).sort();
		var nameValueString = keys.reduce(function(prev, key) {
			return prev + key + data[key];
		}, '');
		return md5(nameValueString + scrobbler.secret);
	},

	getSearchParameters: function() {
		var paramsString = window.location.search.substr(1);
		return paramsString != null && paramsString != "" ? this.transformToAssocArray(paramsString) : {};
	},

	transformToAssocArray: function(paramsString) {
		var params = {};
		var paramsArray = paramsString.split("&");
		for (var i = 0; i < paramsArray.length; i++) {
			var tmpArray = paramsArray[i].split("=");
			params[tmpArray[0]] = tmpArray[1];
		}
		return params;
	},

	checkSimilarity: function (a, b) {
		var equivalency = 0,
			minLength = (a.length > b.length) ? b.length : a.length,
			maxLength = (a.length < b.length) ? b.length : a.length;

		for (var i = 0; i < minLength; i++) {
			if (a[i] == b[i]) {
				equivalency++;
			}
		}

		return equivalency / maxLength
	}

};
