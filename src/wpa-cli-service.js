var exec = require('child_process').exec;
var self;

function WpaCliService (path) {
	self = this;
	this._path = path ? path : 'wpa_cli';
}

//Private methods

function parseStatus (text) {
	var content = text.split("\n");

	var current = {};

	var connected = content[1].match(/bssid=(.*)/);
	if (!connected) return null;

	current.bssid = content[1].match(/bssid=(.*)/)[1];
	current.ssid = content[3].match(/ssid=(.*)/)[1];

	return current;
}

//Public methods

WpaCliService.prototype.reconfigure = function (callback) {
	var command = this._path + ' reconfigure';
	exec(command, (error, stdout, stderr) => {
		if (stdout.includes("FAIL")) {
			callback(stdout);
		} else {
			callback();
		}
	});
}

WpaCliService.prototype.disconnect = function (callback) {
	var command = this._path + ' disconnect';
	exec(command, (error, stdout, stderr) => {
		if (stdout.includes("FAIL")) {
			callback(stdout);
		} else {
			callback();
		}
	});
}

WpaCliService.prototype.reconnect = function (callback) {
	var command = this._path + ' reconnect';
	exec(command, (error, stdout, stderr) => {
		if (stdout.includes("FAIL")) {
			callback(stdout);
		} else {
			callback();
		}
	});
}

WpaCliService.prototype.selectNetwork = function (id, callback) {
	var command = this._path + ' select_network ' + id;
	exec(command, (error, stdout, stderr) => {
		if (stdout.includes("FAIL")) {
			callback(stdout);
		} else {
			callback();
		}
	});
}

WpaCliService.prototype.status = function (callback) {
	var command = this._path + ' status';
	exec(command, (error, stdout, stderr) => {
		if (stdout.includes("FAIL")) {
			callback(stdout);
		} else {
			var current = parseStatus (stdout);
			callback(null, current);
		}
	});
}

module.exports = WpaCliService;
