var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var url = require('url');

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/turven-client.js');
});

var connectedClients = {}

io.on('connection', (socket) => {
	// TODO: handle localhost (and more generally, non-public hosts)
	url = url.parse(socket.request.headers.referer)

	const hostAndPathname = url.host + url.pathname;

	if (connectedClients[hostAndPathname] == null) {
		connectedClients[hostAndPathname] = 0;
	}

	connectedClients[hostAndPathname] += 1;
	io.emit('connectedClients', connectedClients[hostAndPathname]);
	console.log(connectedClients);

  socket.on('disconnect', () => {
		connectedClients[hostAndPathname] -= 1;
		console.log(connectedClients);
		io.emit('connectedClients', connectedClients[hostAndPathname]);
  });
});

var port = process.env.PORT || 3000;
http.listen(port, () => {
	console.log('listening on *:' + port);
});
