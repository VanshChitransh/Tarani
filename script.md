# Tarani — Demo Video Script

_First-person, ~3:30. `[screen]` / `[action]` = on-camera direction; everything else is spoken._

---

**[screen: you on cam, or Tarani home page]**

Hey, I'm Vansh. I was part of the **SuperDev Fellowship, 2026 cohort**, and for the capstone Harkirat gave us a few tracks — perps, AI, x402, agentic. I went a different way and picked **Token-2022**, because honestly I think there's a real gap here that nobody's actually solved yet.

**[screen: rwa.xyz Solana page]**

So here's the thing. Real-world assets on Solana are blowing up — tokenized RWAs hit an all-time high of around **$1.8 billion in March 2026**, and on rwa.xyz today it's already past **$2.6 billion**, across like 1,800 assets and 230,000 holders. Everyone wants to launch a token on Solana right now. And more and more of them are using **Token-2022**, because of its extensions — transfer fees, transfer hooks, confidential transfers, permanent delegate, all of that.

**[screen: a compatibility table / venue logos]**

But here's the problem nobody tells you: every venue handles these extensions _differently_, and the docs don't keep up. Like — Jupiter didn't even support Token-2022 until **June 2023**, and even now it **won't let transfer-fee tokens use Limit or Recurring orders**, because the creator can change the fee whenever they want. Raydium straight up **blocks permanent-delegate tokens from permissionless pools**. Orca puts the risky extensions behind a **manual allowlist**. Phantom only added proper Token-2022 support in **December 2023**. So the same token can work in one place and just be broken in another.

**[screen: PYUSD / xStocks]**

And this isn't some edge case — it hits the biggest tokens out there. **PayPal's PYUSD** is a Token-2022 token, built with a transfer fee, a transfer hook, _and_ a permanent delegate — that's roughly **$2 billion sitting on Solana** that runs right into these restrictions. **xStocks**, the tokenized stocks — over **$182 million on Solana, 57,000 holders** — uses seven extensions, so it's gated too. So you can deploy a token that's perfectly fine on-chain, and then find out _after_ launch that it's un-tradeable somewhere that matters. That's a bad day.

**[screen: Tarani home page]**

So that's why I built **Tarani**. I'll be straight with you — I've only been on this for like **2 to 3 days**, so it's not finished. I'd honestly call it a **v0.5**. But the core actually works end to end, and the idea is simple: paste any mint, and I'll tell you where your token works, where it breaks, and what to fix — _before_ you launch.

**[action: paste a Token-2022 mint, e.g. PYUSD, analyze]**

Let me show you what actually happens under the hood, because this is the part I care about.

First, there's a **parser**. I take the mint and pull out every Token-2022 extension on it, into a clean profile.

**[screen: compatibility matrix appears]**

Then that profile goes into the **compatibility engine**, where I check it against all **7 venues**, for every extension I know about. And every verdict — supported, partial, conditional, blocked — comes with evidence and a confidence level. For some venues I even run a **live probe** against the real protocol, so it's not just a static rule.

**[action: run the simulator]**

And then there's the part I'm most proud of — the **simulator**. Instead of just predicting what'll happen, I **spin up a real solana-test-validator**, build a token that mirrors your exact extension setup, and **run actual transactions** on it — transfers, swaps, freezes — and then read the program logs to show you what really happened on-chain.

**[scroll to recommendations]**

And finally, for everything it flags, you get **recommendations** — actual steps to fix it before you ship.

**[screen: roadmap or "what's next"]**

Like I said, it's early, so here's what I'm building next. I want **live probes for every venue and every extension**, not just a few. I want **deeper simulation** — cloning real mainnet programs like transfer hooks, way more scenarios. **Monitoring and alerts**, so you get a webhook the moment a venue's support for your token changes. And a **public API plus an embeddable badge**, so any launchpad or explorer can plug this in.

**[screen: you on cam, or the logo]**

One honest note for the submission — the deadline's tonight at 11, so that's where the graded commit stops. But I'm not stopping there. I'm going to **keep building this on a separate branch** through the rest of the fellowship and after. I genuinely think this should be a real, company-grade product — I want to **launch it on Product Hunt** and make it a proper part of the Solana tooling ecosystem.

That's **Tarani** — know before you launch. Thanks for watching.

---

## Production notes

- Read it out loud once and cut anything that doesn't sound like _you_ — change words freely, it should feel spoken, not read.
- **Pre-run the simulator once** before recording; if Kotler / the validator isn't reachable in prod it falls back to heuristic on camera. Keep `KOTLER_FORCE_HEURISTIC` ready as a backup so the timeline always fills in.
- To hit ~2:00, cut the roadmap paragraph to one line.

## Sources (for the numbers cited above)

- Solana RWA $1.82B ATH (Mar 2026): rwa.xyz; HokaNews citing Cointelegraph
- Solana RWA $2.62B / 1,843 assets / 232,645 holders (May 2026): https://app.rwa.xyz/networks/solana
- 325% growth in 2025; Solana 3rd-largest RWA chain: CoinEdition citing rwa.xyz
- PYUSD on Token-2022 (transfer fee + hook + permanent delegate): https://www.helius.dev/blog/solanas-stablecoin-landscape
- PYUSD ~$3.06B all-chain mcap, ~60% (~$2B) on Solana: CoinGecko; eco.com support docs
- xStocks ~$182M on Solana, 57k+ holders, 7 extensions: https://solana.com/news/case-study-xstocks
- Jupiter excludes Token-2022 / transfer-tax tokens from Limit & Recurring: support.jup.ag
- Jupiter added Token-2022 ~June 2023: https://discuss.jup.ag/t/archived-jupiter-token-2022-support/21711
- Raydium blocks Permanent Delegate from permissionless pools: https://raydium.medium.com/raydium-support-for-token-2022-932f9fae966b
- Orca TokenBadge allowlist for risky extensions: https://dev.orca.so/Architecture%20Overview/TokenExtensions%20Support/
- Phantom Token-2022 support shipped Dec 14, 2023: Phantom (LinkedIn announcement)
