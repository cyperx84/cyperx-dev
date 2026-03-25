---
title: "Fleet Architecture: Running 4 AI Agents on a Mac Mini"
slug: "fleet-architecture-mac-mini"
date: "2026.02.26"
excerpt: "A generalist, a builder, a researcher, and an ops agent — all running on a single M4 Mac Mini. Here's the architecture, the failures, and what actually works."
tags: ["AGENTS", "MACOS", "DISTRIBUTED"]
readTime: "15 min"
category: "BUILDS"
signal: 91
---

The M4 Mac Mini is doing a lot of work. Four AI agents, always-on, always listening. One is the main one I talk to. One builds things. One researches. One keeps the lights on.

This is how it's actually set up — not the idealized version, the real one.

## The four archetypes

**Generalist (Claw / Main).** This is the one I talk to. Handles everything I throw at it day-to-day. Reading the vault, writing code, sending messages, managing files. It has the broadest access and the most context. Runs on claude-sonnet by default, escalates to opus for hard reasoning tasks.

**Builder.** Dedicated to coding tasks. Gets spawned when there's a proper build to do — a new feature, a refactor, a multi-file change. Runs with bypassPermissions because it needs to move fast without approval prompts slowing it down. Claude Code under the hood.

**Researcher.** Deep research tasks get dispatched here. When I need a multi-source synthesis or a proper written report, the main agent sends a RESEARCH_DISPATCH message to the researcher. It runs deeper searches, processes more tokens, takes longer. Worth it for the quality.

**Ops.** Monitoring, health checks, cron tasks. Checks email, calendar, system status. Runs on the cheapest model that can handle the task — usually GLM-5 Turbo. It doesn't need to be brilliant, just reliable and cheap.

## Discord integration

Every agent has its own Discord channel. That's how I control them and how they report back. Claw is in the main chat. Builder posts to #builds. Researcher posts to #research. Ops posts to #ops.

Why Discord? Because it's persistent, it works on every device, and I've already got it open. I don't need a separate app to manage the fleet. The agents are just another set of participants in my Discord server.

Inter-agent communication goes through internal sessions, not Discord. The main agent can send instructions to the builder via sessions_send. Discord is the human-facing interface; the session bus is the agent-facing one.

## Fallback chains

Model routing matters a lot when you're running agents all day. My fallback chain looks like this:

GLM-5 Turbo → OpenRouter (mixed) → Claude Sonnet → Claude Opus

Routine tasks hit GLM-5. If GLM-5 can't handle it or errors, fall back to OpenRouter. Hard reasoning tasks go straight to Sonnet. Genuinely difficult stuff gets Opus.

The ops agent almost never leaves GLM-5. The main agent uses Sonnet for most things. Builder uses whatever is appropriate for the complexity of the task.

## Session isolation

Each agent is its own session with its own context. They don't share memory except through files. The vault is the shared state. If the main agent wants the builder to know about something, it writes it to a file in a shared location or sends it in the dispatch message.

This isn't a limitation — it's a feature. Isolated sessions mean agent failures are contained. If the builder crashes or does something dumb, it doesn't corrupt the main agent's context.

## What works

The specialization model works. Having a dedicated builder that runs fast and doesn't ask questions is genuinely useful. Having a researcher that takes its time and produces quality output is genuinely useful. Mixing all of that into one agent made it mediocre at everything.

Discord as the control plane works. Low friction, always available, persistent history.

The vault as shared state works. Agents don't need to be briefed — they read the context.

## What doesn't

Inter-agent coordination is still janky. The dispatch protocol is manual. I'm thinking about ways to make agents more proactively aware of each other.

The builder needs babysitting on long tasks. It'll go off in the wrong direction if the initial spec isn't precise. I've burned tokens on this.

Cost is real. Four agents, always-on, adds up. The ops agent is cheap. The researcher is not. You need to be deliberate about what gets routed where.

But overall? The fleet architecture works. The M4 Mini handles it without breaking a sweat. Running four agents on Apple Silicon in 2026 is honestly sick. I don't take that for granted.
