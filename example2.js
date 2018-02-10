'use strict';

var Bitstamp = require('.');

var options = {
	events: false,
	refresh: 300, // Refresh time in seconds (Default: 60)
	convert: 'EUR' // Convert price to different currencies. (Default USD)
};
var bitstamp = new Bitstamp(options); 

/*
// Put event on BTC with no conditions. It will trigger every 60 seconds (*) with information about that coin (*: Or the defined time in options)
bitstamp.getTradingPairs( (tradingPairs) => {
	console.log(tradingPairs);
});

bitstamp.getPlatformStatus('xrpeur', (platformStatus) => {
	console.log(platformStatus);
});


bitstamp.getTicker('xrp', (ticker) => {
	console.log(ticker);
});
*/

bitstamp.getTopSymbols(2, (symbols) => {
	console.log(symbols);
});
