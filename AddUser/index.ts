import { Context, HttpRequest } from "@azure/functions"
import Spotify from "spotify-web-api-node";
import { CosmosClient } from "@azure/cosmos";
import axios from "axios";
import https from "https";

export default async function (context: Context, req: HttpRequest): Promise<void> {
    if (req.query['code']) {
        const spotify = new Spotify({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: `${process.env.FUNCTION_URL}/AddUser`
        });

        const data = await spotify.authorizationCodeGrant(req.query['code']);

        if (data.body['refresh_token']) {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];
            spotify.setAccessToken(access_token);
            spotify.setRefreshToken(refresh_token);

            const cosmos = new CosmosClient({
                endpoint: process.env.COSMOSDB_ENDPOINT,
                key: process.env.COSMOSDB_KEY,
                agent: process.env.NODE_ENV === 'test' ? new https.Agent({
                    rejectUnauthorized: false
                }) : new https.Agent()
            });

            const db = (await cosmos.databases.createIfNotExists({ id: process.env.COSMOSDB_DB_ID })).database;
            const container = (await db.containers.createIfNotExists({
                id: process.env.COSMOSDB_CONTAINER_ID,
                partitionKey: "/id"
            })).container;

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
                    description: `Synced by ${process.env.FUNCTION_URL}. Want your liked songs to be public? DM @pl4nty#5958 on Discord`,
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
                try {
                    await axios.post(`${process.env.FUNCTION_URL}/SyncPlaylist?code=${process.env.FUNCTION_KEY}`, {
                        access_token,
                        refresh_token,
                        playlist,
                        last_sync: 0 // sync all tracks
                    });
                } catch (err) {
                    context.log.error(`Added ${user.id} but couldn't start sync: ${err}`)
                }
                
                context.res = {
                    status: 302,
                    headers: {
                        location: `http://open.spotify.com/user/spotify/playlist/${playlist}`
                    },
                    body: null
                };
            } else {
                // Update refresh token for existing user - it might have expired
                const { resource: doc } = await container.item(id, id).read();
                
                try {
                    await axios.post(`${process.env.FUNCTION_URL}/SyncPlaylist?code=${process.env.FUNCTION_KEY}`, {
                        access_token,
                        refresh_token,
                        playlist: doc.playlist,
                        last_sync: doc.last_sync
                    });
                } catch (err) {
                    context.log.error(`Manual sync failed for user ${user.id}: ${err}`)
                }

                doc.refresh_token = refresh_token;
                doc.last_sync = new Date().toISOString();
                
                await container.item(id, id).replace(doc);

                context.res = {
                    status: 303,
                    headers: {
                        location: `http://open.spotify.com/user/spotify/playlist/${doc.playlist}`
                    },
                    body: null
                };
            }
        } else {
            const message = `Authorisation code is invalid`;
            context.log.error(message)
            context.res = {
                status: 401,
                body: message
            }
        }
    } else if (req.query['error']) {
        const message = `Spotify API returned an error: ${req.query.error}`
        context.log.error(message)
        context.res = {
            status: 401,
            body: message
        }
    } else {
        const message = `Authorisation code not provided`
        context.log.warn(message)
        context.res = {
            status: 401,
            body: message
        }
    }
}