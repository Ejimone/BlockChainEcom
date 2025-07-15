const { ethers } = require("hardhat");
const { getContracts, getStatusString, PaymentStatus } = require("./utils.js");

/**
 * This script cancels one or more pending orders. It can only be called by the buyer
 * who created the orders.
 *
 * To cancel orders:
 * npx hardhat cancel-orders --network <your-network> --orderids <ID1,ID2,...>
 */
async function main() {
    const orderIdsStr = process.env.ORDER_IDS;
    if (!orderIdsStr) {
        console.error("Please provide a comma-separated list of order IDs.");
        process.exit(1);
    }

    const orderIds = orderIdsStr.split(',').map(id => id.trim());

    try {
        const { EcomercePayment } = await getContracts();
        const [_, buyer] = await ethers.getSigners();

        console.log(`Attempting to cancel orders: ${orderIds.join(', ')}...`);

        // Optional: Add a check to ensure all orders are valid and pending
        for (const orderId of orderIds) {
            const order = await EcomercePayment.getOrder(orderId);
            if (order.buyer !== buyer.address) {
                throw new Error(`Order ${orderId} does not belong to the connected buyer.`);
            }
            if (order.status !== BigInt(PaymentStatus.Pending)) {
                throw new Error(`Order ${orderId} is not pending and cannot be cancelled.`);
            }
        }

        const tx = await EcomercePayment.connect(buyer).cancelOrders(orderIds);
        await tx.wait();

        console.log("Orders cancelled successfully.");
        console.log("Transaction hash:", tx.hash);

    } catch (error) {
        console.error("An error occurred while cancelling orders:");
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
