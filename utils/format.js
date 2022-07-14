const COLORS = require('./colors')
const { getUsername } = require('./opensea')
const axios = require('axios')

const getURL = (platforms, contract, tokenIdLong, tokenId, collectionName) => {
	switch(platforms[0]) {
		case 'Archipelago':
			return `https://archipelago.art/collections/${collectionName.toLowerCase().replace(/ /g, '-')}/${tokenId}`
		case 'LooksRare':
			return `https://looksrare.org/collections/${contract}/${tokenIdLong}`
		case 'X2Y2':
			return `https://x2y2.io/eth/${contract}/${tokenIdLong}`
		default:
			return `https://opensea.io/assets/ethereum/${contract}/${tokenIdLong}`
	}
}
const getMediaUrl = (tokenIdLong) => `https://media.artblocks.io/thumb/${tokenIdLong}.png`

// TODO error handling
const getImageBuffer = async (url) => {
	const response = await axios.get(url, { responseType: 'arraybuffer' })

	return Buffer.from(response.data, "utf-8")
}

async function uploadMedia(twitterClient, mediaUrl) {
	let buffer = getImageBuffer(mediaUrl)
	let mediaId = await twitterClient.v1.uploadMedia(buffer, { mimeType: 'image/png' });
	return mediaId;
}
// style = currency to include dollar sign
const formatValue = (value, decimals = 2, style = 'decimal') =>
	new Intl.NumberFormat('en-US', {
		style,
		currency: 'USD',
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	}).format(value)

const formatDiscordMessage = async ({ data, totalPrice, buyer, seller, ethPrice, currency, platforms }) => {
	const buyerUsername = await getUsername(buyer)
	const sellerUsername = (seller === "Multiple") ? "Multiple" : await getUsername(seller)

	let title = ''
	let fields = [
		{
			name: currency,
			value: formatValue(parseFloat(totalPrice), 2),
			inline: true,
		}
	]

	const platformString = `${platforms.length > 1 ? "Platforms" : "Platform"}: **${platforms.join(", ")}**`
	let description = `${platformString}\nBuyer: **${buyerUsername}**\nSeller: **${sellerUsername}**`
	const { contract, tokenIdLong, tokenId, projectName, artist } = data[0]
	const url = getURL(platforms, contract, tokenIdLong, tokenId, projectName)
	
	if(data.length > 1) {
		title = `Multiple "${projectName} by ${artist}" items sold`

		data.forEach(item => {
			const { contract, tokenIdLong, tokenId, projectName, artist } = item
			description += `${projectName} #${tokenId}\n`
		});
	} else {
		title = `${projectName} #${tokenId} by ${artist}`
	}

	if(['ETH', 'WETH'].includes(currency)) {
		fields.push({
			name: 'USD',
			value: formatValue(parseFloat(totalPrice * ethPrice), 2),
			inline: true,
		})
	}

	return {
		username: 'ArtBlocks Sales',
		embeds: [
			{
				title,
				description: `${description}\n---------------------------------`,
				url,
				thumbnail: {
					url: getMediaUrl(tokenIdLong)
				},
				color: COLORS.GREEN,
				fields,
				timestamp: new Date()
			}
		]
	}
}

const formatTwitterMessage = async (twitterClient, { data, totalPrice, buyer, seller, ethPrice, currency, platforms }, includeFiat = true) => {
	const buyerUsername = await getUsername(buyer);
	const sellerUsername = (seller === "Multiple") ? "Multiple" : await getUsername(seller)
	let twitterMessage;
	let mediaIds = [];
	let platformString = "";
	let totalPriceUsdString = "";
	let totalPriceString = formatValue(totalPrice, 2)
	
	if (platforms.length > 1) {
		platformString = `Platforms: ${platforms.join(", ")}`;
	} else {
		platformString = `Platform: ${platforms[0]}`;
	}
	
	let description = `${platformString}\nBuyer: ${buyerUsername}\nSeller: ${sellerUsername}\n`
	
	const { contract, tokenIdLong, tokenId, projectName, artist } = data[0]
	const url = getURL(platforms, contract, tokenIdLong, tokenId, projectName)
	
	if(includeFiat && ['ETH', 'WETH'].includes(currency)) {
		totalPriceUsdString = ` (${formatValue(totalPrice * ethPrice, 2, 'currency')}) `;
	}


	if(data.length > 1) {
		title = `Multiple "${projectName} by ${artist}" items sold for ${totalPriceString} ${currency}${totalPriceUsdString}`
		let mediaUrls = []

		data.forEach(item => {
			const { contract, tokenIdLong, tokenId, projectName, artist } = item
			description += `- ${projectName} #${tokenId}\n`
			mediaUrls.push(getMediaUrl(tokenIdLong))
		});

		// Tweet must not have more than 4 mediaIds. (Twitter code 324)
		mediaUrls = mediaUrls.slice(0, 4)

		mediaIds = await Promise.all(mediaUrls.map(url => uploadMedia(twitterClient, url)));
	} else {
		title = `${projectName} #${tokenId} by ${artist} sold for ${totalPriceString} ${currency}${totalPriceUsdString}`
		description += `${url}`
		mediaIds = [await uploadMedia(twitterClient, getMediaUrl(tokenIdLong))];
	}

	twitterMessage = `${title}\n`
	twitterMessage += `${description}`

	return [twitterMessage, mediaIds];
}

module.exports = exports = {
	formatDiscordMessage,
	formatTwitterMessage,
	formatValue
}
