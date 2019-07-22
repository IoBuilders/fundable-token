# Fundable Token

[![Build Status](https://travis-ci.org/IoBuilders/fundable-token.svg?branch=master)](https://travis-ci.org/IoBuilders/fundable-token)
[![Coverage Status](https://coveralls.io/repos/github/IoBuilders/fundable-token/badge.svg?branch=master)](https://coveralls.io/github/IoBuilders/fundable-token?branch=master)
[![npm](https://img.shields.io/npm/v/eip2019.svg)](https://www.npmjs.com/package/eip2019)

This is the reference implementation of [EIP-2019 Fundable token](https://github.com/ethereum/EIPs/pull/2019/files). This implementation will change over time with the standard and is not stable at the moment.

Feedback is appreciated and can given at [the discussion of the EIP](https://github.com/ethereum/EIPs/issues/2019).

## Summary

An extension to the ERC-20 standard token that allows Token wallet owners to request a wallet to be funded, by calling the smart contract and attaching a fund instruction string.

## Abstract

Token wallet owners (or approved addresses) can order tokenization requests through blockchain. This is done by calling the ```orderFund``` or ```orderFundFrom``` methods, which initiate the workflow for the token contract operator to either honor or reject the fund request. In this case, fund instructions are provided when submitting the request, which are used by the operator to determine the source of the funds to be debited in order to do fund the token wallet (through minting).

In general, it is not advisable to place explicit routing instructions for debiting funds on a verbatim basis on the blockchain, and it is advised to use a private communication alternatives, such as private channels, encrypted storage or similar,  to do so (external to the blockchain ledger). Another (less desirable) possibility is to place these instructions on the instructions field in encrypted form.

## Sequence diagrams

### Fund executed

The following diagram shows the sequence of the payout creation and execution.

![Fundable Token: Fund executed](http://www.plantuml.com/plantuml/png/ZP0n3i8m34NtdCBgtWime7O0YGa6E41eVXae3h8JYUFJr7H11NNCz_FFanjDNb9-3EwYa9RgBLNxpC5V1z0vti7LXg84I4dTzupgUO7Q6pYDS7aSom8CdoVBrK-97LJ_b4zUdzu3dunt5bC_XhfaaSIpzX0ZLeZWXIud_1QPFZIDdR71DU1GRlS6)

### Fund cancelled

The following diagram shows the sequence of the payout creation and cancellation.

![Fundable Token: Fund cancelled](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuGejJYroLD2rKr1oAyrBIKpAILK8oSzEpLEoKiWlIaaj0eboeSifwC8qA3Ycf-QL01M3EFuW3Qaf-CnCJinBJiqXnL1di8uSeB4EgNaf82S30000)

### Fund rejected

The following diagram shows the sequence of the payout creation and rejection.

![Fundable Token: Fund rejected](http://www.plantuml.com/plantuml/png/SoWkIImgAStDuGejJYroLD2rKr1oAyrBIKpAILK8oSzEpLEoKiWlIaaj0eboeSifwC8qA3Ycf-QL01M3EFuW3QaWvGWPx4ONfMQb9fVWCHliBAYnGM35G7CTKlDIG6u60000)

## State diagram

![Fundable: State Diagram](http://www.plantuml.com/plantuml/png/VL51JiGm3Bpd5ND6x0Sue9KGI9n0g3V48KtSfP2rLuaZwEzfqsspArMSeh77C_PadzH6pSTWtcy-iDlTuoLwYkJly9JPdu4vluNmpAzH7AKqKrPerib6leaJR2ISY7tF1wYW7T7C98zsW4KtZiCUYDLSY3QVD7VaHD5gBumVcr0M9N-BDYjqv6XrOL4CfEYvT5eRB3k2T0NcHB4Qb1iUVybbNQvSaAdbvjhWsFDOHYUnAbvcyZ3vXR08hj3KniI1S1Yc89mDeQImBVT6N-JMzHPKR_YFLClRXbUnxudzzFb_)

## Install

```
npm install eip2019
```

## Usage

To write your custom contracts, import the contract and extend it through inheritance.

```solidity
pragma solidity ^0.5.0;

import 'eip2019/contracts/Fundable.sol';

contract MyFundable is Fundable {
    // your custom code
}
```

> You need an ethereum development framework for the above import statements to work! Check out these guides for [Truffle], [Embark] or [Buidler].

## Fund information

Whenever a payout is ordered, payment information has to be provided with the necessary information for the off-chain transfer. [EIP-2019](https://github.com/ethereum/EIPs/pull/2019/files) leaves the structure of this information up to the implementer, but recommends [ISO-20022](https://en.wikipedia.org/wiki/ISO_20022) as a starting point.

The unit tests use a JSON version of this standard, which can be seem below.

```json
{
    "messageId": "Example Message ID",
    "funds": [
        {
            "amount": 1.00,
            "fundingSubjectId": "caaa2bd3-dc42-436a-b70b-d1d7dac23741",
            "receiverInformation": "Example funds receiver information"
        }
    ]
}
```

Amongst other things, if defines the funded amount, an ID to a predefined bank account or credit card and the receiver information. Additionally some IDs are defined to properly mark the transfer.

## Tests

To run the unit tests execute `npm test`.

## Code coverage

To get the code coverage report execute `npm run coverage`

[Truffle]: https://truffleframework.com/docs/truffle/quickstart
[Embark]: https://embark.status.im/docs/quick_start.html
[Buidler]: https://buidler.dev/guides/#getting-started
