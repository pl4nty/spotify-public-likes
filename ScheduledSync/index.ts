import { Context } from "@azure/functions";
import { CosmosClient } from "@azure/cosmos";
import axios from "axios";
import https from "https";

export default async function (context: Context, myTimer: any): Promise<void> {
    const cosmos = new CosmosClient({
        endpoint: process.env.COSMOSDB_ENDPOINT,
        key: process.env.COSMOSDB_KEY,
        agent: process.env.NODE_ENV === 'test' ? new https.Agent({
            rejectUnauthorized: false
        }) : new https.Agent()
    });
    const db = cosmos.database(process.env.COSMOSDB_DB_ID);
    const container = db.container(process.env.COSMOSDB_CONTAINER_ID);

    // Get all users
    const { resources: users } = await container.items.query({
        query: 'SELECT * FROM c'
    }).fetchAll();

    // Sync each user and update sync timestamp
    users.forEach(async user => {
        axios.post(`${process.env.FUNCTION_URL}/SyncPlaylist?code=${process.env.FUNCTION_KEY}`, user);
        user.last_sync = (new Date()).toISOString();
        container.item(user.id, user.id).replace(user);
    });
}