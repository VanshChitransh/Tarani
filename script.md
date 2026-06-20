Hi everyone, I'm Vansh, and today I'll show you a demo of Tarani — a Token-2022 compatibility platform for Solana.

On Solana, token extensions behave differently across platforms, and the rules are often outdated. So an extension that works on one app can quietly fail on another — and for a token, that can mean a real, permanent loss. Tarani tells you, up front, which platforms support your token and how well.

We serve two kinds of users: people who've already deployed a token and want to know where it works, and people who are planning to launch one and want to be sure before they ship.

[paste mint / pick demo token] If your token is already live, you paste your mint address here and hit Analyze. For the demo I'll use one of these sample tokens.

[report loads] In a few seconds you get a full report. At the top is the compatibility matrix across the platforms we cover — right now that's 7: three trading venues (Jupiter, Raydium, Orca), two wallets (Phantom, Solflare), and two explorers (Solscan, Solana Explorer). For the three trading venues we probe live — we actually call the venue to confirm. The other four are heuristic for now, and we're moving everything to probe-first as we add more platforms.

Below the matrix you get ranked risk findings and recommendations — what could go wrong and how to fix it.

[scroll to simulator] We also have a simulator: we spin up a local Solana test validator, recreate your token's extensions on it, and run real transactions — transfer, fee, freeze, and more — so you can see how your token actually behaves on-chain, not just what we predict.

[scroll to badge] Down here are badges you can embed to show your token is Tarani-verified.

[connect wallet / track] And if you want to keep an eye on a token, connect your wallet and track it — you'll get alerted when its compatibility changes.

[switch to pre-launch] Now, if you haven't launched yet: come to this section, select the extensions and authorities you're planning to use, and analyze that combination. You get the same kind of report — before you've deployed anything.

[dashboard] Finally, there's a dashboard with all the tokens you're monitoring in one place.

That's Tarani — know exactly where your token works, before it costs you.
