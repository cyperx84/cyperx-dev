#!/bin/bash
set -euo pipefail

MD="$1"
OUT="${2:-output.mp3}"
VOICE="${VOICE:-cyperx}"
PRESET="${PRESET:-podcast}"
MAX_CHARS="${MAX_CHARS:-200}"
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "→ Extracting text from $MD"
python3 "$SCRIPT_DIR/extract-text.py" "$MD" "$TMPDIR/clean.txt"

echo "→ Chunking into ~${MAX_CHARS} char segments"
CHUNKS=$(python3 "$SCRIPT_DIR/chunk-text.py" "$TMPDIR/clean.txt" "$MAX_CHARS" "$TMPDIR")
echo "→ Generated $CHUNKS chunks"

i=0
for chunk in "$TMPDIR"/chunk_*.txt; do
  i=$((i+1))
  txt=$(cat "$chunk")
  outfile="$TMPDIR/part_$(printf '%03d' $i).mp3"
  echo "→ [$i/$CHUNKS] Generating ($(echo -n "$txt" | wc -c) chars)..."
  forge speak "$txt" --voice "$VOICE" --preset "$PRESET" --output "$outfile" 2>&1
  if [ ! -f "$outfile" ]; then
    echo "✗ FAILED: chunk $i"
    exit 1
  fi
  echo "  ✓ Done"
  sleep 1
done

echo "→ Concatenating $CHUNKS chunks..."
> "$TMPDIR/concat.txt"
for f in "$TMPDIR"/part_*.mp3; do
  echo "file '$f'" >> "$TMPDIR/concat.txt"
done

ffmpeg -y -f concat -safe 0 -i "$TMPDIR/concat.txt" -c copy "$OUT" 2>/dev/null
echo "✓ Audio saved to $OUT ($(du -h "$OUT" | cut -f1))"
