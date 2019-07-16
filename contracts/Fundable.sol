pragma solidity ^0.5.0;

import "./IFundable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./libraries/StringUtil.sol";


contract Fundable is IFundable, ERC20 {
    using StringUtil for string;

    struct FundableData {
        address orderer;
        address walletToFund;
        uint256 value;
        string instructions;
        FundStatusCode status;
    }

    address public tokenOperator;
    // walletToFund -> autorized -> true/false
    mapping(address => mapping(address => bool)) public fundOperators;

    mapping(bytes32 => FundableData) private orderedFunds;

    constructor() public {
        tokenOperator = msg.sender;
    }

    function authorizeFundOperator(address orderer) external returns (bool) {
        require(fundOperators[msg.sender][orderer] == false, "The operator is already authorized");

        fundOperators[msg.sender][orderer] = true;
        emit FundOperatorAuthorized(orderer, msg.sender);
        return true;
    }

    function revokeFundOperator(address orderer) external returns (bool) {
        require(fundOperators[msg.sender][orderer], "The operator is already not authorized");

        fundOperators[msg.sender][orderer] = false;
        emit FundOperatorRevoked(orderer, msg.sender);
        return true;
    }

    function orderFund(
        string calldata operationId,
        uint256 value,
        string calldata instructions
    ) external returns (bool)
    {
        return _orderFund(
            operationId,
            msg.sender,
            value,
            instructions
        );
    }

    function orderFundFrom(
        string calldata operationId,
        address walletToFund,
        uint256 value,
        string calldata instructions
    ) external returns (bool)
    {
        require(!_isFundOperatorFor(walletToFund, msg.sender), "This operator is not authorized");
        return _orderFund(
            operationId,
            walletToFund,
            value,
            instructions
        );
    }

    function cancelFund(string calldata operationId) external returns (bool) {
        FundableData storage fund = orderedFunds[operationId.toHash()];
        require(fund.walletToFund == msg.sender || fund.orderer == msg.sender, "Only the wallet who receive the fund can cancel");
        require(fund.status == FundStatusCode.Ordered, "A fund can only be cancelled in status Ordered");
        fund.status = FundStatusCode.Cancelled;
        emit FundCancelled(fund.orderer, operationId);
        return true;
    }

    function processFund(string calldata operationId) external returns (bool) {
        require(tokenOperator == msg.sender, "Only the token operator can process the fund operation");
        FundableData storage fund = orderedFunds[operationId.toHash()];
        require(fund.status == FundStatusCode.Ordered, "Only reject if the status is ordered");
        fund.status = FundStatusCode.InProcess;
        emit FundInProcess(fund.orderer, operationId);
        return true;
    }

    function executeFund(string calldata operationId) external returns (bool) {
        require(tokenOperator == msg.sender, "Only the token operator can execute the fund operation");
        FundableData storage fund = orderedFunds[operationId.toHash()];
        require(fund.status == FundStatusCode.InProcess, "Only execute if the status is in process");
        fund.status = FundStatusCode.Executed;
        _mint(fund.walletToFund, fund.value);
        emit FundExecuted(fund.orderer, operationId);
        return true;
    }

    function rejectFund(
        string calldata operationId,
        string calldata reason
    ) external returns (bool)
    {
        require(tokenOperator == msg.sender, "A fund can only be rejected by the token operator");

        FundableData storage fund = orderedFunds[operationId.toHash()];
        require(
            fund.status == FundStatusCode.Ordered || fund.status == FundStatusCode.InProcess,
            "Only reject if the status is ordered or in progress"
        );
        fund.status = FundStatusCode.Rejected;
        emit FundRejected(fund.orderer, operationId, reason);
        return true;
    }

    function isFundOperatorFor(address walletToFund, address orderer) external view returns (bool) {
        return _isFundOperatorFor(walletToFund, orderer);
    }

    function retrieveFundData(
        string calldata operationId
    ) external view returns (
        address orderer,
        address walletToFund,
        uint256 value,
        string memory instructions,
        FundStatusCode status
    )
    {
        FundableData storage fund = orderedFunds[operationId.toHash()];
        orderer = fund.orderer;
        walletToFund = fund.walletToFund;
        value = fund.value;
        instructions = fund.instructions;
        status = fund.status;
    }

    function _orderFund(
        string memory operationId,
        address walletToFund,
        uint256 value,
        string memory instructions
    ) private returns (bool)
    {
        require(!instructions.isEmpty(), "Instructions must not be empty");
        require(!operationId.isEmpty(), "Operation ID must not be empty");
        require(value > 0, "Value must be greater than zero");
        require(address(0) != walletToFund, "WalletToFund address must not be zero address");

        FundableData storage newFund = orderedFunds[operationId.toHash()];
        require(!newFund.instructions.isEmpty(), "This operationId already exists");

        newFund.orderer = msg.sender;
        newFund.walletToFund = walletToFund;
        newFund.value = value;
        newFund.instructions = instructions;
        newFund.status = FundStatusCode.Ordered;
        orderedFunds[operationId.toHash()] = newFund;

        emit FundOrdered(
            msg.sender,
            operationId,
            walletToFund,
            value,
            instructions
        );
        return true;
    }

    function _isFundOperatorFor(address walletToFund, address orderer) private view returns (bool) {
        return fundOperators[walletToFund][orderer];
    }
}
