import { AzureFunction, Context, HttpRequest } from "@azure/functions"
import Spotify from "spotify-web-api-node";

const httpTrigger: AzureFunction = async function (context: Context, req: HttpRequest): Promise<void> {
    const scopes = [
        'user-read-email', // read user ID and name
        'user-library-read', // read saved tracks
        'playlist-modify-public' // create and write to sync playlist
    ];
    // TODO generate state string
    const state = 'some-state-of-my-choice';

    const spotify = new Spotify({
        clientId: process.env.SPOTIFY_CLIENT_ID,
        redirectUri: process.env.SPOTIFY_REDIRECT_URI
    });
    
    context.res = {
        status: 302,
        headers: {
            location: spotify.createAuthorizeURL(scopes, state)
        },
        body: null
    };
};

export default httpTrigger;