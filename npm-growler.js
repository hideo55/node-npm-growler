#!/usr/bin/env node
var _ = require('underscore')._;
var http = require('http');
var growl = require('growl');
var lru = require('lru-cache');
var options = {
  host : 'search.npmjs.org', 
  path : '/_view/updated?limit=20'
};
var Seen = {};
var checkUpdate = function () {
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
            Seen[key] = true; growl.notify(item.id, {
              title : 'NPM Update'
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
};

console.log('Start growl notify...');
checkUpdate.call();
setInterval(checkUpdate, 300000);
