var http = require('http');


var lol = require('lol-js').client({
  apiKey: fs.readFileSync('api.key').slice(0,-1),
});

/*
val getStats = function (region, summName) {
  return Promise.resolve(null)
  .then(function (_) {
    return lol.getSummonersByName('na', [summName]);
  })
  .then(function (list) {
    val summ = list[summName];
    val id   = summ.id;
    return lol.matchlist.getMatchListBySummoner(region, id);
  });
}
*/

/*

var server = http.createServer(function (req, resp) {
  resp.writeHead(200);
  resp.end('Hello world')
});

server.listen(8080)
*/

