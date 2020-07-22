var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var url = require('url');
var cors = require('cors');

app.enable('trust proxy');

// enable cors
app.use(cors())
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.use (function (req, res, next) {
  if (req.secure) {
    // request was via https, so do no special handling
    next();
  } else {
    // request was via http, so redirect to https
    return res.redirect('https://' + req.headers.host + req.url);
  }
});

app.get('/script', (req, res) => {
  res.sendFile(__dirname + '/turven-client.js');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

var connectedClients = {}

io.on('connection', (socket) => {
  // TODO: handle localhost (and more generally, non-public hosts)
  if (socket.request.headers.referer == null) {
    return
  }
  url = url.parse(socket.request.headers.referer)

  const hostAndPathname = url.host + url.pathname;
  socket.join(hostAndPathname);

  if (connectedClients[hostAndPathname] == null) {
    connectedClients[hostAndPathname] = 0;
  }

  connectedClients[hostAndPathname] += 1;
  io.to(hostAndPathname).emit('connectedClients', connectedClients[hostAndPathname]);

  socket.on('disconnect', () => {
    connectedClients[hostAndPathname] -= 1;
    if (connectedClients[hostAndPathname] == 0) {
      delete connectedClients[hostAndPathname];
    }
    io.to(hostAndPathname).emit('connectedClients', connectedClients[hostAndPathname]);
  });
});

var port = process.env.PORT || 3000;
http.listen(port, () => {
  console.log('listening on *:' + port);
});
