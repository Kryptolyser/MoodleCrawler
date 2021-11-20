import { Client, APIErrorCode }from "@notionhq/client";
import { getPage, SearchResponse } from "@notionhq/client/build/src/api-endpoints";
import Database from "./database";

interface NotionObject {
    type: "page" | "database";
    id: string;
    title: string;
    url: string;
    parent: NotionObject;
}

class NotionClient {
    db: Database;
    token: string;
    notion: Client;

    constructor(db: Database, token: string) {
        this.db = db;
        this.token = token;
        this.notion = new Client({auth: token});
    }

    async checkToken() {
        try {
            await this.notion.users.me({});
            return true;
        } catch (e) {
            return false;
        }
    }

    async convertToNotionObject(object: any): Promise<NotionObject> {
        let title: string;
        switch(object.object) {
            case "page":
                title = object.properties &&
                    object.properties.title.type === "title" &&
                    object.properties.title.title.length > 0 ?
                    object.properties.title.title[0].plain_text : null
                break;
            case "database":
                title = object.title.length > 0 ? object.title[0].plain_text : null;
                break;
            default:
                title = object.title;
        }

        let parent: NotionObject;
        if (object.parent) {
            switch(object.parent.type) {
                case "page_id":
                    parent = await this.convertToNotionObject(await this.getPage(object.parent.page_id));
                    break;
                case "page":
                    parent = await this.convertToNotionObject(await this.getPage(object.parent.id));
                    break;
                case "database_id":
                    parent = await this.convertToNotionObject(await this.getDatabase(object.parent.database_id));
                    break;
                case "database":
                    parent = await this.convertToNotionObject(await this.getDatabase(object.parent.id));
                    break;
                case "workspace":
                    break;
                default:
                    console.log(object);
            }
        }

        return {
            type: object.object ? object.object : object.type,
            id: object.id,
            title,
            url: object.url,
            parent
        }
    }

    async getPage(id: string): Promise<NotionObject> {
        const page = await this.notion.pages.retrieve({page_id: id});
        return await this.convertToNotionObject(page);
    }

    async getDatabase(id: string): Promise<NotionObject> {
        const database = await this.notion.databases.retrieve({database_id: id});
        return await this.convertToNotionObject(database);
    }

    async getDatabases(): Promise<NotionObject[]> {
        const databases = await this.notion.search({
            filter: {value: "database", property: "object"}
        });

        return await Promise.all(databases.results.filter((database) => {
            return database.object === "database";
        }).map(async (database): Promise<NotionObject> => {
            return await this.convertToNotionObject(database);
        }));
    }

    async getPages(): Promise<NotionObject[]> {
        const pages = await this.notion.search({
            filter: {value: "page", property: "object"}
        });

        return await Promise.all(pages.results.filter((page) => {
            return page.object === "page" &&
                !page.archived &&
                page.properties.title;
        }).map(async (page): Promise<NotionObject> => {
            return await this.convertToNotionObject(page);
        }));
    }

    async getObjects() {
        const databases = await this.getDatabases();
        const pages = await this.getPages();
        
        return {
            databases: databases,
            pages: pages
        }
    }
}

export default NotionClient;