#!/usr/bin/env python3
"""Chunk text into ~max_char segments at paragraph/sentence boundaries."""
import sys, os

text = open(sys.argv[1]).read()
max_chars = int(sys.argv[2])
outdir = sys.argv[3]

chunks = []
current = ''
for para in text.split('\n'):
    para = para.strip()
    if not para:
        continue
    if len(current) + len(para) + 1 <= max_chars:
        current = current + ' ' + para if current else para
    else:
        if current:
            chunks.append(current)
        if len(para) > max_chars:
            sentences = para.replace('. ', '.\n').split('\n')
            buf = ''
            for s in sentences:
                s = s.strip()
                if not s: continue
                if len(buf) + len(s) + 1 <= max_chars:
                    buf = buf + ' ' + s if buf else s
                else:
                    if buf: chunks.append(buf)
                    buf = s
            current = buf
        else:
            current = para
if current:
    chunks.append(current)

for i, c in enumerate(chunks):
    with open(os.path.join(outdir, f'chunk_{i:03d}.txt'), 'w') as f:
        f.write(c)
print(len(chunks))
