const { expect } = require("chai");
const { ethers } = require("hardhat")

const tokens=(n)=>{
    return ethers.utils.parseUnits(n.toString(),'ether');
}
const ether=tokens

describe('Flashloan',()=>{
    let token,flashloan,flashloanreceiver;
    let deployer;
    beforeEach(async ()=>{
        accounts=await ethers.getSigners()
        deployer=accounts[0];
        const FlashLoan=await ethers.getContractFactory('FlashLoan');
        const FlashLoanReceiver=await ethers.getContractFactory('FlashLoanReceiver');
        const Token= await ethers.getContractFactory('Token');
        //Deploying token
        token= await Token.deploy('MyToken','MT','1000000')
        //Deploy FlashLoan pool
        flashloan= await FlashLoan.deploy(token.address);
        //Approve tokens 
        let transaction1= await token.connect(deployer).approve(flashloan.address,tokens(1000000));
        await transaction1.wait()
        //Deposit tokens
        let transaction2=await flashloan.connect(deployer).depositTokens(tokens(1000000));
        await transaction2.wait()
        //Deploy Flash Loan receiver
        flashloanreceiver=await FlashLoanReceiver.deploy(flashloan.address);
    })
    describe('Deployment',()=>{
        it('sends token to flash loan pool contract',async ()=>{
            expect(await token.balanceOf(flashloan.address)).to.equal(tokens(1000000))
        })
    })
    describe("Borrowing funds",()=>{
        it("Borrows funds from pool",async()=>{
            let amount=tokens(100);
            let transaction= await flashloanreceiver.connect(deployer).executeFlashLoan(amount);
            await transaction.wait();
            await expect(transaction).to.emit(flashloanreceiver,'LoanReceived')
            .withArgs(token.address,amount)
        })
    })
})