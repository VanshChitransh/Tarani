import type { VenueId } from "@tarani/shared";

/**
 * Venue categories. DEX venues can be probed for a live pool/route; wallet
 * venues are heuristic display/send surfaces; explorers are read-only viewers.
 * Centralized here so the conditional-venue risk finding and its recommendation
 * stay in lockstep and treat EVERY venue accurately — not Orca-specifically.
 */
export const DEX_VENUES: readonly VenueId[] = ["jupiter", "raydium", "orca"];
export const WALLET_VENUES: readonly VenueId[] = ["phantom", "solflare"];

export function isDexVenue(venue: string): boolean {
  return (DEX_VENUES as readonly string[]).includes(venue);
}
export function isWalletVenue(venue: string): boolean {
  return (WALLET_VENUES as readonly string[]).includes(venue);
}

/**
 * Per-venue guidance for when a venue's verdict is `conditional`. The action is
 * what an issuer must actually do at THAT venue (not a blanket "apply for an
 * Orca TokenBadge"), and the link points at that venue's own documentation.
 * Used to build both the risk-finding description and its recommendation, so a
 * token that is conditional only on wallets never gets DEX TokenBadge advice,
 * and a token conditional on Orca never gets wallet advice.
 */
export interface ConditionalVenueGuidance {
  /** Human label for the venue. */
  label: string;
  /** What the integrator/issuer must do to clear the conditional state here. */
  action: string;
  /** Authoritative doc for that venue's requirement. */
  link: string;
}

export const VENUE_CONDITIONAL_GUIDANCE: Record<VenueId, ConditionalVenueGuidance> = {
  jupiter: {
    label: "Jupiter",
    action:
      "Swaps still route, but order types are limited — transfer-tax tokens are excluded from Limit & Recurring orders. Confirm the token is only offered via Instant swap.",
    link: "https://support.jup.ag/hc/en-us/articles/22634616157340-Are-all-kinds-of-tokens-supported-on-Instant-Limit-and-Recurring",
  },
  raydium: {
    label: "Raydium",
    action:
      "Listing requires a CPMM/CLMM pool whose extensions pass on-chain is_supported_mint, or a hard-coded MINT_WHITELIST entry. Legacy AMM v4 cannot host the mint.",
    link: "https://github.com/raydium-io/raydium-cp-swap/blob/master/programs/cp-swap/src/utils/token.rs",
  },
  orca: {
    label: "Orca",
    action:
      "A Whirlpool can only be created once the token has an initialized TokenBadge (per-WhirlpoolsConfig whitelist). Apply via Orca's developer docs.",
    link: "https://dev.orca.so/Architecture%20Overview/TokenExtensions%20Support/",
  },
  phantom: {
    label: "Phantom",
    action:
      "Sends still succeed, but Phantom shows a warning for the flagged extension (e.g. permanent delegate, or a frozen-by-default account). Disclose this to holders.",
    link: "https://docs.phantom.com/developer-powertools/solana-token-extensions-token22",
  },
  solflare: {
    label: "Solflare",
    action:
      "Sends still succeed, but Solflare surfaces a delegation/approval warning. Disclose the delegate/freeze behavior to holders.",
    link: "https://help.solflare.com/en/articles/9267797-understanding-delegations-aka-spending-approvals-in-solflare",
  },
  solscan: {
    label: "Solscan",
    action:
      "Read-only explorer; some fields (e.g. encrypted balances) are shown partially. No issuer action required.",
    link: "https://solana.com/docs/tokens/extensions",
  },
  "solana-explorer": {
    label: "Solana Explorer",
    action:
      "Read-only explorer; some fields (e.g. encrypted balances) are shown partially. No issuer action required.",
    link: "https://github.com/solana-foundation/explorer",
  },
};
