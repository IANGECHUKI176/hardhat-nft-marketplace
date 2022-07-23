const { developmentChains } = require("../helper-hardhat-config")
const { network,} = require("hardhat")
const { verify } = require("../utils/verify")

module.exports = async ({ deployments, getNamedAccounts }) => {
    const { log, deploy } = deployments
    const { deployer } = await getNamedAccounts()
    log("--------------------------")
    const args = []
    const basicNft = await deploy("BasicNft", {
        from: deployer,
        log: true,
        args: args,
        waitConfirmations:network.config.blockConfirmations || 1
    })
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log("verfifying.......")
        await verify(basicNft.address, args)
    }
    log("-----------------")
}

module.exports.tags = ["all", "basicnft"]
