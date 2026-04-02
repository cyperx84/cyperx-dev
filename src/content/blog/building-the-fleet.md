---
title: "I Built a 4-Agent AI Fleet on a Mac Mini. Here's What Actually Happened."
slug: "building-the-fleet"
date: "2026.04.02"
excerpt: "Setting up Klaw, Builder, Researcher, and Ops on a single M4 Mac Mini. Shared memory with Mem0. A GPT-5.4 meltdown that sent 377 messages of garbage. And the lessons that came out of cleaning it all up."
tags: ["AGENTS", "OPENCLAW", "BUILDS", "WAR-STORY"]
readTime: "12 min"
category: "BUILDS"
signal: 93
---

This is the real version. Not the cleaned-up architecture diagram, not the polished dev.to post. This is what it actually looked like building a multi-agent fleet from scratch over the last few days — the wins, the disasters, and the stuff I'd do differently if I started over tomorrow.

## The setup

Four agents. One M4 Mac Mini. All running through OpenClaw.

- **Klaw** — the generalist. The one I talk to. Orchestrates the others, handles day-to-day stuff, makes decisions about what gets dispatched where.
- **Builder** — dedicated coding agent. Gets tasks from Klaw, writes code, ships features. Runs with bypassPermissions because stopping to ask "can I edit this file?" every 30 seconds is not how you build things.
- **Researcher** — deep dives. When I need something properly investigated with sources and synthesis, not just a quick web search, it goes here.
- **Ops** — keeps the lights on. Health checks, monitoring, cron tasks, the boring important stuff. Runs on the cheapest model that can handle it.

Each agent has its own Discord channel. That's the human-facing interface — I talk to them there, they report back there. Inter-agent communication happens through OpenClaw's session bus, not through Discord. Clean separation.

The whole thing runs on a single `npm install -g openclaw`. One install. One gateway. Four agents hanging off it.

That last part? That wasn't always the case.

## The consolidation

When I first started, I had three separate OpenClaw installs scattered across the machine. Don't ask how it happened — it was a combination of experimenting, following different setup guides at different times, and the classic "I'll clean this up later" that never gets cleaned up.

Three installs meant three gateways trying to bind to ports, three sets of configs that may or may not be in sync, and a general sense of "which one is actually running right now?" that got old fast.

So I nuked it. Consolidated everything down to one clean global npm install. One config directory at `~/.openclaw/`. One gateway process. Four agent workspaces hanging off that single install.

It sounds simple but it took a full session of untangling. Migrating agent configs, making sure secrets were in the right place, verifying each agent could still reach its Discord channel. The kind of work that isn't hard but is extremely tedious and you absolutely cannot rush.

## Shared memory with Mem0

Here's where it gets interesting. Four agents running independently is fine, but they're way more useful if they can share context. Not just through files in a vault — actual semantic memory that any agent can query.

I set up Mem0 with Qdrant as the vector store and Gemini for embeddings. The idea: any agent can write a memory, and any other agent can search for it. Builder finishes a task and stores what it learned. Researcher finds something important and commits it to shared memory. Klaw can pull context from any of them.

Qdrant runs locally on the Mac Mini. No external dependencies, no API calls for storage. The embeddings go through Gemini which is fast enough and cheap enough for this use case.

The result is a fleet that actually builds shared understanding over time. Builder knows what Researcher found yesterday. Klaw knows what Ops flagged this morning. It's not magic — it's a vector database with good embeddings — but it changes the dynamic from "four isolated agents" to "four agents with a shared brain."

Still early. The memory layer needs tuning — relevance filtering, deduplication, expiry policies. But the foundation is there and it's already useful.

## The GPT-5.4 disaster

Okay. This one.

I tried GPT-5.4 as the model behind Builder for a stretch. OpenAI's latest, figured it'd be great for coding tasks. Fast, capable, all the benchmarks looked good.

It was a fucking nightmare.

377 messages. Three hundred and seventy-seven. In a session that should have been maybe 40 messages, tops. The model just... wouldn't stop. It'd generate a response, decide it wasn't done, generate another one, loop back, repeat. Cross-channel bleed — messages meant for one context showing up in another. Premature "done" claims where it'd announce a task was complete, and then I'd look at the output and it had done maybe 30% of what was asked.

The worst part was the noise. When an agent sends 377 messages, you can't meaningfully review them. The signal-to-noise ratio collapses. You're scrolling through hundreds of messages trying to figure out what actually happened, what was real output vs. the model talking to itself, and whether the thing it said it built actually exists.

I pulled it after that session. Went back to Claude for Builder. The difference was immediate — clean, contained responses. Does the thing, reports what it did, stops. No self-referential loops, no phantom completions.

Lesson learned: benchmarks don't tell you how a model behaves as a persistent agent. A model can ace every coding eval and still be unusable when it needs to operate within a dispatch framework with session boundaries and coordination protocols. Agent behavior is a different axis than raw capability.

## Secrets management (the hard way)

Early on I had API keys in config files that were technically in git-tracked directories. Not committed — `.gitignore` was doing its job — but still. That's not good enough.

The rule now: secrets live in `~/.openclaw/secrets/` and nowhere else. Agent configs reference them by path. Nothing sensitive ever touches a git-tracked directory, not even gitignored. Because gitignore is a convention, not a security boundary. One bad `.gitignore` edit, one `git add -A` without thinking, and your API keys are in commit history forever.

This sounds obvious. It is obvious. I still had to learn it the hard way because "I'll fix this later" is the most dangerous sentence in infrastructure work.

## Tmux-first dispatch

Every coding agent runs in a named tmux session. Every single one. No exceptions.

```bash
tmux new-session -d -s cc-feature 'claude -p --permission-mode bypassPermissions "build the thing"'
```

Why? Because if you spawn a coding agent without tmux, you can't see what it's doing. You can't scroll back through its output. You can't attach to it from another terminal. You can't check on it from your phone over SSH. It's a black box.

With tmux, I can attach to any running agent from anywhere. See exactly what it's working on, what it's outputting, whether it's stuck. After the task completes, I capture the output, confirm it actually did what it said, kill the session. Clean.

The "confirm it actually did what it said" part is critical. That's the GPT-5.4 lesson showing up again. Don't trust the agent's self-report. Check the output. Look at the files. Run the tests. Models will confidently tell you something is done when it absolutely is not.

## Verify before saying done

This became a rule for the whole fleet, not just coding agents. Before any agent reports a task as complete:

1. Check the actual output, not just the agent's summary
2. Run it if it's code
3. Look at the files if it's file operations
4. Confirm the state of the world matches what was claimed

It adds maybe 30 seconds per task. It has saved me hours of debugging phantom completions.

The temptation is to trust the agent because it's usually right. And it is usually right. But "usually" isn't "always", and the cost of a false completion propagating through a multi-agent system is way higher than the cost of a quick verification step.

## The philosophy

I'm not building this for today's models. I'm building it for models six months from now.

Today's agents need scaffolding — clear dispatch protocols, session isolation, explicit verification steps. They're capable but they need guard rails. Six months from now, models will be better. They'll need less hand-holding. But they'll still need the infrastructure.

The session bus doesn't care how smart the model is. The memory layer doesn't care. The tmux dispatch pattern doesn't care. The secrets management doesn't care. These are foundations that get more valuable as models improve, not less.

That's the bet. Build the rails now. Future models will fly on them. Current models stumble along. Both are fine because the infrastructure is the same either way.

## What's next

The fleet is stable. Four agents, one Mac Mini, shared memory, clean dispatch. It works. Not perfectly — the memory layer needs tuning, inter-agent coordination could be smoother, cost optimization is ongoing — but it works.

Next up: better observability. I want a TUI that shows me fleet status at a glance — which agents are active, what they're working on, token spend, memory usage. Right now that's scattered across Discord channels and tmux sessions. I want it in one place.

And more agents. Not because four isn't enough, but because there are clear specializations that would benefit from dedicated context. A dedicated DevOps agent. Maybe a writing agent. The architecture supports it — adding a new agent is just a new workspace and a new Discord channel.

The M4 Mac Mini doesn't break a sweat. That's the genuinely cool part. All of this — four agents, a vector database, embeddings, constant Discord traffic — runs on a $600 desktop computer sitting on my desk. No cloud instances. No GPU rentals. Just Apple Silicon doing its thing.

Pretty damn cool, hey?
