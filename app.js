const express = require('express')
const app = express()
const appConfig = require('./app/config/appConfiguration')
const fs = require('fs')
const logger = require('./app/lib/loggerLib')
const bodyParser = require('body-parser')
const globalErrorMiddleware = require('./app/middlewares/appErrorHandler')

// creating database connection
const mongoose = require('mongoose');
mongoose.connect(appConfig.db.uri, { useNewUrlParser: true, useCreateIndex: true });

// App listening on port 3000
app.listen(appConfig.port, () => console.log(`App listening on port ${appConfig.port}!`))

// middlewares
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(globalErrorMiddleware.globalErrorHandler)

// Paths
const models_path = './app/models';
const routes_path = './app/routes';

app.all('*', function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
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

// Calling global 404 handler after route
app.use(globalErrorMiddleware.globalNotFoundHandler)


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

