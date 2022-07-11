const { formatDiscordMessage, formatTwitterMessage } = require('../utils/format');

const mockTwitterClient = {
	v1: {
		uploadMedia: async function(path) {
			console.log("mocked uploadMedia(): " + path)
			return "unit-test";
		}
	}
}

const assert = require("assert");

const singleSale = {
	data: [
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '304000044',
		tokenId: 44,
		projectName: 'Anticyclone',
		artist: 'William Mapan'
	  }
	],
	totalPrice: 14,
	buyer: '0xcdac236352b338789150884e42caa473f7101deb',
	seller: '0xc19ca6cc85de33ec664fef9595905b8e57dae13d',
	ethPrice: 1216.3855394469942,
	currency: 'ETH',
	platforms: [ 'OpenSea' ]
};

const multiSale = {
	data: [
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '138000084',
		tokenId: 84,
		projectName: 'Geometry Runners',
		artist: 'Rich Lord'
	  },
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '138000311',
		tokenId: 311,
		projectName: 'Geometry Runners',
		artist: 'Rich Lord'
	  }
	],
	totalPrice: 2.7,
	buyer: '0x1936ec5c03ef5448f3303aae23b4559863c639a7',
	seller: 'Multiple',
	ethPrice: 1216.4710010885863,
	currency: 'WETH',
	platforms: [ 'OpenSea', 'LooksRare' ]
}

describe("Formatter", function () {
	this.timeout(10_000);

	describe("formatDiscordMessage()", function () {
		it("should format single sales correctly", async function () {
			const discordMsg = await formatDiscordMessage(singleSale);

			assert.equal(discordMsg.embeds[0].title, 'Anticyclone #44 by William Mapan')
		});

		it("should format multiple sales correctly", async function () {
			const discordMsg = await formatDiscordMessage(multiSale);

			assert.equal(discordMsg.embeds[0].title, 'Multiple "Geometry Runners by Rich Lord" items sold')
		});
	});

	describe("formatTwitterMessage()", function () {
		it("should format single sales correctly", async function () {
			const [twitterMessage, mediaId] = await formatTwitterMessage(mockTwitterClient, singleSale, false);
			const expectedMessage = `Anticyclone #44 by William Mapan sold for 14.00 ETH\nPlatform: OpenSea\nBuyer: RHA1\nSeller: 0xc19...13d\nhttps://opensea.io/assets/ethereum/0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270/304000044`;

			assert.equal(expectedMessage, twitterMessage);
			assert.notEqual(mediaId, null);
			assert.notEqual(mediaId, "");
		});

		it("should format multi sales correctly", async function () {
			const [twitterMessage, mediaIds] = await formatTwitterMessage(mockTwitterClient, multiSale, false);
			const expectedMessage = `Multiple "Geometry Runners by Rich Lord" items sold for 2.70 WETH\nPlatforms: OpenSea, LooksRare\nBuyer: 0x193...9a7\nSeller: Multiple\n- Geometry Runners #84\n- Geometry Runners #311\n`;

			assert.equal(expectedMessage, twitterMessage);
			assert.equal(mediaIds.length, 2);
			assert.notEqual(mediaIds[0], null);
			assert.notEqual(mediaIds[0], "");
		});
	});
});