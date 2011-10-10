#!/usr/bin/env node
var _ = require('underscore')._;
var http = require('http');
var growl = require('growl');
var lru = require('lru-cache');
var opts = require('opts');

opts.parse([{
  short: "i",
  long: "interval",
  description: "Update check interval",
  value: true
}],[],true);

var interval = opts.get("i") || ( 300 * 1000 );
if( !interval.match(/^[0-9]+$/) ){
  process.exit(0);
}

var options = {
  host : 'search.npmjs.org', 
  path : '/_view/updated?limit=20'
};
var Seen = {};
function checkUpdate() {
  http.get(options, function (res) {
    var self = this; var resBody = ''; 
	res.on('data', function (data) {
      resBody = resBody + data; 
    }); 
	res.on('end', function () {
      try {
        var resObj = JSON.parse(resBody); 
        var rows = resObj.rows; 
        _.each(rows, function (item) {
          var key = item.id + '-' + item.key; 
          if ( Seen[key] == undefined) {
            Seen[key] = true; 
            var message = item.id + ' released.';
            growl.notify(message, {
              title : 'NPM Update',
              image: './npm-32.png',
            }); 
          }  
        }); 
      } catch (e) {
        self.emit('error', e); 
      }
    }); 
  }).on('error', function (e) {
    console.log(e.message); 
  });
  setTimeout(checkUpdate, interval)
};

console.log('Start growl notify...');
console.log('interval:' + interval + 'ms');
checkUpdate();
