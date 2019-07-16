const truffleAssert = require('truffle-assertions');
const randomString = require("randomstring");

const Fundable = artifacts.require('Fundable');

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const FUNDABLE_INSTRUCTION = '{\n' +
    '    "messageId": "Example Message ID",\n' +
    '    "funds": [\n' +
    '        {\n' +
    '            "amount": 1.00,\n' +
    '            "bankAccountId": "caaa2bd3-dc42-436a-b70b-d1d7dac23741",\n' +
    '            "remittanceInformation": "Example Remittance Information"\n' +
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

    const tokenOperatorAccount = accounts[0];
    const from = accounts[1];
    const authorizedFundOperator = accounts[2];
    const unauthorizedFundOperator = accounts[3];

    beforeEach(async () => {
        fundable = await Fundable.new({from: tokenOperatorAccount});
        
        operationId = randomString.generate();
    });

    describe('constructor', async() => {
        it('should set the token operator account', async() => {
            const tokenOperator = await fundable.tokenOperator();
            assert.strictEqual(tokenOperator, tokenOperatorAccount, 'Token operator account not set correctly');
        });
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
                'Operation ID must not be empty'
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
            await fundable.authorizefundOperator(
                authorizedOperator,
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
                    {from: authorizedOperator}
                ),
                'Operation ID must not be empty'
            );
        });

        it('should revert if value is zero', async() => {
            await truffleAssert.reverts(
                fundable.orderFundFrom(
                    operationId,
                    from,
                    0,
                    FUNDABLE_INSTRUCTION,
                    {from: authorizedOperator}
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
                {from: authorizedOperator}
            );

            await truffleAssert.reverts(
                fundable.orderFundFrom(
                    operationId,
                    from,
                    1,
                    FUNDABLE_INSTRUCTION,
                    {from: authorizedOperator}
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
                    {from: authorizedOperator}
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
                    {from: unauthorizedOperator}
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
                    {from: authorizedOperator}
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
                {from: authorizedOperator}
            );

            truffleAssert.eventEmitted(tx, 'FundOrdered', (_event) => {
                return _event.orderer === authorizedOperator &&
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
                authorizedOperator,
                {from: from}
            );

            await fundable.orderFundFrom(
                operationId,
                from,
                1,
                PAYOUT_INSTRUCTION,
                {from: authorizedOperator}
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

        it('should revert if the contract payout agent calls it', async() => {
            await truffleAssert.reverts(
                fundable.cancelFund(
                    operationId,
                    {from: tokenOperatorAccount}
                ),
                'Only the wallet who receive the fund can cancel'
            );
        });

        it('should cancel the fund and emit a FundCancelled event if called by walletToFund', async() => {
            const tx = await fundable.cancelFund(
                operationId,
                {from: from}
            );

            truffleAssert.eventEmitted(tx, 'FundCancelled', (_event) => {
                return _event.orderer === authorizedOperator && _event.operationId === operationId;
            });

            const cancelledFund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(cancelledFund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(cancelledFund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(cancelledFund.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(cancelledFund.status.toNumber(), STATUS_CANCELLED, 'status not set to cancelled');

        });

        it('should cancel the fund and emit a FundCancelled event if called by the issuer', async() => {
            const tx = await fundable.cancelFund(
                operationId,
                {from: authorizedOperator}
            );

            truffleAssert.eventEmitted(tx, 'FundCancelled', (_event) => {
                return _event.orderer === authorizedOperator && _event.operationId === operationId;
            });

            const cancelledFund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(cancelledFund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(cancelledFund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(cancelledFund.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(cancelledFund.status.toNumber(), STATUS_CANCELLED, 'status not set to cancelled');

            const balanceOfFrom = await fundable.balanceOf(from);
            assert.strictEqual(balanceOfFrom.toNumber(), 3, 'Balance of payer not updated after cancellation');
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
                authorizedOperator,
                {from: from}
            );

            await fundable.orderFundFrom(
                operationId,
                from,
                1,
                PAYOUT_INSTRUCTION,
                {from: authorizedOperator}
            );

            reason = randomString.generate();
        });

        it('should revert if a non existing operation id is used', async() => {
            await truffleAssert.reverts(
                fundable.rejectFund(
                    randomString.generate(),
                    reason,
                    {from: tokenOperatorAccount}
                ),
                'A payout can only be rejected from status Ordered'
            );
        });

        it('should revert if a fund is cancelled', async() => {
            await fundable.cancelFund(
                operationId,
                {from: authorizedOperator}
            );

            await truffleAssert.reverts(
                fundable.rejectFund(
                    operationId,
                    reason,
                    {from: tokenOperatorAccount}
                ),
                'Only reject if the status is ordered or in progress'
            );
        });

        it('should revert if a fund is in status Executed', async() => {
            await fundable.processFunds(
                operationId,
                {from: tokenOperatorAccount}
            );
            await fundable.executeFunds(operationId,
                {from: tokenOperatorAccount}
            );

            await truffleAssert.reverts(
                fundable.rejectFund(
                    operationId,
                    reason,
                    {from: tokenOperatorAccount}
                ),
                'Only reject if the status is ordered or in progress'
            );
        });

        it('should revert if called by the orderer', async() => {
            await truffleAssert.reverts(
                fundable.rejectFund(
                    operationId,
                    reason,
                    {from: authorizedOperator}
                ),
                'A fund can only be rejected by the token operator'
            );
        });

        it('should revert if called by walletToFund', async() => {
            await truffleAssert.reverts(
                fundable.rejectFund(
                    operationId,
                    reason,
                    {from: from}
                ),
                'A fund can only be rejected by the token operator'
            );
        });

        it('should set the fund to status Rejected and emit a FundRejected event if called by the token operator', async() => {
            const tx = await fundable.rejectFund(
                operationId,
                reason,
                {from: tokenOperatorAccount}
            );

            truffleAssert.eventEmitted(tx, 'FundRejected', (_event) => {
                return _event.orderer === authorizedOperator && _event.operationId === operationId && _event.reason === reason;
            });

            const inProcessFund = await fundable.retrieveFundData(operationId);

            assert.strictEqual(inProcessFund.walletToFund, from, 'walletToFund not set correctly');
            assert.strictEqual(inProcessFund.value.toNumber(), 1, 'value not set correctly');
            assert.strictEqual(inProcessFund.instructions, PAYOUT_INSTRUCTION, 'instructions not set correctly');
            assert.strictEqual(inProcessFund.status.toNumber(), STATUS_REJECTED, 'status not set to rejected');
        });
    });
    
});