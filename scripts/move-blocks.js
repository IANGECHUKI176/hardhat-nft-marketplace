const { network } = require("hardhat")
const sleep = (timeInMs) => {
    return new Promise((resolve, reject) => setTimeout(resolve, timeInMs))
}
const moveBlocks = async (amount, sleepAmount = 0) => {
    console.log("Moving blocks....")
    for (let i = 0; i < amount; i++) {
        await network.provider.request({ method: "evm_mine", params: [] })
    }
    if (sleepAmount) {
        console.log(`sleeping for ${sleepAmount}`)
        await sleep(sleepAmount)
    }
}
module.exports={moveBlocks}