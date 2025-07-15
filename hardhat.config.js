require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545", // Default Ganache RPC server
      accounts: [
        "0xc96fc5caefaa6609f77f02cfbdaf3a3abc832dcc290afa4ee5672f0c9451f668",
        "0x5fa92f6a8805768739c34f4d260898f487f3dd644d97612b91a9d500c34175ca",
        // Add more private keys as needed
      ],
    },
  },
};

task("process-payment", "Processes a payment for a given order ID")
  .addParam("orderid", "The ID of the order to process")
  .setAction(async (taskArgs, hre) => {
    // Set the order ID as an environment variable so the script can read it
    process.env.ORDER_ID = taskArgs.orderid;
    // Run the script
    await hre.run('run', { script: 'scripts/processPayment.js' });
  });
