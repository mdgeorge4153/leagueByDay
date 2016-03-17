var http = require('http');

var server = http.createServer(function (req, resp) {
  resp.writeHead(200);
  resp.end('Hello world')
});

server.listen(8080)

