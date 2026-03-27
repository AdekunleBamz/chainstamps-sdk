import type { StacksNetwork, StacksNetworkName } from "@stacks/network";
import type {
  ClarityAbi,
  ClarityValue,
  PostCondition,
  PostConditionMode,
  PostConditionModeName,
  PostConditionWire,
  StacksTransactionWire,
  TxBroadcastResult,
} from "@stacks/transactions";

export type ChainstampNetwork = StacksNetworkName | StacksNetwork;

export type BytesLike = string | Uint8Array | ArrayBuffer;

export type ContractSelector = "hash" | "stamp" | "tag";

export interface ChainstampContractNames {
  hash: string;
  stamp: string;
  tag: string;
}

export interface ChainstampClientConfig {
  network?: ChainstampNetwork;
  contractAddress?: string;
  senderAddress?: string;
  contractNames?: Partial<ChainstampContractNames>;
}

export interface ParsedClarityResult<T = unknown> {
  cv: ClarityValue;
  json: Record<string, unknown>;
  value: T;
}

export interface ReadOnlyCallRequest {
  contractName: string;
  functionName: string;
  functionArgs?: ClarityValue[];
  senderAddress?: string;
  network?: ChainstampNetwork;
}

export interface TxBuildOptions {
  fee?: bigint | number;
  nonce?: bigint | number;
  postConditionMode?: PostConditionModeName | PostConditionMode;
  postConditions?: (PostCondition | PostConditionWire | string)[];
  validateWithAbi?: boolean | ClarityAbi;
  network?: ChainstampNetwork;
}

export interface PublicCallRequest extends TxBuildOptions {
  contractName: string;
  functionName: string;
  functionArgs?: ClarityValue[];
  senderKey: string;
}

export interface TxResult {
  transaction: StacksTransactionWire;
  broadcast: TxBroadcastResult;
}
