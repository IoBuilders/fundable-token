pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "openzeppelin-solidity/contracts/access/Roles.sol";


contract FundAgentRole is Ownable {
    using Roles for Roles.Role;

    Roles.Role internal fundAgents;

    modifier onlyFundAgent() {
        _onlyFundAgent();
        _;
    }

    function addFundAgent(address _who) public onlyOwner {
        fundAgents.add(_who);
    }

    function removeFundAgent(address _who) public onlyOwner {
        fundAgents.remove(_who);
    }

    function isFundAgent(address _who) public view returns (bool) {
        return fundAgents.has(_who);
    }

    function _onlyFundAgent() private view {
        require(isFundAgent(msg.sender), "FundAgentRole: caller is not a fund agent");
    }
}
