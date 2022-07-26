const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const {moveBlocks}=require("./move-blocks")
async function mintAndList() {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    console.log("minting....")
    const mintTx = await basicNft.mintNft()
    const mintReceipt = await mintTx.wait(1)
    const tokenId = mintReceipt.events[0].args.tokenId
    console.log("aproving nft...")
    const aprovalTx = await basicNft.approve(nftMarketplace.address, tokenId)
    await aprovalTx.wait(1)
    console.log("listing nft ....")
    const PRICE = ethers.utils.parseEther("0.1")
    const tx = await nftMarketplace.listItem(basicNft.address, tokenId, PRICE)
    await tx.wait(1)
    console.log("listed")
    if (developmentChains.includes(network.name)) {
        await moveBlocks(2, (sleepAmount = 1000))
    }
}

mintAndList()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
