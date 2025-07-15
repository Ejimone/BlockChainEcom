const { ethers } = require("hardhat");
const { getContracts } = require("./utils.js");

/**
 * This script withdraws funds (ETH or ERC20 tokens) from the EcomercePayment contract.
 * It can only be called by the owner of the contract.
 *
 * To withdraw ETH:
 * npx hardhat withdraw --network <your-network>
 *
 * To withdraw ERC20 tokens:
 * npx hardhat withdraw --network <your-network> --token <token-address>
 */
async function main() {
    const tokenAddress = process.env.TOKEN_ADDRESS;

    try {
        const { EcomercePayment, contractInfo } = await getContracts();
        const [owner] = await ethers.getSigners();

        if (tokenAddress) {
            // Withdraw ERC20 tokens
            const token = contractInfo.MockERC20.address;
            if (tokenAddress.toLowerCase() !== token.toLowerCase()) {
                throw new Error(`Token address ${tokenAddress} is not the supported MockERC20 token.`);
            }

            const balance = await EcomercePayment.getBalance(token);
            if (balance === 0n) {
                throw new Error("No token balance to withdraw.");
            }

            console.log(`Withdrawing ${ethers.formatEther(balance)} OPM tokens...`);
            const tx = await EcomercePayment.connect(owner).withdrawTokens(token);
            await tx.wait();
            console.log("Tokens withdrawn successfully.");

        } else {
            // Withdraw ETH
            const balance = await EcomercePayment.getBalance("0x0000000000000000000000000000000000000000");
            if (balance === 0n) {
                throw new Error("No ETH balance to withdraw.");
            }

            console.log(`Withdrawing ${ethers.formatEther(balance)} ETH...`);
            const tx = await EcomercePayment.connect(owner).withdrawEth();
            await tx.wait();
            console.log("ETH withdrawn successfully.");
        }

    } catch (error) {
        console.error("An error occurred during withdrawal:");
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
