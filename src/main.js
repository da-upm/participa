const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const partials = require('express-partials');
const session = require('express-session');
const morgan = require('morgan');

const mongoose = require('mongoose');

const viewsRouter = require('./routes/views');
const proposalRouter = require('./routes/proposal');

const app = express();

mongodbURI = process.env.MONGODB_URI || "whatever";

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// view engine setup
app.set('views', path.join(__dirname, 'templates'));
app.set('view engine', 'ejs');

// Produce logs via morgan's middleware.
app.use(morgan('common'));

// Middleware for reading form-encoded POST payloads.
app.use(express.json());

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Serve the frontend files.
app.use(express.static(path.join(__dirname, 'templates/static')));
app.use(partials());

// Let Express know if we are using a reverse proxy.
//if (config.server.usingProxy || false) app.set('trust proxy', 1);

app.use('/', viewsRouter);
app.use('/proposals', proposalRouter);

try {
    mongoose.connect(mongodbURI);
    console.log('Connected to database');

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
} catch(error) {
    console.log('Error connecting to database', err);
    throw err;
}
