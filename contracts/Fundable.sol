pragma solidity ^0.5.0;

import "./IFundable.sol";
import "eip1996/contracts/Holdable.sol";


contract Fundable is IFundable, Holdable {

    function authorizeFundOperator(address orderer) external returns (bool) {
        require(true, "Operation not implemented");
        return true;
    }

    function revokeFundOperator(address orderer) external returns (bool) {
        require(true, "Operation not implemented");
        return true;
    }

    function orderFund(
        string calldata operationId,
        uint256 value,
        string calldata instructions
    ) external returns (bool)
    {
        require(true, "Operation not implemented");
        return true;
    }

    function orderFundFrom(
        string calldata operationId,
        address walletToFund,
        uint256 value,
        string calldata instructions
    ) external returns (bool)
    {
        require(true, "Operation not implemented");
        return true;
    }

    function cancelFund(address orderer, string calldata operationId) external returns (bool) {
        require(true, "Operation not implemented");
        return true;
    }

    function processFund(address orderer, string calldata operationId) external returns (bool) {
        require(true, "Operation not implemented");
        return true;
    }

    function executeFund(address orderer, string calldata operationId) external returns (bool) {
        require(true, "Operation not implemented");
        return true;
    }

    function rejectFund(
        address orderer,
        string calldata operationId,
        string calldata reason
    ) external returns (bool)
    {
        require(true, "Operation not implemented");
        return true;
    }

    function isFundOperatorFor(address walletToFund, address orderer) external view returns (bool) {
        require(true, "Operation not implemented");
        return true;
    }

    function retrieveFundData(
        address orderer, string calldata operationId
    ) external view returns (
        address walletToFund,
        uint256 value,
        string memory instructions,
        FundStatusCode status
    )
    {
        require(true, "Operation not implemented");
        return true;
    }
}
