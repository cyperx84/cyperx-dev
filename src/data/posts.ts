export interface Post {
  title: string;
  slug: string;
  date: string;
  excerpt: string;
  tags: string[];
  readTime: string;
  category: string;
  signal: number;
  content: string;
}

export const posts: Post[] = [
  {
    title: "Why I Gave My AI Agent Root Access",
    slug: "ai-agent-root-access",
    date: "2026.03.18",
    excerpt: "Everyone told me it was insane. They were right. But the productivity gains from letting an autonomous agent manage my infrastructure changed everything about how I build.",
    tags: ["AI", "AGENTS", "INFRASTRUCTURE"],
    readTime: "8 min",
    category: "SYSTEMS",
    signal: 94,
    content: `<p>Everyone told me it was insane. My mate in Sydney literally said "you're going to nuke your machine." He wasn't wrong to worry.</p>

<p>I gave OpenClaw — my main agent, the one I talk to every day — full shell access. Not sandboxed. Not read-only. Full. It can run git commands, edit files, manage cron jobs, send Discord messages, and yes, it can <code>rm -rf</code> something if it's having a bad day.</p>

<p>Here's the thing: it hasn't had a bad day. Not even close.</p>

<h2>What the agent actually does with that access</h2>

<p>Day to day, the agent is doing stuff I used to do manually:</p>

<ul>
<li>Git operations — commits, status checks, branch management. I'll say "commit this with a useful message" and it writes the message, commits, done.</li>
<li>File operations — creating notes, updating configs, reorganising directories. The Obsidian vault especially. It creates new notes with proper YAML frontmatter, moves things around, updates wikilinks.</li>
<li>Discord — sending messages to specific channels, relaying information between agents, posting build updates.</li>
<li>Cron — it can schedule tasks. I'll say "remind me about X tomorrow morning" and it writes the cron entry itself.</li>
<li>Process management — checking what's running, restarting services, reading logs.</li>
</ul>

<p>That's not hypothetical. That's the actual daily usage.</p>

<h2>What went wrong</h2>

<p>Honestly? Less than you'd expect. A few things:</p>

<p>Early on, it committed something to the wrong branch. My fault — I gave an ambiguous instruction. The commit was fine, just in the wrong place. Five-second fix.</p>

<p>It once deleted a temp file I actually wanted. Again, I said "clean up the workspace" without being specific. Lesson learned: be specific.</p>

<p>There was one time it tried to run a command that needed sudo and got confused when it hit a password prompt. Not destructive, just annoying. Now it knows to ask before anything elevated.</p>

<p>The pattern here is: every "incident" was my fault. Bad instruction, ambiguous context, unclear scope. The agent didn't go rogue. It followed instructions that happened to be imprecise.</p>

<h2>The guard rails that actually matter</h2>

<p>I'm not just running wild. There are real constraints:</p>

<p><strong>The approval model.</strong> OpenClaw has a policy layer — certain commands need explicit approval before running. Destructive operations, external API calls that cost money, anything touching production. The agent knows to surface these rather than just execute.</p>

<p><strong>Explicit over implicit.</strong> I've trained myself to be specific. Not "fix the bug" but "fix the null check in auth.ts line 47." Specificity is its own safety mechanism.</p>

<p><strong>The soul file.</strong> My agent has a SOUL.md that defines its values. "Don't exfiltrate private data. Ever." "trash over rm." "When in doubt, ask." These aren't just nice words — the agent actually follows them because they're in its context every session.</p>

<p><strong>Reversibility preference.</strong> I've explicitly told it to prefer reversible actions. Move instead of delete. Branch instead of force push. The path back should always exist.</p>

<h2>The actual productivity gains</h2>

<p>Here's what changed: I don't context-switch anymore. When I'm deep in a problem and need to commit progress, I just say it out loud. The agent handles the ceremony. When I want to look something up in my notes, it reads the vault. When I need a file in a specific format, it creates it.</p>

<p>The cognitive overhead of managing my own infrastructure dropped significantly. Not because the agent is magic, but because it handles the mechanical parts so I can focus on the thinking parts.</p>

<p>Is it risky? Yeah, a bit. But the risk is proportional to the quality of your instructions and the quality of your agent's constraints. I've spent time building both. That time paid off.</p>

<p>I'm not telling you to do this. I'm telling you why I did it, what happened, and what I'd do differently. If you're building with agents, you're going to have to figure out your own risk tolerance. Mine is higher than most. That's a deliberate choice.</p>

<p>The machines have root. The machines are behaving. For now, that's enough.</p>`,
  },
  {
    title: "The Obsidian Vault as Operating System",
    slug: "obsidian-vault-os",
    date: "2026.03.02",
    excerpt: "Your note-taking app is a shitty operating system. Here's how I turned mine into an actual one — with pipelines, state machines, and agents that read it.",
    tags: ["OBSIDIAN", "PKM", "AUTOMATION"],
    readTime: "12 min",
    category: "KNOWLEDGE",
    signal: 88,
    content: `<p>Most people's Obsidian vault is a graveyard. Ideas go in, nothing comes out. Notes accumulate like digital clutter and nobody can find anything after six months.</p>

<p>Mine is different. Not because I'm smarter about note-taking — I'm not — but because I stopped thinking of it as a note-taking app and started thinking of it as an operating system. Shared context for both humans and AI agents.</p>

<h2>The pipeline that makes it work</h2>

<p>Everything flows through four stages:</p>

<p><strong>Ideas → PRDs → Builds → Ship</strong></p>

<p>An idea is a single atomic note. "I want a TUI dashboard for my agent fleet." That's it. One line, one note, proper YAML frontmatter with a status field set to <code>idea</code>.</p>

<p>When I decide to pursue something, it becomes a PRD — Product Requirements Document, but stripped of all the corporate nonsense. Just: what is it, why does it exist, what does done look like. The status flips to <code>planning</code>.</p>

<p>PRD becomes a build when I start writing code. Status: <code>building</code>. The note grows to include architecture decisions, blockers, lessons learned. It's a living document.</p>

<p>When something ships, the note gets archived, but the learnings stay. Status: <code>shipped</code>. I can always go back and understand why I made a specific decision.</p>

<h2>Why flat beats folders</h2>

<p>I don't use folders. Or rather, I barely use them. Everything lives at the root level except stuff in <code>inbox/</code> — which is the holding area for things that haven't been processed yet.</p>

<p>The reason is simple: folders create decisions. "Does this go in /projects or /ideas?" You make the decision, you get it slightly wrong, and now the note is in the wrong place and you can never find it. Wikilinks + tags solve the same problem without the overhead.</p>

<p>Wikilinks are the graph. <code>[[fleet-tui]]</code> connects notes automatically. The graph view isn't just decorative — it shows you which ideas are connected, which projects share dependencies, where your thinking clusters.</p>

<p>Tags are the categories. <code>#building</code>, <code>#ai</code>, <code>#infrastructure</code>. They're searchable. They work across everything. No folder reorganization required.</p>

<h2>The vault constitution</h2>

<p>I have a file called <code>09-vault-constitution.md</code>. It defines the rules. Every AI agent I use reads it before touching the vault. It covers:</p>

<ul>
<li>YAML frontmatter format (id, title, created, modified, tags, topics, refs, aliases)</li>
<li>What atomic means — one concept per note, not one topic</li>
<li>Wikilink conventions</li>
<li>What goes in <code>inbox/</code> vs root level</li>
<li>How to update index notes (<code>00-*.md</code>)</li>
</ul>

<p>This isn't bureaucracy. It's the spec that makes the vault machine-readable. Without it, agents would create notes that look different from mine, use inconsistent frontmatter, and break the graph structure.</p>

<h2>How agents read the vault</h2>

<p>The agent context includes the vault path and the constitution. When I ask it to find something, it searches the vault. When I ask it to create a note, it reads the constitution first, then creates a note that matches the spec.</p>

<p>The real power is this: my agent knows about my ongoing projects, past decisions, and current thinking — not because I brief it each session, but because it reads the vault. The vault is the brief. The vault is the shared state between me and every agent I run.</p>

<p>When I'm working on Fleet TUI and I want to understand a past architectural decision, I ask. The agent reads the relevant notes and tells me what past-me was thinking. It's like having access to your own reasoning across time.</p>

<h2>Why structure compounds</h2>

<p>Here's the thing nobody tells you about building systems like this: the benefits compound slowly, then fast.</p>

<p>Month one, it's more work than just writing stuff down randomly. You're building the habit, the template, the constitution. It feels like overhead.</p>

<p>Month six, it starts paying off. You can find anything. You can trace the history of any idea. Agents can operate effectively in your vault because everything is consistent.</p>

<p>Month twelve, it's genuinely different. Your vault isn't just notes — it's an executable specification of how you think. New agents, new tools, even future versions of yourself can read it and understand what you were building and why.</p>

<p>The structure creates a foundation that future intelligence can stand on. That's the whole point.</p>`,
  },
  {
    title: "Fleet Architecture: Running 4 AI Agents on a Mac Mini",
    slug: "fleet-architecture-mac-mini",
    date: "2026.02.26",
    excerpt: "A generalist, a builder, a researcher, and an ops agent — all running on a single M4 Mac Mini. Here's the architecture, the failures, and what actually works.",
    tags: ["AGENTS", "MACOS", "DISTRIBUTED"],
    readTime: "15 min",
    category: "BUILDS",
    signal: 91,
    content: `<p>The M4 Mac Mini is doing a lot of work. Four AI agents, always-on, always listening. One is the main one I talk to. One builds things. One researches. One keeps the lights on.</p>

<p>This is how it's actually set up — not the idealized version, the real one.</p>

<h2>The four archetypes</h2>

<p><strong>Generalist (Claw / Main).</strong> This is the one I talk to. Handles everything I throw at it day-to-day. Reading the vault, writing code, sending messages, managing files. It has the broadest access and the most context. Runs on claude-sonnet by default, escalates to opus for hard reasoning tasks.</p>

<p><strong>Builder.</strong> Dedicated to coding tasks. Gets spawned when there's a proper build to do — a new feature, a refactor, a multi-file change. Runs with bypassPermissions because it needs to move fast without approval prompts slowing it down. Claude Code under the hood.</p>

<p><strong>Researcher.</strong> Deep research tasks get dispatched here. When I need a multi-source synthesis or a proper written report, the main agent sends a RESEARCH_DISPATCH message to the researcher. It runs deeper searches, processes more tokens, takes longer. Worth it for the quality.</p>

<p><strong>Ops.</strong> Monitoring, health checks, cron tasks. Checks email, calendar, system status. Runs on the cheapest model that can handle the task — usually GLM-5 Turbo. It doesn't need to be brilliant, just reliable and cheap.</p>

<h2>Discord integration</h2>

<p>Every agent has its own Discord channel. That's how I control them and how they report back. Claw is in the main chat. Builder posts to #builds. Researcher posts to #research. Ops posts to #ops.</p>

<p>Why Discord? Because it's persistent, it works on every device, and I've already got it open. I don't need a separate app to manage the fleet. The agents are just another set of participants in my Discord server.</p>

<p>Inter-agent communication goes through internal sessions, not Discord. The main agent can send instructions to the builder via sessions_send. Discord is the human-facing interface; the session bus is the agent-facing one.</p>

<h2>Fallback chains</h2>

<p>Model routing matters a lot when you're running agents all day. My fallback chain looks like this:</p>

<p>GLM-5 Turbo → OpenRouter (mixed) → Claude Sonnet → Claude Opus</p>

<p>Routine tasks hit GLM-5. If GLM-5 can't handle it or errors, fall back to OpenRouter. Hard reasoning tasks go straight to Sonnet. Genuinely difficult stuff gets Opus.</p>

<p>The ops agent almost never leaves GLM-5. The main agent uses Sonnet for most things. Builder uses whatever is appropriate for the complexity of the task.</p>

<h2>Session isolation</h2>

<p>Each agent is its own session with its own context. They don't share memory except through files. The vault is the shared state. If the main agent wants the builder to know about something, it writes it to a file in a shared location or sends it in the dispatch message.</p>

<p>This isn't a limitation — it's a feature. Isolated sessions mean agent failures are contained. If the builder crashes or does something dumb, it doesn't corrupt the main agent's context.</p>

<h2>What works</h2>

<p>The specialization model works. Having a dedicated builder that runs fast and doesn't ask questions is genuinely useful. Having a researcher that takes its time and produces quality output is genuinely useful. Mixing all of that into one agent made it mediocre at everything.</p>

<p>Discord as the control plane works. Low friction, always available, persistent history.</p>

<p>The vault as shared state works. Agents don't need to be briefed — they read the context.</p>

<h2>What doesn't</h2>

<p>Inter-agent coordination is still janky. The dispatch protocol is manual. I'm thinking about ways to make agents more proactively aware of each other.</p>

<p>The builder needs babysitting on long tasks. It'll go off in the wrong direction if the initial spec isn't precise. I've burned tokens on this.</p>

<p>Cost is real. Four agents, always-on, adds up. The ops agent is cheap. The researcher is not. You need to be deliberate about what gets routed where.</p>

<p>But overall? The fleet architecture works. The M4 Mini handles it without breaking a sweat. Running four agents on Apple Silicon in 2026 is honestly sick. I don't take that for granted.</p>`,
  },
  {
    title: "Token Economics: Spending $0.47/day on AI That Actually Works",
    slug: "token-economics",
    date: "2026.02.14",
    excerpt: "Model routing, fallback chains, local inference on Apple Silicon. How to stop bleeding money on API calls without sacrificing capability.",
    tags: ["LLM", "OPTIMIZATION", "COST"],
    readTime: "10 min",
    category: "OPTIMIZATION",
    signal: 76,
    content: `<p>$0.47 a day. That's what running an always-on AI agent fleet costs me on average. Some days it's $0.20. Some days it's $1.20 if there's a big research job or a long build. But the average is well under a dollar.</p>

<p>Here's how that's possible without running trash models that can't do anything useful.</p>

<h2>The actual numbers</h2>

<p>My daily spend breaks down roughly like this:</p>

<ul>
<li>Ops agent (GLM-5 Turbo): ~$0.02/day. It handles heartbeats, monitoring, routine checks. Basically free.</li>
<li>Main agent (mixed routing): ~$0.20/day. Most of my casual conversations and file operations. Mix of GLM-5 and Sonnet depending on complexity.</li>
<li>Research dispatches: ~$0.15/day average. These are the expensive ones — long context, multiple sources, synthesis. But I don't run them constantly.</li>
<li>Builder agent: ~$0.10/day average. Depends heavily on whether there's an active build happening.</li>
</ul>

<p>Total: roughly $0.47/day. About $14/month. For always-on agents that manage my infrastructure.</p>

<h2>The fallback chain</h2>

<p>The secret is model routing. Not every task needs Claude Opus. Most don't need Claude at all.</p>

<p>My chain: <strong>GLM-5 Turbo → OpenRouter mixed → Claude Sonnet → Claude Opus</strong></p>

<p>GLM-5 Turbo is incredibly cheap and good enough for maybe 60% of what agents actually do day-to-day. Reading files, formatting outputs, simple reasoning, status checks. It handles all of that fine.</p>

<p>OpenRouter gives me access to a bunch of mid-tier models. Llama 3, Mistral, others. When I need something a step up from GLM-5 but don't need Claude, OpenRouter fills the gap.</p>

<p>Sonnet is the main workhorse for actual reasoning tasks. Most of my substantive conversations with the main agent. Strong model, reasonable cost.</p>

<p>Opus is reserved for genuinely hard stuff. Complex architectural decisions, long-context synthesis, anything where being wrong is expensive. I use it probably once a day if that.</p>

<h2>Local inference on Apple Silicon</h2>

<p>I've got Ollama running on the M4 Mini. A few models cached locally — mostly for experimentation and for tasks where latency matters more than quality.</p>

<p>Honest take: local inference on Apple Silicon is impressive but not competitive with frontier models for most tasks. Useful for specific cases, not a full replacement. The economics favor cloud for anything non-trivial because the token throughput is lower locally.</p>

<p>That said, for tasks that are genuinely repetitive and low-complexity — format this file, summarize this short text, check this syntax — local is fine and costs nothing.</p>

<h2>API vs subscription math</h2>

<p>The subscription services (Claude.ai Pro, ChatGPT Plus) run $20-25/month each. For the way I use AI, they're worse value than API pricing.</p>

<p>Why? Because subscriptions give you more of one thing (convenience, higher limits on their web UI) while API gives you programmability. I don't use the web UI. I use the API. So I only pay for what I use, and I route intelligently.</p>

<p>If you use AI primarily through browser interfaces, subscriptions make sense. If you're running agents programmatically, API + smart routing is almost always cheaper.</p>

<h2>What actually eats tokens</h2>

<p>Context length is the main cost driver, not just raw usage. A 10-turn conversation with a big context window costs way more than 10 single-turn queries.</p>

<p>My agents are designed to be context-efficient. The ops agent summarizes rather than retains full history. The builder gets a clean context for each task rather than a long shared history. The researcher processes documents with chunking rather than loading entire PDFs as context.</p>

<p>These choices compound. Over a month, efficient context management probably saves me $5-10 versus running the same workload naively.</p>

<p>$0.47/day. That's not magic. It's just being deliberate about what you're paying for and what you're not.</p>`,
  },
  {
    title: "Building in Public When the Public Doesn't Exist Yet",
    slug: "building-in-public",
    date: "2026.01.28",
    excerpt: "The audience for human-AI collaboration infrastructure is approximately 400 people worldwide. I'm building for the other 8 billion who'll need it in 18 months.",
    tags: ["PHILOSOPHY", "BUILDING", "FUTURE"],
    readTime: "6 min",
    category: "THOUGHTS",
    signal: 82,
    content: `<p>There are maybe 400 people in the world who care about what I'm building right now. Not 400,000. Four hundred.</p>

<p>The infrastructure for human-AI collaboration — autonomous agents, persistent memory systems, fleet orchestration, voice-to-context pipelines — it's a niche inside a niche. Most people don't know they need it. Most people who've heard of AI agents haven't tried running them at home. Most people who've tried haven't gotten past asking ChatGPT to write their emails.</p>

<p>I'm building for the other 8 billion. The ones who don't exist yet as customers, but will.</p>

<h2>Building 18 months out</h2>

<p>There's a specific way I think about timelines. I don't build for what models can do today. I build for what models will be able to do in 18 months, with the infrastructure I'm building now.</p>

<p>That sounds like speculation, but it's actually pretty concrete. Today's agents are capable but clunky. They need good scaffolding, clear context, precise instructions. In 18 months, they'll need less hand-holding. But they'll still need the scaffolding — the file systems, the vault structures, the dispatch protocols, the session isolation patterns.</p>

<p>The rails I'm building now? Future models will fly on them. Current models stumble along. Both cases benefit from the same well-built infrastructure.</p>

<h2>The "audience of 400" problem</h2>

<p>Building in public with a tiny audience is philosophically weird. You're posting into a near-void. The engagement is low. The validation loop is basically nonexistent.</p>

<p>But I don't think building in public is primarily about audience size. It's about accountability and clarity. When you have to explain what you're building and why, you understand it better yourself. The act of writing forces precision that thinking alone doesn't.</p>

<p>And the 400 people who do care? They're usually very good. Early adopters in a technical niche are often people who are themselves building things, have thought about the problem deeply, and will give you useful feedback rather than noise.</p>

<p>Small audience, high signal. I'll take that over a large audience of people who'll forget what they read in 20 minutes.</p>

<h2>Why infrastructure > apps</h2>

<p>Apps are features. Infrastructure is foundations. I'm not interested in building apps that solve a specific problem right now. I'm interested in building the substrate that makes a whole category of future apps possible.</p>

<p>The Obsidian vault system isn't an app. It's a pattern — a way of structuring information that works for humans and machines simultaneously. Fleet TUI isn't an app. It's an interface pattern for a category of tool that barely exists yet.</p>

<p>Infrastructure bets are longer-term, higher-risk, slower to show value. But when they work, they work for a long time and they work for a lot of things.</p>

<p>I genuinely don't know which specific apps will get built on top of what I'm building. But I'm pretty sure the apps will come, and I'm pretty sure whoever builds them will want a foundation that already exists.</p>

<p>Four hundred people today. A lot more in 18 months. That's the bet.</p>`,
  },
  {
    title: "Tailscale Mesh + Agent Army = Distributed Brain",
    slug: "tailscale-agent-mesh",
    date: "2026.01.12",
    excerpt: "Connecting 3 machines into a single cognitive mesh. The agent on my Linux box can ask the agent on my Mac Mini to look something up, and neither needs to know where the other lives.",
    tags: ["NETWORKING", "AGENTS", "TAILSCALE"],
    readTime: "9 min",
    category: "INFRASTRUCTURE",
    signal: 85,
    content: `<p>Three machines. One brain.</p>

<p>M4 Mac Mini (32GB) is the primary. M1 Mac Mini (8GB) is the secondary server. MacBook Pro running Omarchy Linux (i9, 32GB) is the Linux workstation. All connected via Tailscale. All running agents. All talking to each other.</p>

<p>Here's how I set it up and what actually works.</p>

<h2>Why Tailscale</h2>

<p>I wanted zero-friction connectivity between machines. Not SSH tunnels, not VPN configs, not port forwarding. Just "these machines can see each other" everywhere, including when I'm mobile.</p>

<p>Tailscale delivers that. Install it on each machine, add them to a tailnet, and they get stable IP addresses that work everywhere. The M4 Mini is always reachable at the same address whether I'm on my home network, at a café, or routed through a VPS somewhere.</p>

<p>For agents specifically, this means the agent on machine A can call an API endpoint on machine B using a stable address. No DNS drama, no dynamic IPs, no NAT headaches.</p>

<h2>The mesh setup</h2>

<p>Each machine runs the OpenClaw gateway. The gateway exposes an HTTP API that agents use to communicate. Tailscale makes those gateways mutually accessible.</p>

<p>M4 Mini: Primary gateway, main agent (Claw), builder agent. This machine is always on, always connected, has the most RAM for running multiple models.</p>

<p>M1 Mini: Secondary gateway, ops agent. Lower priority tasks, monitoring, cron jobs. The 8GB limit means I don't run heavy models here, but GLM-5 and basic routing are fine.</p>

<p>MacBook Pro (Linux): Builder's machine when I'm at the desk working. The i9 has good single-core performance for coding tasks, and I like having a dedicated Linux environment for testing Linux-specific stuff. Agent here can access the same Tailscale addresses as the others.</p>

<h2>Agent-to-agent communication</h2>

<p>The main agent on the M4 Mini can dispatch tasks to the ops agent on the M1 Mini. The protocol is simple: a DISPATCH message via the session bus, which routes through the tailnet to the target gateway.</p>

<p>The receiving agent doesn't need to know it came from a different machine. From its perspective, it got a task. It executes the task. It reports back. The network layer is transparent.</p>

<p>This is genuinely useful for offloading. If I'm running a big build on the M4 and I also want research done, I can push the research dispatch to the M1 instead of competing for resources on the primary machine.</p>

<h2>Practical networking setup</h2>

<p>A few things that made it work well:</p>

<p>Set hostnames in Tailscale that are meaningful. <code>m4-mini</code>, <code>m1-mini</code>, <code>mbp-linux</code>. Not the default random names. When you're reading logs and something mentions a host, you want to know immediately which machine it is.</p>

<p>Use Tailscale ACLs to define what can talk to what. Not everything should be able to reach everything. The ops agent doesn't need to talk to the builder's gateway directly.</p>

<p>Exit nodes are useful. The M4 Mini can serve as an exit node, which means any of my mobile devices can route through it. Useful for accessing home network resources when I'm out.</p>

<h2>What works, what doesn't</h2>

<p>Latency is fine. We're talking sub-10ms between machines on the same home network. Even over the internet it's usually under 50ms. Not a bottleneck for agent operations.</p>

<p>Reliability is excellent. Tailscale just works. I haven't had a connectivity failure that wasn't a machine actually being off or a model API being down.</p>

<p>The mental model of "one brain across machines" is mostly true but breaks down when you think about state. Each agent has its own context, its own session history. The shared state is the vault and whatever files I put in shared locations. The agents aren't telepathic — they're just well-connected.</p>

<p>Cross-machine builds are possible but I've been cautious. Having the builder on one machine compile and test on another introduces complexity I haven't fully worked out yet. For now, builds happen on one machine.</p>

<p>Three machines, one tailnet, agents on each. It's a distributed brain in the sense that matters: multiple instances of intelligence, working on different things, able to coordinate when needed. Cool shit, honestly.</p>`,
  },
];
