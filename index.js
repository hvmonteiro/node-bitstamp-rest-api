var request = require('request');

/*
*
* Do not make more than 600 requests per 10 minutes 
* or Bitstamp will ban your IP address. For real time data 
* please refer to the websocket API.
*
*/
class Bitstamp {

    constructor(options={}) {
        this.API_URL = options.API_URL || "https://www.bitstamp.net/api/v2";
        this.convert = options.convert || "USD";
        this.convert = this.convert.toLowerCase();
        this.events = options.events || false;
        if (this.events) {
            this.refresh = options.refresh*1000 || 60*1000;
            this.events = [];
            this._emitter();
            setInterval(this._emitter.bind(this), this.refresh);
        }
    }

    _getJSON(url, callback) {
        request(this.API_URL+url, (error, response, body) => {
            if (error) {
                callback(false);
                return this;
            }
            if (response && response.statusCode == 200) {
                var data;
                try {
                    data = JSON.parse(body);
                } catch (err) {
                    // Don't crash on unexpected JSON
                    data = false;
                }
                callback(data);
            } else {
                callback(false);
                return this;
            }
        });
    }

    _find(symbols, symbol) {
        return symbols.find(o => o.symbol === symbol.toLowerCase()) ||
            symbols.find(o => o.id === symbol.toLowerCase());
    }

    _emitter() {
        this._getJSON(`/ticker/`, (coins) => {
            if (!symbols) { return false; }

            this.events.filter(e => e.type == "multi").forEach(event => {
                if (symbols) {

                    var response = {};
                    response.data = symbols;
                    response.get = function(coin) { return symbols.find(o => o.symbol === symbols.toLowerCase()) || symbols.find(o => o.id === symbols.toLowerCase()); };
                    response.getTop = function(top) {return symbols.slice(0, top);};
                    response.getAll = function() { return symbols; };
                    event.callback(response, event);
                }
            });

            this.events.filter(e => e.type == "update").forEach(event => {
                var res = this._find(symbols, event.symbol);
                if (res) {
                    event.callback(res, event);
                }
            });

            this.events.filter(e => e.type == "greater").forEach(event => {
                var res = this._find(symbols, event.symbol);
                if (res) {
                    if (res["price_"+this.convert] >= event.price) {
                        event.callback(res, event);
                    }
                }
            });

            this.events.filter(e => e.type == "lesser").forEach(event => {
                var res = this._find(symbols, event.symbol);
                if (res) {
                    if (res["price_"+this.convert] <= event.price) {
                        event.callback(res, event);
                    }
                }
            });

            this.events.filter(e => e.type == "percent1h").forEach(event => {
                var res = this._find(symbols, event.symbol);
                if (res) {
                    if (event.percent < 0 && res.percent_change_1h <= event.percent ) {
                        event.callback(res, event);
                    } else if (event.percent > 0 && res.percent_change_1h >= event.percent) {
                        event.callback(res, event);
                    } else if (event.percent == 0 && res.percent_change_1h == 0) {
                        event.callback(res, event);
                    }
                }
            });

            this.events.filter(e => e.type == "percent24h").forEach(event => {
                var res = this._find(symbols, event.symbol);
                if (res) {
                    if (event.percent < 0 && res.percent_change_24h <= event.percent ) {
                        event.callback(res, event);
                    } else if (event.percent > 0 && res.percent_change_24h >= event.percent) {
                        event.callback(res, event);
                    } else if (event.percent == 0 && res.percent_change_24h == 0) {
                        event.callback(res, event);
                    }
                }
            });

            this.events.filter(e => e.type == "percent7d").forEach(event => {
                var res = this._find(symbols, event.symbol);
                if (res) {
                    if (event.percent < 0 && res.percent_change_7d <= event.percent ) {
                        event.callback(res, event);
                    } else if (event.percent > 0 && res.percent_change_7d >= event.percent) {
                        event.callback(res, event);
                    } else if (event.percent == 0 && res.percent_change_7d == 0) {
                        event.callback(res, event);
                    }
                }
            });
        });
    }



    /*
     * Function: getPlatformStatus(callback, tradingPair)
     *
     * Description: Get the current status of each trading engine
     *
     * params: callback, [tradingPair]
     *
     * GET: https://www.bitstamp.net/api/v2/trading-pairs-info/
     *
     * Response: 200 OK     - list of trading pairs. Every trading pair dictionary contains:
     *       [JSON]
     *
     * name                 Trading pair.
     * url_symbol           URL symbol of trading pair.
     * base_decimals        Decimal precision for base currency (BTC/USD - base: BTC).
     * counter_decimals     Decimal precision for counter currency (BTC/USD - counter: USD).
     * minimum_order        Minimum order size.
     * trading              Trading engine status (Enabled/Disabled).
     * description          Trading pair description.
     *
     * Response: 400 Bad Request
     *
     */
    getPlatformStatus(tradingPair, callback) { // WORK DONE
        if (callback) {
            this._getJSON('/trading-pairs-info/', (res) => {
                if (tradingPair)    {
                    res.forEach( resPair => {
                        if  (tradingPair.toLowerCase() == resPair.url_symbol.toLowerCase() )
                            callback(resPair);
                            return this;
                    });

                } else {
                    if (res) {callback(res);}
                }
            });
            return this;
        } else {
            return false;
        }
    }

    /*
     * Function: getTradingPairs(callback)
     *
     * Description: Get the current status of each trading engine
     *
     * params: callback
     *
     * GET: https://www.bitstamp.net/api/v2
     *
     * Response: 200 OK
     *       [
     *         "btcusd",
     *         "ethusd",
     *         "ethbtc",
     *         "ltcusd",
     *         "ltcbtc",
     *         ...
     *       ]
     *
     * Response: 400 Bad Request
     *
     */
    getTradingPairs(callback) { // WORK DONE
        if (callback) {
            this._getJSON('/trading-pairs-info/', (res) => {
                var currencyPairs = [];
                res.forEach( resPair => {
                    currencyPairs.push(resPair.url_symbol.toLowerCase());
                });
                currencyPairs.sort();
                if (currencyPairs) {callback(currencyPairs);}
            });
            return this;
        } else {
            return false;
        }
    }


    /*
     * Function: getAvailableSymbols(callback)
     *
     * Description: Gets a sorted list of all available symbols.
     *
     * params: callback
     *
     * GET: https://api.bitstamp.com/v1/symbols
     *
     * Response: 200 OK
     *       [
     *         "bch",
     *         "btc",
     *         "eth",
     *         "ltc",
     *         "xrp",
     *         ...
     *       ]
     *
     * Response: 400 Bad Request
     *
     *
     */
    getAvailableSymbols(callback) { // WORK DONE
        if (callback) {
            var convert = this.convert.toLowerCase();
            this._getJSON('/trading-pairs-info/', (tradingPairs) => {
                var res = [];
                var symbolPairs = [];
                tradingPairs.forEach( pair => {
                    if ( pair.url_symbol.endsWith(convert) ) symbolPairs.push(pair.url_symbol.slice(0, pair.url_symbol.indexOf(convert))); // Returns symbol only, removing setup 'options.convert'.
                });
                symbolPairs.sort();
                res = symbolPairs.map(tradingPair => { return tradingPair.toLowerCase(); });
                if (res.length > 0) { callback(res); }
            });
            return this;
        } else {
            return false;
        }
    }



    /*
     * Function: getTopSymbols(top, callback)
     *
     * Description: Gets a sorted list of top <n> available symbols.
     *
     * params: top = number
     *         callback
     *
     * GET: https://api.bitstamp.com/v1/symbols
     *
     * Response: 200 OK
     *       [
     *         "btc",
     *         "eth",
     *         "ltc",
     *         ...
     *       ]
     *
     * Response: 400 Bad Request
     *
     */
    getTopSymbols(limit, callback) { // WORK DONE
        if (callback) {
            limit = (limit > 5) ? 5 : limit;

            this.getAvailableSymbols(res => {
                if (res.length > 0) {callback(res.slice(0, limit));}
            });
            return this;
        } else {
            return false;
        }
    }




    /*
     * Function: getTicker(symbol, callback)
     *
     * Description: The ticker is a high level overview of the state of the market.
     *             It shows you the current best bid and ask, as well as the last trade price.
     *             It also includes information such as daily volume and how much the price
     *             has moved over the last day.
     *
     * params: symbol = 'BTC'
     *         callback
     *
     * GET: https://api.bitstamp.com/v2/ticker/tBTCUSD
     *
     * Response: 200 OK
     *       [ 10067,
     *         59.44536362,
     *         10069,
     *         29.15006837,
     *         -333.08973822,
     *         -0.032,
     *         10071,
     *         65248.68663377,
     *         10544,
     *         9760 ]
     *
     *
     * Response: 400 Bad Request
     *
     */
    getTicker(symbol, callback) { // WORK DONE
        if (callback) {
            var symbolPair = symbol.toLowerCase()+this.convert.toLowerCase();
            this._getJSON('/ticker/'+symbolPair, (res) => {
                if (res) {callback(res);}
            });
            return this;
        } else {
            return false;
        }
    }



    /*
     * Function: getTickers(symbols, callback)
     *
     * Description: Get ticker for specified symbols.
     *             The ticker is a high level overview of the state of the market.
     *             It shows you the current best bid and ask, as well as the last trade price.
     *             It also includes information such as daily volume and how much the price
     *             has moved over the last day.
     *
     * params: symbols = 'BTC, ETH, ...'
     *         callback
     *
     * GET: https://api.bitstamp.com/v2/tickers?symbols=tBTCUSD,tETHUSD,...
     *
     * Response: 200 OK
     * // on trading pairs (ex. tBTCUSD)
     *      [ [
     *        SYMBOL,
     *        BID, 
     *        BID_SIZE, 
     *        ASK, 
     *        ASK_SIZE, 
     *        DAILY_CHANGE, 
     *        DAILY_CHANGE_PERC, 
     *        LAST_PRICE, 
     *        VOLUME, 
     *        HIGH, 
     *        LOW
     *      ],[
     *       ...
     *      ] ]
     *
     * Response: 400 Bad Request
     *
     */
    getTickers(symbols, callback) {
        if (symbols && callback) {
            var allSymbolPairs = [];
            symbols.split(',').forEach(symbol => {

                var symbolPair = symbol.toLowerCase()+this.convert.toLowerCase();
                allSymbolPairs.push(symbolPair);
            });
            this._getJSON('/v2/tickers?symbols='+allSymbolPairs.join(','), (res) => {
                if (res) { callback(res); }
            });
            return this;
        } else {
            return false;
        }
    }



    /*
     * Function: getAllTickers(callback)
     *
     * Description: Get ticker for all available symbols.
     *             The ticker is a high level overview of the state of the market.
     *             It shows you the current best bid and ask, as well as the last trade price.
     *             It also includes information such as daily volume and how much the price
     *             has moved over the last day.
     *
     * params: callback
     *
     * Response: 200 OK
     * // on trading pairs (ex. tBTCUSD)
     *    [ [
     *        SYMBOL,
     *        BID, 
     *        BID_SIZE, 
     *        ASK, 
     *        ASK_SIZE, 
     *        DAILY_CHANGE, 
     *        DAILY_CHANGE_PERC, 
     *        LAST_PRICE, 
     *        VOLUME, 
     *        HIGH, 
     *        LOW
     *      ],[
     *       ...
     *      ] ]
     *
     * Response: 400 Bad Request
     *       {
     *         "message": "Unknown symbol"
     *       }
     */
    getAllTickers(callback) {
        if (callback) {
            this.getAvailableSymbols(symbols => {
                if (symbols && callback) {
                    var allSymbolPairs = [];
                    symbols.forEach(symbol => {

                        var symbolPair = symbol.toLowerCase()+this.convert.toLowerCase();
                        allSymbolPairs.push(symbolPair);
                    });
                    this._getJSON('/v2/tickers?symbols='+allSymbolPairs.join(','), (res) => {
                        if (res) { callback(res); }
                    });
                    return this;
                } else {
                    return false;
                }
            });
            return this;
        } else {
            return false;
        }
    }



    /*
     * Function: getSymbolRecentTrades(symbol, callback)
     *
     * Description: Get a list of the most recent trades for the given symbol.
     *
     * params: symbol = 'btc'
     *         callback
     *
     * GET: https://api.bitstamp.com/v1/trades/<symbol>
     *
     * Response: 200 OK
     *      [{
     *        "timestamp":1444266681,
     *        "tid":11988919,
     *        "price":"244.8",
     *        "amount":"0.03297384",
     *        "exchange":"bitstamp",
     *        "type":"sell"
     *      }, {
     *      ...
     *      }]
     *
     * Response: 400 Bad Request
     *      {
     *        "message": "Unknown symbol"
     *      }
     */
    getSymbolRecentTrades(symbol, callback) {
        if (symbol && callback) {
            var symbolPair = symbol.toLowerCase()+this.convert.toLowerCase();
            this._getJSON(`/v1/trades/${symbolPair}`, (res) => {
                if (res) {callback(res);}
            });
            return this;
        } else {
            return false;
        }
    }



    /*
     * Function: getSymbolStats(symbol, callback)
     *
     * Description: Various statistics about the requested pair.
     *
     * params: symbol = 'btc'
     *         callback
     *
     * GET: https://api.bitstamp.com/v1/stats/<symbol>
     *
     * Response: 200 OK
     *      [{
     *        "period":1,
     *        "volume":"7967.96766158"
     *      },{
     *        "period":7,
     *        "volume":"55938.67260266"
     *      },{
     *        "period":30,
     *        "volume":"275148.09653645"
     *      }]
     *
     * Response: 400 Bad Request
     *      {
     *        "message": "Unknown symbol"
     *      }
     */
    getSymbolStats(symbol, callback) {
        if (symbol && callback) {
            var symbolPair = symbol.toLowerCase()+this.convert.toLowerCase();
            this._getJSON(`/v1/stats/${symbolPair}`, (res) => {
                if (res) {callback(res);}
            });
            return this;
        } else {
            return false;
        }
    }


    /*
     * Function: getAllSymbolStats(callback)
     *
     * Description: Get ticker for all available symbols.
     *             The ticker is a high level overview of the state of the market.
     *             It shows you the current best bid and ask, as well as the last trade price.
     *             It also includes information such as daily volume and how much the price
     *             has moved over the last day.
     *
     * params: callback
     *
     * Response: 200 OK
     * // on trading pairs (ex. tBTCUSD)
     *    [ [
     *        SYMBOL,
     *        BID, 
     *        BID_SIZE, 
     *        ASK, 
     *        ASK_SIZE, 
     *        DAILY_CHANGE, 
     *        DAILY_CHANGE_PERC, 
     *        LAST_PRICE, 
     *        VOLUME, 
     *        HIGH, 
     *        LOW
     *      ],[
     *       ...
     *      ] ]
     *
     * Response: 400 Bad Request
     *       {
     *         "message": "Unknown symbol"
     *       }
     */
    getAllSymbolStats(callback) {
        if (callback) {
            return false; // FIXME: not working  as intended
            this.getAvailableSymbols(symbols => {
                var allSymbolStats = [];
                if (symbols) {
                    symbols.forEach(symbol => {

                        this.getSymbolStats(symbol.toLowerCase(), (res) => {
                            allSymbolStats.push( symbol = [] );
                            allSymbolStats.symbol = res;
                        });
                        console.log(allSymbolStats);
                        callback = allSymbolStats;
                    });
                    return this;
                } else {
                    return false;
                }
            });
            return this;
        } else {
            return false;
        }
    }



    /*
     * Function: getSymbolOrderBook(symbol, callback)
     *
     * Description: Get the full order book for the specified symbol piar
     *
     * params: symbol = btcusd
     *         callback
     *
     * GET: https://api.bitstamp.com/v1/book/<symbol>
     *
     * Response: 200 OK
     *      { bids: 
     *         [ { price: '10067', amount: '0.1', timestamp: '1517419047.0' },
     *           { price: '10064', amount: '0.2', timestamp: '1517419047.0' },
     *           ...
     *           { price: '10032', amount: '0.5726', timestamp: '1517419047.0' } ],
     *          asks: 
     *           [ { price: '10069', amount: '0.9622', timestamp: '1517419047.0' },
     *             { price: '10070',
     *               amount: '4.63761686',
     *               timestamp: '1517419047.0' },
     *               ...
     *             { price: '10103', amount: '3.4', timestamp: '1517419047.0' } ] }
     *
     *
     * Response: 400 Bad Request
     *       {
     *         "message": "Unknown symbol"
     *       }
     *
     */
    getSymbolOrderBook(symbol, callback) {
        if (symbol && callback) {
            var symbolPair = symbol.toLowerCase()+this.convert.toLowerCase();
            this._getJSON(`/v1/book/${symbolPair}`, (res) => {
                if (res) {callback(res);}
            });
            return this;
        } else {
            return false;
        }
    }








    on(symbol, callback) {
        if (this.events) {
            this.events.push({symbol, callback, type: "update"});
        } else {
            return false;
        }
    }

    onPriceGreater(symbol, price, callback) {
        if (this.events) {
            this.events.push({symbol, price, callback, type: "greater"});
        } else {
            return false;
        }
    }

    onPriceLesser(symbol, price, callback) {
        if (this.events) {
            this.events.push({symbol, price, callback, type: "lesser"});
        } else {
            return false;
        }
    }

    onPricePercentChange(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "pricepercent"});
        } else {
            return false;
        }
    }

    onPricePercentChange1h(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "pricepercent1h"});
        } else {
            return false;
        }
    }

    onPricePercentChange24h(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "pricepercent24h"});
        } else {
            return false;
        }
    }

    onPricePercentChange7d(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "pricepercent7d"});
        } else {
            return false;
        }
    }

    onVolumeChange(symbol, value, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "volumechange"});
        } else {
            return false;
        }
    }

    onVolumeChange1h(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, value, callback, type: "volumechange1h"});
        } else {
            return false;
        }
    }

    onVolumeChange24h(symbol, value, callback) {
        if (this.events) {
            this.events.push({symbol, value, callback, type: "volumechange24h"});
        } else {
            return false;
        }
    }

    onVolumeChange7d(symbol, value, callback) {
        if (this.events) {
            this.events.push({symbol, value, callback, type: "volumechange7d"});
        } else {
            return false;
        }
    }


    onVolumePercentChange(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "volumepercent"});
        } else {
            return false;
        }
    }

    onVolumePercentChange1h(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "volumepercent1h"});
        } else {
            return false;
        }
    }

    onVolumePercentChange24h(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "volumepercent24h"});
        } else {
            return false;
        }
    }

    onVolumePercentChange7d(symbol, percent, callback) {
        if (this.events) {
            this.events.push({symbol, percent, callback, type: "volumepercent7d"});
        } else {
            return false;
        }
    }

    deleteEvent(event) {
        this.events.splice(this.events.indexOf(event), 1);
        return this;
    }
}

module.exports = Bitstamp;

