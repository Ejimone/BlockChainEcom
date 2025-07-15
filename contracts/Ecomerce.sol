// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract EcomercePayment is ReentrancyGuard {
    address payable public owner;
    using SafeERC20 for IERC20;

    uint256 public constant MINIMUM_PAYMENT = 0.01 ether;
    uint256 private ethBalance;
    mapping(address => uint256) private tokenBalances;
    
    // Supported tokens mapping
    mapping(address => bool) public supportedTokens;
    
    uint256 private totalRefunded;
    uint256 private totalFailed;

    enum PaymentStatus{ Pending, Completed, Refunded, Failed, RefundPending, RefundRequested }

    event PaymentReceived(address indexed buyer, uint256 amount, address token);
    event PaymentSent(address indexed seller, uint256 amount, address token);
    event PaymentRefunded(address indexed buyer, uint256 amount, address token);
    event PaymentFailed(address indexed buyer, uint256 amount, string reason, address token);
    event PaymentPending(uint256 indexed orderId, address indexed buyer, uint256 amount, address token);
    event PaymentCompleted(address indexed buyer, uint256 amount, address token);
    
    // Add refund-specific events
    event RefundPending(address indexed buyer, uint256 orderId, uint256 amount);
    event RefundSuccessful(address indexed buyer, uint256 orderId, uint256 amount);
    event RefundFailed(address indexed buyer, uint256 orderId, uint256 amount, string reason);
    event RefundRequested(address indexed buyer, uint256 orderId, uint256 amount);

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }

    struct Order {
        address buyer;
        uint256 amount;
        PaymentStatus status;
        uint256 timestamp;
        address paymentToken;
        bool isTokenPayment;
    }

    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public buyerOrders;
    uint256 public nextOrderId;

    constructor() {
        owner = payable(msg.sender);
        nextOrderId = 1;
    }

    function addSupportedToken(address _token) external onlyOwner {
        supportedTokens[_token] = true;
    }

    function createOrder(uint256 _amount, address _token) external returns (uint256) {
        require(_amount >= MINIMUM_PAYMENT, "Amount below minimum");
        if (_token != address(0)) {
            require(supportedTokens[_token], "Token not supported");
        }
        
        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            buyer: msg.sender,
            amount: _amount,
            status: PaymentStatus.Pending,
            timestamp: block.timestamp,
            paymentToken: _token,
            isTokenPayment: _token != address(0)
        });
        
        buyerOrders[msg.sender].push(orderId);
        
        emit PaymentPending(orderId, msg.sender, _amount, _token);
        return orderId;
    }

    function processEthPayment(uint256 orderId) external payable nonReentrant {
        Order storage order = orders[orderId];
        require(order.buyer == msg.sender, "Not your order");
        require(order.status == PaymentStatus.Pending, "Order not pending");
        require(!order.isTokenPayment, "This is a token payment order");
        require(msg.value >= order.amount, "Insufficient payment");
        
        order.status = PaymentStatus.Completed;
        ethBalance += order.amount;
        
        emit PaymentReceived(msg.sender, order.amount, address(0));
        emit PaymentCompleted(msg.sender, order.amount, address(0));

        // Return excess payment
        if (msg.value > order.amount) {
            (bool success, ) = payable(msg.sender).call{value: msg.value - order.amount}("");
            require(success, "Failed to return excess payment");
        }
    }

    function processTokenPayment(uint256 orderId) external nonReentrant {
        Order storage order = orders[orderId];
        require(order.buyer == msg.sender, "Not your order");
        require(order.status == PaymentStatus.Pending, "Order not pending");
        require(order.isTokenPayment, "This is an ETH payment order");
        require(supportedTokens[order.paymentToken], "Token not supported");

        IERC20 token = IERC20(order.paymentToken);
        uint256 allowance = token.allowance(msg.sender, address(this));
        require(allowance >= order.amount, "Token allowance too low");

        token.safeTransferFrom(msg.sender, address(this), order.amount);
        tokenBalances[order.paymentToken] += order.amount;
        
        order.status = PaymentStatus.Completed;
        
        emit PaymentReceived(msg.sender, order.amount, order.paymentToken);
        emit PaymentCompleted(msg.sender, order.amount, order.paymentToken);
    }

    function getBuyerOrders(address _buyer) external view returns (uint256[] memory) {
        return buyerOrders[_buyer];
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }

    function initiateRefund(uint256 _orderId) external onlyOwner {
        Order storage order = orders[_orderId];
        require(order.status == PaymentStatus.Completed, "Order not completed");
        require(order.buyer != address(0), "Invalid order");
        
        order.status = PaymentStatus.RefundPending;
        emit RefundPending(order.buyer, _orderId, order.amount);
    }

    function processRefund(uint256 _orderId) external onlyOwner {
        Order storage order = orders[_orderId];
        require(order.status == PaymentStatus.RefundPending, "Refund not pending");
        require(order.buyer != address(0), "Invalid order");

        bool success;
        if (order.isTokenPayment) {
            require(tokenBalances[order.paymentToken] >= order.amount, "Insufficient token balance");
            IERC20 token = IERC20(order.paymentToken);

            // Using low-level call to handle token transfers that might fail, without reverting the whole transaction.
            // This mimics the behavior of OpenZeppelin's SafeERC20.sol but allows us to capture the success status.
            (bool callSuccess, bytes memory returnData) = order.paymentToken.call(abi.encodeWithSelector(token.transfer.selector, order.buyer, order.amount));

            if (callSuccess && (returnData.length == 0 || abi.decode(returnData, (bool)))) {
                tokenBalances[order.paymentToken] -= order.amount;
                success = true;
            } else {
                success = false;
            }
        } else {
            require(ethBalance >= order.amount, "Insufficient ETH balance");
            (bool sent, ) = payable(order.buyer).call{value: order.amount}("");
            if (sent) {
                ethBalance -= order.amount;
            }
            success = sent;
        }

        if (success) {
            order.status = PaymentStatus.Refunded;
            totalRefunded += order.amount;
            emit RefundSuccessful(order.buyer, _orderId, order.amount);
            emit PaymentRefunded(order.buyer, order.amount, order.paymentToken);
        } else {
            // Refund failed
            order.status = PaymentStatus.Failed;
            totalFailed += order.amount;
            emit RefundFailed(order.buyer, _orderId, order.amount, "Transfer failed");
            emit PaymentFailed(order.buyer, order.amount, "Refund transfer failed", order.paymentToken);
        }
    }

    function cancelOrders(uint256[] memory _orderIds) external {
        require(_orderIds.length > 0, "No orders to cancel");
        require(_orderIds.length <= 10, "Too many orders to cancel at once");

        for (uint i = 0; i < _orderIds.length; i++) {
            uint256 orderId = _orderIds[i];
            Order storage order = orders[orderId];
            require(order.buyer == msg.sender, "Not your order to cancel");
            require(order.status == PaymentStatus.Pending, "Order not pending");
            
            order.status = PaymentStatus.Failed;
            totalFailed += order.amount;
            emit PaymentFailed(order.buyer, order.amount, "Order cancelled by buyer", order.paymentToken);
        }
    }

    function withdrawEth() external onlyOwner nonReentrant {
        require(ethBalance > 0, "No ETH balance to withdraw");
        uint256 amount = ethBalance;
        ethBalance = 0;
        
        (bool success, ) = owner.call{value: amount}("");
        require(success, "ETH withdrawal failed");
        
        emit PaymentSent(owner, amount, address(0));
    }

    function withdrawTokens(address _token) external onlyOwner nonReentrant {
        require(supportedTokens[_token], "Token not supported");
        uint256 amount = tokenBalances[_token];
        require(amount > 0, "No token balance to withdraw");
        tokenBalances[_token] = 0;
        IERC20(_token).safeTransfer(owner, amount);
        emit PaymentSent(owner, amount, _token);
    }

    function getBalance(address _token) external view returns (uint256) {
        if (_token == address(0)) {
            return ethBalance;
        }
        return tokenBalances[_token];
    }

    // Support for receiving ETH
    receive() external payable {
        ethBalance += msg.value;
        emit PaymentReceived(msg.sender, msg.value, address(0));
    }

    fallback() external payable {
        ethBalance += msg.value;
        emit PaymentReceived(msg.sender, msg.value, address(0));
    }
}