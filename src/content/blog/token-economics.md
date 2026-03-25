---
title: "Token Economics: Spending $0.47/day on AI That Actually Works"
slug: "token-economics"
date: "2026.02.14"
excerpt: "Model routing, fallback chains, local inference on Apple Silicon. How to stop bleeding money on API calls without sacrificing capability."
tags: ["LLM", "OPTIMIZATION", "COST"]
readTime: "10 min"
category: "OPTIMIZATION"
signal: 76
---

$0.47 a day. That's what running an always-on AI agent fleet costs me on average. Some days it's $0.20. Some days it's $1.20 if there's a big research job or a long build. But the average is well under a dollar.

Here's how that's possible without running trash models that can't do anything useful.

## The actual numbers

My daily spend breaks down roughly like this:

- Ops agent (GLM-5 Turbo): ~$0.02/day. It handles heartbeats, monitoring, routine checks. Basically free.
- Main agent (mixed routing): ~$0.20/day. Most of my casual conversations and file operations. Mix of GLM-5 and Sonnet depending on complexity.
- Research dispatches: ~$0.15/day average. These are the expensive ones — long context, multiple sources, synthesis. But I don't run them constantly.
- Builder agent: ~$0.10/day average. Depends heavily on whether there's an active build happening.

Total: roughly $0.47/day. About $14/month. For always-on agents that manage my infrastructure.

## The fallback chain

The secret is model routing. Not every task needs Claude Opus. Most don't need Claude at all.

My chain: **GLM-5 Turbo → OpenRouter mixed → Claude Sonnet → Claude Opus**

GLM-5 Turbo is incredibly cheap and good enough for maybe 60% of what agents actually do day-to-day. Reading files, formatting outputs, simple reasoning, status checks. It handles all of that fine.

OpenRouter gives me access to a bunch of mid-tier models. Llama 3, Mistral, others. When I need something a step up from GLM-5 but don't need Claude, OpenRouter fills the gap.

Sonnet is the main workhorse for actual reasoning tasks. Most of my substantive conversations with the main agent. Strong model, reasonable cost.

Opus is reserved for genuinely hard stuff. Complex architectural decisions, long-context synthesis, anything where being wrong is expensive. I use it probably once a day if that.

## Local inference on Apple Silicon

I've got Ollama running on the M4 Mini. A few models cached locally — mostly for experimentation and for tasks where latency matters more than quality.

Honest take: local inference on Apple Silicon is impressive but not competitive with frontier models for most tasks. Useful for specific cases, not a full replacement. The economics favor cloud for anything non-trivial because the token throughput is lower locally.

That said, for tasks that are genuinely repetitive and low-complexity — format this file, summarize this short text, check this syntax — local is fine and costs nothing.

## API vs subscription math

The subscription services (Claude.ai Pro, ChatGPT Plus) run $20-25/month each. For the way I use AI, they're worse value than API pricing.

Why? Because subscriptions give you more of one thing (convenience, higher limits on their web UI) while API gives you programmability. I don't use the web UI. I use the API. So I only pay for what I use, and I route intelligently.

If you use AI primarily through browser interfaces, subscriptions make sense. If you're running agents programmatically, API + smart routing is almost always cheaper.

## What actually eats tokens

Context length is the main cost driver, not just raw usage. A 10-turn conversation with a big context window costs way more than 10 single-turn queries.

My agents are designed to be context-efficient. The ops agent summarizes rather than retains full history. The builder gets a clean context for each task rather than a long shared history. The researcher processes documents with chunking rather than loading entire PDFs as context.

These choices compound. Over a month, efficient context management probably saves me $5-10 versus running the same workload naively.

$0.47/day. That's not magic. It's just being deliberate about what you're paying for and what you're not.
