pragma solidity ^0.5.0;

import "./IFundable.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "./libraries/StringUtil.sol";
import "./FundAgentRole.sol";


contract Fundable is IFundable, ERC20, FundAgentRole {
    using StringUtil for string;

    struct FundableData {
        address orderer;
        address walletToFund;
        uint256 value;
        string instructions;
        FundStatusCode status;
    }

    // walletToFund -> authorized -> true/false
    mapping(address => mapping(address => bool)) public fundOperators;
    mapping(bytes32 => FundableData) private orderedFunds;

    constructor() public {
        fundAgents.add(msg.sender);
    }

    function authorizeFundOperator(address orderer) public returns (bool) {
        require(fundOperators[msg.sender][orderer] == false, "The operator is already authorized");

        fundOperators[msg.sender][orderer] = true;
        emit FundOperatorAuthorized(msg.sender, orderer);
        return true;
    }

    function revokeFundOperator(address orderer) public returns (bool) {
        require(fundOperators[msg.sender][orderer], "The operator is already not authorized");

        fundOperators[msg.sender][orderer] = false;
        emit FundOperatorRevoked(msg.sender, orderer);
        return true;
    }

    function orderFund(
        string memory operationId,
        uint256 value,
        string memory instructions
    ) public returns (bool)
    {
        return _orderFund(
            operationId,
            msg.sender,
            value,
            instructions
        );
    }

    function orderFundFrom(
        string memory operationId,
        address walletToFund,
        uint256 value,
        string memory instructions
    ) public returns (bool)
    {
        require(address(0) != walletToFund, "WalletToFund address must not be zero address");
        require(_isFundOperatorFor(msg.sender, walletToFund), "This operator is not authorized");
        return _orderFund(
            operationId,
            walletToFund,
            value,
            instructions
        );
    }

    function cancelFund(string memory operationId) public returns (bool) {
        FundableData storage fund = orderedFunds[operationId.toHash()];
        require(fund.status == FundStatusCode.Ordered, "A fund can only be cancelled in status Ordered");
        require(fund.walletToFund == msg.sender || fund.orderer == msg.sender, "Only the wallet who receives the fund can cancel");
        fund.status = FundStatusCode.Cancelled;
        emit FundCancelled(fund.orderer, operationId);
        return true;
    }

    function processFund(string memory operationId) public onlyFundAgent returns (bool) {
        FundableData storage fund = orderedFunds[operationId.toHash()];
        require(fund.status == FundStatusCode.Ordered, "A fund can only be put in process from status Ordered");
        fund.status = FundStatusCode.InProcess;
        emit FundInProcess(fund.orderer, operationId);
        return true;
    }

    function executeFund(string memory operationId) public onlyFundAgent returns (bool) {
        FundableData storage fund = orderedFunds[operationId.toHash()];
        require(fund.status == FundStatusCode.InProcess, "A fund can only be executed from status InProcess");
        fund.status = FundStatusCode.Executed;
        _mint(fund.walletToFund, fund.value);
        emit FundExecuted(fund.orderer, operationId);
        return true;
    }

    function rejectFund(
        string memory operationId,
        string memory reason
    ) public onlyFundAgent returns (bool)
    {
        FundableData storage fund = orderedFunds[operationId.toHash()];
        require(
            fund.status == FundStatusCode.Ordered || fund.status == FundStatusCode.InProcess,
            "A fund can only be rejected if the status is ordered or in progress"
        );

        fund.status = FundStatusCode.Rejected;
        emit FundRejected(fund.orderer, operationId, reason);
        return true;
    }

    function isFundOperatorFor(address walletToFund, address orderer) public view returns (bool) {
        return _isFundOperatorFor(walletToFund, orderer);
    }

    function retrieveFundData(
        string memory operationId
    ) public view returns (
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
        require(!operationId.isEmpty(), "operationId must not be empty");
        require(value > 0, "Value must be greater than zero");

        FundableData storage newFund = orderedFunds[operationId.toHash()];
        require(newFund.value == 0, "This operationId already exists");

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

    function _isFundOperatorFor(address operator, address from) private view returns (bool) {
        return fundOperators[from][operator];
    }
}
