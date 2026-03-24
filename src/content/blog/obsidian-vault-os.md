---
title: "The Obsidian Vault as Operating System"
slug: "obsidian-vault-os"
date: "2026.03.02"
excerpt: "Your note-taking app is a shitty operating system. Here's how I turned mine into an actual one — with pipelines, state machines, and agents that read it."
tags: ["OBSIDIAN", "PKM", "AUTOMATION"]
readTime: "12 min"
category: "KNOWLEDGE"
signal: 88
---

Most people's Obsidian vault is a graveyard. Ideas go in, nothing comes out. Notes accumulate like digital clutter and nobody can find anything after six months.

Mine is different. Not because I'm smarter about note-taking — I'm not — but because I stopped thinking of it as a note-taking app and started thinking of it as an operating system. Shared context for both humans and AI agents.

## The pipeline that makes it work

Everything flows through four stages:

**Ideas → PRDs → Builds → Ship**

An idea is a single atomic note. "I want a TUI dashboard for my agent fleet." That's it. One line, one note, proper YAML frontmatter with a status field set to `idea`.

When I decide to pursue something, it becomes a PRD — Product Requirements Document, but stripped of all the corporate nonsense. Just: what is it, why does it exist, what does done look like. The status flips to `planning`.

PRD becomes a build when I start writing code. Status: `building`. The note grows to include architecture decisions, blockers, lessons learned. It's a living document.

When something ships, the note gets archived, but the learnings stay. Status: `shipped`. I can always go back and understand why I made a specific decision.

## Why flat beats folders

I don't use folders. Or rather, I barely use them. Everything lives at the root level except stuff in `inbox/` — which is the holding area for things that haven't been processed yet.

The reason is simple: folders create decisions. "Does this go in /projects or /ideas?" You make the decision, you get it slightly wrong, and now the note is in the wrong place and you can never find it. Wikilinks + tags solve the same problem without the overhead.

Wikilinks are the graph. `[[fleet-tui]]` connects notes automatically. The graph view isn't just decorative — it shows you which ideas are connected, which projects share dependencies, where your thinking clusters.

Tags are the categories. `#building`, `#ai`, `#infrastructure`. They're searchable. They work across everything. No folder reorganization required.

## The vault constitution

I have a file called `09-vault-constitution.md`. It defines the rules. Every AI agent I use reads it before touching the vault. It covers:

- YAML frontmatter format (id, title, created, modified, tags, topics, refs, aliases)
- What atomic means — one concept per note, not one topic
- Wikilink conventions
- What goes in `inbox/` vs root level
- How to update index notes (`00-*.md`)

This isn't bureaucracy. It's the spec that makes the vault machine-readable. Without it, agents would create notes that look different from mine, use inconsistent frontmatter, and break the graph structure.

## How agents read the vault

The agent context includes the vault path and the constitution. When I ask it to find something, it searches the vault. When I ask it to create a note, it reads the constitution first, then creates a note that matches the spec.

The real power is this: my agent knows about my ongoing projects, past decisions, and current thinking — not because I brief it each session, but because it reads the vault. The vault is the brief. The vault is the shared state between me and every agent I run.

When I'm working on Fleet TUI and I want to understand a past architectural decision, I ask. The agent reads the relevant notes and tells me what past-me was thinking. It's like having access to your own reasoning across time.

## Why structure compounds

Here's the thing nobody tells you about building systems like this: the benefits compound slowly, then fast.

Month one, it's more work than just writing stuff down randomly. You're building the habit, the template, the constitution. It feels like overhead.

Month six, it starts paying off. You can find anything. You can trace the history of any idea. Agents can operate effectively in your vault because everything is consistent.

Month twelve, it's genuinely different. Your vault isn't just notes — it's an executable specification of how you think. New agents, new tools, even future versions of yourself can read it and understand what you were building and why.

The structure creates a foundation that future intelligence can stand on. That's the whole point.
