import express from "express";
import favicon from "serve-favicon";
import path from "path";
import bodyParser from "body-parser";
import ical from "node-ical";
import NotionCtrl from "./controller/notion";
import TelegramCtrl from "./controller/telegram";
import MoodleCtrl from "./controller/moodle";
import DatabaseCtrl from "./controller/database";

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
app.use(express.static(__dirname + '/public'));

app.get( "/", async ( req, res ) => {
    // render the index template
    res.render("index", {});
} );

app.post( "/api/notion/check", async ( req, res ) => {
    //const notionToken = req.body.notion;
    const notionToken = env.NOTION_TOKEN;
    //const moodleUrl = req.body.moodle;
    const moodleUrl = env.MOODLE_URL;

    let check: boolean = false;
    let objects: NotionCtrl.NotionObject[];
    let events: MoodleCtrl.MoodleEvent[];
    notion.checkToken(notionToken).then(async (result) => {
        check = result;
        if (check) {
            objects = await notion.getObjects(notionToken);
            objects = objects.map((object) => {
                const newObject = object;
                newObject.title = object.title ? object.title : "UNTITLED";
                return newObject;
            });

            events = await MoodleCtrl.getEvents(moodleUrl);
        }
    })
    .catch((err) => console.error(err))
    .finally(() => {
        res.json({
            notion: notionToken,
            moodle: moodleUrl,
            check: check,
            objects: objects,
            events: events
        });
    });
});

app.post( "/api/notion/update", async ( req, res ) => {
    console.log(req.body);
    //res.status(400).send();

    res.render("update", {url: "https://google.de"});
});

// Start database
const db = new DatabaseCtrl();
const notion = new NotionCtrl(db);
const telegram = new TelegramCtrl(db, env.TELEGRAM_TOKEN || "", env.WEBSERVER_URL || "");

// Start the express server
app.listen( port, () => {
    console.log( `Server started at http://localhost:${ port }` );
} );

// const nc = new NotionCtrl(db, env.NOTION_TOKEN);
// nc.getObjects().then(console.log);
// nc.getDatabases().then((databases) => {console.log(databases)});
// nc.getPages().then((pages) => {console.log(pages)});