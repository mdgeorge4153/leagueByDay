var Http    = require('http');
var Promise = require('promise');
var Ty      = require('then-yield');
var LolLib  = require('lol-js');

var Lol     = LolLib.client({
  apiKey: fs.readFileSync('api.key').slice(0,-1),
  cache:  LolLib.redisCache({host: '127.0.0.1', port: 6380})
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

/**
 * returns a 7x24 array results[day][hour].  Each entry has a .wins and a
 * .losses integer.
 */
var getStats = Ty.async(function* (region, summName) {
  var summList = yield Lol.getSummonersByName('na', [summName]);
  var summId   = summList[summName].id;
  var matches  = yield Lol.getMatchlistBySummoner(region, summId);

  /* initialize results[day][hour].wins = 0 and .losses = 0 */
  var results = new Array (7);
  for (var day = 0; day < 7; day++) {
    results[day] = new Array (24);
    for (var hour = 0; hour < 24; hour++) {
      results[day][hour] = {wins: 0, losses: 0};
    }
  }

  var resultsCount = 0;
  for (var i in matches.matches) {
    var match = yield Lol.getMatch(region, matches.matches[i].matchId);

    var timestamp = new Date(match.matchCreation);
    var day       = timestamp.getDay();
    var hour      = timestamp.getHours();

    var entry = results[day][hour];

    var participant = getParticipant(match, summId);
    if (participant.stats.winner)
      entry.wins ++;
    else
      entry.losses ++;

    resultsCount++;

    if (i % 10 == 0)
      console.log(i + "/" + matches.matches.length + " (" + resultsCount + ")");
    if (i % 30 == 0)
      console.log(results);
  }

  return results;
});

var knot = getStats('na','KnotOfGordium');

/*

var server = http.createServer(function (req, resp) {
  resp.writeHead(200);
  resp.end('Hello world')
});

server.listen(8080)
*/

