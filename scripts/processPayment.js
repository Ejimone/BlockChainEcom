const { ethers } = require("hardhat");
const { getContracts, getStatusString, PaymentStatus } = require("./utils.js");

/**
 * This script processes a payment for a given order ID.
 * It performs the following steps:
 * 1. Validates the order ID.
 * 2. Checks if the order exists and is in a 'Pending' state.
 * 3. Mints the required amount of tokens to the buyer.
 * 4. Approves the payment contract to spend the tokens.
 * 5. Processes the payment.
 */
async function main() {
    const orderId = process.env.ORDER_ID;
    if (!orderId) {
        console.error("Please provide an order ID by running the 'process-payment' task.");
        process.exit(1);
    }

    try {
        const { EcomercePayment, MockERC20 } = await getContracts();
        const [owner, buyer] = await ethers.getSigners();

        console.log(`Fetching details for order ${orderId}...`);
        const order = await EcomercePayment.getOrder(orderId);

        if (order.buyer === "0x0000000000000000000000000000000000000000") {
            throw new Error(`Order with ID ${orderId} not found.`);
        }

        if (order.status !== BigInt(PaymentStatus.Pending)) {
            throw new Error(`Cannot process payment. Order ${orderId} has a status of '${getStatusString(order.status)}'. Only pending orders can be processed.`);
        }

        const amount = order.amount;
        console.log(`Processing payment for order ${orderId} with amount ${ethers.formatEther(amount)} OPM...`);

        console.log(`Minting ${ethers.formatEther(amount)} OPM to buyer...`);
        const mintTx = await MockERC20.connect(owner).transfer(buyer.address, amount);
        await mintTx.wait();
        console.log("Tokens minted successfully.");

        console.log("Approving EcomercePayment contract to spend tokens...");
        const approveTx = await MockERC20.connect(buyer).approve(EcomercePayment.target, amount);
        await approveTx.wait();
        console.log("Approval successful.");

        console.log("Processing token payment...");
        const paymentTx = await EcomercePayment.connect(buyer).processTokenPayment(orderId);
        await paymentTx.wait();

        console.log(`Payment for order ${orderId} processed successfully.`);
        console.log("Transaction hash:", paymentTx.hash);

    } catch (error) {
        console.error("An error occurred while processing the payment:");
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