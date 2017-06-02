'use strict';

const express = require('express');
const toDoRouter = require('./router');
const { DATABASE, PORT } = require('./config');
const knex = require('knex')(DATABASE);
const bodyParser = require('body-parser');

const app = express();

// Add middleware and .get, .post, .put and .delete endpoints

let server;
//let knex;

//allows us to use the middleware functions on all the app functions
app.use(setCorsHeaders);
app.use('/api/items',toDoRouter);


/** 
 @function setCorsHeaders
 @desc  a middleware used to to set the response headers of Access-Control-Allow-Origin, Access-Control-Allow-Headers,
        and Access-Control-Allow-Origin
 @param {req} the request you are getting from the client
 @param {res} the response you are sending to the client
 @param {next} the function that you are telling the middleware stack to 
                pass control to the next middleware function in the stack
 @returns undefined
*/
function setCorsHeaders(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  next();
}


///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////           Running and Closing Server            ////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
function runServer(database = DATABASE, port = PORT) {
  return new Promise((resolve, reject) => {
    try {
      //knex = require('knex')(database);
      server = app.listen(port, () => {
        console.info(`App listening on port ${server.address().port}`);
        resolve();
      });
    }
    catch (err) {
      console.error(`Can't start server: ${err}`);
      reject(err);
    }
  });
}

function closeServer() {
  return knex.destroy().then(() => {
    return new Promise((resolve, reject) => {
      console.log('Closing servers');
      server.close(err => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  });
}

if (require.main === module) {
  runServer().catch(err => {
    console.error(`Can't start server: ${err}`);
    throw err;
  });
}

module.exports = { app, runServer, closeServer };