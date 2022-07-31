const {run}=require('hardhat')

const verify=async(contractAddress,args)=>{
    console.log("Verifying  contract ...")
    try {
        await run("verify:verify",{
            address:contractAddress,
            constructorArguments:args
        })
    } catch (error) {
        if(error.message.toLowerCase().includes("already verified")){
            console.log("already verified")
        }else{
            console.log(error)
        }
    }
}
//market place address rinkeby->0x61199914aB62970F1B70768CDc0687523B6351Eb
//basic nft->0xE1FB2d03eC85a8e9b9343134D3f57aF098B384d5
module.exports={verify}