const { ethers } = require("hardhat");
const { getContracts, getStatusString } = require("./utils.js");

/**
 * This script retrieves various pieces of information from the EcomercePayment contract.
 *
 * To get order details:
 * npx hardhat get-info --network <your-network> --query order --orderid <ID>
 *
 * To get a buyer's order list:
 * npx hardhat get-info --network <your-network> --query buyer --buyer <buyer-address>
 *
 * To get the contract's ETH balance:
 * npx hardhat get-info --network <your-network> --query balance
 *
 * To get the contract's token balance:
 * npx hardhat get-info --network <your-network> --query balance --token <token-address>
 */
async function main() {
    const queryType = process.env.QUERY_TYPE;

    try {
        const { EcomercePayment, contractInfo } = await getContracts();

        switch (queryType) {
            case "order":
                const orderId = process.env.ORDER_ID;
                if (!orderId) throw new Error("Order ID is required for 'order' query.");
                const order = await EcomercePayment.getOrder(orderId);
                if (order.buyer === "0x0000000000000000000000000000000000000000") {
                    console.log(`Order ${orderId} not found.`);
                } else {
                    console.log(`Order ${orderId} Details:`);
                    console.log(`  - Buyer: ${order.buyer}`);
                    console.log(`  - Amount: ${ethers.formatEther(order.amount)}`);
                    console.log(`  - Status: ${getStatusString(order.status)}`);
                    console.log(`  - Token: ${order.isTokenPayment ? order.paymentToken : "ETH"}`);
                }
                break;

            case "buyer":
                const buyerAddress = process.env.BUYER_ADDRESS;
                if (!buyerAddress) throw new Error("Buyer address is required for 'buyer' query.");
                const orders = await EcomercePayment.getBuyerOrders(buyerAddress);
                console.log(`Orders for buyer ${buyerAddress}:`);
                console.log(orders.map(id => id.toString()));
                break;

            case "balance":
                const tokenAddress = process.env.TOKEN_ADDRESS || "0x0000000000000000000000000000000000000000";
                const balance = await EcomercePayment.getBalance(tokenAddress);
                const tokenSymbol = tokenAddress === "0x0000000000000000000000000000000000000000" ? "ETH" : "OPM";
                console.log(`Contract balance for ${tokenSymbol}: ${ethers.formatEther(balance)}`);
                break;

            default:
                throw new Error(`Invalid query type '${queryType}'. Use 'order', 'buyer', or 'balance'.`);
        }

    } catch (error) {
        console.error("An error occurred while getting information:");
        console.error(error.message);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
