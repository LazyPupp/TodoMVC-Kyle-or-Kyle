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

function setCorsHeaders(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE');
  next();
}

app.get('/api/items/:id', (req, res) => {
  knex('items')
    .select(req.body.id, req.body.title)
    .where({ 'id': req.params.id })
    .then(result => {
      res.json(result[0]);
    });
});

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

app.delete('/api/items/:id', (req, res) => {
  knex('items')
    .where('id', req.params.id)
    .del()
    .then(result => {
      res.json(result);
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