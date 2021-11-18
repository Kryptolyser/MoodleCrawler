import * as sqlite from 'sqlite3';
const sqlite3 = sqlite.verbose();

class Database {
    db: sqlite.Database;

    constructor() {
        this.db = new sqlite3.Database('database.db', (err: Error) => {
            if (err)
                return console.error(err.stack);
            console.info('Connected to the SQlite database.');

            this.initialize();
        });
    }

    initialize() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, calendar_url TEXT)`,
            (err: Error) => {
                if (err)
                    return console.error(err.stack);
                console.info('Database initialized.');
            }
        );
    }


}

export default Database;