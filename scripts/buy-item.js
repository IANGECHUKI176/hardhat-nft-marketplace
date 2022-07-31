const { ethers, network } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { moveBlocks } = require("./move-blocks")

const TOKEN_ID = 4
const main = async () => {
    const nftMarketplace = await ethers.getContract("NftMarketplace")
    const basicNft = await ethers.getContract("BasicNft")
    const listedItem = await nftMarketplace.getListing(basicNft.address, TOKEN_ID)

    const tx = await nftMarketplace.buyItem(basicNft.address, TOKEN_ID, {
        value: listedItem.price.toString(),
    })
    await tx.wait(1)
    console.log("Bought NFT!!!!")
    if(developmentChains.includes(network.name)){
        await moveBlocks(2,1000)
    }
}
main()
    .then(() => {
        process.exit(0)
    })
    .catch((err) => {
        console.log(err)
        process.exit(1)
    })
