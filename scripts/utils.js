const fs = require("fs");
const path = require("path");
const { ethers } = require("hardhat");

const contractInfoPath = path.join(__dirname, "contract-info.json");

/**
 * Loads contract information (address, ABI) from the generated JSON file.
 * @throws {Error} If the contract-info.json file is not found.
 * @returns {object} The contract information object.
 */
function getContractInfo() {
    if (!fs.existsSync(contractInfoPath)) {
        throw new Error("Contract info file not found. Please deploy contracts first by running 'npx hardhat run scripts/deploy.js'");
    }
    return JSON.parse(fs.readFileSync(contractInfoPath, "utf8"));
}

/**
 * Gets ethers.js contract instances for interacting with the deployed contracts.
 * @returns {Promise<object>} An object containing the EcomercePayment and MockERC20 contract instances.
 */
async function getContracts() {
    const contractInfo = getContractInfo();
    const EcomercePayment = await ethers.getContractAt(
        "EcomercePayment",
        contractInfo.EcomercePayment.address
    );
    const MockERC20 = await ethers.getContractAt(
        "MockERC20",
        contractInfo.MockERC20.address
    );
    return { EcomercePayment, MockERC20, contractInfo };
}

// Enum for PaymentStatus to be used consistently across scripts.
const PaymentStatus = {
    Pending: 0,
    Completed: 1,
    Refunded: 2,
    Failed: 3,
    RefundPending: 4,
    RefundRequested: 5
};

/**
 * Converts a BigInt status from the contract to a human-readable string.
 * @param {bigint} status The status from the contract.
 * @returns {string} The string representation of the status.
 */
function getStatusString(status) {
    const statusBigInt = BigInt(status);
    for (const key in PaymentStatus) {
        if (BigInt(PaymentStatus[key]) === statusBigInt) {
            return key;
        }
    }
    return "Unknown";
}

module.exports = {
    getContractInfo,
    getContracts,
    getStatusString,
    PaymentStatus
};
