'use strict';

const express = require('express');
const { DATABASE, PORT } = require('./config');

const bodyParser = require('body-parser');

const app = express();

// Add middleware and .get, .post, .put and .delete endpoints

let server;
let knex;

app.use(setCorsHeaders);
app.use(bodyParser.json());

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
////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////           Get /API/Items             //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

//returns the item with an id of whatever you put after the endpoint (/api/items/) 
app.get('/api/items/:id', (req, res) => {
  knex('items')
    .select(req.body.id, req.body.title)
    .where({ 'id': req.params.id })
    .then(result => {
      res.json(result[0]);
    });
});

//returns a list of items in the database
app.get('/api/items', (req, res) => {
  knex
    .select(req.body.id, req.body.title, req.body.completed)
    .from('items')
    .then(result => {
      const resultsWithUrl = result.map(el => {
        return {
          id: el.id,
          title: el.title,
          completed: el.completed,
          url: `${req.protocol}://${req.get('host')}/api/items/${el.id}`
        };
      });
      res.json(resultsWithUrl);
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////           Post /API/Items             /////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

//checks if the user pass in a title key in the object they to the server
//if the user didn't, the server will send an error to the client
//if the user did, the server will insert what gets sent in by the client, 
//set the location header to a URL, 
//and sends a json with the results and the url back to the client
app.post('/api/items', (req, res) => {
  if (!req.body.title) {
    return res.status(400).send(`Missing title in body request.`);
  }
  knex
    .insert({title: req.body.title})
    .into('items')
    .returning(['id', 'title', 'completed'])
    .then(result => {
      const URL = `${req.protocol}://${req.get('host')}/api/items/${result[0].id}`;
      res.status(201);
      res.location(URL);
      res.json(Object.assign({}, result[0], { url: URL } )); 
    });
});

///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////           Put /API/Items             //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

//checks if the user passed a completed key in the object they to the server
//if the user did, it updates the title and completed key
//if the user didn't, it updates the title
app.put('/api/items/:id', (req,res) => {
  if (req.body.completed) {
    knex('items')
    .update( {'title': req.body.title, 'completed': req.body.completed} )
    .where('id', req.params.id)
    .returning(['title', 'id', 'completed'])
    .then(result => {
      return res.json(result[0]);
    });
  } else {
    knex('items')
    .update('title', req.body.title)
    .where('id', req.params.id)
    .returning(['title', 'id', 'completed'])
    .then(result => {
      return res.json(result[0]);
    });
  }
});


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////           Delete /API/Items             ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

//deletes the item with an id of whatever you put after the endpoint (/api/items/) 
app.delete('/api/items/:id', (req, res) => {
  knex('items')
    .where('id', req.params.id)
    .del()
    .then(result => {
      res.json(result);
    });
});

///////////////////////////////////////////////////////////////////////////////////////////////////
//////////////////////           Running and Closing Server            ////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////
function runServer(database = DATABASE, port = PORT) {
  return new Promise((resolve, reject) => {
    try {
      knex = require('knex')(database);
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