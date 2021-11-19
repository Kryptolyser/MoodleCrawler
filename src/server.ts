import express from "express";
import path from "path";
import NotionClient from "./notion_client";
import Database from "./database";

// Load environment variables from .env file
const env = require('dotenv').config().parsed;

// Setup express server
const app = express();
const port = env.PORT || 8080;

// Configure Express to use EJS
app.set( "views", path.join( __dirname, "views" ) );
app.set( "view engine", "ejs" );

// Define a route handler for the default home page
app.get( "/", async ( req, res ) => {
    // render the index template
    res.render( "index" );
} );

// Start database
const db = new Database();

// Start the express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );

const nc = new NotionClient(db, env.NOTION_TOKEN);
nc.getDatabases().then((databases) => {console.log(databases)});
nc.getPages().then((pages) => {console.log(pages)});