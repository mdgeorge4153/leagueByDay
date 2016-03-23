var Http    = require('http');
var Promise = require('promise');
var Ty      = require('then-yield');
var LolLib  = require('lol-js');

var Lol     = LolLib.client({
  apiKey: fs.readFileSync('api.key').slice(0,-1),
  cache:  LolLib.redisCache({host: '127.0.0.1', port: 6380}),
  rateLimit: [
    {time: 10,  limit: 8},
    {time: 600, limit: 400},
  ],
});


var getParticipant = function (match, summId) {
  pId = match.participantIdentities.find (function (participantIdentity) {
    return participantIdentity.player.summonerId = summId;
  });

  participant = match.participants.find (function (participant) {
    return participant.participantId = pId.participantId;
  });

  return participant;
}

var getStats = Ty.async(function* (region, summName) {
  var summList = yield Lol.getSummonersByName('na', [summName]);
  var summId   = summList[summName].id;
  var matches  = yield Lol.getMatchlistBySummoner(region, summId);

  var results = new Array(matches.matches.length);

  for (var i in matches.matches) {
    var match = matches.matches[i];
    var matchDetail = yield Lol.getMatch(region, match.matchId);

    results[i] = {
      id:        match.matchId,
      champion:  match.champion,
      queue:     match.queue,
      lane:      match.lane,
      role:      match.role,
      timestamp: match.timestamp,
      winner:    getParticipant(matchDetail, summId).stats.winner,
    };
  }

  return results;
});

var knot = getStats('na','KnotOfGordium');
 
knot.then(function (stats) {
  fs.writeFileSync('ui/data.json', JSON.stringify(stats, null, 2));
  console.log(stats);
});

/*

var server = http.createServer(function (req, resp) {
  resp.writeHead(200);
  resp.end('Hello world')
});

server.listen(8080)
*/

