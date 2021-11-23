import { Client, APIErrorCode }from "@notionhq/client";
import { SearchResponse } from "@notionhq/client/build/src/api-endpoints";
import chalk from "chalk";
import DatabaseCtrl from "./database";

namespace NotionCtrl {
    export interface NotionObject {
        type: "page" | "database";
        id: string;
        title: string;
        url: string;
        parent: NotionObject;
    }
}

type NotionObjectPlain = SearchResponse["results"][0];

class NotionCtrl {
    db: DatabaseCtrl;
    clients: {[token: string]: Client} = {};

    constructor(db: DatabaseCtrl) {
        this.db = db;
        this.db.getUsers().forEach((user: DatabaseCtrl.User) => {
            this.clients[user.notionToken] = new Client({auth: user.notionToken});
        });
        console.info(chalk.green("NotionCtrl initialized") + 
            ", loaded " + chalk.cyan(Object.keys(this.clients).length) + " user(s).");
    }

    async addClient(token: string) {
        if (!await this.checkToken(token))
            throw new Error("Invalid token");

        this.clients[token] = new Client({auth: token});
    }

    async checkToken(token: string) {
        try {
            await (new Client({auth: token})).users.me({});
            return true;
        } catch (e) {
            return false;
        }
    }

    convertToNotionObject(object: NotionObjectPlain, list: NotionObjectPlain[]): NotionCtrl.NotionObject {
        if (!object)
            return null;

        let title: string;
        switch(object.object) {
            case "page":
                title = object.properties && object.properties.title &&
                    object.properties.title.type === "title" &&
                    object.properties.title.title.length > 0 ?
                    object.properties.title.title[0].plain_text : null
                break;
            case "database":
                title = object.title.length > 0 ? object.title[0].plain_text : null;
                break;
        }

        let parent: NotionCtrl.NotionObject;
        let parentId: string;
        switch(object.parent.type) {
            case "page_id":
                parentId = object.parent.page_id;
                break;
            case "database_id":
                parentId = object.parent.database_id;
        }
        parent = this.convertToNotionObject(list.find((item) => {
            return item.id === parentId;
        }), list);

        return {
            type: object.object,
            id: object.id,
            title,
            url: object.url,
            parent
        }
    }

    async getObjects(token: string): Promise<NotionCtrl.NotionObject[]> {
        const client = this.clients[token] || new Client({auth: token});
        let objects: NotionObjectPlain[] = [];
        let hasMore = true;
        let nextCursor;

        while (hasMore) {
            const response: SearchResponse = await client.search({
                page_size: 100,
                start_cursor: nextCursor,
            });
            hasMore = response.has_more;
            nextCursor = response.next_cursor;
            objects = objects.concat(response.results);
        }

        // Convert to NotionObject
        return objects.map((object): NotionCtrl.NotionObject => {
            return this.convertToNotionObject(object, objects);
        });
    }
}

export default NotionCtrl;