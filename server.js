const { WebhookClient } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');
const { watchForTransfers } = require('./utils/watcher');
const { formatDiscordMessage, formatTwitterMessage } = require('./utils/format');

require('dotenv').config()

const {
	DISCORD_ID, DISCORD_TOKEN,
	TWITTER_API_KEY, TWITTER_API_KEY_SECRET, TWITTER_ACCESS_TOKEN_KEY, TWITTER_ACCESS_TOKEN_SECRET
} = process.env

const ENABLE_DISCORD = DISCORD_ID !== ''
const ENABLE_TWITTER = TWITTER_API_KEY !== ''

let discordClient, _twitterClient, twitterClient

if(ENABLE_DISCORD) {
  discordClient = new WebhookClient({id: DISCORD_ID, token: DISCORD_TOKEN})
}

if(ENABLE_TWITTER) {
  _twitterClient = new TwitterApi({
    appKey: TWITTER_API_KEY,
    appSecret: TWITTER_API_KEY_SECRET,
    accessToken: TWITTER_ACCESS_TOKEN_KEY,
    accessSecret: TWITTER_ACCESS_TOKEN_SECRET
  })

  twitterClient = _twitterClient.readWrite
}

const transferHandler = async ({ data, totalPrice, buyer, seller, ethPrice, currency, platforms }) => {
  if(ENABLE_DISCORD) {
    // post to discord
    const discordMsg = await formatDiscordMessage({ data, totalPrice, buyer, seller, ethPrice, currency, platforms })
    discordClient.send(discordMsg).catch(console.error)
  }

  if(ENABLE_TWITTER) {
    // tweet
    const [twitterMessage, mediaId] = await formatTwitterMessage(twitterClient, { data, totalPrice, buyer, seller, ethPrice, currency, platforms })
    twitterClient.v1.tweet(twitterMessage, { media_ids: mediaId }).catch(err => { console.log(JSON.stringify(twitterMessage)); console.log(error) })
  }
}

watchForTransfers(transferHandler)