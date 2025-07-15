const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EcomercePayment Full Flow", function () {
    let ecomercePayment, mockERC20, owner, buyer, otherUser;

    beforeEach(async function () {
        [owner, buyer, otherUser] = await ethers.getSigners();

        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockERC20 = await MockERC20.deploy(ethers.parseEther("1000000"));
        await mockERC20.waitForDeployment();

        const EcomercePayment = await ethers.getContractFactory("EcomercePayment");
        ecomercePayment = await EcomercePayment.deploy();
        await ecomercePayment.waitForDeployment();

        await ecomercePayment.connect(owner).addSupportedToken(mockERC20.target);
    });

    async function createAndPayTokenOrder(signer, amount) {
        const orderId = await ecomercePayment.nextOrderId();
        await ecomercePayment.connect(signer).createOrder(amount, mockERC20.target);
        await mockERC20.connect(owner).transfer(signer.address, amount);
        await mockERC20.connect(signer).approve(ecomercePayment.target, amount);
        await ecomercePayment.connect(signer).processTokenPayment(orderId);
        return orderId;
    }

    describe("Withdrawals", function () {
        it("Should allow the owner to withdraw the full token balance", async () => {
            const amount = ethers.parseEther("50");
            await createAndPayTokenOrder(buyer, amount);

            const initialOwnerBalance = await mockERC20.balanceOf(owner.address);
            await ecomercePayment.connect(owner).withdrawTokens(mockERC20.target);
            const finalOwnerBalance = await mockERC20.balanceOf(owner.address);

            expect(finalOwnerBalance).to.equal(initialOwnerBalance + amount);
            expect(await ecomercePayment.getBalance(mockERC20.target)).to.equal(0);
        });

        it("Should prevent non-owners from withdrawing tokens", async () => {
            await expect(ecomercePayment.connect(buyer).withdrawTokens(mockERC20.target)).to.be.reverted;
        });
    });

    describe("Refunds", function () {
        it("Should allow the owner to fully refund a token order", async () => {
            const amount = ethers.parseEther("25");
            const orderId = await createAndPayTokenOrder(buyer, amount);

            const buyerBalanceBeforeRefund = await mockERC20.balanceOf(buyer.address);

            await ecomercePayment.connect(owner).initiateRefund(orderId);
            let order = await ecomercePayment.getOrder(orderId);
            expect(order.status).to.equal(4); // RefundPending

            await ecomercePayment.connect(owner).processRefund(orderId);
            order = await ecomercePayment.getOrder(orderId);
            expect(order.status).to.equal(2); // Refunded

            const buyerBalanceAfterRefund = await mockERC20.balanceOf(buyer.address);
            expect(buyerBalanceAfterRefund).to.equal(buyerBalanceBeforeRefund + amount);
        });

        it("Should prevent non-owners from initiating or processing refunds", async () => {
            const amount = ethers.parseEther("10");
            const orderId = await createAndPayTokenOrder(buyer, amount);

            await expect(ecomercePayment.connect(buyer).initiateRefund(orderId)).to.be.reverted;
            await ecomercePayment.connect(owner).initiateRefund(orderId); // Owner initiates
            await expect(ecomercePayment.connect(buyer).processRefund(orderId)).to.be.reverted;
        });
    });

    describe("Order Cancellation", function () {
        it("Should allow a buyer to cancel their own pending orders", async () => {
            const orderId1 = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(ethers.parseEther("1"), mockERC20.target);
            
            const orderId2 = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(ethers.parseEther("2"), mockERC20.target);

            await ecomercePayment.connect(buyer).cancelOrders([orderId1, orderId2]);

            const order1 = await ecomercePayment.getOrder(orderId1);
            const order2 = await ecomercePayment.getOrder(orderId2);

            expect(order1.status).to.equal(3); // Failed
            expect(order2.status).to.equal(3); // Failed
        });

        it("Should prevent a user from cancelling another user's order", async () => {
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(ethers.parseEther("1"), mockERC20.target);

            await expect(ecomercePayment.connect(otherUser).cancelOrders([orderId])).to.be.reverted;
        });

        it("Should prevent cancelling an order that is not pending", async () => {
            const orderId = await createAndPayTokenOrder(buyer, ethers.parseEther("5"));
            await expect(ecomercePayment.connect(buyer).cancelOrders([orderId])).to.be.reverted;
        });
    });

    describe("Information Retrieval", function () {
        it("Should return correct order details with getOrder", async () => {
            const amount = ethers.parseEther("10");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, mockERC20.target);

            const order = await ecomercePayment.getOrder(orderId);
            expect(order.buyer).to.equal(buyer.address);
            expect(order.amount).to.equal(amount);
            expect(order.status).to.equal(0); // Pending
        });

        it("Should return a list of orders for a specific buyer", async () => {
            const orderId1 = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(ethers.parseEther("1"), mockERC20.target);
            const orderId2 = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(ethers.parseEther("2"), mockERC20.target);

            const buyerOrders = await ecomercePayment.getBuyerOrders(buyer.address);
            expect(buyerOrders).to.have.lengthOf(2);
            expect(buyerOrders.map(id => id.toString())).to.deep.equal([orderId1.toString(), orderId2.toString()]);
        });

        it("Should return the correct token balance of the contract", async () => {
            const amount = ethers.parseEther("15");
            await createAndPayTokenOrder(buyer, amount);

            const balance = await ecomercePayment.getBalance(mockERC20.target);
            expect(balance).to.equal(amount);
        });
    });
});
