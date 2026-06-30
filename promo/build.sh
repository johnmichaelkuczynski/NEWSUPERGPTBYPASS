#!/usr/bin/env bash
set -euo pipefail

PHASE="${1:-all}"
FONTB="/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
SRC="promo/frames/app_home.jpg"
WORK="promo/work"
OUT="promo/GPT_Bypass_Promo.mp4"
mkdir -p "$WORK"

DUR=4.5
FR=30
W=1280; H=720
ENC="-c:v libx264 -preset veryfast -pix_fmt yuv420p -r $FR -threads 0"
BOX="box=1:boxcolor=black@0.62:boxborderw=22"

still() { # img out drawtextchain
  local img="$1" out="$2"; shift 2
  local draw="$*"
  ffmpeg -y -loglevel error -loop 1 -t $DUR -i "$WORK/${img}.png" \
    -vf "scale=${W}:${H}:flags=bicubic,setsar=1,${draw}" $ENC "$WORK/$out"
}

if [ "$PHASE" = "segs" ] || [ "$PHASE" = "all" ]; then
  ffmpeg -y -loglevel error -i "$SRC" -vf "scale=${W}:${H}:flags=bicubic" "$WORK/s1.png"
  ffmpeg -y -loglevel error -i "$SRC" -vf "crop=620:349:336:84,scale=${W}:${H}:flags=bicubic" "$WORK/s2.png"
  ffmpeg -y -loglevel error -i "$SRC" -vf "crop=545:307:720:84,scale=${W}:${H}:flags=bicubic" "$WORK/s3.png"
  ffmpeg -y -loglevel error -i "$SRC" -vf "crop=940:529:336:208,scale=${W}:${H}:flags=bicubic" "$WORK/s4.png"
  ffmpeg -y -loglevel error -i "$SRC" -vf "crop=940:529:336:84,scale=${W}:${H}:flags=bicubic" "$WORK/s5.png"
  cp "$WORK/s1.png" "$WORK/s6.png"

  still s1 seg1.mp4 \
"drawtext=fontfile=${FONTB}:text='GPT BYPASS':fontcolor=white:fontsize=88:${BOX}:x=(w-text_w)/2:y=(h/2)-100,drawtext=fontfile=${FONTB}:text='AI Text Rewriter':fontcolor=white:fontsize=42:box=1:boxcolor=black@0.55:boxborderw=16:x=(w-text_w)/2:y=(h/2)+34"

  still s2 seg2.mp4 \
"drawtext=fontfile=${FONTB}:text='Drop in your AI text and a style sample':fontcolor=white:fontsize=38:${BOX}:x=(w-text_w)/2:y=h-118"

  still s3 seg3.mp4 \
"drawtext=fontfile=${FONTB}:text='Blend content and get instant output':fontcolor=white:fontsize=38:${BOX}:x=(w-text_w)/2:y=h-118"

  still s4 seg4.mp4 \
"drawtext=fontfile=${FONTB}:text='40+ style presets and custom instructions':fontcolor=white:fontsize=36:${BOX}:x=(w-text_w)/2:y=h-118"

  still s5 seg5.mp4 \
"drawtext=fontfile=${FONTB}:text='Built-in GPTZero detection scoring':fontcolor=white:fontsize=38:${BOX}:x=(w-text_w)/2:y=h-118"

  still s6 seg6.mp4 \
"drawtext=fontfile=${FONTB}:text='Rewrite smarter with GPT Bypass':fontcolor=white:fontsize=48:${BOX}:x=(w-text_w)/2:y=(h-text_h)/2"

  echo "SEGMENTS DONE"; ls -la "$WORK"/seg*.mp4
fi

if [ "$PHASE" = "final" ] || [ "$PHASE" = "all" ]; then
  XF=0.7
  ffmpeg -y -loglevel error \
   -i "$WORK/seg1.mp4" -i "$WORK/seg2.mp4" -i "$WORK/seg3.mp4" \
   -i "$WORK/seg4.mp4" -i "$WORK/seg5.mp4" -i "$WORK/seg6.mp4" \
   -i "promo/audio/promo_music.mp3" \
   -filter_complex \
   "[0:v][1:v]xfade=transition=smoothleft:duration=${XF}:offset=3.8[x1]; \
    [x1][2:v]xfade=transition=smoothright:duration=${XF}:offset=7.6[x2]; \
    [x2][3:v]xfade=transition=smoothup:duration=${XF}:offset=11.4[x3]; \
    [x3][4:v]xfade=transition=fade:duration=${XF}:offset=15.2[x4]; \
    [x4][5:v]xfade=transition=circleopen:duration=${XF}:offset=19.0[vout]; \
    [6:a]atrim=0:23.5,afade=t=in:st=0:d=0.8,afade=t=out:st=22:d=1.5[aout]" \
   -map "[vout]" -map "[aout]" -c:v libx264 -preset veryfast -pix_fmt yuv420p -r $FR -c:a aac -b:a 192k -shortest "$OUT"
  echo "FINAL DONE"; ls -la "$OUT"
fi
