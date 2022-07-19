# artblocks-sales-bot
This sales bot is a fork of [The Curio Cards sales bot](https://github.com/crypt0biwan/curio-sales-bot). Modified to work with the v0 and v1 contracts of Artblocks.
You can see the tweets it outputs at [https://twitter.com/artblocks_sales](https://twitter.com/artblocks_sales)

Special thanks to [Kian](https://github.com/fafrd) who initially setup the source of the bot 🫡

# Setup
Make sure you have the proper Node version installed (see `.nvmrc` file)

Copy `.env.sample` to `.env`.

## Infura

You'll need to get set up with an Infura account- log in to https://infura.io/ and create a new project. In `.env`, populate these 2 values 
```
INFURA_PROJECT_ID=
INFURA_SECRET=
```

## Discord 
Next you'll need to set up a Discord webhook. In your server go to Settings -> Integrations and create a webhook. Set the DISCORD_ID to the first value and DISCORD_TOKEN to the second value.

For example... if your webhook URL is `https://discord.com/api/webhooks/1234123412341234/asdfasdfasdfasdfasdfasdfasdf`, set the .env file with
```
DISCORD_ID=1234123412341234
DISCORD_TOKEN=asdfasdfasdfasdfasdfasdfasdf
```

## Twitter
Setting up the twitter part is a bit complicated. It was a pain to figure out how to get the API keys. Do the following steps:
- Go to https://developer.twitter.com/en/portal/dashboard
- you'll need to apply to become an api user, first. The application might take a few days.
- when that's complete, create an app (NOT a 'standalone' app) here https://developer.twitter.com/en/portal/projects-and-apps
- create a Production environment within the app. The name of this environment will be attached to each tweet, so make it good. Note the api key and secret.
- settings -> set OAuth 1.0a and OAuth 2.0 turned on, MAKE SURE YOU ALLOW READ/WRITE PERMS
- go back to Keys and Tokens, generate "Access Token and Secret", note the access token+token secret.
- plop the details into your .env file
```
TWITTER_API_KEY=
TWITTER_API_KEY_SECRET=
TWITTER_ACCESS_TOKEN_KEY=
TWITTER_ACCESS_TOKEN_SECRET=
```

# Running
```
npm start
```

# Testing
Make sure you set the infura values in .env. The tests will contact the ethereum node.
```
npm test
```
If you want to test an individual test you can install mocha globally `npm i -g mocha` and specify the test this way
```
mocha -g "handleTransfer()"
```

# Contracts
```
0x059edd72cd353df5106d2b9cc5ab83a52287ac3a      Artblocks v0 contract (Chromie Squiggles, Genesis and Construction Token)
0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270      Artblocks v1 contract (Everything else)
```

# Media
The Artblocks API supports v0 and v1 tokens. For social purposes it is good to use the thumb images, like this:

### Squiggle 9285
`https://media.artblocks.io/thumb/9285.png`
![Squiggle 9285](https://media.artblocks.io/thumb/9285.png)

### Anticyclone 44
`https://media.artblocks.io/thumb/304000044.png`
![Anticyclone 44](https://media.artblocks.io/thumb/304000044.png)

# How to contribute

You can find opened issues on the [https://github.com/crypt0biwan/artblocks-sales-bot/issues](https://github.com/crypt0biwan/artblocks-sales-bot/issues) tab. If you want to implement a feature, please check first if an issue is opened and see what needs to be implemented in that regard. If no issue is opened, feel free to implement your feature as you wish.

## Workflow

* fork this repo
* create a branch to implement a feature or fix a bug
* when done, push the branch to your git repository fork
* create a pull request againts the **main** branch
* I'll review it, and either request changes or merge it

# Contact
Reach out to [Obi](https://twitter.com/crypt0biwan) if you have any questions. Donations can go to `obi.eth`
