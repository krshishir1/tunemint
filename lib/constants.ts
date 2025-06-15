import { Chain, Address, parseEther, zeroAddress } from "viem";
import {
  aeneid,
  mainnet,
  LicenseTerms,
  WIP_TOKEN_ADDRESS,
} from "@story-protocol/core-sdk";
import { useAccount } from "wagmi";

export type NetworkType = "aeneid" | "mainnet";

export interface NetworkConfig {
  name: NetworkType;
  displayName: string;
  rpcUrl: string;
  apiChain: string;
  licenseRegistryAddress: `0x${string}`;
  licenseTemplateAddress: `0x${string}`;
  royaltyPolicyLRPAddress: `0x${string}`;
  royaltyPolicyLAPAddress: `0x${string}`;
  limitLicenseHookAddress: `0x${string}`;
  explorerUrl: string;
  chain: Chain;
}

export const NETWORK_CONFIGS: Record<NetworkType, NetworkConfig> = {
  aeneid: {
    name: "aeneid",
    displayName: "Aeneid Testnet",
    rpcUrl: "https://aeneid.storyrpc.io",
    apiChain: "story-aeneid",
    licenseRegistryAddress: "0x529a750E02d8E2f15649c13D69a465286a780e24",
    licenseTemplateAddress: "0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316",
    royaltyPolicyLRPAddress: "0x9156e603C949481883B1d3355c6f1132D191fC41",
    royaltyPolicyLAPAddress: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
    limitLicenseHookAddress: "0xaBAD364Bfa41230272b08f171E0Ca939bD600478",
    explorerUrl: "https://aeneid.storyscan.io",
    chain: aeneid,
  },
  mainnet: {
    name: "mainnet",
    displayName: "Mainnet",
    rpcUrl: "https://mainnet.storyrpc.io",
    apiChain: "story",
    licenseRegistryAddress: "0x529a750E02d8E2f15649c13D69a465286a780e24",
    licenseTemplateAddress: "0x2E896b0b2Fdb7457499B56AAaA4AE55BCB4Cd316",
    royaltyPolicyLRPAddress: "0x9156e603C949481883B1d3355c6f1132D191fC41",
    royaltyPolicyLAPAddress: "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E",
    limitLicenseHookAddress: "0xB72C9812114a0Fc74D49e01385bd266A75960Cda",
    explorerUrl: "https://www.storyscan.io",
    chain: mainnet,
  },
};

export const CHAIN_ID_TO_NETWORK: Record<number, NetworkType> = {
  [aeneid.id]: "aeneid",
  [mainnet.id]: "mainnet",
};

let currentNetworkConfig = NETWORK_CONFIGS.aeneid;

export const getCurrentNetworkConfig = (): NetworkConfig => {
  return currentNetworkConfig;
};

interface NetworkContextType {
  network: NetworkType;
  config: NetworkConfig;
}

export interface Account {
  id: string;
  created_at: string;
  name?: string;
  username: string;
  bio?: string;
  wallet_address: string;
  avatar_url?: string;
}

export interface Music {
  id: string;
  account_id: string;
  created_at: string;
  title: string;
  description?: string;
  categories?: string[];
  cover_art_path?: string;
  audio_file_path: string;
  story_protocol_ip_id?: string;
}

export type Creator = {
  name: string;
  address: string;
  contributionPercent: number;
};

export type Metadata = {
  title: string;
  description?: string;
  creators: Creator[];
  genre?: string;
  mood?: string[];
  duration?: number;
  license?: string;
  external_url?: string;
};

export const RoyaltyPolicyLAP: Address =
  "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E";

export function createCommercialRemixTerms(terms: {
  commercialRevShare: number;
  defaultMintingFee: number;
}): LicenseTerms {
  return {
    transferable: true,
    royaltyPolicy: RoyaltyPolicyLAP,
    defaultMintingFee: parseEther(terms.defaultMintingFee.toString()),
    expiration: BigInt(0),
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x",
    commercialRevShare: terms.commercialRevShare,
    commercialRevCeiling: BigInt(0),
    derivativesAllowed: true,
    derivativesAttribution: true,
    derivativesApproval: false,
    derivativesReciprocal: true,
    derivativeRevCeiling: BigInt(0),
    currency: WIP_TOKEN_ADDRESS,
    uri: "https://github.com/piplabs/pil-document/blob/ad67bb632a310d2557f8abcccd428e4c9c798db1/off-chain-terms/CommercialRemix.json",
  };
}

export function createCommercialTerms(terms: { defaultMintingFee: number }) {
  return {
    transferable: true,
    royaltyPolicy: RoyaltyPolicyLAP, 
    defaultMintingFee: parseEther(terms.defaultMintingFee.toString()),
    expiration: BigInt(0),
    commercialUse: true,
    commercialAttribution: true,
    commercializerChecker: zeroAddress,
    commercializerCheckerData: "0x",
    commercialRevShare: 0,
    commercialRevCeiling: BigInt(0),
    derivativesAllowed: false,
    derivativesAttribution: false,
    derivativesApproval: false,
    derivativesReciprocal: false,
    derivativeRevCeiling: BigInt(0),
    currency: WIP_TOKEN_ADDRESS, // ex. $WIP address
    uri: "https://github.com/piplabs/pil-document/blob/9a1f803fcf8101a8a78f1dcc929e6014e144ab56/off-chain-terms/CommercialUse.json",
  };
}
