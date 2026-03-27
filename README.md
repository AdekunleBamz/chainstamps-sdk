# Chainstamp SDK

[![npm version](https://img.shields.io/npm/v/%40bamzzstudio%2Fchainstamps-sdk)](https://www.npmjs.com/package/@bamzzstudio/chainstamps-sdk)
[![npm downloads](https://img.shields.io/npm/dm/%40bamzzstudio%2Fchainstamps-sdk)](https://www.npmjs.com/package/@bamzzstudio/chainstamps-sdk)

Official JavaScript and TypeScript SDK for interacting with ChainStamps smart contracts on Stacks.

## Install

```bash
npm install @bamzzstudio/chainstamps-sdk
```

## Quick Start

```ts
import { createChainstampClient, sha256Hex } from "@bamzzstudio/chainstamps-sdk";

const client = createChainstampClient({
  network: "mainnet",
  contractAddress: "SP5K2RHMSBH4PAP4PGX77MCVNK1ZEED07CWX9TJT",
});

const documentHashHex = await sha256Hex("hello chainstamp");
const hashStatus = await client.verifyHash(documentHashHex);

console.log(hashStatus.value); // true or false
```

## Transaction Example

```ts
import { createChainstampClient, sha256Hex } from "@bamzzstudio/chainstamps-sdk";

const client = createChainstampClient();

const hash = await sha256Hex("document contents");
const tx = await client.storeHash(hash, "My document", "YOUR_PRIVATE_KEY");

if ("txid" in tx.broadcast) {
  console.log("Broadcasted:", tx.broadcast.txid);
} else {
  console.error("Broadcast failed:", tx.broadcast.reason, tx.broadcast.error);
}
```

## Core API Surface

- `hash`: `storeHash`, `storeHashesBatch`, `updateHashDescription`, `revokeHash`, `verifyHash`, `getHashInfo`
- `stamp`: `stampMessage`, `stampMessageWithCategory`, `batchStampMessages`, `revokeStamp`, `getStamp`
- `tag`: `storeTag`, `storeTagWithNamespace`, `updateTag`, `deleteTag`, `getTagByKey`
- generic: `callReadOnly`, `makePublicCall`, `callPublicFunction`, `broadcast`

## Downloads Visibility (Talent Platforms)

Once published, any platform can read your package download stats from npm using your package name.

Example endpoint:

```bash
curl https://api.npmjs.org/downloads/point/last-month/@bamzzstudio/chainstamps-sdk
```

This package already uses your personal npm scope, so download stats will map directly to your account.

## Publish

```bash
npm install
npm run build
npm login
npm publish --access public
```

## License

MIT
