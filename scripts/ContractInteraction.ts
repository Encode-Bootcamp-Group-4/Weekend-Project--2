import { ethers } from "ethers";
import  web3  from "web3";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
    let BallotContract: any;
    let CONTRACT_ADDRESS: any;
    let BALLOT_ABI: any;

    CONTRACT_ADDRESS = "0xA1272aC2B4c09c2777f8FFff0E425431A5d1d03c";
    BALLOT_ABI = [
        "function giveRightToVote(address voter) external",
        "function delegate(address to) external",
        "function vote(uint proposal) external",
        "function winningProposal() public view returns (uint)",
        "function winnerName() external view returns (bytes32)"
    ];

    const options = {
        // The default provider will be used if no provider is specified
        alchemy: process.env.ALCHEMY_API_KEY,
        // infura: process.env.INFURA_API_KEY,
    };

    const provider = ethers.getDefaultProvider("goerli", options);

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY ?? "");
    // console.log("Wallet address: ", wallet.address);
    const signer = wallet.connect(provider);

    BallotContract = new ethers.Contract(CONTRACT_ADDRESS, BALLOT_ABI, signer);

    // Give right to vote
    const giveRightToVote = await BallotContract.giveRightToVote("0x89Cd39b28CDdBf28E3B972EA64f8c1e2B337a07C");
    console.log("giveRightToVote", giveRightToVote);

    // // Delegate
    const delegate = await BallotContract.delegate("0x82C10e2A9959DEBbd9ac3a35b49CD6990421fd9B");
    console.log("delegate", delegate);

    // // Vote for proposal 1
    const castVoteTx = await BallotContract.vote(1);
    const castVoteTxReceipt = await castVoteTx.wait();
    console.log("castVoteTxReceipt", castVoteTxReceipt);

    // // Get winning proposal
    const winningProposal = await BallotContract.winningProposal();
    console.log("winningProposal", parseInt(winningProposal, 16));

    // // Get winner name
    const winnerName = await BallotContract.winnerName();
    console.log("winnerName", web3.utils.hexToUtf8(winnerName));

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});