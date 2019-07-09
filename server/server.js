const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const usersRoute = require('../routes/users');
//const homeRoute = require('../routes/home');
mongoose.Promise = global.Promise;

const { getSecret } = require('./secrets');

mongoose.connect(getSecret('dbUri'), { useNewUrlParser: true }).then(
	() => {
		console.log('Connected to mongoDB');
	},
	(err) => console.log('Error connecting to mongoDB', err)
);

const app = express();
// const port = process.env.PORT || 5000;
const port = 4000;
//sets up the middleware for parsing the bodies and cookies off of the requests
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/auth', usersRoute);
//app.use('/home',homeRoute)
app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});

module.exports = { app };
