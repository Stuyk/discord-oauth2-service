# Discord oAuth2 Service

This repository provides oAuth2 services for general applications. It can be used as a starter, or used for something larger.

## Install

```
npm install
npm run build
npm run start
```

## Development

```
npm run dev
```

## Usage

There are a few ways this program can be ran; so we'll talk about strategies first and then the endpoints that come with it.

### Strategies

There are also two strategies that are available for providing authentication.

**jwt**

This strategy directs your users to authenticate through Discord's oAuth2 service.

After using their bearer token and obtaining user information it is stored in a JWT token with a session based secret.

This means that when this application is restarted or redeployed at any time, the JWT token is instantly invalid.

```js
// When the JWT token is returned.
// The developer should set the JWT token to a same site cookie.
// Set-Cookie: jwt=some_jwt; SameSite=Strict; Secure

//See: https://web.dev/samesite-cookies-explained/

// Cookies can be set with:
document.cookie = `auth=${token_goes_here}; SameSite=Strict; Secure`;

// Cookie can be obtained by doing:

const allCookies = document.cookie;
const splitCookies = allCookies.split(";");
const authCookieIndex = splitCookies.findIndex(cookie => cookie.includes('auth='));
if (authCookieIndex <= -1) {
    // No cookie found... go auth again.
    return;
}

const token = splitCookies[authCookieIndex].replace('auth=', '');
```

_Use this one if you're doing anything web related._

**json**

This strategy logs the users information in-memory to be obtained later. This has a very specific use case and provides authentication for services where the user logs in through their browser, and then they can click another button to fetch additional information.

It's directed more towards game platforms like alt:V.

_Use this one if you're doing anything alt:V, ragemp, fivem related._

### Endpoints

const ENDPOINTS = {
    AUTH: '/auth',
    URL: '/url',
    URL_REDIRECT: '/url/redirect',
    USER: '/user/:state',
};

There are a handful of endpoints that come with this oAuth2 provider.

#### /url/redirect

This pathway obtains an oAuth2 URL and applies state.

It is not recommended to use this pathway unless you are testing.

Instead just use the `/url` endpoint directly to obtain the url and apply `&state=` to pass data to the provider.

Think of `state` as a way to later obtain the results if necessary.

#### /url

This pathway returns a URL to be used to send your users to when authenticating.

You can pass state by tacking on `&state=some_unique_identifier_here` to perform authentication.

The unique identifier should probably be sha256 or sha512 and should be entirely random.

#### /user/:state

This is how you obtain results from a `json` based strategy.

You just pass the url such as `https://auth.yourprovider.com/user/some_unique_identifier_here`.

If successful it will return the result from your auth service.

This does not apply to `jwt` based strategy.


#### /auth

This endpoint is not for regular users and is pretty much useless for them.

This is where Discord oAuth2 bearer tokens are passed through.


## Setting Up Discord Application

Visit [https://discord.com/developers/applications/](https://discord.com/developers/applications/).

Create an application.

Visit the oAuth2 section and create `2` redirects.

One is going to be your base redirect wherever you are hosting this application.

ie. `http://127.0.0.1:5555` or `https://auth.yoururl.com/`

As well as

ie. `http://127.0.0.1:5555/auth` or `https://auth.yoururl.com/auth`

_The above assumes you know what a CNAME is_

After, you can setup your environment variables for application by obtaining them through the Discord Application panel.

Environment variables are as follows:

```
RESPONSE_STRATEGY=json
DISCORD_REDIRECT=http://127.0.0.1:5555
PORT=5555
CLIENT_SECRET=OBTAINED_FROM_DISCORD_APPLICATION_UNDER_OAUTH2
CLIENT_ID=OBTAINED_FROM_DISCORD_APPLICATION_UNDER_OAUTH2
```

## Deployment

If you are looking for a place to deploy this service, I can highly recommend [Digital Ocean Apps](https://m.do.co/c/0a2a8f925176).

That being said; you can simply fork this repository or clone it and make it private. Then make your necessary changes and pretty much do a few clicks and instantly deploy it.

Make sure to setup environment variables in your digital ocean application if you decide to use digital ocean as your application provider.