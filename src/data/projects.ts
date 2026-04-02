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
  image?: string;
  links: {
    github: string | null;
    live: string | null;
  };
}

export const projects: Project[] = [
  {
    name: "CyperX.dev",
    slug: "cyperx-dev",
    image: "/images/projects/cyperx-dev.jpg",
    tagline: "Personal site. Three themes. Zero restraint.",
    description: "Neo-brutalist personal site built with Astro. Dark, light, and extreme theme variants. Scroll effects, glitch aesthetics, liquid shard layouts.",
    longDescription: `<p>This is the site you're on right now. Three themes, zero compromise, and a deliberate rejection of every safe design choice in the developer portfolio playbook.</p>

<h2>Why three themes</h2>

<p>Most sites pick a palette and call it done. I wanted the design itself to be a statement — dark for readability, light for accessibility, and extreme for the people who want their screen to feel like it's alive. Each theme isn't just a color swap. The extreme variant has glitch effects, fractal backgrounds, vibrating text, and clip-path polygon layouts that make the page feel like it's being rendered by a machine that's slightly losing its mind. The dark theme is clean and terminal-native. The light theme is editorial and magazine-influenced. Three different design languages coexisting in one codebase.</p>

<p>The decision to build three wasn't about feature creep — it was about proving that Astro's static architecture could handle radically different visual identities without any JavaScript framework overhead. CSS classes on the root element, a tiny theme toggle script, and everything else is just HTML and CSS doing what they were designed to do.</p>

<h2>Design process</h2>

<p>The initial concepts were generated in Google Stitch — Anthropic's AI-assisted design tool. Stitch is good at establishing visual direction quickly, but its output isn't production-ready. The shard clip-paths, the liquid polygon layouts, the glitch keyframe animations — all of that was hand-written in Tailwind utilities and custom CSS. Stitch gave me the mood. I gave it the engineering.</p>

<p>The clip-path polygons are what give the site its distinctive angular aesthetic. Instead of rounded corners and soft gradients, elements are sliced at aggressive angles using <code>clip-path: polygon()</code>. Combined with the neon color palette (#39FF14, #FF51FA, #AC89FF), it creates something that looks like a terminal interface designed by someone who grew up on cyberpunk anime.</p>

<h2>How it works</h2>

<p>Content is static. Blog posts and project pages are Astro dynamic routes pulling from TypeScript data files and markdown content collections. Scroll animations use IntersectionObserver — no scroll libraries, no dependencies, just the browser API watching elements enter the viewport and applying CSS transitions. Build output is pure HTML, CSS, and a minimal JS theme toggle.</p>

<p>Deploys to Cloudflare Pages in under a minute. Push to main, Cloudflare builds it, the site is live. No Docker, no CI pipeline, no infrastructure to manage. Astro's static output is tiny — the entire site compresses to almost nothing.</p>

<h2>Why Astro</h2>

<p>Zero JavaScript by default. Islands architecture means I opt in to interactivity only where I need it (the theme toggle). Everything else is server-rendered at build time. For a site that's fundamentally about presenting content with aggressive styling, this is the perfect framework. No hydration tax. No client-side routing overhead. Just fast, static pages that load instantly.</p>

<h2>Current status</h2>

<p>Always building. This site will never be "done" — it grows every time I ship a new project or write something worth posting. The architecture is stable and the content keeps expanding.</p>

<ul>
<li><strong>Astro</strong> — Static site generator with islands architecture. Zero JS by default.</li>
<li><strong>Tailwind</strong> — Utility CSS for layout, spacing, and responsive design. Custom CSS handles the weird stuff Tailwind can't.</li>
<li><strong>TypeScript</strong> — Type-safe data files and content schemas.</li>
<li><strong>Cloudflare Pages</strong> — Hosting and CDN. Sub-minute deploys from git push.</li>
</ul>`,
    stack: ["Astro", "Tailwind", "TypeScript", "Cloudflare Pages"],
    status: "BUILDING",
    statusColor: "#FF51FA",
    entropy: 78,
    links: { github: null, live: "https://cyperx.dev" },
  },
  {
    name: "Dotfiles",
    slug: "dotfiles",
    image: "/images/projects/dotfiles.jpg",
    tagline: "The machine as a living document.",
    description: "A decade of accumulated configuration managed via GNU Stow. Neovim, zsh, tmux, git, macOS defaults — wired to reproduce a working dev environment on fresh hardware in under an hour.",
    longDescription: `<p>A decade of configuration decisions, accumulated one dotfile at a time, managed through GNU Stow and designed to reproduce a fully functional development environment on fresh hardware in under an hour. This isn't a backup — it's infrastructure as code for the personal machine.</p>

<h2>The philosophy</h2>

<p>Dotfiles are the most personal codebase a developer maintains. They encode taste, workflow, muscle memory. Losing them — or worse, not being able to reproduce them on new hardware — means rebuilding years of accumulated decisions from scratch. That's unacceptable. The repository treats the machine itself as a living document: every configuration choice is tracked, versioned, and reproducible.</p>

<p>The goal isn't just backup. It's declarative environment management. Run the bootstrap script, wait, and you get a machine that feels exactly like the one you were working on before. Same keybindings, same shell behavior, same editor config, same git aliases. Zero "oh right, I need to set that up" moments.</p>

<h2>GNU Stow: managing complexity</h2>

<p>Stow is the secret weapon. It's a symlink farm manager — it takes directories of config files and symlinks them into the right locations in your home directory. Each tool gets its own directory in the repo (neovim/, zsh/, tmux/, git/), and <code>stow neovim</code> creates all the right symlinks. No copying. No manual path management. Clean separation between tools, clean activation and deactivation.</p>

<p>The alternative — a shell script that copies files around — is fragile. Stow gives you idempotent, reversible operations. Run it twice and nothing changes. Run <code>stow -D neovim</code> and all the symlinks are removed cleanly. It's the right abstraction for the problem.</p>

<h2>What's configured</h2>

<p>The major modules:</p>

<ul>
<li><strong>Neovim</strong> — LazyVim-based config with custom keybindings, LSP setup for TypeScript/Go/Python/Rust, Harpoon for file navigation, Oil for file management, telescope for fuzzy finding. Transparent backgrounds. The editor I live in.</li>
<li><strong>zsh</strong> — Custom prompt (no oh-my-zsh), aliases, path management, completion, vi-mode. Fast startup time is non-negotiable — no plugin managers that add 200ms to shell init.</li>
<li><strong>tmux</strong> — Session management, Navigator integration for seamless vim/tmux pane switching with Ctrl+h/j/k/l, custom status bar.</li>
<li><strong>git</strong> — Aliases, commit templates, delta for diffs, global gitignore.</li>
<li><strong>macOS defaults</strong> — Shell scripts that set system preferences via <code>defaults write</code>. Dock size, key repeat rate, screenshot format, Finder preferences. The stuff you configure once on a new Mac and never want to configure again.</li>
</ul>

<h2>The bootstrap process</h2>

<p>Fresh machine to working environment: clone the repo, run <code>./bootstrap.sh</code>, answer a few prompts, wait for Homebrew to install everything, and Stow to symlink all configs. Under an hour from unboxing to productive. The script is idempotent — running it on an already-configured machine just verifies everything is in place.</p>

<h2>Current status</h2>

<p>Active and evolving. This repo has been maintained for years and will continue as long as I use a Unix-based machine. It's the most stable project I maintain — because it has to be.</p>`,
    stack: ["GNU Stow", "Neovim", "zsh", "tmux", "Shell"],
    status: "ACTIVE",
    statusColor: "#39FF14",
    entropy: 95,
    links: { github: "https://github.com/cyperx84/dotfiles", live: null },
  },
  {
    name: "Changelogs.info",
    slug: "changelogs-info",
    image: "/images/projects/changelogs-info.jpg",
    tagline: "Release notes for tools that ship too fast to track.",
    description: "Changelog aggregation for AI coding tools — Claude Code, Codex, Gemini CLI, OpenCode. Cheatsheets, config references, and what actually changed in each version.",
    longDescription: `<p>AI coding tools ship at a pace that makes tracking changes genuinely difficult. Claude Code drops a new version and the changelog is buried in a GitHub release. Codex updates land without fanfare. Gemini CLI changes flags between versions and the only documentation is a commit message. Changelogs.info exists because I got tired of checking four different repos every week to find out what broke or what's new.</p>

<h2>The problem</h2>

<p>These tools move fast. A new Claude Code release might land three times a week. Each one has release notes somewhere — GitHub releases, Discord announcements, blog posts, changelog files in the repo. No single place aggregates them. If you're using multiple AI coding tools (and most serious developers are), keeping up is a full-time information management problem.</p>

<p>Beyond raw changelogs, there's the reference problem. What's the flag for enabling plan mode? What environment variables does Claude Code respect? What's the config file format for OpenCode? This information exists, but it's scattered across docs, README files, and GitHub issues. I wanted one place where I could look up "how do I configure X in tool Y" without a 10-minute search.</p>

<h2>How it works</h2>

<p>The site pulls changelog data from GitHub's releases API. Each tracked tool has a configured source — org/repo, release tag pattern, parsing rules for the release notes format. A background polling job runs periodically, pulls new releases, parses the notes into structured data, and updates the site's content.</p>

<p>The cheatsheets and config references are manually curated but structured for fast lookup. Organized by tool, then by topic (configuration, flags, environment variables, keyboard shortcuts). Designed to be the page you keep open in a tab while you work.</p>

<p>The design matches the neo-brutalist aesthetic of the rest of my projects — high contrast, aggressive typography, sharp edges. Different site, same visual DNA.</p>

<h2>Technical approach</h2>

<p>Built with Astro, same as cyperx.dev. Static generation with data pulled at build time from the GitHub API. Tailwind for layout. Deployed to Cloudflare Pages. The architecture is deliberately simple — no database, no server, no authentication. Just a static site that rebuilds when there's new data.</p>

<p>The GitHub API rate limits are manageable with reasonable polling intervals. Each tool's releases endpoint gives structured changelog data that parses cleanly into the site's content format. The build step fetches fresh data, generates pages, and deploys. Total build time is under a minute.</p>

<h2>Current status</h2>

<p>Live at changelogs.info. Tracking Claude Code, Codex, Gemini CLI, and OpenCode. Cheatsheets are growing as I document the tools I use daily. The core functionality — changelog aggregation and display — is solid. I'm expanding the cheatsheet coverage and adding config reference pages for each tool.</p>

<ul>
<li><strong>Astro</strong> — Static site generation with dynamic data at build time.</li>
<li><strong>Tailwind</strong> — Layout and utility styles.</li>
<li><strong>GitHub API</strong> — Data source for release notes and changelogs.</li>
<li><strong>Cloudflare Pages</strong> — Hosting with automatic deploys from git push.</li>
</ul>`,
    stack: ["Astro", "Tailwind", "GitHub API", "Cloudflare Pages"],
    status: "LIVE",
    statusColor: "#39FF14",
    entropy: 70,
    links: { github: "https://github.com/cyperx84/changelogs-info", live: "https://changelogs.info" },
  },
];
