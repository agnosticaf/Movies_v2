var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var multer = require('multer');
var debug = require('debug')('mean-app:server');
var http = require('http');
var app = express();

// ROUTES
var movie = require('./routes/movies');

/**
 * Get port from environment and store in Express.
 */

var port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

/**
 * Create HTTP server.
 */

var server = http.createServer(app);

/**
 * Create socket thangs.
 */
var io = require('socket.io')(server);

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port);

// start DB
mongoose.Promise = global.Promise;
mongoose.connect('mongodb://localhost/mean-chat')
  .then(() => console.log('connection successful'))
  .catch((err) => console.error(err));


/**
 * MIDDLEWARE STARTS HERE
 */
// app.set('view engine', 'html');
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ 'extended': 'true' }));
var options = {
  index: false
}

app.use(express.static(path.join(__dirname, 'public'), options));

// headers and content type
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next()
});


// Routes start here
app.use('/movie', movie.MoviesRest);


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'prod' ? err : {};
  console.error(err)
  // render the error page
  // res.status(err.status || 500);
  res.sendStatus(err.status || 500);
});


// Sockets start here
io.sockets.on('connection', function (socket) {

  // Create event handlers for this socket
  var eventHandlers = {
    movies: new movie.MoviesSocket(app, socket, io),
    // user: new User(app, socket)
  };

  // Bind events to handlers
  for (var category in eventHandlers) {
    var handler = eventHandlers[category].handler;
    for (var event in handler) {
      socket.on(event, handler[event]);
    }
  }

  // Keep track of the socket
  // app.allSockets.push(socket);
});


server.on('error', onError);
server.on('listening', onListening);

/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val) {
  var port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  var bind = typeof port === 'string'
    ? 'Pipe ' + port
    : 'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    case '11000':
      console.error(bind + ' asdsadsadasd');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  var addr = server.address();
  var bind = typeof addr === 'string'
    ? 'pipe ' + addr
    : 'port ' + addr.port;
  debug('Listening on ' + bind);
}

module.exports = app;
