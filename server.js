'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
var methodOverride = require('method-override')

const cors = require('cors');
const superagent = require('superagent');
const pg = require('pg');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Application Middleware
app.use(express.urlencoded({ extended: true }));


// override with POST having ?_method=DELETE
app.use(methodOverride('_method'))

/* <form method="POST" action="/resource?_method=DELETE">
  <button type="submit">Delete resource</button>
</form> */

const favicon = require('serve-favicon');
const path = require('path');

app.use(favicon(path.join(__dirname, 'public', 'images/virus-favicon.png')));


// Set the view engine for server-side templating
app.set('view engine', 'ejs');
app.use(express.static('./public'));

// Database Setup
const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.log(err));

// Route Definitions
app.get('/', getSavedStates);
app.get('/state', getStateData);
app.get('/about', (req, res) => {
  res.render('about.ejs');
});
app.post('/saveState', saveStateData);
app.delete('/states/:state', deleteState);
app.use('*', notFoundHandler);
app.use(errorHandler);


function getStateData(request, response) {
  const state = request.query.state;
  if (!state) {
    let viewModelObject = { states: [] }
    response.render('state', viewModelObject)
    return
  }
  const url = `https://api.covidtracking.com/v1/states/${state}/current.json`;
  superagent.get(url)
    .query({
      format: 'json'
    })
    .then(stateDataResponse => {
      const state = stateDataResponse.body;
      const statesResult = [];
      statesResult.push(new States(state))
      return statesResult;
    })
    .then(results => {
      // console.log(results);
      let viewModelObject = { states: results };
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

// eslint-disable-next-line no-unused-vars
function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

function getSavedStates(request, response) {
  const SQL = `
  SELECT *
  FROM userstates
  `;
  client.query(SQL)
    .then(result => {
      return Promise.all(result.rows.map(row => {
        let timeOnRow = new Date(Date.parse(row.updatedTime));

        // let hourAgo = new Date(Date.now() - 60 * 1000 * 30);

        if (timeOnRow > 0) {
          return row
        }
        // console.log('Row is out of date: ', row);
        let state = row.stateName;
        const url = `https://api.covidtracking.com/v1/states/${state}/current.json`;
        return superagent.get(url)
          .then(response => {
            return new States(response.body);
          })
          .then(state => {
            // console.log(state);
            const SQL = `
            UPDATE userstates
            SET "updatedTime" = '11'
            WHERE "stateName" = $1
            `;
            let values = [state.stateName];
            // , positive = ${state.positive}, negative = ${state.negative}, "hospitalizedCurrently" = ${state.hospitalizedCurrently}, recovered = ${state.recovered}, death = ${state.death}, "totalTest" = ${state.total_test}, "positiveTests" = 10

            //   , "negativeTests" = ${state.negative_test}
            // ;

            // console.log(state.stateName, state.date);
            // let values = [state.date, state.positive, state.negative, state.hospitalized, state.recovered, state.death, state.total_test, state.positive_test, state.negative_test];
            return client.query(SQL, values)
              .then(results => {
                console.log(results);
                const SQL = `
                SELECT *
                FROM userstates
                WHERE "stateName" = '${state.stateName}'
                `;
                return client.query(SQL)
                  .then(results => {
                    return results.row[0];
                  })
              })
          })
          .catch(err => {
            console.log(err);
            return row;
          })
      }))
    })
    .then(states => {
      // console.log(states);
      let viewModelObject = {
        states,
      }
      response.render('index', viewModelObject);
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function saveStateData(request, response) {
  const SQL = `
  INSERT INTO userstates ("stateName", "updatedTime", positive, negative, "hospitalizedCurrently", recovered, death, "totalTest", "positiveTests", "negativeTests")
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
  `;
  let { name, date, positive, negative, hospitalized, recovered, death, total_test, positive_test, negative_test } = request.body
  let values = [name, date, positive, negative, hospitalized, recovered, death, total_test, positive_test, negative_test];
  client.query(SQL, values)
    .then(response.redirect('/state'))
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function deleteState(request, response) {
  const SQL = `
  DELETE
  FROM userstates
  WHERE "stateName" = $1
  `
  let values = [request.params.state];
  client.query(SQL, values)
    .then(function deleteSQLstate() {
      response.redirect('/')
    })
    .catch(err => {
      console.log(err);
      errorHandler(err, request, response);
    });
}

function States(state) {
  this.date = new Date();
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
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  })
  .catch(err => { throw err; })
