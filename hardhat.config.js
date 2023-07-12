require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.6",
  defaultNetwork: "sepolia",
  networks:{
    hardhat:{
      chainId:1337
    },
    sepolia: {
      url: process.env.SEPOLIA_URL,
      accounts: [process.env.ACCOUNT_PRIVATE_KEY],
      chainId: 11155111,
    }
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  }

};
