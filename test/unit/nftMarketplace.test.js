const { assert, expect } = require("chai")
const { network, deployments, getNamedAccounts, ethers } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("Nft Marketplace Tests", () => {
          let nftMarketplace, nftMarketPlaceContract, basicNft, basicNftContract, deployer, player
          const PRICE = ethers.utils.parseEther("0.1")
          const TOKENID = 0
          beforeEach(async () => {
              //deployer = (await getNamedAccounts()).deployer
              // player=(await getNamedAccounts()).player
              accounts = await ethers.getSigners()
              deployer = accounts[0]
              player = accounts[1]
              await deployments.fixture(["all"])
              nftMarketPlaceContract = await ethers.getContract("NftMarketplace")
              nftMarketplace = nftMarketPlaceContract.connect(deployer)
              basicNftContract = await ethers.getContract("BasicNft")
              /*contract.connect(signer)-. from ethers 
               @dev getNamedAccounts gives us address but we want signer ->so we use getSigners which we use to connect to contract
              */
              basicNft = basicNftContract.connect(deployer)
              await basicNft.mintNft()
              await basicNft.approve(nftMarketPlaceContract.address, TOKENID)
          })
          describe("listItem", () => {
              it("confirms whether nft is listed and it can be bought", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  const playerConnectedNftMarketplace = await nftMarketPlaceContract.connect(player)
                  await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKENID, {
                      value: PRICE,
                  })
                  const newOwner = await basicNft.ownerOf(TOKENID)
                  const proceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert(newOwner == player.address)
                  assert(proceeds.toString() == PRICE.toString())
              })
              it("reverts if a non owner tries to make a listing", async () => {
                  // await basicNftContract.connect(player)
                  //player 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
                  //depl 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
                  nftMarketplace = await nftMarketPlaceContract.connect(player)
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })
              it("reverts if the item is already listed", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)

                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__AlreadyListed")
              })
              it("ensures item is approved to be on marketplace", async () => {
                  await basicNft.approve(ethers.constants.AddressZero, TOKENID)

                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotApprovedForMarketplace")
              })
              it("ensures that listing price is above zero", async () => {
                  const BELOW_ZERO_PRICE = ethers.utils.parseEther("0")
                  await expect(
                      nftMarketplace.listItem(basicNft.address, TOKENID, BELOW_ZERO_PRICE)
                  ).to.be.revertedWith("NftMarketplace__PriceMustBeAboveZero")
              })
              it("emits an event when item is listed", async () => {
                  await expect(nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)).to.emit(
                      nftMarketplace,
                      "ItemListed"
                  )
              })
          })
          describe("buyItem", () => {
              it("reverts if item is not listed", async () => {
                  const playerConnectedNftMarketplace = await nftMarketPlaceContract.connect(player)
                  await expect(
                      playerConnectedNftMarketplace.buyItem(basicNft.address, TOKENID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
              it("reverts if buying price is less than listed price", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  const SMALL_PRICE = ethers.utils.parseEther("0.05")
                  const playerConnectedNftMarketplace = await nftMarketPlaceContract.connect(player)

                  await expect(
                      playerConnectedNftMarketplace.buyItem(basicNft.address, TOKENID, {
                          value: SMALL_PRICE,
                      })
                  ).to.be.revertedWith("NftMarketplace__PriceNotMet")
              })
              it("ensures proceeds equal to buying price,item is delisted,ownership transfered to buyer", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  const oldOwner = await basicNft.ownerOf(TOKENID)

                  const playerConnectedNftMarketplace = await nftMarketPlaceContract.connect(player)
                  await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKENID, {
                      value: PRICE,
                  })
                  //1/proceeds equal buying price
                  const proceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert.equal(proceeds.toString(), PRICE.toString())
                  //2.delisting
                  const listedItem = await nftMarketplace.getListing(basicNft.address, TOKENID)
                  assert.equal(listedItem.price.toString(), "0")
                  //3.transfered ownership from (deployer to player)

                  const newOwner = await basicNft.ownerOf(TOKENID)
                  assert.equal(newOwner, player.address)
              })
              it("emits event when item is bought", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  const playerConnectedNftMarktplace = await nftMarketPlaceContract.connect(player)
                  await expect(
                      playerConnectedNftMarktplace.buyItem(basicNft.address, TOKENID, {
                          value: PRICE,
                      })
                  ).to.emit(nftMarketplace, "ItemBought")
              })
          })
          describe("cancel listing", () => {
              it("reverts if non owner tries to cancel listing", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  const playerConnectedNftMarketplace = await nftMarketPlaceContract.connect(player)
                  await expect(
                      playerConnectedNftMarketplace.cancelListing(basicNft.address, TOKENID)
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })
              it("reverts if item being cancelled is not listed", async () => {
                  await expect(
                      nftMarketplace.cancelListing(basicNft.address, TOKENID)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
              it("cancels item from listing  ", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)

                  await nftMarketplace.cancelListing(basicNft.address, TOKENID)
                  const listedItem = await nftMarketplace.getListing(basicNft.address, TOKENID)
                  assert.equal(listedItem.price.toString(), "0")
              })
              it("emits event when item is delisted", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  await expect(nftMarketplace.cancelListing(basicNft.address, TOKENID)).to.emit(
                      nftMarketplace,
                      "ItemCanceled"
                  )
              })
          })
          describe("updateListing", () => {
              it("reverts if non owner tries to update listing", async () => {
                  const NEW_PRICE = ethers.utils.parseEther("0.2")
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  const playerConnectedNftMarketplace = await nftMarketPlaceContract.connect(player)
                  await expect(
                      playerConnectedNftMarketplace.updateListing(
                          basicNft.address,
                          TOKENID,
                          NEW_PRICE
                      )
                  ).to.be.revertedWith("NftMarketplace__NotOwner")
              })
              it("reverts is item being updated is not listed", async () => {
                  const NEW_PRICE = ethers.utils.parseEther("0.2")
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKENID, NEW_PRICE)
                  ).to.be.revertedWith("NftMarketplace__NotListed")
              })
              it("changes price from original to new and emits event", async () => {
                  const NEW_PRICE = ethers.utils.parseEther("0.2")
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  await expect(
                      nftMarketplace.updateListing(basicNft.address, TOKENID, NEW_PRICE)
                  ).to.emit(nftMarketplace, "ItemListed")
                  const newItem = await nftMarketplace.getListing(basicNft.address, TOKENID)
                  assert.equal(newItem.price.toString(), NEW_PRICE.toString())
              })
          })
          describe("withdrawProceeds", () => {
              it("reverts if there are no proceeds and confirms there is none", async () => {
                  const proceeds = await nftMarketplace.getProceeds(deployer.address)
                  assert.equal(proceeds.toString(), "0")
                  await expect(nftMarketplace.withdrawProceeds()).to.be.revertedWith(
                      "NftMarketplace__NoProceeds"
                  )
              })
              it("resets proceeds to zero and withdraws funds into owner", async () => {
                  await nftMarketplace.listItem(basicNft.address, TOKENID, PRICE)
                  const playerConnectedNftMarketplace = await nftMarketPlaceContract.connect(player)
                  await playerConnectedNftMarketplace.buyItem(basicNft.address, TOKENID, {
                      value: PRICE,
                  })
                  /**
                   * @me from the future  
                   * balance b4 buying -1000
                   * bought for 50
                   * total balance->1050
                   * during withdraw gas is used -> gasUsed-ie 2litres ,gas price per liter ->10
                   * total gas cost ->20
                   * balance after 1050-20=1030
                   * comparison->  1000 + 50 === 1030+20  
                   */
                  const proceedsBefore = await nftMarketplace.getProceeds(deployer.address)
                  const deployerBalanceBefore = await deployer.getBalance()
                  const txResponse = await nftMarketplace.withdrawProceeds()
                  const txReceipt = await txResponse.wait(1)
                  const { gasUsed, effectiveGasPrice } = txReceipt
                  const proceedsAfter = await nftMarketplace.getProceeds(deployer.address)
                  assert.equal(proceedsAfter.toString(), "0")
                  const deployerBalanceAfter = await deployer.getBalance()
                  const totalGasCost = gasUsed.mul(effectiveGasPrice)
                  assert(
                      deployerBalanceBefore.add(proceedsBefore).toString(),
                      deployerBalanceAfter.add(totalGasCost).toString()
                  )
              })
          })
      })
