const truffleAssert = require('truffle-assertions');

const Fundable = artifacts.require('Fundable');

contract('FundAgentRole', (accounts) => {
    let fundable;

    const owner = accounts[0];
    const fundAgent = accounts[1];

    beforeEach(async () => {
        fundable = await Fundable.new({from: owner});
    });

    describe('constructor', async() => {
        it('should set contract deployer as fund agent', async() => {
            const isFundAgent = await fundable.isFundAgent(owner);
            assert.strictEqual(isFundAgent, true, 'Owner is not set as fund agent after deployment');
        });
    });

    describe('addFundAgent', async() => {
        it('should add an account as fund agent', async() => {
            await fundable.addFundAgent(fundAgent);
            const isFundAgent = await fundable.isFundAgent(fundAgent);

            assert.strictEqual(isFundAgent, true, 'Account was not added as fund agent');
        });
    });

    describe('addFundAgent', async() => {
        it('should remove an account as fund agent', async() => {
            await fundable.addFundAgent(fundAgent);
            await fundable.removeFundAgent(fundAgent);
            const isFundAgent = await fundable.isFundAgent(fundAgent);

            assert.strictEqual(isFundAgent, false, 'Account was not removed as fund agent');
        });
    });
});
