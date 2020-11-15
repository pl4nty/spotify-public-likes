import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import Spotify from "spotify-web-api-node";
import { CosmosClient } from "@azure/cosmos";
import axios from "axios";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    if (req.query['code']) {
        const spotify = new Spotify({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: process.env.SPOTIFY_REDIRECT_URI
        });

        const data = await spotify.authorizationCodeGrant(req.query['code']);

        if (data.body['refresh_token']) {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            spotify.setAccessToken(access_token);
            spotify.setRefreshToken(refresh_token);

            const cosmos = new CosmosClient({
                endpoint: process.env.COSMOSDB_ENDPOINT,
                key: process.env.COSMOSDB_KEY
            });
            const db = cosmos.database(process.env.COSMOSDB_DB_ID);
            const container = db.container(process.env.COSMOSDB_CONTAINER_ID);

            // Get user details
            const user = (await spotify.getMe()).body;
            const id = user.id;

            // Check if user is in database
            const { resources: items } = await container.items.query({
                query: 'SELECT * FROM c WHERE c.id=@id',
                parameters: [{name: '@id', value: id}]
            }).fetchNext();

            if (items.length === 0) {
                // Create sync playlist
                // @ts-ignore as types haven't been updated to v5 yet
                const p = await spotify.createPlaylist(`${user.display_name}'s Likes`, {
                    description: `Songs liked by ${user.display_name}.`,
                    public: true
                });

                const playlist = p.body.id;

                // Add new user
                await container.items.create({
                    id,
                    refresh_token,
                    playlist,
                    last_sync: (new Date()).toISOString()
                });

                // Trigger sync to new playlist
                axios.post(process.env.SYNC_ENDPOINT, {
                    access_token,
                    refresh_token,
                    playlist,
                    last_sync: 0 // sync all tracks
                });

                context.res = {
                    body: "Enjoy!"
                };
            } else {
                // Update refresh token for existing user - it might have expired
                const { resource: doc } = await container.item(id, id).read();
                doc.refresh_token = refresh_token;
                
                await container.item(id, id).replace(doc);

                context.res = {
                    body: "You're already being synced..."
                };
            }
        } else {
            // generic error - analytics?
        }
    } else if (req.query['error']) {
        // display error - analytics?
    } else {
        // generic error - analytics?
    }
};

export default httpTrigger;