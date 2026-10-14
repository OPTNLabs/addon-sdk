# Add-on SDK migration notes

The public package is the boundary for third-party add-ons. It is not a copy
of the wallet implementation.

## From the internal wallet facade

Third-party code should import from
`@optnlabs/optn-wallet-addon-sdk`, use the public transport connector, and
request only the capabilities it needs. It must not import `AddonsSDK.ts`,
wallet stores, transaction managers, provider objects, CashScript signers, or
key services.

The public client exposes sanitized reads, immutable proposals,
wallet-owned execution requests, operation polling, and address-scoped message
signing. The wallet still performs coin selection, contract construction,
signing, submission, provider reconciliation, and recovery.

## From legacy built-ins

Legacy built-ins may continue to use internal compatibility methods while they
are migrated. New add-ons must not depend on internal `build`, direct
`broadcast`, provider, unlocker, or key-bearing APIs. Migrate a flow by:

1. requesting the smallest manifest capability set;
2. replacing wallet reads with the public sanitized read methods;
3. replacing transaction construction with `tx.propose`;
4. using `tx.requestExecution` and `tx.waitForOperation` for wallet-owned
   approval and submission; and
5. handling `submission_unknown` as an unresolved state rather than treating a
   transaction ID as confirmation.

## Contract and CashToken add-ons

An add-on may provide public artifact/ABI and token-intent data. It may not
provide an unlocker, signer, private key, provider, or raw transaction. The
wallet decides whether the connected wallet owns the required inputs and
authority and whether the operation is enabled by the host policy.

The migration is complete only when the target host adapter has the required
security review and platform evidence. Passing the package mock-host tests is
not evidence of a native wallet approval or a chain transaction.

## Versioning

Use the package version for client distribution changes, the wallet API version
for method/response changes, and the transport protocol version for envelope
changes. See [`COMPATIBILITY.md`](./COMPATIBILITY.md) before changing any of
these values.
