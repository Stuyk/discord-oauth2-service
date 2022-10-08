import Fastify from 'fastify';
import fetch from 'cross-fetch';
import { Token } from './interfaces/token';
import { DiscordUser } from './interfaces/discordUser';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

dotenv.config();

const oAuthURL =
    `https://discord.com/api/oauth2/authorize?client_id=` +
    `VAR_CLIENT_ID` +
    `&redirect_uri=` +
    `VAR_REDIRECT_URI` +
    `&response_type=code&scope=identify`;

const WebServer = Fastify({
    logger: true,
});

const ENDPOINTS = {
    AUTH: '/auth',
    URL: '/url',
    URL_REDIRECT: '/url/redirect',
    USER: '/user/:state',
};

if (typeof process.env.DISCORD_REDIRECT === 'undefined') {
    console.error(`Failed to get DISCORD_REDIRECT from environment variables.`);
    process.exit(1);
}

if (typeof process.env.CLIENT_SECRET === 'undefined') {
    console.error(`Failed to get CLIENT_SECRET from environment variables.`);
    process.exit(1);
}

if (typeof process.env.CLIENT_ID === 'undefined') {
    console.error(`Failed to get CLIENT_ID from environment variables.`);
    process.exit(1);
}

const DISCORD_REDIRECT = `${process.env.DISCORD_REDIRECT}${ENDPOINTS.AUTH}`;
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5555;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const CLIENT_ID = process.env.CLIENT_ID;
const RESPONSE_STRATEGY: string = process.env.RESPONSE_STRATEGY ? process.env.RESPONSE_STRATEGY : 'json';

// remove from here once jwt is established and move jwt data to... jwt...
let users: { [state: string]: DiscordUser } = {};
let sessionSecret: string;

/**
 * Constructs a safe URL for authorization.
 *
 * @return {string}
 */
function getURL(): string {
    return oAuthURL.replace('VAR_CLIENT_ID', CLIENT_ID).replace('VAR_REDIRECT_URI', encodeURI(DISCORD_REDIRECT));
}

WebServer.get(ENDPOINTS.AUTH, async (request, reply) => {
    const { code, state }: { code?: string; state?: string } = request.query;

    if (typeof code === 'undefined' || typeof state === 'undefined') {
        reply.type('application/json').code(401);
        return { status: false, message: 'Code and state for authentication were not provided.' };
    }

    let oAuthData: Token;

    try {
        const tokenResponseData = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: DISCORD_REDIRECT,
                scope: 'identify',
            }),
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        oAuthData = await tokenResponseData.json();
    } catch (error) {
        reply.type('application/json').code(401);
        return { status: false, message: 'Authentication credentials were missing or incorrect' };
    }

    if (typeof oAuthData === 'undefined') {
        reply.type('application/json').code(401);
        return { status: false, message: 'Authentication credentials were missing or incorrect' };
    }

    const userResult = await fetch('https://discord.com/api/users/@me', {
        headers: {
            authorization: `${oAuthData.token_type} ${oAuthData.access_token}`,
        },
    });

    if (!userResult.ok) {
        reply.type('application/json').code(401);
        return { status: false, message: 'Authorization token must have expired.' };
    }

    const user: DiscordUser = await userResult.json();
    if (typeof user === 'undefined') {
        reply.type('application/json').code(401);
        return { status: false, message: 'Authorization token must have expired.' };
    }

    if (RESPONSE_STRATEGY === 'json') {
        users[state] = user;
        reply.type('application/json').code(200);
        return { status: true, message: 'Authorization Complete!' };
    }

    // When the JWT token is returned.
    // The developer should set the JWT token to a same site cookie.
    // Set-Cookie: jwt=some_jwt; SameSite=Strict; Secure
    return { status: true, jwt: jwt.sign(user, sessionSecret) };
});

WebServer.get(ENDPOINTS.URL, (request, reply) => {
    reply.type('application/json').code(200);
    return { url: getURL() };
});

WebServer.get(ENDPOINTS.URL_REDIRECT, (request, reply) => {
    let { state }: { state?: string } = request.query;
    if (!state) {
        state = `${Math.floor(Math.random() * Number.MAX_SAFE_INTEGER)}`;
    }

    reply.type('redirect');
    reply.redirect(`${getURL()}&state=${state}`);
});

WebServer.get(
    ENDPOINTS.USER,
    {
        schema: {
            params: {
                type: 'object',
                additionalProperties: false,
                required: ['state'],
                properties: { state: { type: 'string' } },
            },
        },
    },
    (request, reply) => {
        let { state }: { state?: string } = request.params;
        if (!users[state]) {
            reply.type('application/json').code(401);
            return { status: false, message: 'No user found.' };
        }

        const user = { ...users[state] };
        reply.type('application/json').code(200);
        delete users[state];
        return user;
    }
);

WebServer.listen({ port: PORT }, async (err, address) => {
    if (err) {
        throw err;
    }

    sessionSecret = await new Promise((resolve: Function) => {
        crypto.randomBytes(48, (err, buff) => {
            resolve(buff.toString('hex'));
        });
    });

    console.log(`Application Info`);
    console.log(`Redirect URL: ${DISCORD_REDIRECT}`);
    console.log(`Response Strategy: ${RESPONSE_STRATEGY}`);
    if (RESPONSE_STRATEGY === 'json') {
        console.log(`Users who authenticate may be obtained from the following url path:`);
        console.log(`your-app-ip-or-address/user/id-passed-as-state`);
    }
});
