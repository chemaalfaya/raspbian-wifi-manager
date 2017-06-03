var fs = require('fs');
var self;

function WpaSupplicantService (path) {
	self = this;
	this._path = path ? path : '/etc/wpa_supplicant/wpa_supplicant.conf';
	this._conf = [];
	this._networks = [];
}

//Private methods

function parseFile (callback) {
	self._conf = [];
	self._networks = [];
	var currentNetwork;
	var insideNetwork = false;

	var lineReader = require('readline').createInterface({
		input: fs.createReadStream(self._path)
	});

	lineReader.on('line', function (line) {
		if (!insideNetwork) {
			if (line.includes('network={')) {
				currentNetwork = {
					ssid: null,
					attrib: []
				};
				insideNetwork = true;
			} else {
				if (line != "") 
					self._conf.push(line);
			}
		} else {
			if (line.includes('}')) { //TODO: do it with regexpr
				self._networks.push(currentNetwork);
				insideNetwork = false;
			} else {
				var networkLine = parseNetworkLine(line);
				if (networkLine.ssid) currentNetwork.ssid = networkLine.ssid;
				currentNetwork.attrib.push({ key: networkLine.key, value: networkLine.value });
			}
		}
	});

	lineReader.on('close', function () {
		callback();
	});
};

function parseNetworkLine (line) {
	var key = line.substring(0, line.indexOf("="));
	key = key.replace(/^[\s|\t]+/, "").replace(/\s+$/, "");

	var value = line.substring(line.indexOf("=") + 1);
	value = value.replace(/^[\s|\t]+/, "").replace(/\s+$/, "");

	var ssid = (key == "ssid") ? value : null;

	return { key: key, value: value, ssid: ssid};
}

function quoteValue (value) {
	if (!(value.substring(0,1) == '"') && !(value.substring(value.length - 1) == '"'))
		value = '"' + value + '"';

	return value;
}

//Public methods

WpaSupplicantService.prototype.init = function (callback) {
	parseFile(callback);
}

WpaSupplicantService.prototype.getConf = function () {
	return this._conf;
}

WpaSupplicantService.prototype.setConf = function (conf) {
	this._conf = conf;
}

WpaSupplicantService.prototype.getNetworks = function () {
	return this._networks;
}

WpaSupplicantService.prototype.setNetworks = function (networks) {
	this._networks = networks;
}

WpaSupplicantService.prototype.getNetworkIndex = function (ssid, bssid) {
	ssid = quoteValue(ssid);
	for (var i = 0; i < self._networks.length; i++) {
		if (self._networks[i].ssid == ssid) {
			if (!bssid) return i;
			for (var j = 0; j < self._networks[i].attrib.length; j++) {
				if (self._networks[i].attrib[j].key == "bssid" && self._networks[i].attrib[j].value == bssid) return i;
			}
			
		}
	}

	return -1;
}

WpaSupplicantService.prototype.getNetwork = function (ssid, bssid) {
	ssid = quoteValue(ssid);
	var index = this.getNetworkIndex(ssid, bssid);
	if (index != -1) { 
		return this._networks[index];
	} else {
		return null;
	}
}

WpaSupplicantService.prototype.addNetwork = function (ssid, attrib) {
	ssid = quoteValue(ssid);
	var bssid = null;
	for (var i = 0; i < attrib.length; i++) {
		if (attrib[i].key == "ssid" || attrib[i].key == "psk")
		attrib[i].value = quoteValue(attrib[i].value);
		if (attrib[i].key == "bssid")
			bssid = attrib[i].value;
	}

	var network = {
		ssid: ssid,
		attrib: attrib
	};


	var index = this.getNetworkIndex(ssid, bssid);

	if (index != -1) {
		this._networks[index] = network;
	} else {
		this._networks.push(network);
	}
}

WpaSupplicantService.prototype.persist = function (callback) {
	var content = "";

	for (var i = 0; i < this._conf.length; i++) {
		content += this._conf[i] + "\n";
	}

	content += "\n";

	for (var i = 0; i < this._networks.length; i++) {
		content += "network={\n";
		for (var j = 0; j < this._networks[i].attrib.length; j++) {
			content += "\t" + this._networks[i].attrib[j].key + "=" + this._networks[i].attrib[j].value + "\n";
		}
		content += "}\n";
	}

	fs.unlink(self._path, function (uErr) {
		if (uErr) {
			console.log("Error unlinking '" + self._path + "' file");
			console.log(uErr);
			callback(uErr);
		} else {
			fs.writeFile(self._path, content, function (wErr) {
				if (wErr) {
					console.log("Error writting '" + self._path + "' file");
					console.log(wErr);
					callback(wErr);
				} else {
					callback();
				}
			});
		}
	});
}

module.exports = WpaSupplicantService;
