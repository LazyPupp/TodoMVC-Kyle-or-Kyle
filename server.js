'use strict';

const express = require('express');
const { DATABASE, PORT } = require('./config');

const bodyParser = require('body-parser');

const app = express();

// Add middleware and .get, .post, .put and .delete endpoints

let server;
let knex;

app.use(setCORSheaders);
app.use(bodyParser.json());

function setCORSheaders(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  next();
}
app.get('/api/items/:id',(req,res)=>{
  knex('items')
    .select(req.body.id, req.body.title)
    .where({ 'id': req.params.id})
    .then(result=>{
      res.json(result[0]);
    });
});

app.get('/api/items', (req, res) => {
  knex
    .select(req.body.id, req.body.title)
    .from('items')
    .then(result =>{
      res.json(result);
    });
});

app.post('/api/items', (req, res) => {
  if(!req.body.title){
    const message = `Missing title in body request.`;
    console.error(message);
    return res.status(400).send(message);
  }
  knex
    .insert({title: req.body.title})
    .into('items')
    .returning(['id', 'title', 'completed'])
    .then( result => {
      res.status(201);
      // res.location(`${req.protocol}://${req.hostname}/api/items/${result[0].id}`);
      res.json(Object.assign({}, result[0], {url: `${req.protocol}://${req.hostname}:${PORT}/api/items/${result[0].id}`}));
    });
});


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