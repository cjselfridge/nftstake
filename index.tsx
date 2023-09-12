import React, { useEffect, useState } from "react";
import {
  ConnectWallet,
  ThirdwebNftMedia,
  Web3Button,
  useAddress,
  useContract,
  useOwnedNFTs,
  useContractRead,
} from "@thirdweb-dev/react";
import styles from "../styles/Home.module.css";
import { NextPage } from "next";
import { BigNumber, ethers } from "ethers";

const Home: NextPage = () => {
  const address = useAddress();

  const martiniAddress = "0x7D84FA3b62afC63E54D758E1D2f23e9b2794883C";
  const stakingAddress = "0xcEf4E7efCC70A33C8dd32001Da9425946e0f6C61";

  const { contract: martiniContract } = useContract(martiniAddress, "nft-collection");
  const { contract: stakingContract } = useContract(stakingAddress);

  const [myMartiniNFTs, setMyMartiniNFTs] = useState([]);
  const [stakedMartiniNFTs, setStakedMartiniNFTs] = useState([]);
  const [claimableRewards, setClaimableRewards] = useState<BigNumber>();

  useEffect(() => {
    if (martiniContract && address) {
      fetchMyMartiniNFTs();
    }

    if (stakingContract && address) {
      fetchStakedMartiniNFTs();
      loadClaimableRewards();
    }
  }, [martiniContract, stakingContract, address]);

  const fetchMyMartiniNFTs = async () => {
    try {
      const myNFTs = await useOwnedNFTs(martiniContract, address);
      setMyMartiniNFTs(myNFTs.data || []);
    } catch (error) {
      console.error("Error fetching owned NFTs:", error);
    }
  };

  const fetchStakedMartiniNFTs = async () => {
    try {
      const stakedNFTs = await useContractRead(stakingContract, "getStakeInfo", [address]);
      setStakedMartiniNFTs(stakedNFTs.data || []);
    } catch (error) {
      console.error("Error fetching staked NFTs:", error);
    }
  };

  const loadClaimableRewards = async () => {
    try {
      const stakeInfo = await stakingContract.call("getStakeInfo", address);
      setClaimableRewards(stakeInfo[1]);
    } catch (error) {
      console.error("Error loading claimable rewards:", error);
    }
  };

  async function stakeNFT(nftId: string) {
    if (!address || !martiniContract || !stakingContract) return;

    const isApproved = await martiniContract.isApproved(address, stakingAddress);

    if (!isApproved) {
      await martiniContract.setApprovalForAll(stakingAddress, true);
    }

    try {
      await stakingContract.call("stake", [nftId]);
    } catch (error) {
      console.error("Error staking NFT:", error);
    }
  }

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <h1>Martinicoin NFT</h1>
        <ConnectWallet>
          {({ connect, connected }) => (
            <button onClick={connected ? checkNFTBalance : connect}>
              {connected ? "Check For NFT" : "Connect Wallet"}
            </button>
          )}
        </ConnectWallet>
        <br />
        <h1>My Martinicoin NFT</h1>
        <div>
          {myMartiniNFTs.map((nft) => (
            <div key={nft.id}>
              <h3>{nft.metadata.name}</h3>
              {nft.metadata.url ? (
                <>
                  <ThirdwebNftMedia metadata={nft.metadata} />
                  <Web3Button
                    contractAddress={stakingAddress}
                    action={() => stakeNFT(nft.metadata.id)}
                  >
                    Stake Martinicoin NFT
                  </Web3Button>
                </>
              ) : (
                <p>Metadata URL not available</p>
              )}
            </div>
          ))}
        </div>
        <h1>Staked Martini</h1>
        <div>
          {stakedMartiniNFTs.map((stakedNFT: BigNumber) => (
            <div key={stakedNFT.toString()}>
              {/* Replace with your NFTCard component */}
              <NFTCard tokenId={stakedNFT.toString()} />
            </div>
          ))}
        </div>
        <br />
        <h1>Claimable $MTC:</h1>
        {!claimableRewards ? "Loading..." : ethers.utils.formatUnits(claimableRewards, 18)}
        <Web3Button
          contractAddress={stakingAddress}
          action={() => stakingContract?.call("claimRewards")}
        >
          Claim $MTC
        </Web3Button>
        {address && <p>Connected Wallet Address: {address}</p>}
      </div>
    </main>
  );
};

export default Home;
