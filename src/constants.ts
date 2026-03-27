import type { ChainstampContractNames } from "./types";

export const DEFAULT_CONTRACT_ADDRESS = "SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT";

export const DEFAULT_CONTRACT_NAMES: ChainstampContractNames = {
  hash: "hash-registry",
  stamp: "stamp-registry",
  tag: "tag-registry",
};

export const DEFAULT_NETWORK = "mainnet" as const;

export const CHAINSTAMP_FEES = {
  hash: {
    store: 30000n,
    batchStore: 25000n,
    updateDescription: 10000n,
  },
  stamp: {
    stamp: 50000n,
  },
  tag: {
    store: 40000n,
    update: 40000n,
  },
} as const;

export const STAMP_CATEGORIES = {
  GENERAL: 0,
  ANNOUNCEMENT: 1,
  MILESTONE: 2,
  LEGAL: 3,
  PERSONAL: 4,
} as const;
