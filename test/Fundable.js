const truffleAssert = require('truffle-assertions');
const randomString = require("randomstring");

const Fundable = artifacts.require('Fundable');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const FUNDABLE_INSTRUCTION = '{\n' +
    '    "messageId": "Example Message ID",\n' +
    '    "funds": [\n' +
    '        {\n' +
    '            "amount": 1.00,\n' +
    '            "fundingSubjectId": "caaa2bd3-dc42-436a-b70b-d1d7dac23741",\n' +
    '            "receiverInformation": "Example funds receiver information"\n' +
    '        }\n' +
    '    ]\n' +
    '}';

const STATUS_ORDERED = 1;
const STATUS_IN_PROCESS = 2;
const STATUS_EXECUTED = 3;
const STATUS_REJECTED = 4;
const STATUS_CANCELLED = 5;

contract('Fundable', (accounts) => {
    let fundable;
    let operationId;

    const fundAgent = accounts[0];
    const from = accounts[1];
    const authorizedFundOperator = accounts[2];
    const unauthorizedFundOperator = accounts[3];

    beforeEach(async () => {
        fundable = await Fundable.new({from: fundAgent});

        operationId = randomString.generate();
    });

    describe('orderFund', async() => {
        it('should revert if operation ID is empty', async() => {
            await truffleAssert.reverts(
                fundable.orderFund(
                    '',
                    1,
                    FUNDABLE_INSTRUCTION,
                    {from: from}
                ),
                'operationId must not be empty'
            );
        });

        it('should revert if value is zero', async() => {
            await truffleAssert.reverts(
                fundable.orderFund(
                    operationId,
                    0,
                    FUNDABLE_INSTRUCTION,
                    {from: from}
                ),
                'Value must be greater than zero'
            );
        });

        it('should revert if operation ID is already used', async() => {
            await fundable.orderFund(
                operationId,
                1,
                FUNDABLE_INSTRUCTION,
                {from: from}
            );

            await truffleAssert.reverts(
                fundable.orderFund(
                    operationId,
                    1,
                    FUNDABLE_INSTRUCTION,
                    {from: from}
                ),
                'This operationId already exists'
            );
        });

        it('should revert if the fund instruction is empty', async() => {
            await truffleAssert.reverts(
                fundable.orderFund(
                    operationId,
                    1,
                    '',
                    {from: from}
                ),
                'Instructions must not be empty'
            );
        });

        it('should successfully order a fund and emit a FundOrdered event', async() => {
            const tx = await fundable.orderFund(
                operationId,
                1,
                FUNDABLE_INSTRUCTION,
                {from: from}
            );

            truffleAssert.eventEmitted(tx, 'FundOrdered', (_event) => {
                return _event.orderer === from &&
                    _event.operationId === operationId &&
                    _event.walletToFund === from &&
                    _event.value.toNumber() === 1 &&
                    _event.instructions === FUNDABLE_INSTRUCTION;
            });

            const orderedFunds = await fundable.retrieveFundData(operationId);

            assert.strictEqual(orderedFunds.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(orderedFunds.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(orderedFunds.instructions, FUNDABLE_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(orderedFunds.status.toNumber(), STATUS_ORDERED, 'status not set to ordered');
        });
    });

    describe('orderFundFrom', async() => {
        beforeEach(async() => {
            await fundable.authorizeFundOperator(
                authorizedFundOperator,
                {from: from}
            );
        });

        it('should revert if operation ID is empty', async() => {
            await truffleAssert.reverts(
                fundable.orderFundFrom(
                    '',
                    from,
                    1,
                    FUNDABLE_INSTRUCTION,
                    {from: authorizedFundOperator}
                ),
                'operationId must not be empty'
            );
        });

        it('should revert if value is zero', async() => {
            await truffleAssert.reverts(
                fundable.orderFundFrom(
                    operationId,
                    from,
                    0,
                    FUNDABLE_INSTRUCTION,
                    {from: authorizedFundOperator}
                ),
                'Value must be greater than zero'
            );
        });

        it('should revert if operation ID is already used', async() => {
            await fundable.orderFundFrom(
                operationId,
                from,
                1,
                FUNDABLE_INSTRUCTION,
                {from: authorizedFundOperator}
            );

            await truffleAssert.reverts(
                fundable.orderFundFrom(
                    operationId,
                    from,
                    1,
                    FUNDABLE_INSTRUCTION,
                    {from: authorizedFundOperator}
                ),
                'This operationId already exists'
            );
        });

        it('should revert if from address is zero', async() => {
            await truffleAssert.reverts(
                fundable.orderFundFrom(
                    operationId,
                    ZERO_ADDRESS,
                    1,
                    FUNDABLE_INSTRUCTION,
                    {from: authorizedFundOperator}
                ),
                'WalletToFund address must not be zero address'
            );
        });

        it('should revert if operator is not authorized', async() => {
            await truffleAssert.reverts(
                fundable.orderFundFrom(
                    operationId,
                    from,
                    1,
                    FUNDABLE_INSTRUCTION,
                    {from: unauthorizedFundOperator}
                ),
                'This operator is not authorized'
            );
        });

        it('should revert if the fund instruction is empty', async() => {
            await truffleAssert.reverts(
                fundable.orderFundFrom(
                    operationId,
                    from,
                    1,
                    '',
                    {from: authorizedFundOperator}
                ),
                'Instructions must not be empty'
            );
        });

        it('should successfully order a fund and emit a FundOrdered event', async() => {
            const tx = await fundable.orderFundFrom(
                operationId,
                from,
                1,
                FUNDABLE_INSTRUCTION,
                {from: authorizedFundOperator}
            );

            truffleAssert.eventEmitted(tx, 'FundOrdered', (_event) => {
                return _event.orderer === authorizedFundOperator &&
                    _event.operationId === operationId &&
                    _event.walletToFund === from &&
                    _event.value.toNumber() === 1 &&
                    _event.instructions === FUNDABLE_INSTRUCTION
                    ;
            });

            const orderedfund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(orderedfund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(orderedfund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(orderedfund.instructions, FUNDABLE_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(orderedfund.status.toNumber(), STATUS_ORDERED, 'status not set to ordered');
        });
    });

    describe('cancelFund', async() => {
        beforeEach(async() => {
            await fundable.authorizeFundOperator(
                authorizedFundOperator,
                {from: from}
            );

            await fundable.orderFundFrom(
                operationId,
                from,
                1,
                FUNDABLE_INSTRUCTION,
                {from: authorizedFundOperator}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                fundable.cancelFund(
                    randomString.generate(),
                    {from: from}
                ),
                'A fund can only be cancelled in status Ordered'
            );
        });

        it('should revert if the contract fund operator calls it', async() => {
            await truffleAssert.reverts(
                fundable.cancelFund(
                    operationId,
                    {from: fundAgent}
                ),
                'Only the wallet who receives the fund can cancel'
            );
        });

        it('should cancel the fund and emit a FundCancelled event if called by walletToFund', async() => {
            const tx = await fundable.cancelFund(
                operationId,
                {from: from}
            );

            truffleAssert.eventEmitted(tx, 'FundCancelled', (_event) => {
                return _event.orderer === authorizedFundOperator && _event.operationId === operationId;
            });

            const cancelledFund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(cancelledFund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(cancelledFund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(cancelledFund.instructions, FUNDABLE_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(cancelledFund.status.toNumber(), STATUS_CANCELLED, 'status not set to cancelled');

        });

        it('should cancel the fund and emit a FundCancelled event if called by the issuer', async() => {
            const tx = await fundable.cancelFund(
                operationId,
                {from: authorizedFundOperator}
            );

            truffleAssert.eventEmitted(tx, 'FundCancelled', (_event) => {
                return _event.orderer === authorizedFundOperator && _event.operationId === operationId;
            });

            const cancelledFund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(cancelledFund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(cancelledFund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(cancelledFund.instructions, FUNDABLE_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(cancelledFund.status.toNumber(), STATUS_CANCELLED, 'status not set to cancelled');
        });

        it('should revert if the contract fundable is in status in progress', async() => {
            await fundable.cancelFund(
                operationId,
                {from: from}
            );

            await truffleAssert.reverts(
                fundable.cancelFund(
                    operationId,
                    {from: from}
                ),
                'A fund can only be cancelled in status Ordered'
            );
        });
    });

    describe('rejectFund', async() => {
        let reason;

        beforeEach(async () => {
            await fundable.authorizeFundOperator(
                authorizedFundOperator,
                {from: from}
            );

            await fundable.orderFundFrom(
                operationId,
                from,
                1,
                FUNDABLE_INSTRUCTION,
                {from: authorizedFundOperator}
            );

            reason = randomString.generate();
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                fundable.rejectFund(
                    randomString.generate(),
                    reason,
                    {from: fundAgent}
                ),
                'A fund can only be rejected if the status is ordered or in progress'
            );
        });

        it('should revert if a fund is cancelled', async() => {
            await fundable.cancelFund(
                operationId,
                {from: authorizedFundOperator}
            );

            await truffleAssert.reverts(
                fundable.rejectFund(
                    operationId,
                    reason,
                    {from: fundAgent}
                ),
                'A fund can only be rejected if the status is ordered or in progress'
            );
        });

        it('should revert if a fund is in status Executed', async() => {
            await fundable.processFund(
                operationId,
                {from: fundAgent}
            );
            await fundable.executeFund(operationId,
                {from: fundAgent}
            );

            await truffleAssert.reverts(
                fundable.rejectFund(
                    operationId,
                    reason,
                    {from: fundAgent}
                ),
                'A fund can only be rejected if the status is ordered or in progress'
            );
        });

        it('should revert if called by the orderer', async() => {
            await truffleAssert.reverts(
                fundable.rejectFund(
                    operationId,
                    reason,
                    {from: authorizedFundOperator}
                ),
                'FundAgentRole: caller is not a fund agent'
            );
        });

        it('should revert if called by walletToFund', async() => {
            await truffleAssert.reverts(
                fundable.rejectFund(
                    operationId,
                    reason,
                    {from: from}
                ),
                'FundAgentRole: caller is not a fund agent'
            );
        });

        it('should set the fund to status Rejected and emit a FundRejected event if called by a fund agent', async() => {
            const tx = await fundable.rejectFund(
                operationId,
                reason,
                {from: fundAgent}
            );

            truffleAssert.eventEmitted(tx, 'FundRejected', (_event) => {
                return _event.orderer === authorizedFundOperator && _event.operationId === operationId && _event.reason === reason;
            });

            const inProcessFund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(inProcessFund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(inProcessFund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(inProcessFund.instructions, FUNDABLE_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(inProcessFund.status.toNumber(), STATUS_REJECTED, 'status not set to rejected');
        });
    });

    describe('processFund', async() => {
        beforeEach(async() => {
            await fundable.authorizeFundOperator(
                authorizedFundOperator,
                {from: from}
            );

            await fundable.orderFundFrom(
                operationId,
                from,
                1,
                FUNDABLE_INSTRUCTION,
                {from: authorizedFundOperator}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                fundable.processFund(
                    randomString.generate(),
                    {from: fundAgent}
                ),
                ' A fund can only be put in process from status Ordered'
            );
        });

        it('should revert if a fund is cancelled', async() => {
            await fundable.cancelFund(
                operationId,
                {from: authorizedFundOperator}
            );

            await truffleAssert.reverts(
                fundable.processFund(
                    operationId,
                    {from: fundAgent}
                ),
                'A fund can only be put in process from status Ordered'
            );
        });

        it('should revert if called by the orderer', async() => {
            await truffleAssert.reverts(
                fundable.processFund(
                    operationId,
                    {from: authorizedFundOperator}
                ),
                'FundAgentRole: caller is not a fund agent'
            );
        });

        it('should revert if called by walletToFund', async() => {
            await truffleAssert.reverts(
                fundable.processFund(
                    operationId,
                    {from: from}
                ),
                'FundAgentRole: caller is not a fund agent'
            );
        });

        it('should set the fund to status InProcess and emit a FundInProcess event if called by a fund agent', async() => {
            const tx = await fundable.processFund(
                operationId,
                {from: fundAgent}
            );

            truffleAssert.eventEmitted(tx, 'FundInProcess', (_event) => {
                return _event.orderer === authorizedFundOperator && _event.operationId === operationId;
            });

            const inProcessFund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(inProcessFund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(inProcessFund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(inProcessFund.instructions, FUNDABLE_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(inProcessFund.status.toNumber(), STATUS_IN_PROCESS, 'status not set to in process');
        });
    });

    describe('executeFund', async() => {
        beforeEach(async () => {
            await fundable.authorizeFundOperator(
                authorizedFundOperator,
                {from: from}
            );

            await fundable.orderFundFrom(
                operationId,
                from,
                1,
                FUNDABLE_INSTRUCTION,
                {from: authorizedFundOperator}
            );
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                fundable.executeFund(
                    randomString.generate(),
                    {from: fundAgent}
                ),
                'A fund can only be executed from status InProcess'
            );
        });

        it('should revert if a fund is cancelled', async() => {
            await fundable.cancelFund(
                operationId,
                {from: authorizedFundOperator}
            );

            await truffleAssert.reverts(
                fundable.executeFund(
                    operationId,
                    {from: fundAgent}
                ),
                'A fund can only be executed from status InProcess'
            );
        });

        it('should revert if called by the orderer', async() => {
            await fundable.processFund(
                operationId,
                {from: fundAgent}
            );

            await truffleAssert.reverts(
                fundable.executeFund(
                    operationId,
                    {from: authorizedFundOperator}
                ),
                'FundAgentRole: caller is not a fund agent'
            );
        });

        it('should revert if called by walletToFund', async() => {
            await fundable.processFund(
                operationId,
                {from: fundAgent}
            );

            await truffleAssert.reverts(
                fundable.executeFund(
                    operationId,
                    {from: from}
                ),
                'FundAgentRole: caller is not a fund agent'
            );
        });

        it('should mint the tokens to the wallet to fund account and emit a FundExecuted event if called by the topen operator', async() => {
            await fundable.processFund(
                operationId,
                {from: fundAgent}
            );

            const tx = await fundable.executeFund(
                operationId,
                {from: fundAgent}
            );

            truffleAssert.eventEmitted(tx, 'FundExecuted', (_event) => {
                return _event.orderer === authorizedFundOperator && _event.operationId === operationId;
            });

            const executedFund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(executedFund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(executedFund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(executedFund.instructions, FUNDABLE_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(executedFund.status.toNumber(), STATUS_EXECUTED, 'status not set to executed');

            const balanceOfWalletToFund = await fundable.balanceOf(from);
            assert.strictEqual(balanceOfWalletToFund.toNumber(), 1, 'Balance of wallet to fund not updated');
        });
    });

    describe('authorizeFundOperator', async() => {
        it('should authorize an operator and emit a FundOperatorAuthorized event', async() => {
            const tx = await fundable.authorizeFundOperator(authorizedFundOperator, {from: from});

            const isAuthorized = await fundable.isFundOperatorFor(authorizedFundOperator, from);
            assert.strictEqual(isAuthorized, true, 'Operator has not been authorized');

            truffleAssert.eventEmitted(tx, 'FundOperatorAuthorized', (_event) => {
                return _event.orderer === authorizedFundOperator && _event.walletToFund === from;
            });
        });

        it('should revert if an operator has already been authorized', async() => {
            await fundable.authorizeFundOperator(authorizedFundOperator, {from: from});

            await truffleAssert.reverts(
                fundable.authorizeFundOperator(authorizedFundOperator, {from: from}),
                'The operator is already authorized'
            );
        });
    });

    describe('revokeFundOperator', async() => {
        it('should revert if an operator has not been authorized', async() => {
            await truffleAssert.reverts(
                fundable.revokeFundOperator(unauthorizedFundOperator, {from: from}),
                'The operator is already not authorized'
            );
        });

        it('should revoke the authorization of an operator and emit a FundOperatorRevoked event', async() => {
            await fundable.authorizeFundOperator(unauthorizedFundOperator, {from: from});

            const tx = await fundable.revokeFundOperator(unauthorizedFundOperator, {from: from});

            const isAuthorized = await fundable.isFundOperatorFor(unauthorizedFundOperator, from);
            assert.strictEqual(isAuthorized, false, 'Operator authorization has not been revoked');

            truffleAssert.eventEmitted(tx, 'FundOperatorRevoked', (_event) => {
                return _event.orderer === unauthorizedFundOperator && _event.walletToFund === from;
            });
        });
    });

});
