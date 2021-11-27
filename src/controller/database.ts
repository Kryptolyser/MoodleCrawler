import sqlite from 'better-sqlite3';
import chalk from 'chalk';

namespace DatabaseCtrl {
    export interface User {
        notionToken: string;
        notionDatabase: string;
        notionPage: string;
        calendarUrl: string;
        chatId: string;
    }
}

class DatabaseCtrl {
    db: sqlite.Database;

    constructor() {
        this.db = new sqlite('database.db');
        this.initialize();
    }

    initialize() {
        const statements = [
            "CREATE TABLE IF NOT EXISTS users (notion_token TEXT PRIMARY KEY, notion_database TEXT, notion_page TEXT, calendar_url TEXT, chat_id INTEGER);",
            "CREATE TABLE IF NOT EXISTS events (user_notion_token TEXT, event_id TEXT, PRIMARY KEY(user_notion_token, event_id))"
        ].map(sql => this.db.prepare(sql));

        this.db.transaction(() => {
            statements.forEach(statement => statement.run());
        })();

        this.db.exec("INSERT or REPLACE INTO users (notion_token, notion_database, notion_page, calendar_url, chat_id) VALUES ('n_test_token', 'n_DATABASE', 'n_PAGE', 'https://test', 12345)");

        console.info(chalk.green("Database initialized"));
    }

    getUsers(): DatabaseCtrl.User[] {
        return this.db.prepare('SELECT * FROM users').all();
    }

    hasTelegramChatId(chatId: number): boolean {
        return this.db.prepare('SELECT chat_id FROM users WHERE chat_id = ?').get(chatId) !== undefined;
    }

    updateTelegramCharId(chatId: number, notionToken: string): boolean {
        const result = this.db.prepare('UPDATE users SET chat_id = ? WHERE notion_token = ?').run(chatId, notionToken);
        return result.changes && result.changes > 0;
    }
}

export default DatabaseCtrl;