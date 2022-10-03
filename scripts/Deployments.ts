import { expect } from "chai";
// import { ethers } from "hardhat";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { Ballot, Ballot__factory } from "../typechain-types";

dotenv.config();

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
    const bytes32Array = [];
    for (let index = 0; index < array.length; index++) {
      bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
    }
    return bytes32Array;
}

async function main() {
    let ballotContract: Ballot;

    const options = {
        // The default provider will be used if no provider is specified
        alchemy: process.env.ALCHEMY_API_KEY,
        // infura: process.env.INFURA_API_KEY,
    };
    // console.log("options", options);

    const provider = ethers.getDefaultProvider("goerli", options);
    
    // const accounts = await ethers.getSigners();

    console.log("Deploying Ballot contract");
    console.log("Proposals: ");
    PROPOSALS.forEach((element, index) => {
        console.log(`Proposal N. ${index + 1}: ${element}`);
    });
    
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? "");
    console.log("Wallet address: ", wallet.address);
    const signer = wallet.connect(provider);
    const balanceBN = await provider.getBalance(signer.getAddress());
    const balance = Number(ethers.utils.formatEther(balanceBN));
    console.log("Balance: ", balance);
    if (balance < 0.01) {
        throw Error("Not enough funds");
    }
    const ballotFactory = new Ballot__factory(signer)
    // const ballotFactory = await ethers.getContractFactory("Ballot");
    ballotContract = await ballotFactory.deploy(
        convertStringArrayToBytes32(PROPOSALS)
        );
    const deployment = await ballotContract.deployed();
    console.log(deployment.address);

    for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        const name = ethers.utils.parseBytes32String(proposal.name);
        console.log({ index, name, proposal });
    }

    const chairperson = await ballotContract.chairperson();
    console.log({ chairperson });
    // console.log({address0: accounts[0].address, address1: accounts[1].address, address2: accounts[2].address});
    // let voterForAddress1 = await ballotContract.voters("0x5D6e74bd320bc12dE273c705198b4a1d6c63832A");
    // console.log({ voterForAddress1 });
    // console.log("giving right to vote to account 1");
    // const giveRightToVoteTx = await ballotContract.giveRightToVote("0x5D6e74bd320bc12dE273c705198b4a1d6c63832A");
    // const giveRightToVoteTxReceipt = await giveRightToVoteTx.wait();
    // console.log({giveRightToVoteTxReceipt});

    // voterForAddress1 = await ballotContract.voters("0x5D6e74bd320bc12dE273c705198b4a1d6c63832A");
    // console.log({ voterForAddress1 });

    // console.log("Voting for Proposal 1");
    // const castVoteTx = await ballotContract.vote(0);
    // const castVoteTxReceipt = await castVoteTx.wait();
    // console.log({castVoteTxReceipt});
    // const proposal0 = await ballotContract.proposals(0);
    // const name = ethers.utils.parseBytes32String(proposal0.name);
    // console.log({ index: 0, name, proposal0 });

}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});