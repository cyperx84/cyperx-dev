export interface Project {
  name: string;
  slug: string;
  tagline: string;
  description: string;
  longDescription: string;
  stack: string[];
  status: string;
  statusColor: string;
  entropy: number;
  links: {
    github: string | null;
    live: string | null;
  };
}

export const projects: Project[] = [
  {
    name: "OpenClaw Agent Fleet",
    slug: "openclaw-fleet",
    tagline: "4 autonomous AI agents on a single Mac Mini",
    description: "Distributed fleet of AI agents — a generalist, builder, researcher, and ops agent — all running on Apple Silicon. Tailscale mesh networking, Discord integration, automatic failover chains, and inter-agent orchestration.",
    longDescription: `<p>OpenClaw is the runtime that powers my agent fleet. It's an always-on, multi-agent orchestration layer that runs on the M4 Mac Mini and ties together everything I do with AI.</p>

<p>The idea started simple: I wanted one AI agent that was always running, had access to my tools, and could be controlled via Discord. It turned into four agents, a Tailscale mesh, a vault system, and a fleet architecture that I genuinely use every day.</p>

<h2>The problem it solves</h2>

<p>Before this, every time I wanted AI help I was opening a browser tab, pasting context, getting a response, closing the tab. Zero continuity. Zero tool access. Zero ability to run things in the background.</p>

<p>I wanted agents that persisted. That had access to my files, my calendar, my git repos. That could dispatch work to each other. That I could reach via Discord from anywhere.</p>

<h2>How it works</h2>

<p>Each agent is a long-running session with its own identity, context, and tool set. The main agent (Claw) handles my day-to-day. The builder spawns when there's code to write. The researcher handles deep research dispatches. The ops agent does monitoring and cron-based tasks.</p>

<p>They communicate via the OpenClaw session bus — an internal message queue that routes task dispatches between agents. Human-facing communication goes through Discord. File-based state (the vault, shared configs) is the shared memory layer.</p>

<p>Model routing is built in. Most tasks hit GLM-5 Turbo for cost efficiency. Hard reasoning escalates to Claude Sonnet or Opus. The fallback chain is configurable per agent.</p>

<h2>Current status</h2>

<p>Active and in daily use. The architecture is mostly stable. I'm iterating on inter-agent coordination and working on better tooling for fleet observability. The TUI dashboard (Fleet TUI) is a direct response to wanting better visibility into what all four agents are actually doing.</p>

<h2>Stack notes</h2>

<ul>
<li><strong>TypeScript</strong> — OpenClaw core is TS. Type safety matters when you're building something that has access to your entire machine.</li>
<li><strong>OpenClaw runtime</strong> — The thing that makes all of this possible. Gateway, session bus, plugin system, tool registry.</li>
<li><strong>Tailscale</strong> — The networking layer. Makes agents on different machines mutually accessible without any infrastructure pain.</li>
<li><strong>Discord.js</strong> — Control plane for human-agent interaction. Persistent, available everywhere, already where I spend time.</li>
</ul>`,
    stack: ["TypeScript", "OpenClaw", "Tailscale", "Discord.js"],
    status: "ACTIVE",
    statusColor: "#39FF14",
    entropy: 94,
    links: { github: "https://github.com/openclaw/openclaw", live: null },
  },
  {
    name: "Fleet TUI",
    slug: "fleet-tui",
    tagline: "Real-time terminal dashboard for agent fleets",
    description: "Go/Bubbletea TUI for monitoring agent sessions, error feeds, and gateway health. Tokyo Night palette, vim keybinds, live session logs, kill/restart controls. Zero inference — reads raw JSON and logs.",
    longDescription: `<p>Fleet TUI is a terminal dashboard for monitoring agent fleets in real time. It's how I know what my four agents are doing without having to scroll through Discord or tail log files manually.</p>

<h2>The problem</h2>

<p>Four agents running concurrently means four log streams, four session states, four potential failure modes. Checking on them was painful — different terminal windows, different log files, no unified view of fleet health.</p>

<p>I wanted something that showed me everything at a glance. Session status, recent log output, error counts, gateway health. Without having to switch context to check it.</p>

<h2>How it works</h2>

<p>The TUI reads directly from OpenClaw's JSON log files and the gateway's health endpoints. Zero inference — it's not calling any models, just parsing structured data and rendering it. This keeps it cheap to run and fast to respond.</p>

<p>Layout: left panel is session list with status indicators. Center is the active session log feed. Right panel is gateway health metrics. Bottom bar is keybind hints.</p>

<p>Vim keybinds throughout. j/k to navigate sessions, enter to focus, q to quit. It feels natural if you spend time in the terminal.</p>

<p>You can kill and restart sessions directly from the TUI. That's the most useful feature — when an agent gets stuck or crashes, I don't have to go find the right command. Just navigate to the session and hit the key.</p>

<h2>Current status</h2>

<p>Shipped and in daily use. The core features are stable. I'm considering adding a command input panel so I can send quick messages to agents directly from the TUI without switching to Discord.</p>

<h2>Stack notes</h2>

<ul>
<li><strong>Go</strong> — Perfect language for a TUI. Fast, single binary, great concurrency story for reading multiple log streams simultaneously.</li>
<li><strong>Bubbletea</strong> — Elm-architecture TUI framework. Makes complex UI state manageable. The best Go TUI option by a wide margin.</li>
<li><strong>Lipgloss</strong> — Styling layer for Bubbletea. Handles the Tokyo Night color palette, borders, padding. Works well.</li>
</ul>`,
    stack: ["Go", "Bubbletea", "Lipgloss"],
    status: "SHIPPED",
    statusColor: "#AC89FF",
    entropy: 88,
    links: { github: "https://github.com/cyperx84/fleet-tui", live: null },
  },
  {
    name: "CyperX.dev",
    slug: "cyperx-dev",
    tagline: "This website. Three themes. Zero restraint.",
    description: "Personal site built with Astro. Dark, light, and extreme theme variants generated from Google Stitch designs. Neo-brutalist glitch aesthetic with liquid shard layouts.",
    longDescription: `<p>This website. The one you're reading right now. Three themes, zero compromise on the weird aesthetic choices.</p>

<h2>Why it exists</h2>

<p>I wanted a place to put the projects and writing that didn't look like every other developer portfolio on the internet. The dark-mode minimalist thing is fine, but it's everywhere. I wanted something that felt like it was from a slightly different reality.</p>

<p>Also, I wanted to actually understand Astro. The best way to learn a framework is to build something real with it.</p>

<h2>How it works</h2>

<p>Three theme variants — dark, light, extreme — controlled by a theme toggle. CSS classes on the root element switch which variant is visible. The extreme theme is the one with the glitch effects, fractal backgrounds, and vibrating text. It's a lot.</p>

<p>The design started in Google Stitch (AI-assisted design tool) and got translated to hand-written Tailwind and custom CSS. The shard clip-paths, the glitch animations, the melt effects — all custom keyframes and clip-path polygons.</p>

<p>Content is static. Blog posts and project pages are Astro dynamic routes pulling from TypeScript data files. Build output is just HTML, CSS, and a tiny JS theme toggle script. Deploys to Cloudflare Pages in under a minute.</p>

<h2>Current status</h2>

<p>Always building. This site will never be "done" — I keep adding things when I build new projects or write something worth posting. The architecture is stable; the content keeps growing.</p>

<h2>Stack notes</h2>

<ul>
<li><strong>Astro</strong> — Static site generator with islands architecture. Zero JS by default, opt in when you need it. Perfect for a mostly-static site with a theme toggle.</li>
<li><strong>Tailwind</strong> — Utility CSS. The extreme variant has a lot of custom CSS that Tailwind doesn't cover, but Tailwind handles the layout and spacing.</li>
<li><strong>Google Stitch</strong> — AI design tool used for initial concept generation. The output isn't production-ready but it's a good starting point for visual direction.</li>
</ul>`,
    stack: ["Astro", "Tailwind", "Google Stitch"],
    status: "BUILDING",
    statusColor: "#FF51FA",
    entropy: 76,
    links: { github: null, live: "https://cyperx.dev" },
  },
  {
    name: "Personal OS",
    slug: "personal-os",
    tagline: "Obsidian vault as an actual operating system",
    description: "A system for capturing and executing ideas autonomously. Pipelines flow from ideas → PRDs → builds → ship. Agents read the vault, execute tasks, and report back. The vault is shared context for humans AND AI.",
    longDescription: `<p>Personal OS is what I call the system built around my Obsidian vault. It's not just note-taking — it's an operating system for thinking and building.</p>

<h2>The problem</h2>

<p>Ideas are worthless if they don't go anywhere. I had the usual problem: capture everything, execute nothing. Good note-taking system, bad execution system. Things went into the vault and stayed there.</p>

<p>The insight was that the vault needed a pipeline, not just a structure. A clear path from "I had an idea" to "I shipped a thing."</p>

<h2>How it works</h2>

<p>Everything flows through four stages: <strong>Ideas → PRDs → Builds → Ship</strong>.</p>

<p>Ideas are atomic notes with a status field. When I decide to act on something, the status moves to <code>planning</code> and I write a lightweight PRD in the note itself. When code starts, status is <code>building</code>. When it ships, the note gets archived with lessons learned.</p>

<p>The vault constitution (a dedicated rules note) defines the schema. Every note follows the same YAML frontmatter format. This isn't bureaucracy — it's what makes the vault machine-readable by AI agents.</p>

<p>Agents read the vault as their context. They don't need to be briefed on what I'm working on — the vault tells them. They can create notes, update status fields, link related ideas. The vault is the shared brain between me and every agent I run.</p>

<h2>Current status</h2>

<p>Active. The pipeline model is working. The vault has real continuity across projects. Agents are integrated and the pattern is stable. I'm working on better indexing for faster agent lookups and more automated status tracking.</p>

<h2>Stack notes</h2>

<ul>
<li><strong>Obsidian</strong> — The note-taking app underneath. Sync via iCloud, works on mobile, Neovim plugin for terminal editing.</li>
<li><strong>Markdown</strong> — Plain text foundation. Everything is a .md file. Future-proof, portable, readable without the app.</li>
<li><strong>OpenClaw</strong> — The agent runtime that reads and writes to the vault. The intelligence layer on top of the file system.</li>
<li><strong>YAML</strong> — Frontmatter format. Structured metadata in every note. This is what makes notes queryable and machine-readable.</li>
</ul>`,
    stack: ["Obsidian", "Markdown", "OpenClaw", "YAML"],
    status: "ACTIVE",
    statusColor: "#39FF14",
    entropy: 91,
    links: { github: null, live: null },
  },
  {
    name: "Voice Forge",
    slug: "voice-forge",
    tagline: "Voice cloning pipeline for agent TTS",
    description: "Automated pipeline that captures voice messages, transcribes with Whisper, builds a corpus, and trains voice models. Gives AI agents a real voice instead of generic TTS.",
    longDescription: `<p>Voice Forge is a pipeline for giving AI agents a real voice — specifically, my voice. Instead of agents responding with generic TTS, they can speak in a cloned voice that sounds like an actual person.</p>

<h2>The problem</h2>

<p>Generic TTS sounds like a robot. It's fine for reading back short pieces of information, but for anything conversational it breaks immersion immediately. I wanted agents that sounded human when they talked back to me.</p>

<p>The solution was voice cloning. Train a model on real voice data, use that model for inference. The quality is genuinely good now — close enough that you'd have to be paying close attention to notice.</p>

<h2>How it works</h2>

<p>The pipeline has four stages:</p>

<p><strong>Capture:</strong> Voice messages from various sources (mostly Discord voice notes and recorded sessions) get collected into the corpus directory.</p>

<p><strong>Transcribe:</strong> Whisper processes each audio file and generates transcripts. Clean transcripts are required for good voice model training — garbage in, garbage out.</p>

<p><strong>Corpus build:</strong> Audio files get cleaned (noise removal, normalization, silence trimming with FFmpeg), paired with their transcripts, and structured into the training format.</p>

<p><strong>Train/Fine-tune:</strong> ElevenLabs gets the corpus and produces a cloned voice model. This is the slow step — takes time to process. But you only do it occasionally as you add more corpus data.</p>

<p>Inference is fast. The trained model handles real-time TTS at reasonable quality.</p>

<h2>Current status</h2>

<p>Version 3. The core pipeline is stable. V1 was manual. V2 added automation. V3 improved corpus quality with better audio preprocessing and transcript cleaning. Quality improved noticeably between V2 and V3.</p>

<h2>Stack notes</h2>

<ul>
<li><strong>Python</strong> — Pipeline scripting. Good ecosystem for audio processing, Whisper integration, API calls.</li>
<li><strong>Whisper</strong> — OpenAI's transcription model, running locally. High quality transcription without API costs.</li>
<li><strong>ElevenLabs</strong> — Voice cloning and TTS inference. Currently the best option for quality voice cloning at reasonable cost.</li>
<li><strong>FFmpeg</strong> — Audio preprocessing. Normalization, format conversion, silence trimming, noise reduction. Essential for corpus quality.</li>
</ul>`,
    stack: ["Python", "Whisper", "ElevenLabs", "FFmpeg"],
    status: "v3",
    statusColor: "#AC89FF",
    entropy: 82,
    links: { github: null, live: null },
  },
  {
    name: "Changelogs.info",
    slug: "changelogs-info",
    tagline: "Aggregated release notes for dev tools",
    description: "OpenClaw subdomain with neo-brutalist theme. Changelog aggregation, cheatsheets, and config reference. Built to make release tracking less painful.",
    longDescription: `<p>Changelogs.info is a site for tracking what actually changed in the dev tools I use. Specifically AI coding tools — Claude Code, Codex, Gemini CLI, OpenCode — plus whatever else I'm integrating at any given time.</p>

<h2>The problem</h2>

<p>These tools ship fast. Claude Code drops a new version and the changelog is buried in a GitHub release, or there's a brief mention in a Discord announcement somewhere. Keeping up is annoying.</p>

<p>I wanted one place to see what changed across all the tools I care about, without having to go check four different repos and accounts.</p>

<h2>How it works</h2>

<p>The site aggregates changelog data from GitHub's releases API. Each tool has a configured source — org/repo, release tag pattern, the works. A background job runs periodically and pulls new releases, parses the release notes, and updates the site's data.</p>

<p>Beyond raw changelogs, the site also has cheatsheets and config references for the tools — the stuff I find myself looking up constantly. Less "what changed in this release" and more "what's the flag for X again."</p>

<p>The design matches the rest of my stuff — neo-brutalist, high contrast, a bit aggressive. Different from Changelogs.info subdomain on OpenClaw but sharing aesthetic DNA.</p>

<h2>Current status</h2>

<p>Running locally, not yet deployed publicly. The core functionality works — changelog aggregation is solid. I want to clean up the UI and sort out the hosting before I open it up properly.</p>

<h2>Stack notes</h2>

<ul>
<li><strong>Astro</strong> — Same as cyperx.dev. Static generation with dynamic data pull at build time. Fast and easy to deploy.</li>
<li><strong>Tailwind</strong> — Layout and utilities. The design is simpler than cyperx.dev but the same tooling.</li>
<li><strong>GitHub API</strong> — Data source for release notes. The releases endpoint gives structured changelog data. Rate limits are manageable with a reasonable polling interval.</li>
</ul>`,
    stack: ["Astro", "Tailwind", "GitHub API"],
    status: "LOCAL",
    statusColor: "#FF51FA",
    entropy: 68,
    links: { github: "https://github.com/cyperx84/changelogs-info", live: null },
  },
];
