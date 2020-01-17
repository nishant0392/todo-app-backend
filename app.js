const express = require('express')
const app = express()
const appConfig = require('./app/config/appConfiguration')
const fs = require('fs')
const logger = require('./app/lib/loggerLib')
const bodyParser = require('body-parser')
const globalErrorMiddleware = require('./app/middlewares/appErrorHandler')
const http = require('http')
const mongoose = require('mongoose')

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use('/userAvatars', express.static('userAvatars'))

app.use(globalErrorMiddleware.globalErrorHandler)

// Paths
const models_path = './app/models';
const routes_path = './app/routes';

app.all('*', function (req, res, next) {
  res.setHeader( "Access-Control-Allow-Origin", req.headers.origin );
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
  res.header('Access-Control-Allow-Credentials', true);
  next();
});

// Bootstrap models
fs.readdirSync(models_path).forEach(function (file) {
  if (~file.indexOf('.js'))
    require(models_path + '/' + file);
});

// Bootstrap routes
fs.readdirSync(routes_path).forEach(function (file) {
  if (~file.indexOf('.js')) {
    let route = require(routes_path + '/' + file);
    route.setRouter(app);
  }
});

// File Upload
const file_upload = require('./app/lib/uploadFile');
file_upload.uploadFile(app);

// Calling global 404 handler after route
app.use(globalErrorMiddleware.globalNotFoundHandler)


/**
 * Create HTTP server.
 */
const HTTP_Server = http.createServer(app);
HTTP_Server.listen(appConfig.port);
HTTP_Server.on('error', errorHandler);
HTTP_Server.on('listening', listeningEventHandler);

// Socket IO connection handler 
const socketLib = require("./app/lib/socketLib");
socketLib.set_http_server(HTTP_Server);


function errorHandler(err) {
  console.log(err)
  if (err.code === "EADDRINUSE") {
    logger.error(err.code + ":Port is already in use", "App.js: errorHandler", 10);
    process.exit(1);
  }
  else if (err.code === "EACCESS") {
    logger.error(err.code + ":Elevated privileges required", "App.js: errorHandler", 10);
    process.exit(1);
  }
  else {
    logger.error(err.code + ":Some Unknown Error occurred while creating HTTP Server", "App.js: errorHandler", 10);
    process.exit(1);
  }
} // END errorHandler()

function listeningEventHandler() {
  var addr = HTTP_Server.address();
  logger.info('HTTP Server listening on port ' + addr.port, 'App.js: listeningEventHandler', 10);

  // Creating Database connection
  mongoose.connect(appConfig.db.uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
}


/**
 * Database connection settings
 */
mongoose.connection.on('error', function (err) {
  console.log('Database connection error');
  console.log(err);
  logger.error(err, 'mongoose connection on error handler', 10)
}); // end mongoose connection error

mongoose.connection.on('open', function (err) {
  if (err) {
    console.log("database error");
    console.log(err);
    logger.error(err, 'mongoose connection open handler', 10)
  } else {
    console.log("Database Connection opens successfully !!");
    logger.info("Database connection opens",
      'database connection open handler', 10)
  }
}); // end mongoose connection open handler
