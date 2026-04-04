#!/usr/bin/env python3
"""Extract plain text from a markdown file for TTS."""
import sys, re

text = open(sys.argv[1]).read()
text = re.sub(r'^---.*?---', '', text, count=1, flags=re.DOTALL)
text = re.sub(r'!\[.*?\]\(.*?\)', '', text)
text = re.sub(r'\[([^\]]+)\]\([^\)]+\)', r'\1', text)
text = re.sub(r'```.*?```', '', text, flags=re.DOTALL)
text = re.sub(r'`([^`]+)`', r'\1', text)
text = re.sub(r'^#{1,6}\s+', '', text, flags=re.MULTILINE)
text = text.replace('\u201c', '"').replace('\u201d', '"')
text = text.replace('\u2014', ',').replace('\u2013', '-')
text = text.replace('\u2018', "'").replace('\u2019', "'")
text = re.sub(r'\n{2,}', '\n', text)
text = re.sub(r' +', ' ', text)
with open(sys.argv[2], 'w') as f:
    f.write(text.strip())
