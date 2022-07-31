const {ethers, network}=require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { moveBlocks } = require("./move-blocks")
const TOKEN_ID=5
const main = async () => {
    const nftMarketplace=await ethers.getContract("NftMarketplace")
    const basicNft=await ethers.getContract("BasicNft")
    const tx=await nftMarketplace.cancelListing(basicNft.address,TOKEN_ID)
    await tx.wait(1)
    console.log("Item canceled")
    if(developmentChains.includes(network.name)){
        await moveBlocks(2,1000)
    }
}

main()
    .then(() => {
        process.exit(0)
    })
    .catch((error) => {
        console.log(error);
        process.exit(1)
    })
