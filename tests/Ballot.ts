import { expect } from "chai";
import { ethers } from "hardhat";
import  web3  from "web3";
import { Ballot } from "../typechain-types";

const PROPOSALS = ["Proposal 1", "Proposal 2", "Proposal 3"];

function convertStringArrayToBytes32(array: string[]) {
  const bytes32Array = [];
  for (let index = 0; index < array.length; index++) {
    bytes32Array.push(ethers.utils.formatBytes32String(array[index]));
  }
  return bytes32Array;
}

describe("Ballot", function () {
  let ballotContract: Ballot;

  beforeEach(async function () {
    const ballotFactory = await ethers.getContractFactory("Ballot");
    ballotContract = await ballotFactory.deploy(
        convertStringArrayToBytes32(PROPOSALS)
      );
    await ballotContract.deployed();
  });

  describe("when the contract is deployed", function () {
    it("has the provided proposals", async function () {
        for (let index = 0; index < PROPOSALS.length; index++) {
            const proposal = await ballotContract.proposals(index);
            expect(ethers.utils.parseBytes32String(proposal.name)).to.eq(
              PROPOSALS[index]
            );
        }
    });

    it("has zero votes for all proposals", async function () {
      for (let index = 0; index < PROPOSALS.length; index++) {
        const proposal = await ballotContract.proposals(index);
        expect(proposal.voteCount).to.eq(0);
      }
    });
    it("sets the deployer address as chairperson", async function () {
      const chairperson = await ballotContract.chairperson();
      expect(chairperson).to.eq(await ethers.provider.getSigner().getAddress());
    });
    it("sets the voting weight for the chairperson as 1", async function () {
      const chairperson = await ballotContract.chairperson();
      const voter = await ballotContract.voters(chairperson);
      expect(voter.weight).to.eq(1);
    });
  });

  describe("when the chairperson interacts with the giveRightToVote function in the contract", function () {
    it("gives right to vote for another address", async function () {
      const [_, voter] = await ethers.getSigners();
      await ballotContract.giveRightToVote(voter.address);
      const voterInfo = await ballotContract.voters(voter.address);
      expect(voterInfo.weight).to.eq(1);
    });
    it("can not give right to vote for someone that has voted", async function () {
      const [_, voter] = await ethers.getSigners();
      await ballotContract.giveRightToVote(voter.address);
      await ballotContract.connect(voter).vote(0);
      await expect(ballotContract.giveRightToVote(voter.address)).to.be.revertedWith(
        "The voter already voted."
      );
    });
    it("can not give right to vote for someone that has already voting rights", async function () {
      const [_, voter] = await ethers.getSigners();
      await ballotContract.giveRightToVote(voter.address);
      await expect(ballotContract.giveRightToVote(voter.address)).to.be.revertedWith('The voter already has voting rights.');
    });
  });

  describe("when the voter interact with the vote function in the contract", function () {
    it("should register the vote", async () => {
      const [_, voter] = await ethers.getSigners();
      await ballotContract.giveRightToVote(voter.address);
      await ballotContract.connect(voter).vote(0);
      const proposal = await ballotContract.proposals(0);
      expect(proposal.voteCount).to.eq(1);
    });
  });

  describe("when the voter interact with the delegate function in the contract", function () {
    it("should transfer voting power", async () => {
      const [_, voter, delegate] = await ethers.getSigners();
      await ballotContract.giveRightToVote(voter.address);
      await ballotContract.giveRightToVote(delegate.address);
      await ballotContract.connect(voter).delegate(delegate.address);
      await ballotContract.connect(delegate).vote(0);
      const proposal = await ballotContract.proposals(0);
      expect(proposal.voteCount).to.eq(2);
    });
  });

  describe("when the an attacker interact with the giveRightToVote function in the contract", function () {
    it("should revert", async () => {
      const [_, voter] = await ethers.getSigners();
      await expect(ballotContract.connect(voter).giveRightToVote(voter.address)).to.be.revertedWith("Only chairperson can give right to vote.");
    });
  });

  describe("when the an attacker interact with the vote function in the contract", function () {
    it("should revert", async () => {
      const [_, voter] = await ethers.getSigners();
      await expect(ballotContract.connect(voter).vote(0)).to.be.revertedWith("Has no right to vote");
    });
  });

  describe("when the an attacker interact with the delegate function in the contract", function () {
    it("should revert", async () => {
      const [_, voter, delegate] = await ethers.getSigners();
      await expect(ballotContract.connect(voter).delegate(delegate.address)).to.be.revertedWith("You have no right to vote");
    });
  });

  describe("when someone interact with the winningProposal function before any votes are cast", function () {
    it("should return 0", async () => {
      const winningProposal = await ballotContract.winningProposal();
      expect(winningProposal).to.eq(0);
    });
  });

  describe("when someone interact with the winningProposal function after one vote is cast for the first proposal", function () {
    it("should return 0", async () => {
      const [_, voter] = await ethers.getSigners();
      await ballotContract.giveRightToVote(voter.address);
      await ballotContract.connect(voter).vote(0);
      const winningProposal = await ballotContract.winningProposal();
      expect(winningProposal).to.eq(0);
    });
  });

  describe("when someone interact with the winnerName function before any votes are cast", function () {
    it("should return name of proposal 0", async () => {
      const winningProposal = await ballotContract.winnerName();
      expect(web3.utils.hexToUtf8(winningProposal)).to.eq(PROPOSALS[0]);
    });
  });

  describe("when someone interact with the winnerName function after one vote is cast for the first proposal", function () {
    it("should return name of proposal 0", async () => {
      const [_, voter] = await ethers.getSigners();
      await ballotContract.giveRightToVote(voter.address);
      await ballotContract.connect(voter).vote(0);
      const winningProposal = await ballotContract.winnerName();
      expect(web3.utils.hexToUtf8(winningProposal)).to.eq(PROPOSALS[0]);
    });
  });

  describe("when someone interact with the winningProposal function and winnerName after 5 random votes are cast for the proposals", function () {
    it("should return the name of the winner proposal", async () => {
      const [_, voter1, voter2, voter3, voter4, voter5] = await ethers.getSigners();
      await ballotContract.giveRightToVote(voter1.address);
      await ballotContract.giveRightToVote(voter2.address);
      await ballotContract.giveRightToVote(voter3.address);
      await ballotContract.giveRightToVote(voter4.address);
      await ballotContract.giveRightToVote(voter5.address);
      await ballotContract.connect(voter1).vote(0);
      await ballotContract.connect(voter2).vote(0);
      await ballotContract.connect(voter3).vote(1);
      await ballotContract.connect(voter4).vote(2);
      await ballotContract.connect(voter5).vote(0);
      const winningProposal = await ballotContract.winningProposal();
      const winnerName = await ballotContract.winnerName();
      expect(winningProposal).to.eq(0);
      expect(web3.utils.hexToUtf8(winnerName)).to.eq(PROPOSALS[0]);
    });
  });
});