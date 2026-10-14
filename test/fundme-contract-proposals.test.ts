import { describe, expect, it } from "vitest";

import { createAddonWalletClient } from "../src/client";
import type { AddonCashScriptArtifact } from "../src/types";

const fixtureArtifact: AddonCashScriptArtifact = {
  contractName: "AddonSdkContractFixture",
  constructorInputs: [],
  abi: [
    { name: "pledge", inputs: [{ name: "amount", type: "int" }] },
    { name: "externalFunction", inputs: [] },
    { name: "refund", inputs: [] },
    { name: "stop", inputs: [] },
    { name: "cancel", inputs: [] },
    {
      name: "claim",
      inputs: [
        { name: "recipient", type: "bytes20" },
        { name: "amount", type: "int" },
      ],
    },
    {
      name: "initialize",
      inputs: [
        { name: "manager", type: "bytes20" },
        { name: "goal", type: "int" },
        { name: "deadline", type: "int" },
        { name: "beneficiary", type: "bytes20" },
        { name: "fee", type: "int" },
      ],
    },
  ],
  bytecode: "51",
  compiler: { name: "cashc", version: "0.14.0" },
};

const contract = {
  contractId: "ab".repeat(32),
  contractName: "FundMe fixture contract",
  contractType: "p2sh32" as const,
  address:
    "bitcoincash:p03u4v845j4rhzyc63cgm0arksfx5u3atkvz43xzdy0r8pql4qm37j50tje8p",
  tokenAddress:
    "bitcoincash:r03u4v845j4rhzyc63cgm0arksfx5u3atkvz43xzdy0r8pql4qm37q8n2tc72",
  lockingBytecode: "51",
  bytecode: "51",
  bytesize: 1,
  opcount: 1,
  compiler: { name: "cashc", version: "0.10.0-next.5" },
};

const input = {
  address: contract.address,
  tx_hash: "11".repeat(32),
  tx_pos: 0,
  value: 1_000,
  height: 0,
  token: {
    category: "48".repeat(32),
    amount: 0,
    nft: { capability: "minting" as const, commitment: "00".repeat(40) },
  },
};

const output = {
  recipientAddress: contract.address,
  amount: 1_000,
  token: input.token,
};

const cases: Array<{
  name: string;
  artifact: AddonCashScriptArtifact;
  args: Array<{ type: string; value: string }>;
}> = [
  {
    name: "pledge",
    artifact: fixtureArtifact,
    args: [{ type: "int", value: "10000" }],
  },
  { name: "externalFunction", artifact: fixtureArtifact, args: [] },
  { name: "refund", artifact: fixtureArtifact, args: [] },
  { name: "stop", artifact: fixtureArtifact, args: [] },
  { name: "cancel", artifact: fixtureArtifact, args: [] },
  {
    name: "claim",
    artifact: fixtureArtifact,
    args: [
      { type: "bytes20", value: "cd".repeat(20) },
      { type: "int", value: "15000" },
    ],
  },
  {
    name: "initialize",
    artifact: fixtureArtifact,
    args: [
      { type: "bytes20", value: "ef".repeat(20) },
      { type: "int", value: "100000" },
      { type: "int", value: "900000" },
      { type: "bytes20", value: "cd".repeat(20) },
      { type: "int", value: "1000000" },
    ],
  },
];

describe("FundMe contract proposal ABI boundary", () => {
  it.each(cases)(
    "accepts the $name ABI call without execution",
    async ({ name, artifact, args }) => {
      const requests: unknown[] = [];
      const sdk = createAddonWalletClient({
        async request(_method, params) {
          requests.push(params);
          return {
            proposalId: `fundme-${name}`,
            commitmentHex: "12".repeat(32),
            walletId: 1,
            // The public SDK only accepts wallet-supported BCH networks. This
            // fixture is execution-free, so chipnet represents the simulated
            // environment without introducing a non-wallet network value.
            network: "chipnet",
            sessionId: "mock-session",
            grantRevision: 1,
            authorityEpoch: 1,
            createdAt: new Date(0).toISOString(),
            expiresAt: new Date(60_000).toISOString(),
            inputs: [input],
            outputs: [output],
            contract: { contractId: contract.contractId, functionName: name },
            status: "proposed",
          };
        },
      });

      const proposal = await sdk.contracts.propose({
        contract,
        artifact,
        constructorArgs: [],
        function: { name, args },
        inputs: [input],
        contractInputIndexes: [0],
        outputs: [output],
        idempotencyKey: `fundme:mocknet:${name}`,
      });

      expect(proposal.status).toBe("proposed");
      expect(requests[0]).toMatchObject({
        function: { name, args },
        contractInputIndexes: [0],
        idempotencyKey: `fundme:mocknet:${name}`,
      });
    },
  );

  it("does not execute or broadcast proposals", () => {
    const sdk = createAddonWalletClient({ request: async () => ({}) });
    expect("requestExecution" in sdk.contracts).toBe(false);
    expect("broadcast" in sdk.tx).toBe(false);
  });
});
