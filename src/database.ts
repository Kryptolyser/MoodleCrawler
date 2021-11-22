import sqlite from 'better-sqlite3';

class Database {
    db: sqlite.Database;

    constructor() {
        this.db = new sqlite('database.db');
        this.initialize();
    }

    initialize() {
        const statements = [
            'CREATE TABLE IF NOT EXISTS users (notion_token TEXT PRIMARY KEY, notion_database TEXT, notion_page TEXT, calendar_url TEXT, notification_url TEXT);',
            'CREATE TABLE IF NOT EXISTS events (user_notion_token TEXT, event_id TEXT, PRIMARY KEY(user_notion_token, event_id))'
        ].map(sql => this.db.prepare(sql));

        this.db.transaction(() => {
            statements.forEach(statement => statement.run());
        })();

        console.log('Database initialized');
    }


}

export default Database;