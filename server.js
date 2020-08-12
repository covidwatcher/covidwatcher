'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');
app.use(express.static('./public'));

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.log(err));

// Route Definitions
app.get('/', getSavedStates);
// app.get('/state', addState);
app.get('/states', getStateData);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
// function rootHandler(request, response) {
//   let viewModelObject = {states: [{stateName:'Iowa', positive:'3', negative:'4',hospitalizedCurrently:'1',recovered:'12',death:'10',totalTest:'300',positiveTests:'21',negativeTests:'25'}]};
//   response.render('index', viewModelObject);
// }

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
      return statesResult;
    })
    .then( results => {
      console.log(results);
      let viewModelObject = {states: results};
      response.render('state', viewModelObject)
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

function getSavedStates (request, response) {
  const SQL = `
  SELECT *
  FROM userstates
  `;
  client.query(SQL)
    .then(result => {
      let viewModelObject = {
        states: result.rows,
      }
      response.render('index', viewModelObject);
    })
}

// function stateHandler(request, response) {
//   const state = request.query.state;
// }
// function addState(request, response) {
//   console.log(response.body)
//   let {stateName, positive, negative, hospitalizedCurrently, recovered, death, totalTest, positiveTests, negativeTests} = request.body;
//   const SQL = `
//   INSERT INTO userstates ("stateName", positive, negative, "hospitalizedCurrently", recovered, death, "totalTest", "positiveTests", "negativeTests")
//   VALUES ($1, $2,)
//   `;
//   const values = [stateName, positive, negative, hospitalizedCurrently, recovered, death, totalTest, positiveTests, negativeTests]
//   console.log(values);
// }

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

// App listener
client.connect()
  .then(() => {
    app.listen(PORT,() => console.log(`Listening on port ${PORT}`));
  })
  .catch(err => {throw err;})
