'use strict';

// Application Dependencies
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Application Setup
const app = express();
const PORT = process.env.PORT;
app.use(cors());

// Application Middleware
app.use(express.urlencoded({ extended: true }));

// Route Definitions
app.get('/', rootHandler);
app.use('*', notFoundHandler);
app.use(errorHandler);

// Route Handlers
function rootHandler(request, response) {
  response.status(200).send('COVID Watcher Backend');
}
function notFoundHandler(request, response) {
  response.status(404).json({ notFound: true });
}
function errorHandler(error, request, response, next) {
  response.status(500).json({ error: true, message: error.message });
}

// App listener
app.listen(PORT,() => console.log(`Listening on port ${PORT}`));