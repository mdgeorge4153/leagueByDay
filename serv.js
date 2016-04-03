var Http    = require('http');
var Promise = require('promise');
var Ty      = require('then-yield');
var LolLib  = require('lol-js');
var Url     = require('url');
var Fs      = require('fs');

/** config.json should have the following type:
{
	apiKey:    string
	rateLimit: Array<{time: int, limit: int}>
	cache:     {type: string, other params depending on type}
	port:      int
}
*/
var config   = JSON.parse(Fs.readFileSync('config.json'));

switch(config.cache.type) {
	case "redis":
		config.cache = LolLib.redisCache(config.cache);
		break;
	case "lru":
		config.cache = LolLib.lruCache(config.cache);
		break;
	case "none":
		config.cache = null;
		break;
}

var Lol = LolLib.client(config);

var getParticipant = function (match, summId) {
	pId = match.participantIdentities.find (function (participantIdentity) {
		return participantIdentity.player.summonerId = summId;
	});

	participant = match.participants.find (function (participant) {
		return participant.participantId = pId.participantId;
	});

	return participant;
}

function delay(time) {
	return new Promise (function (fulfill) {
		setTimeout(fulfill, time);
	});
}

var getStats = Ty.async(function* (region, summName) {

	console.log('fetching summoner id for ' + summName + ' [' + region + ']');
	var summList = yield Lol.getSummonersByName(region, [summName]);
	var summId	 = summList[summName].id;

	console.log('fetching match list  for ' + summId);
	var matches  = yield Lol.getMatchlistBySummoner(region, summId);

	console.log('fetching details for ' + /* matches.matches.length + */ 'matches');
	var timeout = new Promise(function (fulfill) { setTimeout(fulfill, 1000); });
	var results = new Array(matches.matches.length);
	for (var i in matches.matches) {
		var match = matches.matches[i];

		function makeResult(match, summId) {
			var result = {
				id:        match.matchId,
				champion:  match.champion,
				queue:     match.queue,
				lane:      match.lane,
				role:      match.role,
				timestamp: match.timestamp,
			};

			result.addDetail = function (matchDetail) {
				console.log('match ' + matchDetail.matchId + ' =? ' + result.id + ' fetched');
				result.winner = getParticipant(matchDetail, summId).stats.winner;
				return result;
			};

			result.timeout = function () {
				if (result.winner == undefined)
					result.winner = null;
				return result;
			};

			return result;
		}

		console.log('setting up race ' + i);
		result = makeResult(match, summId);

		results[i] = Promise.race([
			Lol.getMatch(region, match.matchId).then(result.addDetail),
			timeout.then(result.timeout)
		]);
	}

	return Promise.all(results);
});

var resources = {
	'/display.html': {
		contentType: 'text/html',
		content: Fs.readFileSync('ui/display.html'),
	},
	'/d3.v3.min.js': {
		contentType: 'application/javascript',
		content: Fs.readFileSync('ui/d3.v3.min.js'),
	},
}


var server = Http.createServer(function (request, response) {

	if (request.method != 'GET') {
		response.writeHead(405);
		response.end();
		return;
	}

	var url = Url.parse(request.url, true);

	switch(url.pathname) {
		case '/':
			response.writeHead(300, {
				'Location': '/display.html'
			});
			response.end();
			break;

		case '/display.html':
		case '/d3.v3.min.js':
			var result = resources[url.pathname]
			response.writeHead(200, {
				'Content-Length': result.content.length,
				'Content-Type':   result.contentType,
			});
			response.end(result.content);
			break;

		case '/data.json':
			var summoner = url.query['summoner'];
			var region   = url.query['region'].toLowerCase();

			if (summoner == undefined || region == undefined) {
				response.writeHead(400);
				response.end('summoner and region are required');
			}

			console.log('getting stats for ' + summoner + ' [' + region + ']');
			getStats(region, summoner)
			.then(function (stats) {
				response.writeHead(200, {
					'Content-Type': 'application/json'
				});
				response.end(JSON.stringify(stats));
			});

			break;

		default:
			response.writeHead(404);
			break;
	}
});

server.listen(config.port)

/*
** vim: ts=4 sw=4
*/

