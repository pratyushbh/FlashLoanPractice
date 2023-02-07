pragma solidity ^0.8.0;

import "hardhat/console.sol";
import './Token.sol';
import "@openzeppelin/contracts/math/SafeMath.sol";

interface IReceiver{
    function receiveTokens(address tokenAddress,uint256 amount) external;
}

contract FlashLoan{
    using SafeMath for uint256;
    Token public token;
    uint256 public  poolBalance;
    constructor(address _tokenAddress) {
        token=Token(_tokenAddress);
    }
    function depositTokens(uint256 _amount) external {
        require(_amount>0,"Must deposit atleast one token");
        token.transferFrom(msg.sender, address(this), _amount);
        poolBalance=poolBalance.add(_amount);
    }
    function flashLoan(uint256 _borrowAmount) external{
        require(_borrowAmount>0,"Must borrow at least 1 token");
        uint256 balanceBefore=token.balanceOf(address(this));
        require(balanceBefore>=_borrowAmount,"Not enough tokens in pool");
        assert(poolBalance==balanceBefore);
        //Send token to receiver 
        token.transfer(msg.sender, _borrowAmount);
        //Get paid back
        IReceiver(msg.sender).receiveTokens(address(token), _borrowAmount);
        //Ensure the loan paid back
        uint256 balanceAfter=token.balanceOf(address(this));
        require(balanceAfter>= balanceBefore,"Flash loan hasn't been paid back");
    }
}