'use strict';
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();
const { DATABASE, PORT } = require('./config');
const knex = require('knex')(DATABASE);

//allows us to use the middleware functions on all the router functions
router.use(jsonParser);

////////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////           Get /API/Items             //////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

//returns the item with an id of whatever you put after the endpoint (/api/items/) 
router.get('/:id', (req, res) => {
  knex('items')
    .select(req.body.id, req.body.title)
    .where({ 'id': req.params.id })
    .then(result => {
      res.json(result[0]);
    });
});

//returns a list of items in the database
router.get('/', (req, res) => {
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
router.post('/', (req, res) => {
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
//if the user passed only completed, it updates completed
//if the user passed only title, it updates the title
//if none of these are inputted return an error
router.put('/:id', (req,res) => {
  if (req.body.completed && req.body.title) {
    knex('items')
    .update( {'title': req.body.title, 'completed': req.body.completed} )
    .where('id', req.params.id)
    .returning(['title', 'id', 'completed'])
    .then(result => {
      return res.json(result[0]);
    });
  } else if(req.body.title){
    knex('items')
    .update('title', req.body.title)
    .where('id', req.params.id)
    .returning(['title', 'id', 'completed'])
    .then(result => {
      return res.json(result[0]);
    });
  } else if(req.body.completed){
    knex('items')
    .update('completed', req.body.completed)
    .where('id', req.params.id)
    .returning(['title', 'id', 'completed'])
    .then(result => {
      return res.json(result[0]);
    });
  }else{
    return res.status(400).send(`Missing title or completed in body request.`);
  }
});


///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////           Delete /API/Items             ///////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////////////////

//deletes the item with an id of whatever you put after the endpoint (/api/items/) 
router.delete('/:id', (req, res) => {
  knex('items')
    .where('id', req.params.id)
    .del()
    .then(result => {
      res.json(result);
    });
});

module.exports = router;