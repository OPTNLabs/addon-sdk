import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const root = resolve(".");
const manifest = JSON.parse(await readFile(join(root, "package.json"), "utf8"));

for (const artifact of [
  "dist/index.js",
  "dist/index.d.ts",
  "README.md",
  "CHANGELOG.md",
  "COMPATIBILITY.md",
  "MIGRATION.md",
  "SDK_ARTIFACTS.sha256",
]) {
  try {
    await readFile(join(root, artifact));
  } catch {
    throw new Error(`Missing generated SDK artifact: ${artifact}`);
  }
}

const publicEntry = await import(
  `${new URL("../dist/index.js", import.meta.url).href}?check=${Date.now()}`
);
for (const exportName of [
  "connectAddonPostMessage",
  "createAddonWalletClient",
  "defineAddon",
  "validateAddonManifest",
]) {
  if (typeof publicEntry[exportName] !== "function") {
    throw new Error(`Missing public SDK export: ${exportName}`);
  }
}

if (manifest.private === true) {
  throw new Error(
    "The public-release SDK package must not retain the private guard",
  );
}
if (manifest.version !== "0.1.0-pre-alpha.0") {
  throw new Error(`Unexpected SDK package version: ${manifest.version}`);
}
if (manifest.license !== "GPL-3.0-only") {
  throw new Error(
    "The SDK package must declare the repository GPL-3.0-only license",
  );
}
if (
  manifest.repository?.url !== "git+https://github.com/OPTNLabs/addon-sdk.git"
) {
  throw new Error("The SDK package must identify the standalone repository");
}
if (manifest.publishConfig?.access !== "public") {
  throw new Error(
    "The SDK package must declare public scoped-package access for the approved release",
  );
}
if (!manifest.exports?.["."]?.import || !manifest.exports["."]?.types) {
  throw new Error("The add-on SDK package must expose ESM and declarations");
}
for (const includedFile of [
  "CHANGELOG.md",
  "COMPATIBILITY.md",
  "MIGRATION.md",
  "SDK_ARTIFACTS.sha256",
]) {
  if (!manifest.files?.includes(includedFile)) {
    throw new Error(`The add-on SDK package must include ${includedFile}`);
  }
}
if (manifest.dependencies || manifest.peerDependencies) {
  throw new Error(
    "The public add-on SDK package must not depend on wallet implementation modules",
  );
}

const forbidden =
  /SignatureTemplate|privateKey|private_key|mnemonic|recoveryPhrase|seedPhrase|secretKey|unlocker|rawTransaction|KeyService|TransactionBuilder|ElectrumNetworkProvider|\bbroadcast\b/i;

async function walk(directory, extensions) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error?.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(path, extensions);
      continue;
    }
    if (!extensions.some((extension) => entry.name.endsWith(extension)))
      continue;
    const contents = await readFile(path, "utf8");
    if (forbidden.test(contents)) {
      throw new Error(`Forbidden wallet implementation symbol in ${path}`);
    }
  }
}

await walk(join(root, "src"), [".ts"]);
await walk(join(root, "dist"), [".js", ".d.ts"]);
console.log("Add-on SDK package contract check passed.");
