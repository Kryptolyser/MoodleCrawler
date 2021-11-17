import { Client }from "@notionhq/client";

class NotionClient {
    notion: Client;

    constructor(token: string) {
        // Initializing a client
        this.notion = new Client({
            auth: token,
        });

        ;(async () => {
            const listUsersResponse = await this.notion.search({
                filter: {value: "database", property: "object"}
            });
            console.log(listUsersResponse);
        })()
    }
}

export default NotionClient;