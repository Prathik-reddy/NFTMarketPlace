const { ethers } = require("hardhat");

const main = async () => {
    const Market = await ethers.getContractFactory("NFTMarket");
    const market = await Market.deploy();

    await market.deployed();
    const marketAddress = market.address;

    const NFT = await ethers.getContractFactory("NFT");
    const nft = await NFT.deploy(marketAddress);
    const nftAddress = nft.address;
    await nft.deployed();

    console.log("Contract NFT marketplace deployed at: ", marketAddress);
    console.log("Contract NFT deployed at: ", nftAddress);

}

main().catch((error) => console.error(error));

