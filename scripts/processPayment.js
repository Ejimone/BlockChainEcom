const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [owner, buyer] = await ethers.getSigners();
    const contractInfoPath = path.join(__dirname, "contract-info.json");
    const contractInfo = JSON.parse(fs.readFileSync(contractInfoPath, "utf8"));

    const ecomercePaymentAddress = contractInfo.EcomercePayment.address;
    const ecomercePaymentAbi = contractInfo.EcomercePayment.abi;
    const mockERC20Address = contractInfo.MockERC20.address;
    const mockERC20Abi = contractInfo.MockERC20.abi;

    const ecomercePayment = new ethers.Contract(ecomercePaymentAddress, ecomercePaymentAbi, owner);
    const mockERC20 = new ethers.Contract(mockERC20Address, mockERC20Abi, owner);

    // Get orderId from environment variable
    const orderId = process.env.ORDER_ID;
    if (!orderId) {
        console.error("Please provide an order ID by running the 'process-payment' task.");
        process.exit(1);
    }

    console.log(`Fetching details for order ${orderId}...`);

    const order = await ecomercePayment.getOrder(orderId);
    if (order.buyer === ethers.ZeroAddress) {
        console.error(`Order with ID ${orderId} not found.`);
        process.exit(1);
    }
    const amount = order.amount;

    console.log(`Processing payment for order ${orderId} with amount ${ethers.formatEther(amount)} OPM...`);

    // Mint tokens to the buyer and approve the contract
    console.log(`Minting ${ethers.formatEther(amount)} OPM to buyer...`);
    await mockERC20.connect(owner).transfer(buyer.address, amount);
    console.log("Tokens minted.");

    console.log("Approving EcomercePayment contract to spend tokens...");
    await mockERC20.connect(buyer).approve(ecomercePaymentAddress, amount);
    console.log("Approval successful.");

    // Process the token payment
    console.log("Processing token payment...");
    const tx = await ecomercePayment.connect(buyer).processTokenPayment(orderId);
    await tx.wait();

    console.log(`Payment for order ${orderId} processed successfully.`);
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
