const { ethers } = require("hardhat");

async function deploy_nft() {
  console.log("Deploying the NFT contract");
  const nft = await ethers.getContractFactory("TaikoNFT");
  const nftInstance = await nft.deploy();
  await nftInstance.deployed();

  console.log("NFT Contract deployed to:", nftInstance.address);
  console.log("---------------------------------------------------------");
  return nftInstance;
}
deploy_nft();
module.exports = deploy_nft;
