#!node

var _ = require('underscore')._;
var http = require('http');
var growl = require('growl');
var lru = require('lru-cache');
var opts = require('opts');

opts.parse([ {
  short : "i",
  long : "interval",
  description : "Update check interval",
  value : true
} ], [], true);

var interval = opts.get("i") || (300 * 1000);

if (!new String(interval).match(/^[0-9]+$/)) {
  console.log('Invalid interval value:' + interval);
  process.exit(0);
}

var options = {
  host : 'search.npmjs.org',
  path : '/_view/updated?descending=true&limit=20'
};
var Seen = {};
function checkUpdate() {
  http.get(options, function(res) {
    var that = this;
    var resBody = '';
    res.on('data', function(data) {
      resBody = resBody + data;
    });
    res.on('end', function() {
      try {
        var resObj = JSON.parse(resBody);
        var rows = resObj.rows;
        _.each(rows, function(item) {
          var key = item.id + '-' + item.key;
          if (Seen[key] == undefined) {
            Seen[key] = true;
            var name = item.id;
            http.get({
              'host' : 'search.npmjs.org',
              'path' : '/api/' + name
            }, function(res) {
              var that = this;
              var resBody = '';
              res.on('data', function(data) {
                resBody = resBody + data;
              });
              res.on('end', function() {
                try{
                  var resObj = JSON.parse(resBody);
                  var description = resObj.description;
                  var message = name + 'released!';
                  if(description && description.length > 0 ){
                    message = description;
                  }
                  growl.notify(message, {
                    title : name,
                    image : './npm-32.png'
                  });
                }catch(e){
                  that.emit('error', e);
                }
              });
            });
          }
        });
      } catch (e) {
        that.emit('error', e);
      }
    });
  }).on('error', function(e) {
    console.log(e.message);
  });
  setTimeout(checkUpdate, interval);
};

console.log('Start growl notify...');
console.log('interval:' + interval + 'ms');
checkUpdate();