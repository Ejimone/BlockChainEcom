const { getContracts, getStatusString, PaymentStatus } = require("./utils.js");

/**
 * This script handles refunds for orders. It can either initiate a refund (owner only)
 * or process a pending refund (owner only).
 *
 * To initiate a refund:
 * npx hardhat refund --network <your-network> --orderid <ID> --action initiate
 *
 * To process a refund:
 * npx hardhat refund --network <your-network> --orderid <ID> --action process
 */
async function main() {
    const orderId = process.env.ORDER_ID;
    const action = process.env.REFUND_ACTION;

    if (!orderId || !action) {
        console.error("Please provide an order ID and an action (initiate or process).");
        process.exit(1);
    }

    try {
        const { EcomercePayment } = await getContracts();
        const order = await EcomercePayment.getOrder(orderId);

        if (order.buyer === "0x0000000000000000000000000000000000000000") {
            throw new Error(`Order with ID ${orderId} not found.`);
        }

        if (action === "initiate") {
            if (order.status !== BigInt(PaymentStatus.Completed)) {
                throw new Error(`Cannot initiate refund. Order status is '${getStatusString(order.status)}', not 'Completed'.`);
            }
            console.log(`Initiating refund for order ${orderId}...`);
            const tx = await EcomercePayment.initiateRefund(orderId);
            await tx.wait();
            console.log("Refund initiated successfully.");

        } else if (action === "process") {
            if (order.status !== BigInt(PaymentStatus.RefundPending)) {
                throw new Error(`Cannot process refund. Order status is '${getStatusString(order.status)}', not 'RefundPending'.`);
            }
            console.log(`Processing refund for order ${orderId}...`);
            const tx = await EcomercePayment.processRefund(orderId);
            await tx.wait();
            console.log("Refund processed successfully.");

        } else {
            throw new Error(`Invalid action '${action}'. Use 'initiate' or 'process'.`);
        }

    } catch (error) {
        console.error("An error occurred during the refund process:");
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
