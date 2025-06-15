import { useAccountStore } from "@/store/userStore";
import { useMusicUploadStore } from "@/store/musicStore";
import { createHash } from "crypto";
import { pinJSONToIPFS } from "./pinata";
import { zeroAddress, parseEther, formatEther } from "viem";
import { WIP_TOKEN_ADDRESS } from "@story-protocol/core-sdk";

import { createCommercialRemixTerms, createCommercialTerms } from "./constants";

function cidToUrl(id: string) {
  return `${process.env.NEXT_PUBLIC_PINATA_URL}/${id}`;
}

export async function registerMusicAsIPAsset(ip_data: any) {
  const { storyClient, account, config } = useAccountStore.getState();
  const { metadata, ipfsCids } = useMusicUploadStore.getState();

  if (!storyClient) {
    throw new Error("Story client not initialized");
  }

  if (!account) {
    throw new Error("No account found");
  }

  if (!ipfsCids.metadata || !ipfsCids.audio || !ipfsCids.cover) {
    throw new Error("Missing required IPFS CIDs");
  }

  try {
    // Generate IP metadata
    const ipMetadata = await storyClient.ipAsset.generateIpMetadata({
      ...ip_data,
      image: cidToUrl(ipfsCids.cover),
      imageHash: ipfsCids.cover,
      mediaUrl: cidToUrl(ipfsCids.audio),
      mediaHash: ipfsCids.audio,
    });

    // Upload IP metadata to IPFS
    const ipIpfsHash = await pinJSONToIPFS(ipMetadata, "ip");
    const ipHash = createHash("sha256")
      .update(JSON.stringify(ipMetadata))
      .digest("hex");

    const nftMetadata = {
      ...metadata,
      created_at: new Date().toISOString(),
    };

    // Upload NFT metadata to IPFS
    const nftIpfsHash = ipfsCids.metadata;
    const nftHash = createHash("sha256")
      .update(JSON.stringify(nftMetadata))
      .digest("hex");

    console.log("Remixing allowed", ip_data.rights?.allowRemixing);
    console.log(
      createCommercialRemixTerms({
        commercialRevShare: parseInt(ip_data.pricing?.royalty || "10"),
        defaultMintingFee: parseFloat(ip_data.pricing?.price || "0.1"),
      })
    );

    // Register IP asset with PIL terms
    const response = await storyClient.ipAsset.mintAndRegisterIpAssetWithPilTerms({
      spgNftContract: "0xc32A8a0FF3beDDDa58393d022aF433e78739FAbc",
      licenseTermsData: [
        {
          terms: createCommercialRemixTerms({
            commercialRevShare: parseInt(ip_data.pricing?.royalty || "10"),
            defaultMintingFee: parseFloat(ip_data.pricing?.price || "0.1"),
          }),
        },
      ] as any,
      ipMetadata: {
        ipMetadataURI: `https://ipfs.io/ipfs/${ipIpfsHash}`,
        ipMetadataHash: `0x${ipHash}`,
        nftMetadataURI: `https://ipfs.io/ipfs/${nftIpfsHash}`,
        nftMetadataHash: `0x${nftHash}`,
      },
    });

    console.log("IP asset registered successfully:", response);
    return {
      ipId: response.ipId,
      txHash: response.txHash,
      licenseTermsIds: response.licenseTermsIds,
      tokenId: response.tokenId,
      receipt: response.receipt
    };
  } catch (error) {
    console.error("Error registering IP asset:", error);
    throw error;
  }
}

export async function payTip(ipId: `0x${string}`, amount: string) {
  try {
    const { storyClient, account, config } = useAccountStore.getState();

    if (!storyClient) {
      throw new Error("Story client not initialized");
    }

    if (!account) {
      throw new Error("No account found");
    }

    console.log(ipId, amount, parseEther(amount), zeroAddress);

    const payRoyalty = await storyClient.royalty.payRoyaltyOnBehalf({
      receiverIpId: ipId,
      payerIpId: zeroAddress,
      token: WIP_TOKEN_ADDRESS,
      amount: parseEther(amount),
      // txOptions: { waitForTransaction: true },
    });

    console.log("Paid Royalty: ", payRoyalty);
  } catch (err) {
    console.error("Error paying royalty:", err);
    throw err;
  }
}

export async function mintLicense(ipId: `0x${string}`, licenseTermsId: string) {
  try {
    const { storyClient, account } = useAccountStore.getState();

    if (!storyClient) {
      throw new Error("Story client not initialized");
    }

    if (!account) {
      throw new Error("No account found");
    }

    const response = await storyClient.license.mintLicenseTokens({
      licenseTermsId,
      licensorIpId: ipId,
      maxMintingFee: parseEther("0.1"),
      maxRevenueShare: 100,
    });

    console.log("License minted: ", response);
    return response;
  } catch (err) {
    console.error("Error minting license:", err);
    throw err;
  }
}

export const getClaimableRevenue = async (ipId: `0x${string}`, account: any) => {
  try {
    const { storyClient } = useAccountStore.getState();

    if (!storyClient) {
      throw new Error("Story client not initialized");
    }

    console.log(ipId, account)

    const vault_address = await storyClient.royalty.getRoyaltyVaultAddress(ipId)
    console.log("Vault address: ", vault_address)
    const response = await storyClient.royalty.claimableRevenue({
      ipId: ipId,
      claimer: account?.wallet_address as `0x${string}`,
      token: WIP_TOKEN_ADDRESS
    });

    // Convert bigint wei to ETH string
    const ethAmount = formatEther(response);

    console.log(response, ethAmount)
    
    return {
      amount: parseFloat(ethAmount), // Convert to float for easier handling
      rawAmount: response // Keep the original bigint for contract calls
    };
  } catch (error) {
    console.error("Error getting claimable revenue:", error);
    throw error;
  }
};

export const claimRevenue = async (ipId: `0x${string}`) => {
  try {

    const { storyClient, account } = useAccountStore.getState();

    if (!storyClient) {
      throw new Error("Story client not initialized");
    }

    console.log(ipId)

    const response = await storyClient.royalty.batchClaimAllRevenue({
      ancestorIps: [
        {
          ipId: ipId,
          claimer: ipId,
          childIpIds: [],
          royaltyPolicies: [],
          currencyTokens: [WIP_TOKEN_ADDRESS],
      }
      ]
    })

    console.log("Claimed revenue", response)
    return response;

  } catch (error) {
    console.error("Error claiming revenue:", error);
    throw error;
  }
}
