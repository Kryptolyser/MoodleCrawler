import express from "express";
import favicon from "serve-favicon";
import path from "path";
import bodyParser from "body-parser";
import ical from "node-ical";
import NotionClient from "./notion_client";
import MoodleHelper from "./moodle_helper";
import Database from "./database";

// Load environment variables from .env file
const env = require('dotenv').config().parsed;

// Setup express server
const app = express();
const port = env.PORT || 8080;

// Body parser
app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use(express.json());
app.use(express.urlencoded());

// Configure Express to use EJS
app.set( "views", path.join( __dirname, "views" ) );
app.set( "view engine", "ejs" );

// Define a routes
app.use(favicon(__dirname + '/public/images/favicon.png'));

app.get( "/", async ( req, res ) => {
    // render the index template
    res.render("index", {});
} );

app.post( "/api/notion/check", async ( req, res ) => {
    // const notionClient = new NotionClient(db, req.body.notion);
    const notionClient = new NotionClient(db, env.NOTION_TOKEN);

    const check = await notionClient.checkToken();
    const objects = check ? (await notionClient.getObjects()).map((object) => {
        const newObject = object;
        newObject.title = object.title ? object.title : "UNTITLED";
        return newObject;
    }) : null;

    ical.async.fromURL(env.MOODLE_URL, {}, (error, data) => {
    // ical.async.fromURL(req.body.moodle, {}, (error, data) => {
        if (error) {
            console.log(error);
            res.json({check, objects});
        }
        else
            res.json({
                check,
                objects,
                events: MoodleHelper.convertCalendar(data)
            });
    });
} );

// Start database
const db = new Database();

// Start the express server
app.listen( port, () => {
    console.log( `server started at http://localhost:${ port }` );
} );

const nc = new NotionClient(db, env.NOTION_TOKEN);
// nc.getObjects().then(console.log);
// nc.getDatabases().then((databases) => {console.log(databases)});
// nc.getPages().then((pages) => {console.log(pages)});