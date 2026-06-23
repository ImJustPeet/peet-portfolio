#!/bin/bash
INPUT=$(cat)

# Extract file_path from JSON using Python (jq may not be available)
FILE=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('file_path',''))" 2>/dev/null || echo "")

if [[ "$FILE" == *"_headers"* ]]; then
  echo "PRIPOMIENKA: _headers bol upravený. Pred potvrdením hotovo over na ŽIVEJ donovanpeet.com (nie localhost): YouTube lightbox, TikTok linky, fonty, žiadne nové CSP console chyby." >&2
fi

exit 0
