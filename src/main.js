const express = require('express');
const mongoose = require('mongoose');

const app = express();

mongodbURI = process.env.MONGODB_URI || 

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


mongoose.connect(mongodbURI, (err) => {
    if (err) {
        console.log('Error connecting to database', err);
        throw err;
    }

    console.log('Connected to database');

    app.listen(3000, () => {
        console.log('Server is running on port 3000');
    });
})

