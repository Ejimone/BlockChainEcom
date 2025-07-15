const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const [owner] = await ethers.getSigners();
    console.log("Deploying contracts with the account:", owner.address);

    // Deploy MockERC20 token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const mockERC20 = await MockERC20.deploy(ethers.parseEther("1000000"));
    await mockERC20.waitForDeployment();
    console.log("MockERC20 deployed to:", mockERC20.target);

    // Deploy EcomercePayment contract
    const EcomercePayment = await ethers.getContractFactory("EcomercePayment");
    const ecomercePayment = await EcomercePayment.deploy();
    await ecomercePayment.waitForDeployment();
    console.log("EcomercePayment deployed to:", ecomercePayment.target);

    // Add the mock token as a supported token in the payment contract
    console.log("Adding MockERC20 as a supported token...");
    await ecomercePayment.connect(owner).addSupportedToken(mockERC20.target);
    console.log("Supported token added.");

    // Save contract info for backend
    const contractInfo = {
        EcomercePayment: {
            address: ecomercePayment.target,
            abi: JSON.parse(ecomercePayment.interface.formatJson())
        },
        MockERC20: {
            address: mockERC20.target,
            abi: JSON.parse(mockERC20.interface.formatJson())
        }
    };

    const contractInfoPath = path.join(__dirname, "contract-info.json");
    fs.writeFileSync(contractInfoPath, JSON.stringify(contractInfo, null, 2));

    console.log(`Contract info saved to ${contractInfoPath}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
