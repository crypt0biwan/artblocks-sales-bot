const Ethers = require("ethers");
require('dotenv').config()
const { INFURA_PROJECT_ID, INFURA_SECRET } = process.env
const { formatValue } = require('./format')

// set up provider
const provider = new Ethers.providers.InfuraProvider("homestead", {
	projectId: INFURA_PROJECT_ID,
	projectSecret: INFURA_SECRET
});

const AB_V0_CONTRACT = "0x059edd72cd353df5106d2b9cc5ab83a52287ac3a"
const abv0Abi = require("../abis/ArtblocksV0.json");
const abv0Contract = new Ethers.Contract(AB_V0_CONTRACT, abv0Abi, provider);

const AB_V1_CONTRACT = "0xa7d8d9ef8d8ce8992df33d8b8cf4aebabd5bd270"
const abv1Abi = require("../abis/ArtblocksV1.json");
const abv1Contract = new Ethers.Contract(AB_V1_CONTRACT, abv1Abi, provider);

const erc20TokenAbi = require("../abis/ERC20Token.json");

const OPENSEA_CONTRACT = "0x7f268357a8c2552623316e2562d90e642bb538e5";
const OLD_OPENSEA_CONTRACT = "0x7be8076f4ea4a4ad08075c2508e481d6c946d12b";
const wyvernAbi = require("../abis/WyvernExchangeWithBulkCancellations.json");
const wyvernContract = new Ethers.Contract(OPENSEA_CONTRACT, wyvernAbi, provider);

const OPENSEA_SEAPORT_CONTRACT = "0x00000000006c3852cbef3e08e8df289169ede581"
const seaportAbi = require("../abis/SeaPort.json");
const seaportContract = new Ethers.Contract(OPENSEA_SEAPORT_CONTRACT, seaportAbi, provider);

const LOOKSRARE_CONTRACT = "0x59728544b08ab483533076417fbbb2fd0b17ce3a"
const looksAbi = require("../abis/LooksRare.json");
const looksContract = new Ethers.Contract(LOOKSRARE_CONTRACT, looksAbi, provider);

const ARCHIPELAGO_CONTRACT = "0x555598409fe9a72f0a5e423245c34555f6445555"
const archipelagoAbi = require("../abis/ArchipelagoMarket.json")
const archipelagoContract = new Ethers.Contract(ARCHIPELAGO_CONTRACT, archipelagoAbi, provider)

const UNISWAP_USDC_ETH_LP_CONTRACT = "0xb4e16d0168e52d35cacd2c6185b44281ec28c9dc";
const uniswapAbi = require("../abis/Uniswap_USDC_ETH_LP.json");
const uniswapContract = async () => await new Ethers.Contract(UNISWAP_USDC_ETH_LP_CONTRACT, uniswapAbi, provider);

const getEthUsdPrice = async () => await uniswapContract()
	.then(contract => contract.getReserves())
	.then(reserves => Number(reserves._reserve0) / Number(reserves._reserve1) * 1e12); // times 10^12 because usdc only has 6 decimals

const abv0EventFilter = {
	address: AB_V0_CONTRACT,
	topics: [
		Ethers.utils.id("Transfer(address,address,uint256)")
	]
};

const abv1EventFilter = {
	address: AB_V1_CONTRACT,
	topics: [
		Ethers.utils.id("Transfer(address,address,uint256)")
	]
};

// this is a helper for the unit test
async function getABv0EventsFromBlock(blockNum) {
	return await abv0Contract.queryFilter(abv0EventFilter, fromBlock=blockNum, toBlock=blockNum);
}

async function getABv1EventsFromBlock(blockNum) {
	return await abv1Contract.queryFilter(abv1EventFilter, fromBlock=blockNum, toBlock=blockNum);
}

let lastTx;
async function handleTransfer(tx) {
	let txReceipt = await provider.getTransactionReceipt(tx.transactionHash);
	if (lastTx === tx.transactionHash) return {}; // Transaction already seen
	lastTx = tx.transactionHash
	let totalPrice = 0
	let currency = 'ETH'
	let platforms = []

	let isABv0 = !!txReceipt.logs.filter(x => {
		return [AB_V0_CONTRACT].includes(x.address.toLowerCase())
	}).length

	const abContract = isABv0 ? abv0Contract : abv1Contract

	let wyvernLogRaw = txReceipt.logs.filter(x => {
		return [OPENSEA_CONTRACT, OLD_OPENSEA_CONTRACT].includes(x.address.toLowerCase())
	});

	let seaportLogRaw = txReceipt.logs.filter(x => {
		return [OPENSEA_SEAPORT_CONTRACT].includes(x.address.toLowerCase())
	});

	let looksRareLogRaw = txReceipt.logs.filter(x => {
		return [
			Ethers.utils.keccak256(Ethers.utils.toUtf8Bytes('TakerBid(bytes32,uint256,address,address,address,address,address,uint256,uint256,uint256)')),
			Ethers.utils.keccak256(Ethers.utils.toUtf8Bytes('TakerAsk(bytes32,uint256,address,address,address,address,address,uint256,uint256,uint256)'))
		].includes(x.topics[0])
	});

	let archipelagoLogRaw = txReceipt.logs.filter(x => {
		return [
			Ethers.utils.keccak256(Ethers.utils.toUtf8Bytes('Trade(bytes32,address,address,uint256,uint256,uint256,address)'))
		].includes(x.topics[0])
	});

	// early return check
	if (wyvernLogRaw.length === 0 && seaportLogRaw.length === 0 && looksRareLogRaw.length === 0 && archipelagoLogRaw.length === 0) {
		console.log(`found transfer ${tx.transactionHash}, but no associated OpenSea (Wyvern or Seaport), LooksRare or Archipelago sale`);
		return false
	}

	// check for OpenSea (Wyvern contract) sale
	if(wyvernLogRaw.length) {
		platforms.push("OpenSea")
		// Check if related token transfers instead of a regular ETH buy
		let tokenTransfers = txReceipt.logs.filter(x => {
			return ![AB_V0_CONTRACT, AB_V1_CONTRACT].includes(x.address.toLowerCase()) && x.topics.includes(Ethers.utils.keccak256(Ethers.utils.toUtf8Bytes('Transfer(address,address,uint256)')))
		});
		// ERC20 token buy
		let decimals;
		if (tokenTransfers.length) {
			const tokenAddress = tokenTransfers[0].address.toLowerCase()
			const erc20TokenContract = new Ethers.Contract(tokenAddress, erc20TokenAbi, provider);
			
			const symbol = await erc20TokenContract.symbol()
			decimals = await erc20TokenContract.decimals()
			currency = symbol
		}
		for (let log of wyvernLogRaw) {
			let wyvernLog = wyvernContract.interface.parseLog(log);

			if(tokenTransfers.length) {
				totalPrice += parseFloat(Ethers.utils.formatUnits(wyvernLog.args.price.toBigInt(), decimals))
			} else {
				// regular ETH buy
				totalPrice += parseFloat(Ethers.utils.formatEther(wyvernLog.args.price.toBigInt()));
			}
		}
	}

	// check for OpenSea (Seaport contract) sale
	if(seaportLogRaw.length) {
		platforms.push("OpenSea")
		// Check if related token transfers instead of a regular ETH buy
		let tokenTransfers = txReceipt.logs.filter(x => {
			return ![AB_V0_CONTRACT, AB_V1_CONTRACT].includes(x.address.toLowerCase()) && x.topics.includes(Ethers.utils.keccak256(Ethers.utils.toUtf8Bytes('Transfer(address,address,uint256)')))
		});

		// ERC20 token buy
		let decimals;
		if (tokenTransfers.length) {
			const tokenAddress = tokenTransfers[0].address.toLowerCase()
			const erc20TokenContract = new Ethers.Contract(tokenAddress, erc20TokenAbi, provider);
			
			const symbol = await erc20TokenContract.symbol()
			decimals = await erc20TokenContract.decimals()
			currency = symbol
		}
		for (let log of seaportLogRaw) {
			let seaportLog = seaportContract.interface.parseLog(log);

			if(tokenTransfers.length) {
				totalPrice += parseFloat(Ethers.utils.formatUnits(seaportLog.args.offer[0].amount.toBigInt(), decimals))
			} else {
				// regular ETH buy
				let chunks = log.data.substring(2, log.data.length).match(/.{1,64}/g)

				if(chunks.length >= 24) {
					try {
						totalPrice += parseFloat(Ethers.utils.formatEther(Ethers.BigNumber.from(Buffer.from(chunks[13], 'hex'))))
						totalPrice += parseFloat(Ethers.utils.formatEther(Ethers.BigNumber.from(Buffer.from(chunks[18], 'hex'))))
						totalPrice += parseFloat(Ethers.utils.formatEther(Ethers.BigNumber.from(Buffer.from(chunks[23], 'hex'))))
					} catch(e) {
						// added some logging since the bot crashes no a rare occasion
						console.log(e)
						console.log(log)
					}
				}
			}
		}
	}

	// check for LooksRare sale
	if(looksRareLogRaw.length) {
		platforms.push("LooksRare")
		for (let log of looksRareLogRaw) {
			let looksLog = looksContract.interface.parseLog(log);

			totalPrice += parseFloat(Ethers.utils.formatEther(looksLog.args.price.toBigInt()));
		}
		currency = 'WETH'
	}

	if(archipelagoLogRaw.length) {
		platforms.push("Archipelago")

		for (let log of archipelagoLogRaw) {
			let archipelagoLog = archipelagoContract.interface.parseLog(log);

			totalPrice += parseFloat(Ethers.utils.formatEther(archipelagoLog.args.price.toBigInt()));
		}
	}

	// Check if the value of the item is more than 5 ETH
	txLogRaw = txReceipt.logs.filter(x => {
		return [AB_V0_CONTRACT, AB_V1_CONTRACT].includes(x.address.toLowerCase())
	});

	if (txLogRaw.length === 0) {
		console.error("unable to parse transfer from tx receipt!");
		return false
	}

	let ethPrice = await getEthUsdPrice()

	let data = []
	let buyer;
	let seller;
	let sellers = []

	for (let log of txLogRaw) {
		let txLog = abContract.interface.parseLog(log);
		let token = txLog.args.tokenId.toString();
		let projectId = await abContract.tokenIdToProjectId(token)
		let { projectName, artist } = await abContract.projectDetails(projectId)
		let tokenId = parseInt(token.replace(projectId, ''), 10)

		sellers.push(txLog.args.from.toLowerCase())
		buyer = txLog.args.to.toLowerCase()

		if(data.filter(i => i.tokenIdLong === token).length === 0) {
			data.push({
				contract: isABv0 ? AB_V0_CONTRACT : AB_V1_CONTRACT,
				tokenIdLong: token,
				tokenId,
				projectName,
				artist
			})
		}
	}

	seller = (sellers.every((val, i, arr) => val === arr[0])) ? sellers[0] : seller = "Multiple" // Check if multiple sellers, if so, seller is "Multiple" instead of a single seller
	
	console.log(`Found sale: ${Object.entries(data).length} piece(s) sold for ${formatValue(totalPrice, 2)} ${currency}`)

	return { data, totalPrice, buyer, seller, ethPrice, currency, platforms }
	
}

function watchForTransfers(transferHandler) {
	provider.on("block", (blockNumber) => {
		console.log("new block: " + blockNumber)
	});

	provider.on(abv0EventFilter, async (log) => {
		const transfer = await handleTransfer(log);
		if (transfer.data) {
			transferHandler(transfer);
		}
	});

	provider.on(abv1EventFilter, async (log) => {
		const transfer = await handleTransfer(log);
		if (transfer?.data) {
			transferHandler(transfer);
		}
	});
}

module.exports = { watchForTransfers, handleTransfer, getABv0EventsFromBlock, getABv1EventsFromBlock };
