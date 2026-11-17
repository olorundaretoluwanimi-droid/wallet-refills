#!/bin/sh
# One command: "What If Your Wallet Refilled Every Morning?" (2.5D Pixel Art) — voices, score, mix, subtitles, picture, master, poster.
#   sh build.sh                     full build
#   STOP_BEFORE_VIDEO=1 sh build.sh sound and subtitles only
# Needs the Lemo-Opuscar library (core, voice and music tiers): set LIB if it is not at the path below.
set -e
LIB=${LIB:-/c/Users/HP/lemo-opuscar}
export LIB
HERE=$(cd "$(dirname "$0")" && pwd)
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
PY="$LIB/.venv/bin/python"
NAME=wallet-refills
FPS=30
cd "$LIB"
"$PY" core/audio/sampler.py --need "$HERE/score.py"
# 1. voices (Kokoro) + speech-to-text check
"$PY" "$HERE/voices.py"                                  # Kokoro offline; your lines via Microsoft edge-tts (needs the internet)
"$PY" core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices"
# 2. events (voice times, foley cues) from the page
node core/render/events.mjs "$HERE"
# 3. score, mix, subtitles
"$PY" "$HERE/score.py"
"$PY" "$HERE/mix.py"
ffmpeg -v error -y -i "$HERE/out/mix.wav" -c:a flac -sample_fmt s16 -compression_level 8 "$HERE/audio/mix.flac"   # the soundtrack the GitHub render uses
"$PY" "$HERE/srt_cues.py"
"$PY" core/render/srt.py "$HERE/out/cues.json" "$HERE/subtitles_en.srt"   # burned in too: not named like the video
[ -n "$STOP_BEFORE_VIDEO" ] && { echo "stopped before the picture"; exit 0; }
# 4. picture (tilt-shift on by default), 30 fps
node core/render/video.mjs "$HERE" --fps $FPS --workers 2 --out "$HERE/out/video.mp4"
# 5. master: -14 LUFS, no grain (pixel art)
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/$NAME.mp4" $FPS 0
# 6. poster
ffmpeg -v error -y -ss 234.0 -i "$HERE/$NAME.mp4" -frames:v 1 -q:v 2 "$HERE/poster.jpg"
echo "done: $HERE/$NAME.mp4"
