#!/usr/bin/env node
/**
 * generate-blog-audio.mjs
 * Generates voice-cloned podcast MP3s for blog posts.
 * Each chunk runs as a separate `forge speak` process to avoid MPS memory creep.
 *
 * Usage:
 *   node scripts/generate-blog-audio.mjs [--slug <slug>] [--force]
 *
 * Reads:  src/content/blog/*.md
 * Writes: public/audio/blog/<slug>.mp3
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { join, basename } from 'path';
import { tmpdir } from 'os';
import { randomBytes } from 'crypto';

const ROOT = new URL('..', import.meta.url).pathname;
const BLOG_DIR = join(ROOT, 'src/content/blog');
const AUDIO_OUT = join(ROOT, 'public/audio/blog');
const VOICE = 'cyperx';
const MAX_CHARS = 400;
const CHUNK_TIMEOUT_S = 300; // 5 min per chunk

mkdirSync(AUDIO_OUT, { recursive: true });

function mdToSpeech(md) {
  return md
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\([^\)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    .replace(/`{3}[\s\S]*?`{3}/g, '')
    .replace(/`[^`]+`/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/^>\s+/gm, '')
    .replace(/---+/g, '. ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function sanitize(text) {
  return text
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2014/g, ', ')
    .replace(/\u2013/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/'/g, '')
    .replace(/\n+/g, ' ')
    .replace(/`/g, '')
    .replace(/\\/g, '')
    .trim();
}

function chunkText(text, maxChars = MAX_CHARS) {
  const paragraphs = text.split('\n\n');
  const chunks = [];
  let current = '';
  for (const p of paragraphs) {
    if (current.length + p.length + 2 > maxChars && current) {
      chunks.push(current.trim());
      current = p;
    } else {
      current = current ? current + '\n\n' + p : p;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// Each chunk = separate process. Full memory cleanup between chunks.
function generateChunk(text, outFile) {
  const clean = sanitize(text);
  // Write text to temp file to avoid shell escaping issues
  const tmpText = join(tmpdir(), `tts_${randomBytes(4).toString('hex')}.txt`);
  writeFileSync(tmpText, clean, 'utf8');
  
  try {
    execSync(
      `forge speak "$(cat '${tmpText}')" --voice ${VOICE} --preset podcast -o '${outFile}'`,
      { encoding: 'utf8', timeout: CHUNK_TIMEOUT_S * 1000, stdio: ['pipe','pipe','pipe'] }
    );
  } finally {
    try { unlinkSync(tmpText); } catch {}
  }

  if (!existsSync(outFile)) {
    throw new Error('forge speak completed but no output file');
  }
}

function concatMP3s(files, outFile) {
  const tmp = join(tmpdir(), `concat_${randomBytes(4).toString('hex')}`);
  mkdirSync(tmp, { recursive: true });
  const listFile = join(tmp, 'list.txt');
  writeFileSync(listFile, files.map(f => `file '${f}'`).join('\n'));
  execSync(`ffmpeg -y -f concat -safe 0 -i "${listFile}" -c:a libmp3lame -q:a 2 "${outFile}"`, {
    stdio: 'pipe', timeout: 120000
  });
  try { files.forEach(f => unlinkSync(f)); unlinkSync(listFile); } catch {}
  try { execSync(`rmdir "${tmp}"`); } catch {}
}

async function processPost(mdFile, force = false) {
  const src = readFileSync(mdFile, 'utf8');
  // Extract frontmatter
  const parts = src.split(/^---\s*$/m);
  const meta = {};
  if (parts.length >= 3) {
    parts[1].split('\n').forEach(line => {
      const m = line.match(/^(\w+):\s*"?(.+?)"?\s*$/);
      if (m) meta[m[1]] = m[2];
    });
  }
  const body = parts.length >= 3 ? parts.slice(2).join('---') : src;
  const slug = meta.slug || basename(mdFile, '.md');
  const title = meta.title || slug;
  const outFile = join(AUDIO_OUT, `${slug}.mp3`);

  if (!force && existsSync(outFile)) {
    console.log(`  ⏭  ${slug} — already exists`);
    return;
  }

  console.log(`  🎙  ${slug} — "${title}"`);

  const speechText = `${title}. ${mdToSpeech(body)}`;
  const chunks = chunkText(speechText);
  console.log(`     ${speechText.length} chars, ${chunks.length} chunk(s)`);

  const tmp = join(tmpdir(), `audio_${randomBytes(4).toString('hex')}`);
  mkdirSync(tmp, { recursive: true });
  const chunkFiles = [];
  let failed = 0;

  for (let i = 0; i < chunks.length; i++) {
    const chunkFile = join(tmp, `chunk_${String(i).padStart(3, '0')}.mp3`);
    const label = `chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`;
    try {
      console.log(`     ${label}...`);
      generateChunk(chunks[i], chunkFile);
      chunkFiles.push(chunkFile);
    } catch (err) {
      console.error(`     ❌ ${label} FAILED: ${err.message.slice(0, 200)}`);
      failed++;
      // Continue with remaining chunks — one failure shouldn't kill the whole run
    }
    // Brief pause to let MPS fully release memory
    execSync('sleep 2');
  }

  if (chunkFiles.length === 0) {
    console.error(`     💀 All chunks failed for ${slug}`);
    try { execSync(`rm -rf "${tmp}"`); } catch {}
    return;
  }

  if (chunkFiles.length === 1) {
    execSync(`cp "${chunkFiles[0]}" "${outFile}"`);
  } else {
    console.log(`     🔗 Concatenating ${chunkFiles.length} chunks...`);
    concatMP3s(chunkFiles, outFile);
  }

  try { execSync(`rm -rf "${tmp}"`); } catch {}

  const dur = execSync(`ffprobe -v quiet -show_entries format=duration -of csv=p=0 "${outFile}"`, { encoding: 'utf8' }).trim();
  const size = Math.round(readFileSync(outFile).length / 1024);
  const mins = Math.floor(Number(dur) / 60);
  const secs = Math.round(Number(dur) % 60);
  console.log(`     ✅ ${size}KB, ${mins}m${secs}s (${failed} chunks failed)`);
}

// CLI
const args = process.argv.slice(2);
const force = args.includes('--force');
const slugArg = args.includes('--slug') ? args[args.indexOf('--slug') + 1] : null;

const files = readdirSync(BLOG_DIR)
  .filter(f => f.endsWith('.md'))
  .filter(f => !slugArg || f.includes(slugArg))
  .map(f => join(BLOG_DIR, f));

if (files.length === 0) {
  console.error(`No posts found${slugArg ? ` matching "${slugArg}"` : ''}`);
  process.exit(1);
}

console.log(`\n🎙  Blog Audio Generator`);
console.log(`   Voice: ${VOICE} | Posts: ${files.length} | Chunk size: ${MAX_CHARS} chars`);
console.log(`   Each chunk = separate process (no memory creep)\n`);

for (const f of files) {
  try {
    await processPost(f, force);
  } catch (err) {
    console.error(`  ❌ ${basename(f)}: ${err.message.slice(0, 300)}`);
  }
}

console.log('\nDone.');
