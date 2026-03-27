# Chainstamp SDK

[![npm version](https://img.shields.io/npm/v/%40chainstamp%2Fsdk)](https://www.npmjs.com/package/@chainstamp/sdk)
[![npm downloads](https://img.shields.io/npm/dm/%40chainstamp%2Fsdk)](https://www.npmjs.com/package/@chainstamp/sdk)

Official JavaScript and TypeScript SDK for interacting with ChainStamps smart contracts on Stacks.

## Install

```bash
npm install @chainstamp/sdk
```

## Quick Start

```ts
import { createChainstampClient, sha256Hex } from "@chainstamp/sdk";

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
import { createChainstampClient, sha256Hex } from "@chainstamp/sdk";

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
curl https://api.npmjs.org/downloads/point/last-month/@chainstamp/sdk
```

If you want stats tied to your personal brand, rename the package in `package.json` to your own scope first, for example `@yourname/chainstamp-sdk`.

## Publish

```bash
npm install
npm run build
npm login
npm publish --access public
```

## License

MIT
