pragma solidity ^0.5.0;

interface IFundable {
    enum FundStatusCode {
        NonExistent,
        Ordered,
        InProcess,
        Executed,
        Rejected,
        Cancelled
    }
    function authorizeFundOperator(address orderer) external returns (bool);
    function revokeFundOperator(address orderer) external returns (bool);
    function orderFund(string calldata operationId, uint256 value, string calldata instructions) external returns (bool);
    function orderFundFrom(
        string calldata operationId,
        address walletToFund,
        uint256 value,
        string calldata instructions
    ) external returns (bool);
    function cancelFund(string calldata operationId) external returns (bool);
    function processFund(string calldata operationId) external returns (bool);
    function executeFund(string calldata operationId) external returns (bool);
    function rejectFund(string calldata operationId, string calldata reason) external returns (bool);
    function isFundOperatorFor(address walletToFund, address orderer) external view returns (bool);
    function retrieveFundData(
        string calldata operationId
    ) external view returns (
        address orderer,
        address walletToFund,
        uint256 value,
        string memory instructions,
        FundStatusCode status
    );
    event FundOrdered(
        address indexed orderer,
        string indexed operationId,
        address indexed walletToFund,
        uint256 value,
        string instructions
    );
    event FundInProcess(address indexed orderer, string indexed operationId);
    event FundExecuted(address indexed orderer, string indexed operationId);
    event FundRejected(address indexed orderer, string indexed operationId, string reason);
    event FundCancelled(address indexed orderer, string indexed operationId);
    event FundOperatorAuthorized(address indexed walletToFund, address indexed orderer);
    event FundOperatorRevoked(address indexed walletToFund, address indexed orderer);
}
