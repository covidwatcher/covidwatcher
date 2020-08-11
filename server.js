'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Route Definitions
app.get('/', rootHandler);
app.get('/states', getStateData);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function rootHandler(request, response) {
  response.status(200).send('COVID Watcher Backend');
}

function getStateData(request, response) {
  const url = 'https://api.covidtracking.com/v1/states/current.json';
  superagent.get(url)
  console.log(response)
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

function States(state){
  this.stateName = state.state;
  this.positive = state.positive;
  this.negative = state.negative;
  this.hospitalizedCurrently = state.hospitalizedCurrently;
  this.recovered = state.recovered;
  this.death = state.death;
  this.totalTest = state.totalTestsViral;
  this.positiveTests = state.positiveTestsViral;
  this.negativeTests = state.negativeTestsViral;
}

function renderHomePage(request, response) {
  response.render('views/index');
}

// App listener
app.listen(PORT,() => console.log(`Listening on port ${PORT}`));
