type RemediationTemplate = {
  title: string;
  description: string;
  links?: string[];
};

export const REMEDIATIONS: Record<string, RemediationTemplate> = {
  "mint-authority-live": {
    title: "Consider renouncing mint authority",
    description:
      "If you do not need to mint additional tokens, renouncing the mint authority permanently caps supply. " +
      "This reduces investor risk and may improve exchange listing eligibility. " +
      "Use `spl-token authorize <MINT> mint --disable`.",
    links: ["https://spl.solana.com/token#set-authority"],
  },
  "freeze-authority-active": {
    title: "Consider renouncing freeze authority",
    description:
      "If account freezing is not a core feature of your token, renouncing the freeze authority " +
      "removes the issuer's ability to lock holder accounts. This improves holder trust. " +
      "Use `spl-token authorize <MINT> freeze --disable`.",
    links: ["https://spl.solana.com/token#set-authority"],
  },
  "update-authority-live": {
    title: "Consider renouncing the update authority",
    description:
      "Once your token's metadata is final, renouncing the update authority makes the name, symbol, " +
      "and image immutable — protecting holders from a post-launch rebrand or impersonation. " +
      "If you must retain it (e.g., to fix a broken image URI), hold it in a multisig and disclose that.",
    links: ["https://spl.solana.com/token#set-authority"],
  },
  "metadata-authority-live": {
    title: "Consider renouncing the metadata authority",
    description:
      "The Token-2022 metadata authority can rewrite on-chain name, symbol, and URI. Renounce it to " +
      "lock the token's identity, or assign it to a multisig if updates may still be required. " +
      "Disclose the authority address and its governance to holders.",
    links: ["https://spl.solana.com/token-2022/extensions#token-metadata"],
  },
  "permanent-delegate-present": {
    title: "Document permanent delegate behavior clearly",
    description:
      "If the permanent delegate is required (e.g., for compliance clawback), publish the delegate " +
      "address and the conditions under which it will act. Consider a multisig delegate address to " +
      "prevent unilateral use. Disclose this extension prominently in your token documentation.",
    links: ["https://spl.solana.com/token-2022/extensions#permanent-delegate"],
  },
  "incompatible-non-transferable-hook": {
    title: "Remove either NonTransferable or TransferHook",
    description:
      "These two extensions cannot coexist. If the token must be non-transferable, remove the transfer hook. " +
      "If the hook is required, remove the NonTransferable extension. " +
      "This decision is irreversible after mint creation — plan carefully before deploying.",
    links: ["https://spl.solana.com/token-2022/extensions#non-transferable-tokens"],
  },
  "incompatible-non-transferable-fee": {
    title: "Remove either NonTransferable or TransferFeeConfig",
    description:
      "Transfer fees can only be collected during transfers. A non-transferable token can never " +
      "trigger fee collection, making this configuration non-functional. Remove one extension.",
    links: ["https://spl.solana.com/token-2022/extensions#non-transferable-tokens"],
  },
  "incompatible-confidential-hook": {
    title: "Remove either ConfidentialTransfer or TransferHook",
    description:
      "Transfer hooks cannot inspect encrypted transfer amounts. Remove the TransferHook extension " +
      "if confidential transfers are the priority, or remove ConfidentialTransfer if the hook logic is required.",
    links: ["https://spl.solana.com/token-2022/extensions#confidential-transfer"],
  },
  "incompatible-confidential-fee": {
    title: "Remove either ConfidentialTransfer or TransferFeeConfig",
    description:
      "Fee amounts cannot be calculated from encrypted balances. Use one or the other — not both. " +
      "ConfidentialTransfer is appropriate for privacy-focused tokens; TransferFeeConfig for revenue-generating ones.",
    links: ["https://spl.solana.com/token-2022/extensions#confidential-transfer"],
  },
  "incompatible-confidential-delegate": {
    title: "Review the need for PermanentDelegate on a confidential transfer token",
    description:
      "A delegate operating on hidden balances creates significant audit and compliance risk. " +
      "If the delegate is required for compliance (e.g., clawback), ensure its actions are logged " +
      "off-chain and that token holders are clearly informed of this capability.",
    links: ["https://spl.solana.com/token-2022/extensions#permanent-delegate"],
  },
  "transfer-fee-presence": {
    title: "Publish your transfer fee configuration",
    description:
      "Make the fee rate and fee recipient address visible in your token documentation and website. " +
      "DEX integrators and wallet providers need this information to display accurate amounts to users.",
    links: ["https://spl.solana.com/token-2022/extensions#transfer-fees"],
  },
  "blocked-on-all-dexes": {
    title: "Review extension configuration before deploying",
    description:
      "Your current extension combination blocks this token from all major DEXes. " +
      "Consider whether each extension is required. If trading is critical, consult each DEX's " +
      "Token-2022 support docs for any whitelisting or permissioned pool paths.",
    links: [
      "https://station.jup.ag/docs/token-2022",
      "https://docs.raydium.io/raydium/token-2022",
      "https://docs.orca.so/orca-for-token-2022-developers/",
    ],
  },
  "blocked-on-major-dex": {
    title: "Check DEX-specific Token-2022 support documentation",
    description:
      "One or more major DEXes have blocked this token's extension configuration. " +
      "Review each affected venue's Token-2022 documentation to understand if a permissioned pool, " +
      "whitelist, or TokenBadge application can restore access.",
    links: [
      "https://station.jup.ag/docs/token-2022",
      "https://docs.raydium.io/raydium/token-2022",
      "https://docs.orca.so/orca-for-token-2022-developers/",
    ],
  },
  "conditional-orca": {
    title: "Apply for Orca TokenBadge",
    description:
      "Orca requires a TokenBadge for tokens with TransferHook or TransferFeeConfig extensions. " +
      "Apply via Orca's developer documentation. Typical review time is 1-2 weeks. " +
      "You must provide your transfer hook program address and a description of its behavior.",
    links: ["https://docs.orca.so/orca-for-token-2022-developers/"],
  },
  "metadata-missing": {
    title: "Add token metadata before launch",
    description:
      "Upload a JSON metadata file to a permanent storage provider (Arweave or IPFS), then set " +
      "the metadata URI on your mint. Include at minimum: name, symbol, description, and image. " +
      "Without metadata, wallets will show your token as 'Unknown'.",
    links: ["https://developers.metaplex.com/token-metadata"],
  },
  "metadata-partial": {
    title: "Complete missing metadata fields",
    description:
      "Ensure your metadata URI resolves to a valid JSON file with name, symbol, description, and image. " +
      "Missing fields cause inconsistent display across wallets and explorers.",
    links: ["https://developers.metaplex.com/token-metadata"],
  },
  "no-on-chain-name": {
    title: "Consider writing name on-chain with TokenMetadata extension",
    description:
      "Off-chain metadata can be changed or made unavailable by the metadata authority. " +
      "The Token-2022 TokenMetadata extension stores name and symbol directly on the mint account, " +
      "making them resistant to modification without governance.",
    links: ["https://spl.solana.com/token-2022/extensions#token-metadata"],
  },
};
