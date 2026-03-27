import {
  PostConditionMode,
  bufferCV,
  broadcastTransaction,
  fetchCallReadOnlyFunction,
  listCV,
  makeContractCall,
  principalCV,
  stringUtf8CV,
  tupleCV,
  uintCV,
  type ClarityValue,
  type StacksTransactionWire,
  type TxBroadcastResult,
} from "@stacks/transactions";

import {
  DEFAULT_CONTRACT_ADDRESS,
  DEFAULT_CONTRACT_NAMES,
  DEFAULT_NETWORK,
} from "./constants";
import type {
  BytesLike,
  ChainstampClientConfig,
  ChainstampContractNames,
  ChainstampNetwork,
  ParsedClarityResult,
  PublicCallRequest,
  ReadOnlyCallRequest,
  TxBuildOptions,
  TxResult,
} from "./types";
import { ensure32ByteHash, parseClarityResult, toUint } from "./utils";

export interface HashBatchEntry {
  hash: BytesLike;
  description: string;
}

export const isBroadcastRejected = (
  result: TxBroadcastResult
): result is Exclude<TxBroadcastResult, { txid: string }> => {
  return "error" in result;
};

export class ChainstampClient {
  readonly network: ChainstampNetwork;
  readonly contractAddress: string;
  readonly senderAddress?: string;
  readonly contractNames: ChainstampContractNames;

  constructor(config: ChainstampClientConfig = {}) {
    this.network = config.network ?? DEFAULT_NETWORK;
    this.contractAddress = config.contractAddress ?? DEFAULT_CONTRACT_ADDRESS;
    this.senderAddress = config.senderAddress;
    this.contractNames = {
      ...DEFAULT_CONTRACT_NAMES,
      ...(config.contractNames ?? {}),
    };
  }

  private resolveNetwork(network?: ChainstampNetwork): ChainstampNetwork {
    return network ?? this.network;
  }

  private resolveSenderAddress(senderAddress?: string): string {
    return senderAddress ?? this.senderAddress ?? this.contractAddress;
  }

  async callReadOnly<T = unknown>(request: ReadOnlyCallRequest): Promise<ParsedClarityResult<T>> {
    const cv = await fetchCallReadOnlyFunction({
      contractAddress: this.contractAddress,
      contractName: request.contractName,
      functionName: request.functionName,
      functionArgs: request.functionArgs ?? [],
      senderAddress: this.resolveSenderAddress(request.senderAddress),
      network: this.resolveNetwork(request.network),
    });

    return parseClarityResult<T>(cv);
  }

  async makePublicCall(request: PublicCallRequest): Promise<StacksTransactionWire> {
    const txOptions: Parameters<typeof makeContractCall>[0] = {
      contractAddress: this.contractAddress,
      contractName: request.contractName,
      functionName: request.functionName,
      functionArgs: request.functionArgs ?? [],
      senderKey: request.senderKey,
      fee: request.fee === undefined ? undefined : toUint(request.fee),
      nonce: request.nonce === undefined ? undefined : toUint(request.nonce),
      postConditionMode: request.postConditionMode ?? PostConditionMode.Allow,
      postConditions: request.postConditions,
      validateWithAbi: request.validateWithAbi,
      network: this.resolveNetwork(request.network),
    };

    return makeContractCall(txOptions);
  }

  async broadcast(
    transaction: StacksTransactionWire,
    network?: ChainstampNetwork
  ): Promise<TxBroadcastResult> {
    return broadcastTransaction({
      transaction,
      network: this.resolveNetwork(network),
    });
  }

  async callPublicFunction(request: PublicCallRequest): Promise<TxResult> {
    const transaction = await this.makePublicCall(request);
    const broadcast = await this.broadcast(transaction, request.network);
    return { transaction, broadcast };
  }

  private hashReadOnly<T = unknown>(
    functionName: string,
    functionArgs: ClarityValue[] = [],
    senderAddress?: string,
    network?: ChainstampNetwork
  ) {
    return this.callReadOnly<T>({
      contractName: this.contractNames.hash,
      functionName,
      functionArgs,
      senderAddress,
      network,
    });
  }

  private stampReadOnly<T = unknown>(
    functionName: string,
    functionArgs: ClarityValue[] = [],
    senderAddress?: string,
    network?: ChainstampNetwork
  ) {
    return this.callReadOnly<T>({
      contractName: this.contractNames.stamp,
      functionName,
      functionArgs,
      senderAddress,
      network,
    });
  }

  private tagReadOnly<T = unknown>(
    functionName: string,
    functionArgs: ClarityValue[] = [],
    senderAddress?: string,
    network?: ChainstampNetwork
  ) {
    return this.callReadOnly<T>({
      contractName: this.contractNames.tag,
      functionName,
      functionArgs,
      senderAddress,
      network,
    });
  }

  storeHashTx(
    hash: BytesLike,
    description: string,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.makePublicCall({
      contractName: this.contractNames.hash,
      functionName: "store-hash",
      functionArgs: [bufferCV(ensure32ByteHash(hash)), stringUtf8CV(description)],
      senderKey,
      ...options,
    });
  }

  async storeHash(
    hash: BytesLike,
    description: string,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.callPublicFunction({
      contractName: this.contractNames.hash,
      functionName: "store-hash",
      functionArgs: [bufferCV(ensure32ByteHash(hash)), stringUtf8CV(description)],
      senderKey,
      ...options,
    });
  }

  storeHashesBatchTx(entries: HashBatchEntry[], senderKey: string, options: TxBuildOptions = {}) {
    return this.makePublicCall({
      contractName: this.contractNames.hash,
      functionName: "store-hashes-batch",
      functionArgs: [
        listCV(
          entries.map(entry =>
            tupleCV({
              hash: bufferCV(ensure32ByteHash(entry.hash)),
              description: stringUtf8CV(entry.description),
            })
          )
        ),
      ],
      senderKey,
      ...options,
    });
  }

  async storeHashesBatch(
    entries: HashBatchEntry[],
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.callPublicFunction({
      contractName: this.contractNames.hash,
      functionName: "store-hashes-batch",
      functionArgs: [
        listCV(
          entries.map(entry =>
            tupleCV({
              hash: bufferCV(ensure32ByteHash(entry.hash)),
              description: stringUtf8CV(entry.description),
            })
          )
        ),
      ],
      senderKey,
      ...options,
    });
  }

  updateHashDescriptionTx(
    hash: BytesLike,
    newDescription: string,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.makePublicCall({
      contractName: this.contractNames.hash,
      functionName: "update-description",
      functionArgs: [bufferCV(ensure32ByteHash(hash)), stringUtf8CV(newDescription)],
      senderKey,
      ...options,
    });
  }

  async updateHashDescription(
    hash: BytesLike,
    newDescription: string,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.callPublicFunction({
      contractName: this.contractNames.hash,
      functionName: "update-description",
      functionArgs: [bufferCV(ensure32ByteHash(hash)), stringUtf8CV(newDescription)],
      senderKey,
      ...options,
    });
  }

  revokeHashTx(hash: BytesLike, senderKey: string, options: TxBuildOptions = {}) {
    return this.makePublicCall({
      contractName: this.contractNames.hash,
      functionName: "revoke-hash",
      functionArgs: [bufferCV(ensure32ByteHash(hash))],
      senderKey,
      ...options,
    });
  }

  async revokeHash(hash: BytesLike, senderKey: string, options: TxBuildOptions = {}) {
    return this.callPublicFunction({
      contractName: this.contractNames.hash,
      functionName: "revoke-hash",
      functionArgs: [bufferCV(ensure32ByteHash(hash))],
      senderKey,
      ...options,
    });
  }

  verifyHash(hash: BytesLike, senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly<boolean>(
      "verify-hash",
      [bufferCV(ensure32ByteHash(hash))],
      senderAddress,
      network
    );
  }

  getHashInfo(hash: BytesLike, senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly(
      "get-hash-info",
      [bufferCV(ensure32ByteHash(hash))],
      senderAddress,
      network
    );
  }

  getHashOwner(hash: BytesLike, senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly(
      "get-hash-owner",
      [bufferCV(ensure32ByteHash(hash))],
      senderAddress,
      network
    );
  }

  getHashDescription(hash: BytesLike, senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly(
      "get-hash-description",
      [bufferCV(ensure32ByteHash(hash))],
      senderAddress,
      network
    );
  }

  getHashCount(senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly<bigint>("get-hash-count", [], senderAddress, network);
  }

  getHashFee(senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly<bigint>("get-hash-fee", [], senderAddress, network);
  }

  getBatchHashFee(senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly<bigint>("get-batch-hash-fee", [], senderAddress, network);
  }

  getUserHashes(user: string, senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly("get-user-hashes", [principalCV(user)], senderAddress, network);
  }

  getUserHashCount(user: string, senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly("get-user-hash-count", [principalCV(user)], senderAddress, network);
  }

  getHashById(id: bigint | number, senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly("get-hash-by-id", [uintCV(toUint(id))], senderAddress, network);
  }

  getHashInfoById(id: bigint | number, senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly("get-hash-info-by-id", [uintCV(toUint(id))], senderAddress, network);
  }

  getHashStats(senderAddress?: string, network?: ChainstampNetwork) {
    return this.hashReadOnly("get-stats", [], senderAddress, network);
  }

  stampMessageTx(message: string, senderKey: string, options: TxBuildOptions = {}) {
    return this.makePublicCall({
      contractName: this.contractNames.stamp,
      functionName: "stamp-message",
      functionArgs: [stringUtf8CV(message)],
      senderKey,
      ...options,
    });
  }

  async stampMessage(message: string, senderKey: string, options: TxBuildOptions = {}) {
    return this.callPublicFunction({
      contractName: this.contractNames.stamp,
      functionName: "stamp-message",
      functionArgs: [stringUtf8CV(message)],
      senderKey,
      ...options,
    });
  }

  stampMessageWithCategoryTx(
    message: string,
    category: number | bigint,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.makePublicCall({
      contractName: this.contractNames.stamp,
      functionName: "stamp-message-with-category",
      functionArgs: [stringUtf8CV(message), uintCV(toUint(category))],
      senderKey,
      ...options,
    });
  }

  async stampMessageWithCategory(
    message: string,
    category: number | bigint,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.callPublicFunction({
      contractName: this.contractNames.stamp,
      functionName: "stamp-message-with-category",
      functionArgs: [stringUtf8CV(message), uintCV(toUint(category))],
      senderKey,
      ...options,
    });
  }

  batchStampMessagesTx(messages: string[], senderKey: string, options: TxBuildOptions = {}) {
    return this.makePublicCall({
      contractName: this.contractNames.stamp,
      functionName: "batch-stamp-messages",
      functionArgs: [listCV(messages.map(message => stringUtf8CV(message)))],
      senderKey,
      ...options,
    });
  }

  async batchStampMessages(messages: string[], senderKey: string, options: TxBuildOptions = {}) {
    return this.callPublicFunction({
      contractName: this.contractNames.stamp,
      functionName: "batch-stamp-messages",
      functionArgs: [listCV(messages.map(message => stringUtf8CV(message)))],
      senderKey,
      ...options,
    });
  }

  revokeStampTx(stampId: number | bigint, senderKey: string, options: TxBuildOptions = {}) {
    return this.makePublicCall({
      contractName: this.contractNames.stamp,
      functionName: "revoke-stamp",
      functionArgs: [uintCV(toUint(stampId))],
      senderKey,
      ...options,
    });
  }

  async revokeStamp(stampId: number | bigint, senderKey: string, options: TxBuildOptions = {}) {
    return this.callPublicFunction({
      contractName: this.contractNames.stamp,
      functionName: "revoke-stamp",
      functionArgs: [uintCV(toUint(stampId))],
      senderKey,
      ...options,
    });
  }

  getStamp(stampId: number | bigint, senderAddress?: string, network?: ChainstampNetwork) {
    return this.stampReadOnly("get-stamp", [uintCV(toUint(stampId))], senderAddress, network);
  }

  getStampMessage(stampId: number | bigint, senderAddress?: string, network?: ChainstampNetwork) {
    return this.stampReadOnly(
      "get-stamp-message",
      [uintCV(toUint(stampId))],
      senderAddress,
      network
    );
  }

  getStampSender(stampId: number | bigint, senderAddress?: string, network?: ChainstampNetwork) {
    return this.stampReadOnly(
      "get-stamp-sender",
      [uintCV(toUint(stampId))],
      senderAddress,
      network
    );
  }

  getStampCount(senderAddress?: string, network?: ChainstampNetwork) {
    return this.stampReadOnly<bigint>("get-stamp-count", [], senderAddress, network);
  }

  getStampFee(senderAddress?: string, network?: ChainstampNetwork) {
    return this.stampReadOnly<bigint>("get-stamp-fee", [], senderAddress, network);
  }

  getUserStamps(user: string, senderAddress?: string, network?: ChainstampNetwork) {
    return this.stampReadOnly("get-user-stamps", [principalCV(user)], senderAddress, network);
  }

  getUserStampCount(user: string, senderAddress?: string, network?: ChainstampNetwork) {
    return this.stampReadOnly("get-user-stamp-count", [principalCV(user)], senderAddress, network);
  }

  getStampsByCategory(
    category: number | bigint,
    senderAddress?: string,
    network?: ChainstampNetwork
  ) {
    return this.stampReadOnly(
      "get-stamps-by-category",
      [uintCV(toUint(category))],
      senderAddress,
      network
    );
  }

  isValidStampCategory(
    category: number | bigint,
    senderAddress?: string,
    network?: ChainstampNetwork
  ) {
    return this.stampReadOnly<boolean>(
      "is-valid-category",
      [uintCV(toUint(category))],
      senderAddress,
      network
    );
  }

  getStampStats(senderAddress?: string, network?: ChainstampNetwork) {
    return this.stampReadOnly("get-stats", [], senderAddress, network);
  }

  storeTagTx(key: string, value: string, senderKey: string, options: TxBuildOptions = {}) {
    return this.makePublicCall({
      contractName: this.contractNames.tag,
      functionName: "store-tag",
      functionArgs: [stringUtf8CV(key), stringUtf8CV(value)],
      senderKey,
      ...options,
    });
  }

  async storeTag(key: string, value: string, senderKey: string, options: TxBuildOptions = {}) {
    return this.callPublicFunction({
      contractName: this.contractNames.tag,
      functionName: "store-tag",
      functionArgs: [stringUtf8CV(key), stringUtf8CV(value)],
      senderKey,
      ...options,
    });
  }

  storeTagWithNamespaceTx(
    namespace: string,
    key: string,
    value: string,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.makePublicCall({
      contractName: this.contractNames.tag,
      functionName: "store-tag-with-namespace",
      functionArgs: [stringUtf8CV(namespace), stringUtf8CV(key), stringUtf8CV(value)],
      senderKey,
      ...options,
    });
  }

  async storeTagWithNamespace(
    namespace: string,
    key: string,
    value: string,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.callPublicFunction({
      contractName: this.contractNames.tag,
      functionName: "store-tag-with-namespace",
      functionArgs: [stringUtf8CV(namespace), stringUtf8CV(key), stringUtf8CV(value)],
      senderKey,
      ...options,
    });
  }

  updateTagTx(key: string, newValue: string, senderKey: string, options: TxBuildOptions = {}) {
    return this.makePublicCall({
      contractName: this.contractNames.tag,
      functionName: "update-tag",
      functionArgs: [stringUtf8CV(key), stringUtf8CV(newValue)],
      senderKey,
      ...options,
    });
  }

  async updateTag(key: string, newValue: string, senderKey: string, options: TxBuildOptions = {}) {
    return this.callPublicFunction({
      contractName: this.contractNames.tag,
      functionName: "update-tag",
      functionArgs: [stringUtf8CV(key), stringUtf8CV(newValue)],
      senderKey,
      ...options,
    });
  }

  updateTagWithNamespaceTx(
    namespace: string,
    key: string,
    newValue: string,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.makePublicCall({
      contractName: this.contractNames.tag,
      functionName: "update-tag-with-namespace",
      functionArgs: [stringUtf8CV(namespace), stringUtf8CV(key), stringUtf8CV(newValue)],
      senderKey,
      ...options,
    });
  }

  async updateTagWithNamespace(
    namespace: string,
    key: string,
    newValue: string,
    senderKey: string,
    options: TxBuildOptions = {}
  ) {
    return this.callPublicFunction({
      contractName: this.contractNames.tag,
      functionName: "update-tag-with-namespace",
      functionArgs: [stringUtf8CV(namespace), stringUtf8CV(key), stringUtf8CV(newValue)],
      senderKey,
      ...options,
    });
  }

  deleteTagTx(tagId: number | bigint, senderKey: string, options: TxBuildOptions = {}) {
    return this.makePublicCall({
      contractName: this.contractNames.tag,
      functionName: "delete-tag",
      functionArgs: [uintCV(toUint(tagId))],
      senderKey,
      ...options,
    });
  }

  async deleteTag(tagId: number | bigint, senderKey: string, options: TxBuildOptions = {}) {
    return this.callPublicFunction({
      contractName: this.contractNames.tag,
      functionName: "delete-tag",
      functionArgs: [uintCV(toUint(tagId))],
      senderKey,
      ...options,
    });
  }

  getTag(tagId: number | bigint, senderAddress?: string, network?: ChainstampNetwork) {
    return this.tagReadOnly("get-tag", [uintCV(toUint(tagId))], senderAddress, network);
  }

  getTagByKey(owner: string, key: string, senderAddress?: string, network?: ChainstampNetwork) {
    return this.tagReadOnly(
      "get-tag-by-key",
      [principalCV(owner), stringUtf8CV(key)],
      senderAddress,
      network
    );
  }

  getTagByNamespaceAndKey(
    owner: string,
    namespace: string,
    key: string,
    senderAddress?: string,
    network?: ChainstampNetwork
  ) {
    return this.tagReadOnly(
      "get-tag-by-ns-key",
      [principalCV(owner), stringUtf8CV(namespace), stringUtf8CV(key)],
      senderAddress,
      network
    );
  }

  getTagCount(senderAddress?: string, network?: ChainstampNetwork) {
    return this.tagReadOnly<bigint>("get-tag-count", [], senderAddress, network);
  }

  getTagFee(senderAddress?: string, network?: ChainstampNetwork) {
    return this.tagReadOnly<bigint>("get-tag-fee", [], senderAddress, network);
  }

  getUserTags(user: string, senderAddress?: string, network?: ChainstampNetwork) {
    return this.tagReadOnly("get-user-tags", [principalCV(user)], senderAddress, network);
  }

  getUserTagCount(user: string, senderAddress?: string, network?: ChainstampNetwork) {
    return this.tagReadOnly("get-user-tag-count", [principalCV(user)], senderAddress, network);
  }

  getUserNamespaceTags(
    user: string,
    namespace: string,
    senderAddress?: string,
    network?: ChainstampNetwork
  ) {
    return this.tagReadOnly(
      "get-user-namespace-tags",
      [principalCV(user), stringUtf8CV(namespace)],
      senderAddress,
      network
    );
  }

  getTagStats(senderAddress?: string, network?: ChainstampNetwork) {
    return this.tagReadOnly("get-stats", [], senderAddress, network);
  }
}

export const createChainstampClient = (config: ChainstampClientConfig = {}) => {
  return new ChainstampClient(config);
};
