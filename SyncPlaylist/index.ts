import { Context, HttpRequest } from "@azure/functions";
import Spotify from "spotify-web-api-node";

export default async function (context: Context, req: HttpRequest): Promise<void> {
    if (req.body.playlist) {
        const spotify = new Spotify({
            clientId: process.env.SPOTIFY_CLIENT_ID,
            clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
            redirectUri: `${process.env.FUNCTION_URL}/AddUser`,
            refreshToken: req.body.refresh_token
        });
        if (req.body.access_token) {
            spotify.setAccessToken(req.body.access_token);
        } else {
            spotify.setAccessToken((await spotify.refreshAccessToken()).body.access_token);
        }

        // Paginate through liked tracks, adding any additions since last sync
        // TODO check if responses are sorted by date, for optimisations
        const lastSync = new Date(req.body.last_sync);
        let offset = 0;
        let tracks;
        do {
            tracks = (await spotify.getMySavedTracks({ offset })).body;
            const uris = tracks.items.filter(track => new Date(track.added_at) > lastSync).map(track => track.track.uri);
            spotify.addTracksToPlaylist(req.body.playlist, uris);
            offset += 20;
        } while (offset < tracks.total);
    }
}