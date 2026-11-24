# Add-on SDK compatibility policy

This document describes the compatibility contract for the first public
release candidate. Publishing itself remains an owner-controlled release
action.

## Version identifiers

- npm package version: `0.1.0-pre-alpha.1`
- wallet SDK/API version: `1.6.0`
- postMessage transport protocol: `1`

The npm package version describes the TypeScript client and its distribution
artifacts. The wallet SDK/API version describes the method and response
catalog returned by the wallet. The transport protocol version describes the
envelope and handshake format. These values are intentionally separate so a
package-only fix does not look like a wire-protocol change.

## Compatibility rules

- Additive public methods, capabilities, and optional response fields are
  minor-compatible changes when the existing validation and authorization
  rules remain intact.
- Bug fixes, documentation changes, and security hardening that preserve the
  public contract are patch-compatible changes.
- Removing or changing a required method, capability, field, error meaning,
  approval boundary, or transport-envelope rule requires a major package/API
  version review.
- An incompatible handshake, request envelope, response envelope, or error
  schema requires a transport protocol version review. A client must reject
  an unsupported protocol instead of silently falling back.
- A capability is not permission to bypass wallet policy. The wallet remains
  the authority for input selection, contract construction, signer choice,
  approval, signing, submission, and recovery.

## Supported first-release boundary

The intended first release covers wallet context, sanitized address and UTXO
reads, permitted BCMR/token-index reads, immutable BCH proposals,
wallet-owned execution status, and address-scoped message signing after the
corresponding host and platform evidence is approved.

The client also accepts arbitrary CashScript artifact and ABI-shaped inputs for
the generic `contracts` methods. This does not grant an add-on execution
authority: the wallet validates the artifact and arguments, derives the
contract, resolves wallet-owned inputs and signers, applies CashToken and fee
rules, shows approval UI, and owns submission. Host policy may reject an
artifact, ABI, capability, or contract operation.

## Not a compatibility promise

Raw private keys, mnemonics, unlockers, signature templates, provider access,
direct broadcast, and signed transaction export are outside the public SDK.
CashToken mint/burn/NFT execution, generic contract execution, and any mobile
adapter without the required evidence must remain disabled or clearly marked
unavailable even though the typed proposal surface can describe those intents.
