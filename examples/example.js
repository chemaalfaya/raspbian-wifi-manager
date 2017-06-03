var rwm = require('../index.js');


rwm.status(function(err, response) {
	if (!err) console.log(response);
});

rwm.scan(function(err, networks) {
	if (!err) console.log(networks);
});

rwm.addWpaDhcpNetwork("My ssid", "My password", function(err) {
	if (!err) console.log("Network added");
}, "00:00:00:00:00:00");

rwm.getKnownNetworks(function(networks) {
	console.log(networks);
});

rwm.disconnect(function(err) {
	if (!err) console.log("Disconnected from the network");
});

rwm.connect("My ssid", function(err) {
	if (!err) console.log("Connected to the network");
}, "00:00:00:00:00:00");
