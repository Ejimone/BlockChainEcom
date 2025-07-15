require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    ganache: {
      url: "HTTP://127.0.0.1:7545", // Default Ganache RPC server
      accounts: [
        "0x94a2b9841e3d8ca1c07a6830d8ef1b678219afe47c69c5e4a1066c3306ff5470",
        "0xa954cd7361ed33aec92cee7ed312dbe2712804c96e871e44f1f96e35df88baf2",
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

task("withdraw", "Withdraws funds from the contract")
  .addOptionalParam("token", "The address of the ERC20 token to withdraw")
  .setAction(async (taskArgs, hre) => {
    process.env.TOKEN_ADDRESS = taskArgs.token;
    await hre.run('run', { script: 'scripts/withdraw.js' });
  });

task("refund", "Initiates or processes a refund for an order")
  .addParam("orderid", "The ID of the order to refund")
  .addParam("action", "The refund action to perform (initiate or process)")
  .setAction(async (taskArgs, hre) => {
    process.env.ORDER_ID = taskArgs.orderid;
    process.env.REFUND_ACTION = taskArgs.action;
    await hre.run('run', { script: 'scripts/refund.js' });
  });

task("cancel-orders", "Cancels one or more pending orders")
  .addParam("orderids", "A comma-separated list of order IDs to cancel")
  .setAction(async (taskArgs, hre) => {
    process.env.ORDER_IDS = taskArgs.orderids;
    await hre.run('run', { script: 'scripts/cancelOrder.js' });
  });

task("get-info", "Gets information from the contract")
  .addParam("query", "The type of query to run (order, buyer, balance)")
  .addOptionalParam("orderid", "The ID of the order to query")
  .addOptionalParam("buyer", "The address of the buyer to query")
  .addOptionalParam("token", "The address of the token to query for balance")
  .setAction(async (taskArgs, hre) => {
    process.env.QUERY_TYPE = taskArgs.query;
    process.env.ORDER_ID = taskArgs.orderid;
    process.env.BUYER_ADDRESS = taskArgs.buyer;
    process.env.TOKEN_ADDRESS = taskArgs.token;
    await hre.run('run', { script: 'scripts/getInfo.js' });
  });
