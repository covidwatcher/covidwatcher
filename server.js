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

// Set the view engine for server-side templating
app.set('view engine', 'ejs');
app.use(express.static('./public'));

// Route Definitions
app.get('/', rootHandler);
app.get('/states', getStateData);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function rootHandler(request, response) {
  response.render('index');
}

function getStateData(request, response) {
  const url = 'https://api.covidtracking.com/v1/states/current.json';
  superagent.get(url)
    .query({
      format: 'json'
    })
    .then(stateDataResponse => {
      const arrayOfStateData = stateDataResponse.body;
      const statesResult = [];
      arrayOfStateData.forEach(state => {
        statesResult.push(new States(state))
      })
      response.send(statesResult);
      console.log(statesResult);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}

function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

function States(state){
  this.stateName = state.state;
  this.positive = state.positive || 'Data not provided';
  this.negative = state.negative || 'Data not provided';
  this.hospitalizedCurrently = state.hospitalizedCurrently || 'Data not provided';
  this.recovered = state.recovered || 'Data not provided';
  this.death = state.death || 'Data not provided';
  this.totalTest = state.totalTestsViral || 'Data not provided';
  this.positiveTests = state.positiveTestsViral || 'Data not provided';
  this.negativeTests = state.negativeTestsViral || 'Data not provided';
}

function renderHomePage(request, response) {
  response.render('views/index');
}

// App listener
app.listen(PORT,() => console.log(`Listening on port ${PORT}`));
