var exec = require('child_process').exec;
var self;

function IwlistService (path) {
	self = this;
	this._path = path ? path : 'iwlist';
}

//Private methods

function parseIwlist (text) {
	var content = text.split("\n");
	content.splice(0,1);

	var cellRegEx = /^[\s|\t]*Cell/;

	var networks = [];

	var cellContent = [];
	for (var i = 0; i < content.length; i++) {
		if (cellRegEx.test(content[i])) {
			var n = parseCell(cellContent);
			if (n) networks.push(n);
			cellContent = [];
			cellContent.push(content[i]);
		} else {
			cellContent.push(content[i]);
		}
	}
	var n = parseCell(cellContent);
	if (n) networks.push(n);

	return networks;
}

function parseCell (cellContent) {
	if (cellContent.length == 0) return null;

	var network = {};

	network.address = cellContent[0].match(/Address\:\s(.*)/)[1];
	network.channel = cellContent[1].match(/Channel\:(.*)/)[1];
	network.frequency = cellContent[2].match(/Frequency\:(.*)\s\(.*$/)[1];
	network.quality = cellContent[3].match(/Quality=(\d+).*$/)[1];
	network.max_quality = cellContent[3].match(/Quality=.*\/(\d+).*$/)[1];
	network.signal_level = cellContent[3].match(/Signal level=([-]*\d+).*$/)[1];
	network.encryption_key = cellContent[4].match(/Encryption key\:(.*)$/)[1];
	network.essid = cellContent[5].match(/ESSID\:(.*)$/)[1];

	return network;
}

//Public methods

IwlistService.prototype.scan = function (callback, interface) {
	interface = interface ? interface : 'wlan0';

	var command = this._path + ' ' + interface + ' scan';
	exec(command, (error, stdout, stderr) => {
		if (error) {
			callback(error);
		} else {
			var networks = parseIwlist (stdout);
			callback(null, networks);
		}
	});
}

module.exports = IwlistService;
