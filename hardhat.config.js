require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
};

task("process-payment", "Processes a payment for a given order ID")
  .addParam("orderid", "The ID of the order to process")
  .setAction(async (taskArgs, hre) => {
    // Set the order ID as an environment variable so the script can read it
    process.env.ORDER_ID = taskArgs.orderid;
    // Run the script
    await hre.run('run', { script: 'scripts/processPayment.js' });
  });
