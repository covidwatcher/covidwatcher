'use strict';

// Application Dependencies
const express = require('express');
const superagent = require('superagent');
const { response } = require('express');
// const pg = require('pg');


// Application Setup
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();

// Application Middleware
app.use(express.urlencoded({ extended: true }));
// const client = new pg.Client(process.env.DATABASE_URL);
// client.on('error', err => console.log(err));

// Set the view engine for server-side templating
app.set('view engine', 'ejs');
app.use(express.static('./public'));

// Catch-all
app.get('*', (request, response) => response.status(404).send('This route does not exist.'));
app.listen(PORT, () => console.log(`Listening on port: ${PORT}`));