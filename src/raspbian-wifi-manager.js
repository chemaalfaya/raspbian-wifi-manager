var WpaCliService = require('./wpa-cli-service.js');
var IwlistService = require('./iwlist-service.js');
var WpaSupplicantService = require('./wpa-supplicant-service.js');
var self;

function RaspbianWifiManager () {
	self = this;
	wpacli = new WpaCliService();
	iwlist = new IwlistService();
	wpasup = new WpaSupplicantService();
	wpaSupplicantServiceInitiated = false;

	wpasup.init(() => {
		wpaSupplicantServiceInitiated = true;
	});
}

//Private methods

//Public methods

RaspbianWifiManager.prototype.status = function (callback) {
	wpacli.status(function(err, current) {
		if (err) {
			callback(err);
		} else {
			var response = {
				connected: (current ? true : false),
				network: current
			};
			callback(null, response);
		}
	});
}

RaspbianWifiManager.prototype.scan = function (callback, interface) {
	interface = interface ? interface : 'wlan0';

	iwlist.scan(function(err, networks) {
		callback(err, networks);
	}, interface);
}

RaspbianWifiManager.prototype.addWpaDhcpNetwork = function (ssid, password, callback, bssid) {
	if (!this.wpaSupplicantServiceInitiated) {
		setTimeout(self.addWpaDhcpNetwork.bind(null, ssid, password, callback, bssid), 1000);
	} else {
		var attrib = [
			{ key:'ssid' , value: ssid },
			{ key:'psk' , value: password }
		];

		if (bssid) attrib.push({ key: 'bssid', value: bssid });

		this.wpasup.addNetwork(ssid, attrib);

		this.wpasup.persist(function(err) {
			this.wpacli.reconfigure(function(err) {
				callback(err);
			});
		});
	}
}

RaspbianWifiManager.prototype.getKnownNetworks = function (callback) {
	if (!this.wpaSupplicantServiceInitiated) {
		setTimeout(self.getKnownNetworks.bind(null, callback), 1000);
	} else {
		callback(this.wpasup.getNetworks());
	}
}

RaspbianWifiManager.prototype.disconnect = function (callback) {
	wpacli.disconnect(function(err) {
		callback(err);
	});
}

RaspbianWifiManager.prototype.connect = function (ssid, callback, bssid) {
	if (!this.wpaSupplicantServiceInitiated) {
		setTimeout(self.connect.bind(null, ssid, callback, bssid), 1000);
	} else {
		var index = wpasup.getNetworkIndex(ssid, bssid);
		wpacli.selectNetwork(index, function(err) {
			callback(err);
		});
	}	
}

module.exports = RaspbianWifiManager;
