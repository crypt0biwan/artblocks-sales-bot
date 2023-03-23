const { WebhookClient } = require('discord.js');
const { TwitterApi } = require('twitter-api-v2');
const { handleTransfer } = require('./utils/watcher');
const { formatDiscordMessage, formatTwitterMessage, formatValue } = require('./utils/format');

require('dotenv').config()

const {
	DISCORD_ID, DISCORD_TOKEN,
	TWITTER_API_KEY, TWITTER_API_KEY_SECRET, TWITTER_ACCESS_TOKEN_KEY, TWITTER_ACCESS_TOKEN_SECRET,
  MINIMUM_ETH_AMOUNT
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

const transferHandler = async ({ data, totalPrice, buyer, seller, ethPrice, currency, platforms, transactionHash }) => {
  if(totalPrice >= MINIMUM_ETH_AMOUNT) {
    if(ENABLE_DISCORD) {
      // post to discord
      const discordMsg = await formatDiscordMessage({ data, totalPrice, buyer, seller, ethPrice, currency, platforms })
      discordClient.send(discordMsg).catch(console.error)
    }

    if(ENABLE_TWITTER) {
      // tweet
      const [twitterMessage, mediaId] = await formatTwitterMessage(twitterClient, { data, totalPrice, buyer, seller, ethPrice, currency, platforms })
      twitterClient.v1.tweet(twitterMessage, { media_ids: mediaId }).catch(err => { console.log(JSON.stringify(twitterMessage)); console.log(err) })
    }
  } else {
    console.log(`Price of sale (${formatValue(totalPrice, 2)}) too low.. tx id ${transactionHash}`)
  }
}

// make sure to lowercase
// const tx = '0x7e9f8dbbf56b3105091d8f07d38b8e65a72964185ace25ecd3a76afa5685f585'
// const tx = '0xad32d6a2d834e5741f7d14337414b5619d8d1b9828537c64768ad709d2cd1558'
// const tx = '0xfe52e31e245200bf8f776b62bcaa22f52682c1965307566de62369ccdf994817'
// const tx = '0xb64b09ddbddb48d5786ad5bc38a0193bde70ed4f8e8db2ea427d777892ed458e'
// const tx = '0xd4189d4b1c04851fb56afee6ffbef10e333c28d51a34fa6f6dfbbdec43ca76f4'
const tx = '0x257b83ffb9e03f2a8c69e2ca1d02a506be54184c2184d6999b57b56fb563f3a1'

const init = async () => {
    const details = await handleTransfer({
        transactionHash: tx
    })

    console.log(details)

    transferHandler(details)
}

init()