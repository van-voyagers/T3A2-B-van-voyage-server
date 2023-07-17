// Make the .env data ready for use.
const dotenv = require('dotenv');
dotenv.config();

// Import the Express package and configure some needed data.
const express = require('express');
const app = express();
// If no process.env.X is found, assign a default value instead.
const HOST = process.env.HOST || 'localhost';
const PORT = process.env.PORT || 3000;

// Configure some basic Helmet settings on the server instance.
const helmet = require('helmet');
app.use(helmet());
app.use(helmet.permittedCrossDomainPolicies());
app.use(helmet.referrerPolicy());
app.use(helmet.contentSecurityPolicy({
    directives:{
        defaultSrc:["'self'"]
    }
}));

// Configure some basic CORS settings on the server instance.
// These origin values don't actually have to be anything - 
// this project exists without a front-end, but any front-end
// that should interact with this API should be listed in the 
// array of origins for CORS configuration.
const cors = require('cors');
var corsOptions = {
    origin: ["http://localhost:5000", "https://deployedApp.com"],
    optionsSuccessStatus: 200
}
app.use(cors(corsOptions));

// Configure some API-friendly request data formatting.
app.use(express.json());
app.use(express.urlencoded({extended: true}));

// Add a route just to make sure things work.
// This path is the server API's "homepage".
app.get('/', (request, response) => {
    response.json({
        message:"Hello world!"
    });
});




// Keep this route at the end of this file, only before the module.exports!
// A 404 route should only trigger if no preceding routes or middleware was run. 
// So, put this below where any other routes are placed within this file.
app.get('*', (request, response) => {
    response.status(404).json({
        message: "No route with that path found!",
        attemptedPath: request.path
    });
});

// Export everything needed to run the server.
module.exports = {
    HOST,
    PORT,
    app
}