const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { moveBlocks } = require("./move-blocks")
async function mint() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    console.log("minting....")
    const mintTx = await basicNft.mintNft()
    const mintReceipt = await mintTx.wait(1)
    const tokenId=mintReceipt.events[0].args.tokenId
    console.log("Got TokenId:",tokenId.toString())
    console.log("nft address",basicNft.address)
    if (developmentChains.includes(network.name)) {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

mint()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
