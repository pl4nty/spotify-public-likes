import trigger from ".";
import Spotify from "spotify-web-api-node";

let playlist = [];

beforeAll(async () => {
    // Import local environment variables
    // https://github.com/MicrosoftDocs/azure-docs/issues/38310#issuecomment-642722072
    try {
        const config = require("./../local.settings.json");
        process.env = Object.assign(process.env, {
            ...config.Values
        });
    } catch (err) {}

    Spotify.prototype.addTracksToPlaylist = jest.fn(async (_,tracks) => {
        playlist.concat(tracks);
        return {} as any;
    });
});

afterEach(() => playlist = []);

it('adds new songs and removes unliked ones', async () => {
    // Mock Spotify API responses
    Spotify.prototype.getMySavedTracks = jest.fn(async () => ({
        body: {
            total: 1,
            items: [
                {
                    added_at: 0,
                    track: {
                        uri: "existing"
                    }
                },
                {
                    added_at: 1,
                    track: {
                        uri: "new"
                    }
                }
            ]
        },
        ...{} as any
    }));
    
    await trigger({
        log: jest.fn(console.log)
    } as any, {
        body: {
            access_token: "access",
            refresh_token: "refresh",
            playlist: "playlist",
            last_sync: 0
        },
        ...{} as any
    });
});