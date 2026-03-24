---
title: "Tailscale Mesh + Agent Army = Distributed Brain"
slug: "tailscale-agent-mesh"
date: "2026.01.12"
excerpt: "Connecting 3 machines into a single cognitive mesh. The agent on my Linux box can ask the agent on my Mac Mini to look something up, and neither needs to know where the other lives."
tags: ["NETWORKING", "AGENTS", "TAILSCALE"]
readTime: "9 min"
category: "INFRASTRUCTURE"
signal: 85
---

Three machines. One brain.

M4 Mac Mini (32GB) is the primary. M1 Mac Mini (8GB) is the secondary server. MacBook Pro running Omarchy Linux (i9, 32GB) is the Linux workstation. All connected via Tailscale. All running agents. All talking to each other.

Here's how I set it up and what actually works.

## Why Tailscale

I wanted zero-friction connectivity between machines. Not SSH tunnels, not VPN configs, not port forwarding. Just "these machines can see each other" everywhere, including when I'm mobile.

Tailscale delivers that. Install it on each machine, add them to a tailnet, and they get stable IP addresses that work everywhere. The M4 Mini is always reachable at the same address whether I'm on my home network, at a café, or routed through a VPS somewhere.

For agents specifically, this means the agent on machine A can call an API endpoint on machine B using a stable address. No DNS drama, no dynamic IPs, no NAT headaches.

## The mesh setup

Each machine runs the OpenClaw gateway. The gateway exposes an HTTP API that agents use to communicate. Tailscale makes those gateways mutually accessible.

M4 Mini: Primary gateway, main agent (Claw), builder agent. This machine is always on, always connected, has the most RAM for running multiple models.

M1 Mini: Secondary gateway, ops agent. Lower priority tasks, monitoring, cron jobs. The 8GB limit means I don't run heavy models here, but GLM-5 and basic routing are fine.

MacBook Pro (Linux): Builder's machine when I'm at the desk working. The i9 has good single-core performance for coding tasks, and I like having a dedicated Linux environment for testing Linux-specific stuff. Agent here can access the same Tailscale addresses as the others.

## Agent-to-agent communication

The main agent on the M4 Mini can dispatch tasks to the ops agent on the M1 Mini. The protocol is simple: a DISPATCH message via the session bus, which routes through the tailnet to the target gateway.

The receiving agent doesn't need to know it came from a different machine. From its perspective, it got a task. It executes the task. It reports back. The network layer is transparent.

This is genuinely useful for offloading. If I'm running a big build on the M4 and I also want research done, I can push the research dispatch to the M1 instead of competing for resources on the primary machine.

## Practical networking setup

A few things that made it work well:

Set hostnames in Tailscale that are meaningful. `m4-mini`, `m1-mini`, `mbp-linux`. Not the default random names. When you're reading logs and something mentions a host, you want to know immediately which machine it is.

Use Tailscale ACLs to define what can talk to what. Not everything should be able to reach everything. The ops agent doesn't need to talk to the builder's gateway directly.

Exit nodes are useful. The M4 Mini can serve as an exit node, which means any of my mobile devices can route through it. Useful for accessing home network resources when I'm out.

## What works, what doesn't

Latency is fine. We're talking sub-10ms between machines on the same home network. Even over the internet it's usually under 50ms. Not a bottleneck for agent operations.

Reliability is excellent. Tailscale just works. I haven't had a connectivity failure that wasn't a machine actually being off or a model API being down.

The mental model of "one brain across machines" is mostly true but breaks down when you think about state. Each agent has its own context, its own session history. The shared state is the vault and whatever files I put in shared locations. The agents aren't telepathic — they're just well-connected.

Cross-machine builds are possible but I've been cautious. Having the builder on one machine compile and test on another introduces complexity I haven't fully worked out yet. For now, builds happen on one machine.

Three machines, one tailnet, agents on each. It's a distributed brain in the sense that matters: multiple instances of intelligence, working on different things, able to coordinate when needed. Cool shit, honestly.
