// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";


contract EcomercePayment {
    address payable public owner;
    using SafeERC20 for IERC20;

    uint256 public constant MINIMUM_PAYMENT = 0.01 ether;
    uint256 private balance;
    address payable public buyer;
    uint256 public amount;
    IERC20 public token;
    PaymentStatus public paymentStatus;



    uint256 internal buyerBalance;




    uint256 private moneyCollected;
    uint256 private totalRefunded;
    uint256 private totalFailed;



    event PaymentReceived(address indexed buyer, uint256 amount);
    event PaymentSent(address indexed seller, uint256 amount);
    event PaymentRefunded(address indexed buyer, uint256 amount);
    event PaymentFailed(address indexed buyer, uint256 amount, string reason);

    event paymentPending(address indexed buyer, uint256 amount);
    event paymentCompleted(address indexed buyer, uint256 amount);


    enum PaymentStatus{ Pending, Completed, Refunded, Failed }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    modifier onlyBuyer() {
        require(msg.sender == buyer, "Only buyer can call this function");
        _;
    }

    struct Order {
        address buyer;
        uint256 amount;
        PaymentStatus status;
        uint256 timestamp;
    }

    mapping(uint256 => Order) public orders;
    mapping(address => uint256[]) public buyerOrders;
    uint256 public nextOrderId;

    constructor() {
        owner = payable(msg.sender);
        nextOrderId = 1;
    }

    function createOrder(uint256 _amount) external payable returns (uint256) {
        require(_amount >= MINIMUM_PAYMENT, "Amount below minimum");
        
        uint256 orderId = nextOrderId++;
        orders[orderId] = Order({
            buyer: msg.sender,
            amount: _amount,
            status: PaymentStatus.Pending,
            timestamp: block.timestamp
        });
        
        buyerOrders[msg.sender].push(orderId);
        
        emit paymentPending(msg.sender, _amount);
        return orderId;
    }

    function processPayment(uint256 orderId) external payable {
        Order storage order = orders[orderId];
        require(order.buyer == msg.sender, "Not your order");
        require(order.status == PaymentStatus.Pending, "Order not pending");
        require(msg.value >= order.amount, "Insufficient payment");
        
        order.status = PaymentStatus.Completed;
        balance += order.amount;
        moneyCollected += order.amount;
        
        emit PaymentReceived(msg.sender, order.amount);
        emit paymentCompleted(msg.sender, order.amount);
    }

    function getBuyerOrders(address _buyer) external view returns (uint256[] memory) {
        return buyerOrders[_buyer];
    }

    function getOrder(uint256 orderId) external view returns (Order memory) {
        return orders[orderId];
    }
}