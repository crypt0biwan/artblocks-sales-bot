# artblocks-sales-bot

# Setup
Make sure you have the proper Node version installed (see `.nvmrc` file)

Copy `.env.sample` to `.env`.

You'll need to get set up with an Infura account- log in to https://infura.io/ and create a new project. In `.env`, populate the INFURA_PROJECT_ID and INFURA_SECRET.

Next you'll need to set up a Discord webhook. In your server go to Settings -> Integrations and create a webhook. Set the DISCORD_ID to the first value and DISCORD_TOKEN to the second value.

For example... if your webhook URL is `https://discord.com/api/webhooks/1234123412341234/asdfasdfasdfasdfasdfasdfasdf`, set the .env file with
`DISCORD_ID=1234123412341234`, `DISCORD_TOKEN=asdfasdfasdfasdfasdfasdfasdf`

Setting up the twitter part is a bit complicated. It was a pain to figure out how to get the API keys. Do the following steps:
- Go to https://developer.twitter.com/en/portal/dashboard
- you'll need to apply to become an api user, first. The application might take a few days.
- when that's complete, create an app (NOT a 'standalone' app) here https://developer.twitter.com/en/portal/projects-and-apps
- create a Production environment within the app. The name of this environment will be attached to each tweet, so make it good. Note the api key and secret.
- settings -> set OAuth 1.0a and OAuth 2.0 turned on, MAKE SURE YOU ALLOW READ/WRITE PERMS
- go back to Keys and Tokens, generate "Access Token and Secret", note the access token+token secret.
- plop the details into your .env file

# Running
```
npm start
```

# Testing
Make sure you set the infura values in .env. The tests will contact the ethereum node.
```
npm test
```

# Notes
```
0x059edd72cd353df5106d2b9cc5ab83a52287ac3a      Artblocks v0 contract (Chromie Squiggles, Genesis and Construction Token)
0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270      Artblocks v1 contract (Everything else)
```

Media Squiggle 9285 https://media.artblocks.io/thumb/9285.png
Media Anticyclone 44 https://media.artblocks.io/thumb/304000044.png