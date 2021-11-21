import { Client, APIErrorCode }from "@notionhq/client";
import { SearchResponse } from "@notionhq/client/build/src/api-endpoints";
import Database from "./database";

interface NotionObject {
    type: "page" | "database";
    id: string;
    title: string;
    url: string;
    parent: NotionObject;
}

type NotionObjectPlain = SearchResponse["results"][0];

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

    convertToNotionObject(object: NotionObjectPlain, list: NotionObjectPlain[]): NotionObject {
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

        let parent: NotionObject;
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

    async getObjects(): Promise<NotionObject[]> {
        let objects: NotionObjectPlain[] = [];
        let hasMore = true;
        let nextCursor;

        while (hasMore) {
            const response: SearchResponse = await this.notion.search({
                page_size: 100,
                start_cursor: nextCursor,
            });
            hasMore = response.has_more;
            nextCursor = response.next_cursor;
            objects = objects.concat(response.results);
        }

        // Convert to NotionObject
        return objects.map((object): NotionObject => {
            return this.convertToNotionObject(object, objects);
        });
    }
}

export default NotionClient;