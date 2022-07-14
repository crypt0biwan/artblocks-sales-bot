const { handleTransfer, getABv0EventsFromBlock, getABv1EventsFromBlock } = require("../utils/watcher.js");
const { getUsername } = require("../utils/opensea");

const assert = require("assert");

describe("Watcher", function () {
	this.timeout(10_000);

	describe("handleTransfer()", function () {
		it("should correctly find Squiggle 6426 transfer in block 15100323", async function () {
			const events = await getABv0EventsFromBlock(15100323);
			assert.equal(events.length, 1);

			const transfer = await handleTransfer(events[0])

			assert.equal(transfer.data[0].tokenId, "6426")
			assert.equal(transfer.totalPrice, 13.7);
		});
	});

	describe("handleSeaportSales()", function() {
		it("should return the correct numbers for an ETH sale", async function () {
			const details = await handleTransfer({
				transactionHash: '0xd2a3d96f0da3f312176a66101c4a54dc48d3e820f3643198170a216f2698e81e'
			})

			assert.equal(details.currency, "ETH");
			assert.equal(details.totalPrice, "14");
		})

		it("should return the correct numbers for a WETH sale", async function () {
			const details = await handleTransfer({
				transactionHash: '0x178fa3cc70a6873f018f0caeae90fa02c6864bd8bc2e0250e8a1b951aebce42c'
			})

			assert.equal(details.currency, "WETH");
			assert.equal(details.totalPrice, "11");
		})

		it("should pass with extra check for weird event logs", async function () {
			const details = await handleTransfer({
				transactionHash: '0x67aa3212a84750056bf206de808647a2325353f14c57855e09a6df1f7ae53ec6'
			})

			assert.deepEqual(details.data, [
				{
				  contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
				  tokenIdLong: '89000401',
				  tokenId: 401,
				  projectName: 'Dreams',
				  artist: 'Joshua Bagley'
				}
			  ])
			assert.deepEqual(details.platforms, ['OpenSea'])
			assert.equal(details.currency, "ETH");
			assert.equal(details.totalPrice, "1.5000000000000002");
		})
	})

	describe("handleArchipelagoSales()", function() {
		it("should return the correct numbers for an ETH sale", async function () {
			const details = await handleTransfer({
				transactionHash: '0x010736855caeaa9ae1185fcef95a3bb116dd3422004cc8ddd8c20451c1c301bf'
			})

			assert.deepEqual(details.data, [
				{
				  contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
				  tokenIdLong: '78000631',
				  tokenId: 631,
				  projectName: 'Fidenza',
				  artist: 'Tyler Hobbs'
				}
			])
			assert.deepEqual(details.platforms, ['Archipelago'])
			assert.equal(details.currency, "ETH");
			assert.equal(details.totalPrice, "459.69");
		})	
	})

	describe("handleX2Y2Sales()", function() {
		it("should return the correct numbers for a X2Y2 ETH sale", async function () {
			const details = await handleTransfer({
				transactionHash: '0xfe52e31e245200bf8f776b62bcaa22f52682c1965307566de62369ccdf994817'
			})

			assert.deepEqual(details.data, [
				{
				  contract: '0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270',
				  tokenIdLong: '304000191',
				  tokenId: 191,
				  projectName: 'Anticyclone',
				  artist: 'William Mapan'
				}
			  ])
			assert.deepEqual(details.platforms, ['X2Y2'])
			assert.equal(details.currency, "ETH");
			assert.equal(details.totalPrice, "10.6465");
		})	
	})

	describe("handleMultipleSales()", function () {
		it("should return the correct numbers for a Gem sweep sale", async function () {
			const details = await handleTransfer({
				transactionHash: '0x650cff63072f786d6b0a8eb7afb1ef020104520da31b91bf558edae79f060256'
			})

			assert.deepEqual(details.data, [{
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
			  }])

			assert.deepEqual(details.platforms, ['OpenSea', 'LooksRare'])
			assert.equal(details.buyer, '0x1936ec5c03ef5448f3303aae23b4559863c639a7');
			assert.equal(details.seller, 'Multiple');
			assert.equal(details.totalPrice, '2.7');
		})
	})

	describe("getOpenseaUsername()", function () {
		it("should correctly find 'ArtBlocks_Admin' username corresponding to ETH address 0x96dC73c8B5969608C77375F085949744b5177660", async function () {
			const username = await getUsername("0x96dC73c8B5969608C77375F085949744b5177660");

			assert.equal(username, "ArtBlocks_Admin");
		});
	});

	describe("getBlockWithDifferentSales()", function () {
		it("should correctly handle different sales in the same block", async function () {
			const events = await getABv1EventsFromBlock(15135703)

			const details1 = await handleTransfer(events[0])
			const details2 = await handleTransfer(events[1])

			assert.equal(details1.currency, "ETH");
			assert.equal(details1.totalPrice, "6.75");
			assert.equal(details1.data[0].tokenId, 626);
			assert.equal(details1.data[0].projectName, 'Singularity');
			assert.equal(details1.data[0].artist, 'Hideki Tsukamoto');	

			assert.equal(details2.currency, "ETH");
			assert.equal(details2.totalPrice, "4.69");
			assert.equal(details2.data[0].tokenId, 435);
			assert.equal(details2.data[0].projectName, 'Running Moon');
			assert.equal(details2.data[0].artist, 'Licia He');
		})
	})
});
