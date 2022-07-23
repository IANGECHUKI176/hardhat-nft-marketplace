const { ethers, network } = require("hardhat")
const fs = require("fs")
const frontEndContractsFile = "../nextjs-nft-marketplace-moralis-fcc/constants/networkMapping.json"
module.exports = async () => {
    if (process.env.UPDATE_FRONTEND) {
        console.log("Updating frontend")
        await updateContractAddresses()
    }
}

async function updateContractAddresses() {
    const NftMarketplace = await ethers.getContract("NftMarketplace")
    const chainId = network.config.chainId.toString()
    const contractAddresses = JSON.parse(fs.readFileSync(frontEndContractsFile, "utf8"))
    if (chainId in contractAddresses && chainId != undefined) {
        if (!contractAddresses[chainId]["NftMarketplace"].includes(NftMarketplace.address)) {
            contractAddresses[chainId]["NftMarketplace"].push(NftMarketplace.address)
        }
    } else {
        contractAddresses[chainId] = {NftMarketplace:[NftMarketplace.address]}
    }
    fs.writeFileSync(frontEndContractsFile, JSON.stringify(contractAddresses))
}
module.exports.tags = ["all", "frontend"]
