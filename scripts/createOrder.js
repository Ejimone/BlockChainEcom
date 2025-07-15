const { ethers } = require("hardhat");
const { getContracts } = require("./utils");

async function main() {
    const { EcomercePayment, contractInfo } = await getContracts();
    const [_, buyer] = await ethers.getSigners(); // Use the second account as the buyer

    const tokenAddress = contractInfo.MockERC20.address;
    const amount = ethers.parseEther("5"); // 5 OPM

    console.log(`Creating a token order for ${ethers.formatEther(amount)} OPM...`);

    const tx = await EcomercePayment.connect(buyer).createOrder(amount, tokenAddress);
    const receipt = await tx.wait();

    const createOrderLog = receipt.logs.find(log => log.eventName === 'PaymentPending');
    if (!createOrderLog) {
        throw new Error("PaymentPending event not found");
    }
    
    const orderId = createOrderLog.args[0];

    console.log(`Order created with ID: ${orderId}`);
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
