import trigger from ".";
import Spotify from "spotify-web-api-node";
import { CosmosClient, Items, Item } from "@azure/cosmos";
import axios from "axios";
import https from "https";

const getCosmosClient = () => new CosmosClient({
    endpoint: process.env.COSMOSDB_ENDPOINT,
    key: process.env.COSMOSDB_KEY,
    // Disable SSL checks to allow self-signed local cert
    agent: new https.Agent({
        rejectUnauthorized: false
    })
});

beforeAll(async () => {
    // Import local environment variables
    // https://github.com/MicrosoftDocs/azure-docs/issues/38310#issuecomment-642722072
    try {
        const config = require("./../local.settings.json");
        process.env = Object.assign(process.env, {
            ...config.Values
        });
    } catch (err) {}
    
    const cosmos = getCosmosClient();
    const db = (await cosmos.databases.create({ id: process.env.COSMOSDB_DB_ID })).database;
    await db.containers.create({
        id: process.env.COSMOSDB_CONTAINER_ID,
        partitionKey: "/id"
    });
    
    Spotify.prototype.authorizationCodeGrant = jest.fn(async () => ({
        body: {
            access_token: "access_token",
            expires_in: 1,
            refresh_token: "refresh_token",
            scope: [
                'user-read-email',
                'user-library-read',
                'playlist-modify-public'
            ],
            token_type: ""
        },
        ...{} as any
    }));

    Spotify.prototype.getMe = jest.fn(async () => ({
        body: {
            display_name: "",
            external_urls: {
                spotify: ""
            },
            href: "",
            id: "id",
            type: "user",
            uri: "",
            birthdate: "01-01-1970",
            country: "Australia",
            email: "test@test.com",
            product: ""
        },
        ...{} as any
    }));

    Spotify.prototype.createPlaylist = jest.fn(async () => ({
        body: {
            id: "abc"
        },
        ...{} as any
    }));
});

afterAll(async () => {
    const cosmos = getCosmosClient();
    await cosmos.database(process.env.COSMOSDB_DB_ID).delete();
})

it('adds new users', async () => {
    Items.prototype.create = jest.fn(Items.prototype.create);
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
    
    const cosmos = getCosmosClient();

    expect(Spotify.prototype.createPlaylist).toBeCalled();
    expect(Items.prototype.create).toBeCalled();
    expect(axios.post).toBeCalled();
    expect(await cosmos.database(process.env.COSMOSDB_DB_ID).container(process.env.COSMOSDB_CONTAINER_ID).item("id").read()).toBeTruthy();
});

it('updates existing users', async () => {
    Item.prototype.replace = jest.fn(Item.prototype.replace);

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