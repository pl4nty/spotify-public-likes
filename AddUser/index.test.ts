import trigger from ".";
import Spotify from "spotify-web-api-node";
import { Items, Item } from "@azure/cosmos";
import axios from "axios";

beforeAll(async () => {
    // Import local environment variables
    // https://github.com/MicrosoftDocs/azure-docs/issues/38310#issuecomment-642722072
    try {
        const config = require("./../local.settings.json");
        process.env = Object.assign(process.env, {
            ...config.Values
        });
    } catch (err) {}
    
    Spotify.prototype.authorizationCodeGrant = jest.fn(async code => ({
        body: {
            access_token: code,
            expires_in: 1,
            refresh_token: "dummy_refresh",
            scope: [
                'user-read-email',
                'user-library-read',
                'playlist-modify-public'
            ],
            token_type: ""
        },
        ...{} as any
    }));

    Spotify.prototype.getMe = jest.fn(async function() {
        return {
            body: {
                display_name: "",
                external_urls: {
                    spotify: ""
                },
                href: "",
                id: this.getAccessToken(),
                type: "user",
                uri: "",
                birthdate: "01-01-1970",
                country: "Australia",
                email: "test@test.com",
                product: ""
            },
            ...{} as any
        }
    });

    Spotify.prototype.createPlaylist = jest.fn(async () => ({
        body: {
            id: "abc"
        },
        ...{} as any
    }));
});

it('adds new users', async () => {
    Items.prototype.query = jest.fn(() => ({
        fetchNext: async () => ({
            resources: []
        }),
        ...{} as any
    }));
    Items.prototype.create = jest.fn();
    axios.post = jest.fn(_ => ({} as any));

    const authCode = "dummycode";
    await trigger({} as any, {
        headers: {},
        method: "GET",
        params: {},
        query: {
            code: authCode
        },
        url: `${process.env.FUNCTION_URL}/AddUser?code=${authCode}`
    });

    expect(Spotify.prototype.createPlaylist).toBeCalled();
    expect(Items.prototype.create).toBeCalled();
    expect(axios.post).toBeCalled();
});

it('updates existing users', async () => {
    const user = {
        refresh_token: "old_token",
        ...{} as any
    }
    Items.prototype.query = jest.fn(() => ({
        fetchNext: async () => ({
            resources: [user]
        }),
        ...{} as any
    }));
    Item.prototype.read = jest.fn(() => ({ resource: user }) as any);
    Item.prototype.replace = jest.fn();

    const authCode = "dummycode";
    await trigger({} as any, {
        headers: {},
        method: "GET",
        params: {},
        query: {
            code: authCode
        },
        url: `${process.env.FUNCTION_URL}/AddUser?code=${authCode}`
    });

    expect(Item.prototype.replace).toBeCalled();
});

it('rejects if the auth code is bad', async () => {
    const context = {
        log: {
            warn: jest.fn(),
            error: jest.fn()
        },
        ...{} as any
    };
    await trigger(context, {
        headers: {},
        method: "GET",
        params: {},
        query: {},
        url: `${process.env.FUNCTION_URL}/AddUser`
    });

    expect(context.log.warn.mock.calls.length+context.log.error.mock.calls.length).toBeGreaterThan(0);
    expect(context.res.status).toBeGreaterThan(399);
});