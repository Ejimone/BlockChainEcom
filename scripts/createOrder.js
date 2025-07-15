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

    const ecomercePayment = new ethers.Contract(ecomercePaymentAddress, ecomercePaymentAbi, owner);
    
    const amount = ethers.parseEther("5"); // 5 OPM

    console.log(`Creating a token order for ${ethers.formatEther(amount)} OPM...`);

    const tx = await ecomercePayment.connect(buyer).createOrder(amount, mockERC20Address);
    const receipt = await tx.wait();
    
    // The orderId is now the first argument of the PaymentPending event
    const orderId = receipt.logs[0].args[0];

    console.log(`Order created with ID: ${orderId}`);
    console.log("Transaction hash:", tx.hash);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
