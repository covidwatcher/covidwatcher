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

  // let state = request.query.state;
  // if(request.query.state.length > 2){
  //   let state = nameToAbrv(state, nameConvert).name;
  const state = request.query.state;

  // if(state.toString().length > 2){
  //   state = nameToAbrv(state, nameConvert).name;
  // } else state = request.query.state;

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

        let fiveMinutesAgo = new Date(Date.now() - 60 * 1000 * 5);

        if (timeOnRow > fiveMinutesAgo) {
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
            const SQL = `
            UPDATE userstates
            SET "updatedTime" = $2, positive = $3,  negative = $4, "hospitalizedCurrently" = $5, recovered = $6, death = $7, "totalTest" = $8, "positiveTests" = $9, "negativeTests" = $10 
            WHERE "stateName" = $1
            `;
            let values = [state.stateName, state.date, state.positive, state.negative, state.hospitalizedCurrently, state.recovered, state.death, state.totalTest, state.positiveTests, state.negativeTests];
            return client.query(SQL, values)
              .then(results => {
                console.log(results);
                const SQL = `
                SELECT *
                FROM userstates
                WHERE "stateName" = $1
                `;
                let values = [state.stateName];
                return client.query(SQL, values)
                  .then(results => {
                    return results.rows[0];
                  })
                  .then(state => {
                    const { runChart } = require('chart.js');
                    runChart(state);
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
  const altText = 'Not Reported';
  this.date = new Date();
  this.stateName = state.state;
  this.positive = state.positive || altText;
  this.negative = state.negative || altText;
  this.hospitalizedCurrently = state.hospitalizedCurrently || altText;
  this.recovered = state.recovered || altText;
  this.death = state.death || altText;
  this.totalTest = state.totalTestsViral || altText;
  this.positiveTests = state.positiveTestsViral || altText;
  this.negativeTests = state.negativeTestsViral || altText;
  this.displayName = arraySearch(state.state, stateArray).name || state.state;
  this.flag = arraySearch(state.state, stateArray).flag;
}

function arraySearch(state, array) {
  for (var i = 0; i < array.length; i++) {
    if (array[i].abrv === state || array[i].name === state) {
      return array[i];
    }
  }
}


var stateArray = [
  {abrv: 'AL', name: 'Alabama', flag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/Flag_of_Alabama.svg/23px-Flag_of_Alabama.svg.png'},
  {abrv: 'AK', name: 'Alaska', flag: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Flag_of_Alaska.svg/21px-Flag_of_Alaska.svg.png'},
  {abrv: 'AR', name: 'Arkansas', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Flag_of_Arkansas.svg/23px-Flag_of_Arkansas.svg.png'},
  {abrv: 'CA', name: 'California', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_California.svg/23px-Flag_of_California.svg.png'},
  {abrv: 'CO', name: 'Colorado', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/Flag_of_Colorado.svg/23px-Flag_of_Colorado.svg.png'},
  {abrv: 'CT', name: 'Connecticut', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Flag_of_Connecticut.svg/20px-Flag_of_Connecticut.svg.png'},
  {abrv: 'DE', name: 'Delaware', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c6/Flag_of_Delaware.svg/23px-Flag_of_Delaware.svg.png'},
  {abrv: 'FL', name: 'Florida', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Florida.svg/23px-Flag_of_Florida.svg.png'},
  {abrv: 'GA', name: 'Georgia', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Flag_of_Georgia_%28U.S._state%29.svg/23px-Flag_of_Georgia_%28U.S._state%29.svg.png'},
  {abrv: 'HI', name: 'Hawaii', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Flag_of_Hawaii.svg/23px-Flag_of_Hawaii.svg.png'},
  {abrv: 'ID', name: 'Idaho', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_Idaho.svg/19px-Flag_of_Idaho.svg.png'},
  {abrv: 'IL', name: 'Illinois', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/01/Flag_of_Illinois.svg/23px-Flag_of_Illinois.svg.png'},
  {abrv: 'IN', name: 'Indiana', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/Flag_of_Indiana.svg/23px-Flag_of_Indiana.svg.png'},
  {abrv: 'IA', name: 'Iowa', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/Flag_of_Iowa.svg/23px-Flag_of_Iowa.svg.png'},
  {abrv: 'KS', name: 'Kansas', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Flag_of_Kansas.svg/23px-Flag_of_Kansas.svg.png'},
  {abrv: 'KY', name: 'Kentucky', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Flag_of_Kentucky.svg/23px-Flag_of_Kentucky.svg.png'},
  {abrv: 'LA', name: 'Louisiana', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Flag_of_Louisiana.svg/23px-Flag_of_Louisiana.svg.png'},
  {abrv: 'ME', name: 'Maine', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Flag_of_Maine.svg/19px-Flag_of_Maine.svg.png'},
  {abrv: 'MD', name: 'Maryland', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Flag_of_Maryland.svg/23px-Flag_of_Maryland.svg.png'},
  {abrv: 'MA', name: 'Massachusetts', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f2/Flag_of_Massachusetts.svg/23px-Flag_of_Massachusetts.svg.png'},
  {abrv: 'MI', name: 'Michigan', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Flag_of_Michigan.svg/23px-Flag_of_Michigan.svg.png'},
  {abrv: 'MN', name: 'Minnesota', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Flag_of_Minnesota.svg/23px-Flag_of_Minnesota.svg.png'},
  {abrv: 'MS', name: 'Mississippi', flag:''},
  {abrv: 'MO', name: 'Missouri', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5a/Flag_of_Missouri.svg/23px-Flag_of_Missouri.svg.png'},
  {abrv: 'MT', name: 'Montana', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Flag_of_Montana.svg/23px-Flag_of_Montana.svg.png'},
  {abrv: 'NE', name: 'Nebraska', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Flag_of_Nebraska.svg/23px-Flag_of_Nebraska.svg.png'},
  {abrv: 'NV', name: 'Nevada', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Flag_of_Nevada.svg/23px-Flag_of_Nevada.svg.png'},
  {abrv: 'NH', name: 'New Hampshire', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Flag_of_New_Hampshire.svg/23px-Flag_of_New_Hampshire.svg.png'},
  {abrv: 'NJ', name: 'New Jersey', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/Flag_of_New_Jersey.svg/23px-Flag_of_New_Jersey.svg.png'},
  {abrv: 'NM', name: 'New Mexico', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Flag_of_New_Mexico.svg/23px-Flag_of_New_Mexico.svg.png'},
  {abrv: 'NY', name: 'New York', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_New_York.svg/23px-Flag_of_New_York.svg.png'},
  {abrv: 'NC', name: 'North Carolina', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Flag_of_North_Carolina.svg/23px-Flag_of_North_Carolina.svg.png'},
  {abrv: 'ND', name: 'North Dakota', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Flag_of_North_Dakota.svg/21px-Flag_of_North_Dakota.svg.png'},
  {abrv: 'OH', name: 'Ohio', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Flag_of_Ohio.svg/25px-Flag_of_Ohio.svg.png'},
  {abrv: 'OK', name: 'Oklahoma', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6e/Flag_of_Oklahoma.svg/23px-Flag_of_Oklahoma.svg.png'},
  {abrv: 'OR', name: 'Oregon', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Flag_of_Oregon.svg/23px-Flag_of_Oregon.svg.png'},
  {abrv: 'PA', name: 'Pennsylvania', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Pennsylvania.svg/23px-Flag_of_Pennsylvania.svg.png'},
  {abrv: 'RI', name: 'Rhode Island', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Flag_of_Rhode_Island.svg/19px-Flag_of_Rhode_Island.svg.png'},
  {abrv: 'SC', name: 'South Carolina', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Flag_of_South_Carolina.svg/23px-Flag_of_South_Carolina.svg.png'},
  {abrv: 'SD', name: 'South Dakota', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Flag_of_South_Dakota.svg/23px-Flag_of_South_Dakota.svg.png'},
  {abrv: 'TN', name: 'Tennessee', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Flag_of_Tennessee.svg/23px-Flag_of_Tennessee.svg.png'},
  {abrv: 'TX', name: 'Texas', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Flag_of_Texas.svg/23px-Flag_of_Texas.svg.png'},
  {abrv: 'UT', name: 'Utah', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Flag_of_Utah.svg/23px-Flag_of_Utah.svg.png'},
  {abrv: 'VT', name: 'Vermont', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Flag_of_Vermont.svg/23px-Flag_of_Vermont.svg.png'},
  {abrv: 'VA', name: 'Virginia', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Flag_of_Virginia.svg/22px-Flag_of_Virginia.svg.png'},
  {abrv: 'WA', name: 'Washington', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Flag_of_Washington.svg/23px-Flag_of_Washington.svg.png'},
  {abrv: 'WV', name: 'West Virginia', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Flag_of_West_Virginia.svg/23px-Flag_of_West_Virginia.svg.png'},
  {abrv: 'WI', name: 'Wisconsin', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Flag_of_Wisconsin.svg/23px-Flag_of_Wisconsin.svg.png'},
  {abrv: 'WY', name: 'Wyoming', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Flag_of_Wyoming.svg/22px-Flag_of_Wyoming.svg.png'},
  {abrv: 'DC', name: 'District of Columbia', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Flag_of_the_District_of_Columbia.svg/23px-Flag_of_the_District_of_Columbia.svg.png'},
  {abrv: 'AS', name: 'American Samoa', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Flag_of_American_Samoa.svg/23px-Flag_of_American_Samoa.svg.png'},
  {abrv: 'GU', name: 'Guam', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Flag_of_Guam.svg/23px-Flag_of_Guam.svg.png'},
  {abrv: 'MP', name: 'Northern Mariana Islands', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Flag_of_the_Northern_Mariana_Islands.svg/23px-Flag_of_the_Northern_Mariana_Islands.svg.png'},
  {abrv: 'PR', name: 'Puerto Rico', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/2/28/Flag_of_Puerto_Rico.svg/23px-Flag_of_Puerto_Rico.svg.png'},
  {abrv: 'VI', name: 'U.S. Virgin Islands', flag:'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Flag_of_the_United_States_Virgin_Islands.svg/23px-Flag_of_the_United_States_Virgin_Islands.svg.png'},
];

// App listener
client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
  })
  .catch(err => { throw err; })
