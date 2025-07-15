const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("EcomercePayment", function () {
    let EcomercePayment;
    let ecomercePayment;
    let owner;
    let buyer;
    let seller;
    let mockERC20;

    const MINIMUM_PAYMENT = ethers.parseEther("0.01");

    beforeEach(async function () {
        [owner, buyer, seller] = await ethers.getSigners();

        // Deploy Mock ERC20 Token
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockERC20 = await MockERC20.deploy("MockToken", "MTK", ethers.parseEther("1000"));
        await mockERC20.waitForDeployment();

        EcomercePayment = await ethers.getContractFactory("EcomercePayment");
        ecomercePayment = await EcomercePayment.deploy();
        await ecomercePayment.waitForDeployment();

        // Add mockERC20 as a supported token
        await ecomercePayment.connect(owner).addSupportedToken(mockERC20.target);
    });

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            expect(await ecomercePayment.owner()).to.equal(owner.address);
        });
    });

    describe("Order Creation", function () {
        it("Should create an ETH order successfully", async function () {
            const amount = ethers.parseEther("0.05");
            const nextOrderId = await ecomercePayment.nextOrderId();
            await expect(ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress))
                .to.emit(ecomercePayment, "PaymentPending")
                .withArgs(nextOrderId, buyer.address, amount, ethers.ZeroAddress);

            const order = await ecomercePayment.orders(nextOrderId);
            expect(order.buyer).to.equal(buyer.address);
            expect(order.amount).to.equal(amount);
            expect(order.status).to.equal(0); // Pending
            expect(order.isTokenPayment).to.be.false;
        });

        it("Should create a Token order successfully", async function () {
            const amount = ethers.parseEther("10");
            const nextOrderId = await ecomercePayment.nextOrderId();
            await expect(ecomercePayment.connect(buyer).createOrder(amount, mockERC20.target))
                .to.emit(ecomercePayment, "PaymentPending")
                .withArgs(nextOrderId, buyer.address, amount, mockERC20.target);

            const order = await ecomercePayment.orders(nextOrderId);
            expect(order.buyer).to.equal(buyer.address);
            expect(order.amount).to.equal(amount);
            expect(order.status).to.equal(0); // Pending
            expect(order.isTokenPayment).to.be.true;
            expect(order.paymentToken).to.equal(mockERC20.target);
        });

        it("Should revert if amount is below minimum", async function () {
            const amount = ethers.parseEther("0.005");
            await expect(ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress))
                .to.be.revertedWith("Amount below minimum");
        });

        it("Should revert if token is not supported", async function () {
            const amount = ethers.parseEther("1");
            const unsupportedToken = "0x1234567890123456789012345678901234567890"; // A random address
            await expect(ecomercePayment.connect(buyer).createOrder(amount, unsupportedToken))
                .to.be.revertedWith("Token not supported");
        });
    });

    describe("Payment Processing", function () {
        it("Should process ETH payment successfully", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);

            await expect(ecomercePayment.connect(buyer).processEthPayment(orderId, { value: amount }))
                .to.emit(ecomercePayment, "PaymentReceived")
                .withArgs(buyer.address, amount, ethers.ZeroAddress)
                .and.to.emit(ecomercePayment, "PaymentCompleted")
                .withArgs(buyer.address, amount, ethers.ZeroAddress);

            const order = await ecomercePayment.orders(orderId);
            expect(order.status).to.equal(1); // Completed
            expect(await ecomercePayment.getBalance(ethers.ZeroAddress)).to.equal(amount);
        });

        it("Should process Token payment successfully", async function () {
            const amount = ethers.parseEther("10");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, mockERC20.target);

            // Mint tokens to buyer and approve contract
            await mockERC20.connect(owner).transfer(buyer.address, amount);
            await mockERC20.connect(buyer).approve(ecomercePayment.target, amount);

            await expect(ecomercePayment.connect(buyer).processTokenPayment(orderId))
                .to.emit(ecomercePayment, "PaymentReceived")
                .withArgs(buyer.address, amount, mockERC20.target)
                .and.to.emit(ecomercePayment, "PaymentCompleted")
                .withArgs(buyer.address, amount, mockERC20.target);

            const order = await ecomercePayment.orders(orderId);
            expect(order.status).to.equal(1); // Completed
            expect(await ecomercePayment.getBalance(mockERC20.target)).to.equal(amount);
        });

        it("Should revert ETH payment if insufficient amount", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);

            await expect(ecomercePayment.connect(buyer).processEthPayment(orderId, { value: ethers.parseEther("0.01") }))
                .to.be.revertedWith("Insufficient payment");
        });

        it("Should revert Token payment if allowance too low", async function () {
            const amount = ethers.parseEther("10");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, mockERC20.target);

            // Mint tokens to buyer but don't approve enough
            await mockERC20.connect(owner).transfer(buyer.address, amount);
            await mockERC20.connect(buyer).approve(ecomercePayment.target, ethers.parseEther("5")); // Approve less than required

            await expect(ecomercePayment.connect(buyer).processTokenPayment(orderId))
                .to.be.revertedWith("Token allowance too low");
        });
    });

    describe("Refunds", function () {
        it("Should initiate and process ETH refund successfully", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);
            await ecomercePayment.connect(buyer).processEthPayment(orderId, { value: amount });

            // Simulate contract having ETH to refund
            await owner.sendTransaction({ to: ecomercePayment.target, value: amount });

            await expect(ecomercePayment.connect(owner).initiateRefund(orderId))
                .to.emit(ecomercePayment, "RefundPending")
                .withArgs(buyer.address, orderId, amount);

            const initialBuyerBalance = await ethers.provider.getBalance(buyer.address);

            await expect(ecomercePayment.connect(owner).processRefund(orderId))
                .to.emit(ecomercePayment, "RefundSuccessful")
                .withArgs(buyer.address, orderId, amount)
                .and.to.emit(ecomercePayment, "PaymentRefunded")
                .withArgs(buyer.address, amount, ethers.ZeroAddress);

            const order = await ecomercePayment.orders(orderId);
            expect(order.status).to.equal(2); // Refunded
            expect(await ethers.provider.getBalance(buyer.address)).to.be.closeTo(initialBuyerBalance + amount, ethers.parseEther("0.001")); // Account for gas
        });

        it("Should initiate and process Token refund successfully", async function () {
            const amount = ethers.parseEther("10");
            // Get the correct orderId right before creating the order
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, mockERC20.target);

            // Mint tokens to buyer and approve contract
            await mockERC20.connect(owner).transfer(buyer.address, amount);
            await mockERC20.connect(buyer).approve(ecomercePayment.target, amount);

            await expect(ecomercePayment.connect(buyer).processTokenPayment(orderId))
                .to.emit(ecomercePayment, "PaymentReceived")
                .withArgs(buyer.address, amount, mockERC20.target)
                .and.to.emit(ecomercePayment, "PaymentCompleted")
                .withArgs(buyer.address, amount, mockERC20.target);

            const order = await ecomercePayment.orders(orderId);
            expect(order.status).to.equal(1); // Completed
            expect(await ecomercePayment.getBalance(mockERC20.target)).to.equal(amount);
        });

        it("Should revert initiateRefund if not owner", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);
            await ecomercePayment.connect(buyer).processEthPayment(orderId, { value: amount });

            await expect(ecomercePayment.connect(buyer).initiateRefund(orderId))
                .to.be.revertedWith("Only owner can call this function");
        });

        it("Should revert processRefund if not owner", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);
            await ecomercePayment.connect(buyer).processEthPayment(orderId, { value: amount });
            await ecomercePayment.connect(owner).initiateRefund(orderId);

            await expect(ecomercePayment.connect(buyer).processRefund(orderId))
                .to.be.revertedWith("Only owner can call this function");
        });

        it("Should revert processRefund if order not in RefundPending status", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);
            // Order is still Pending

            await expect(ecomercePayment.connect(owner).processRefund(orderId))
                .to.be.revertedWith("Refund not pending");
        });
    });

    describe("Withdrawals", function () {
        it("Should allow owner to withdraw ETH", async function () {
            const amount = ethers.parseEther("0.1");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);
            await ecomercePayment.connect(buyer).processEthPayment(orderId, { value: amount });

            const initialOwnerBalance = await ethers.provider.getBalance(owner.address);
            const contractBalance = await ethers.provider.getBalance(ecomercePayment.target);

            await expect(ecomercePayment.connect(owner).withdrawEth())
                .to.emit(ecomercePayment, "PaymentSent")
                .withArgs(owner.address, amount, ethers.ZeroAddress);

            expect(await ethers.provider.getBalance(owner.address)).to.be.closeTo(initialOwnerBalance + contractBalance, ethers.parseEther("0.001")); // Account for gas
            expect(await ecomercePayment.getBalance(ethers.ZeroAddress)).to.equal(0);
        });

        it("Should allow owner to withdraw Tokens", async function () {
            const amount = ethers.parseEther("20");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, mockERC20.target);

            await mockERC20.connect(owner).transfer(buyer.address, amount);
            await mockERC20.connect(buyer).approve(ecomercePayment.target, amount);
            await ecomercePayment.connect(buyer).processTokenPayment(orderId);

            const initialOwnerTokenBalance = await mockERC20.balanceOf(owner.address);

            await expect(ecomercePayment.connect(owner).withdrawTokens(mockERC20.target))
                .to.emit(ecomercePayment, "PaymentSent")
                .withArgs(owner.address, amount, mockERC20.target);

            expect(await mockERC20.balanceOf(owner.address)).to.equal(initialOwnerTokenBalance + amount);
            expect(await ecomercePayment.getBalance(mockERC20.target)).to.equal(0);
        });

        it("Should revert withdrawEth if not owner", async function () {
            await expect(ecomercePayment.connect(buyer).withdrawEth())
                .to.be.revertedWith("Only owner can call this function");
        });

        it("Should revert withdrawTokens if not owner", async function () {
            await expect(ecomercePayment.connect(buyer).withdrawTokens(mockERC20.target))
                .to.be.revertedWith("Only owner can call this function");
        });
    });

    describe("Order Cancellation", function () {
        it("Should allow buyer to cancel pending orders", async function () {
            const amount1 = ethers.parseEther("0.02");
            const orderId1 = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount1, ethers.ZeroAddress);

            const amount2 = ethers.parseEther("0.03");
            const orderId2 = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount2, mockERC20.target);

            await expect(ecomercePayment.connect(buyer).cancelOrders([orderId1, orderId2]))
                .to.emit(ecomercePayment, "PaymentFailed")
                .withArgs(buyer.address, amount1, "Order cancelled by buyer", ethers.ZeroAddress)
                .and.to.emit(ecomercePayment, "PaymentFailed")
                .withArgs(buyer.address, amount2, "Order cancelled by buyer", mockERC20.target);

            const order1 = await ecomercePayment.orders(orderId1);
            const order2 = await ecomercePayment.orders(orderId2);

            expect(order1.status).to.equal(3); // Failed
            expect(order2.status).to.equal(3); // Failed
        });

        it("Should revert if trying to cancel non-pending order", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);
            await ecomercePayment.connect(buyer).processEthPayment(orderId, { value: amount }); // Complete the order

            await expect(ecomercePayment.connect(buyer).cancelOrders([orderId]))
                .to.be.revertedWith("Order not pending");
        });

        it("Should revert if not buyer trying to cancel order", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);

            await expect(ecomercePayment.connect(owner).cancelOrders([orderId]))
                .to.be.revertedWith("Not your order to cancel");
        });
    });

    describe("Utility Functions", function () {
        it("Should return buyer's orders", async function () {
            const amount1 = ethers.parseEther("0.02");
            const orderId1 = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount1, ethers.ZeroAddress);
            const amount2 = ethers.parseEther("0.03");
            const orderId2 = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount2, mockERC20.target);

            const buyerOrders = await ecomercePayment.getBuyerOrders(buyer.address);
            expect(buyerOrders).to.deep.equal([orderId1, orderId2]);
        });

        it("Should return correct order details", async function () {
            const amount = ethers.parseEther("0.05");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);
            
            const order = await ecomercePayment.getOrder(orderId);
            expect(order.buyer).to.equal(buyer.address);
            expect(order.amount).to.equal(amount);
            expect(order.status).to.equal(0); // Pending
        });

        it("Should return correct balance for ETH", async function () {
            const amount = ethers.parseEther("0.1");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, ethers.ZeroAddress);
            await ecomercePayment.connect(buyer).processEthPayment(orderId, { value: amount });

            expect(await ecomercePayment.getBalance(ethers.ZeroAddress)).to.equal(amount);
        });

        it("Should return correct balance for Token", async function () {
            const amount = ethers.parseEther("15");
            const orderId = await ecomercePayment.nextOrderId();
            await ecomercePayment.connect(buyer).createOrder(amount, mockERC20.target);

            await mockERC20.connect(owner).transfer(buyer.address, amount);
            await mockERC20.connect(buyer).approve(ecomercePayment.target, amount);
            await ecomercePayment.connect(buyer).processTokenPayment(orderId);

            expect(await ecomercePayment.getBalance(mockERC20.target)).to.equal(amount);
        });
    });
});
