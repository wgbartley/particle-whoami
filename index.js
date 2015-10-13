// Require required stuff
var udp   = require('dgram').createSocket('udp4'),
    spark = require('spark');


// Require variables
var ACCESS_TOKEN = (process.env.ACCESS_TOKEN ? process.env.ACCESS_TOKEN : '').trim();
var EVENT_SCOPE = (process.env.EVENT_SCOPE ? false : 'mine');

// Optional variables
// The event to listen for
var EVENT_SUBSCRIBE = (process.env.EVENT_SUBSCRIBE ? process.env.EVENT_SUBSCRIBE : 'whoami');
// The event to respond from
var EVENT_PUBLISH = (process.env.EVENT_PUBLISH ? process.env.EVENT_PUBLISH : 'youare');
// Interval (in seconds) to refresh the device list
var DEVICE_REFRESH = (process.env.DEVICE_REFRESH ? process.env.DEVICE_REFRESH : 10*60)*1000;

// I said it was required!
if(ACCESS_TOKEN.length==0) {
	console.error('You MUST provide an access token');
	process.exit(1);
}


// Contains the list of devices (or it will, eventually)
var devices = {};

// A helper to make sure we don't just try and get devices while we're already trying to get devices
var getting_devices = false;


// Login to the cloud
spark.login({accessToken: ACCESS_TOKEN}, subscribe);


// Get the device list
function getDevices() {
	// Return early if we're already getting devices
	if(getting_devices)
		return;

	// Flag that we're getting devices
	getting_devices = true;
	_log('retrieving devices');

	// Make the call to get the device list
	spark.listDevices(function(err, data) {
		// Oh noes!
		if(err) {
			console.error('ERROR', err);
			return;
		}

		// Reset the device list (and add "001" => "Computer" since it's kinda reserved for CLI publishes)
		devices = {'001': 'Computer'};

		// Loop through response data and store in an object
		for(var i in data)
			devices[data[i].id.toUpperCase().trim()] = data[i].name.trim();

		_log('retrieved '+Object.keys(devices).length+' devices', devices);

		// Let's do this again sometime!
		setTimeout(getDevices, DEVICE_REFRESH);

		// Unflag that we're getting devices
		getting_devices = false;
	});
}


// Subscription handler
function subscribe() {
	// If we haven't retrieved devices, wait 1 second and check again
	if(Object.keys(devices).length==0) {
		getDevices();
		setTimeout(subscribe, 1000);
		return;
	}

	_log('subscription started');

	// Subscribe
	var req = spark.getEventStream(EVENT_SUBSCRIBE, EVENT_SCOPE, function(data) {
		parse_data(data);
	});

	// Re-subscribe
	req.on('end', function() {
		_log('subscription ended');
		console.time('subscribe');

		// Re-subscribe in 1 second
		setTimeout(subscribe, 1000);
	});
}


// Parse the data
function parse_data(data) {
	// Let's make it all upper-case so as to be case insensitive
	var coreid = data.coreid.toUpperCase();

	// A default name
	var device_name = 'Unknown';

	_log('>>>', coreid);

	// Set the device_name if we have record of it
	if(devices[coreid]!=undefined)
		device_name = devices[coreid];
	
	// Publish a response!
	spark.publishEvent(EVENT_PUBLISH, device_name);
	_log('<<<', coreid, device_name);
}


// Semi-fancy logging with timestamps
function _log() {
	var d = new Date();

	// Year
	d_str = d.getFullYear();
	d_str += '-';

	// Month
	if(d.getMonth()+1<10) d_str += '0';
	d_str += (d.getMonth()+1);
	d_str += '-';

	// Day
	if(d.getDate()<10) d_str += '0';
	d_str += d.getDate();
	d_str += ' ';

	// Hour
	if(d.getHours()<10) d_str += '0';
	d_str += d.getHours();
	d_str += ':';

	// Minute
	if(d.getMinutes()<10) d_str += '0';
	d_str += d.getMinutes();
	d_str += ':';

	// Second
	if(d.getSeconds()<10) d_str += '0';
	d_str += d.getSeconds();
	d_str += '.';

	// Milliseconds
	d_str += d.getMilliseconds();


	if(arguments.length==1)
		var l = arguments[0];
	else {
		var l = [];
		for(var i=0; i<arguments.length; i++)
			l.push(arguments[i]);
	}
			

	console.log('['+d_str+']', l);
}
