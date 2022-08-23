const { formatDiscordMessage, formatTwitterMessage, getImageBuffer } = require('../utils/format');

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

const multiOpenseaSale = {
	data: [
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '304000231',
		tokenId: 231,
		projectName: 'Anticyclone',
		artist: 'William Mapan'
	  },
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '304000154',
		tokenId: 154,
		projectName: 'Anticyclone',
		artist: 'William Mapan'
	  },
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '304000569',
		tokenId: 569,
		projectName: 'Anticyclone',
		artist: 'William Mapan'
	  },
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '304000337',
		tokenId: 337,
		projectName: 'Anticyclone',
		artist: 'William Mapan'
	  },
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '304000129',
		tokenId: 129,
		projectName: 'Anticyclone',
		artist: 'William Mapan'
	  }
	],
	totalPrice: 19.9,
	buyer: '0xf0624f08ee09ebc9c7359d405d91a3e31a3b9faa',
	seller: 'Multiple',
	ethPrice: 1077.0431502781184,
	currency: 'WETH', // TODO check why this is WETH instead of ETH
	platforms: [ 'OpenSea', 'OpenSea' ],
	transactionHash: '0x7e9f8dbbf56b3105091d8f07d38b8e65a72964185ace25ecd3a76afa5685f585'
}

const archipelagoSale = {
	data: [
	  {
		contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
		tokenIdLong: '78000631',
		tokenId: 631,
		projectName: 'Fidenza',
		artist: 'Tyler Hobbs'
	  }
	],
	totalPrice: 459.69,
	buyer: '0xbb367b95c4e118b872ebaa64734b2fcfa5c252ef',
	seller: '0xf2b011dbadf7cc0d472c7ba161205f422bb6702c',
	ethPrice: 1070.9577870289213,
	currency: 'ETH',
	platforms: [ 'Archipelago' ]
}

describe("Formatter", function () {
	this.timeout(10_000);

	describe("formatDiscordMessage()", function () {
		it("should format single sales correctly", async function () {
			const discordMsg = await formatDiscordMessage(singleSale);

			assert.equal(discordMsg.embeds[0].title, 'Anticyclone #44 by William Mapan')
		});

		it("should format archipelagoSale sales correctly", async function () {
			const discordMsg = await formatDiscordMessage(archipelagoSale);
			
			assert.equal(discordMsg.embeds[0].title, 'Fidenza #631 by Tyler Hobbs')
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

		it("should format archipelagoSale sales correctly", async function () {
			const [twitterMessage, mediaId] = await formatTwitterMessage(mockTwitterClient, archipelagoSale, false);
			const expectedMessage = `Fidenza #631 by Tyler Hobbs sold for 459.69 ETH\nPlatform: Archipelago\nBuyer: 0xbb3...2ef\nSeller: abc_123_0xf2\nhttps://archipelago.art/collections/fidenza/631`;

			assert.equal(expectedMessage, twitterMessage);
			assert.notEqual(mediaId, null);
			assert.notEqual(mediaId, "");
		});

		it("should format multi opensea sales correctly", async function () {
			const [twitterMessage, mediaIds] = await formatTwitterMessage(mockTwitterClient, multiOpenseaSale, false);
			const expectedMessage = `Multiple "Anticyclone by William Mapan" items sold for 19.90 WETH\nPlatforms: OpenSea, OpenSea\nBuyer: GSRblue\nSeller: Multiple\n- Anticyclone #231\n- Anticyclone #154\n- Anticyclone #569\n- Anticyclone #337\n- Anticyclone #129\n`;

			assert.equal(expectedMessage, twitterMessage);

			// 5 NFTs sold, but only 4 media ids (twitter restriction)
			assert.equal(mediaIds.length, 4);
			assert.notEqual(mediaIds[0], null);
			assert.notEqual(mediaIds[0], "");
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

	describe("handleNotFoundImage()", function () {
		it("should have correct error handling when an image can't be found", async function () {
			const imgBuffer = await getImageBuffer('https://media.artblocks.io/thumb/7046.png')

			assert.equal(imgBuffer, null);
		});
	})
});