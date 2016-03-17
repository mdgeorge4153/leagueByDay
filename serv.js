var Http    = require('http');
var Promise = require('promise');
var Ty      = require('then-yield').using(Promise.resolve);
var Lol     = require('lol-js').client({
  apiKey: fs.readFileSync('api.key').slice(0,-1),
});



var getStats = Ty.async(function* (region, summName) {
  var summList = yield Lol.getSummonersByName('na', [summName]);
  var summ     = summList[summName];
  var id       = summ.id;
  var matches  = yield Lol.getMatchlistBySummoner(region, id);

  return matches;
});

var knot = getStats('na','KnotOfGordium');

/*

var server = http.createServer(function (req, resp) {
  resp.writeHead(200);
  resp.end('Hello world')
});

server.listen(8080)
*/

