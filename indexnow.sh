#!/usr/bin/env bash
# Ping IndexNow (Bing, Yandex, Naver, Seznam — NOT Google) with URLs that were
# added / updated / removed, so they get re-crawled fast.
#
# Usage:
#   ./indexnow.sh https://worthkeeping.info/story/new-piece/     # one or more URLs
#   ./indexnow.sh --all                                          # every URL in sitemap.xml
#
# Run it after publishing (once the change is live). Google ignores IndexNow —
# for Google, resubmit the sitemap / Request Indexing in Search Console.
set -euo pipefail
HOST="worthkeeping.info"
KEY="0b333e2fc4983d007948d55c257d5ce5"
KEYLOC="https://$HOST/$KEY.txt"

if [ "${1:-}" = "--all" ]; then
  mapfile -t URLS < <(curl -s "https://$HOST/sitemap.xml" | grep -oE '<loc>[^<]+' | sed 's/<loc>//')
else
  URLS=("$@")
fi
if [ "${#URLS[@]}" -eq 0 ]; then
  echo "usage: ./indexnow.sh <url> [url ...]   |   ./indexnow.sh --all"; exit 1
fi

list=$(printf '"%s",' "${URLS[@]}"); list="[${list%,}]"
body=$(printf '{"host":"%s","key":"%s","keyLocation":"%s","urlList":%s}' "$HOST" "$KEY" "$KEYLOC" "$list")
echo "Submitting ${#URLS[@]} URL(s) to IndexNow…"
curl -sS -X POST "https://api.indexnow.org/indexnow" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d "$body" -w "\nHTTP %{http_code}\n"
