#!/bin/bash
INPUT=$(cat)

# Extract command from JSON using Python (jq may not be available)
COMMAND=$(echo "$INPUT" | python -c "import sys,json; d=json.load(sys.stdin); print(d.get('tool_input',{}).get('command',''))" 2>/dev/null || echo "")

if echo "$COMMAND" | grep -qE 'git push.*(--force|-f\b)'; then
  echo "Blocked: force push nie je dovolený bez explicitného potvrdenia od Peet/Klaudia." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qiE 'wrangler (pages project delete|delete)|curl.*-X *DELETE.*(workers/scripts|pages/projects)'; then
  echo "Blocked: mazanie Worker/Pages projektu je nezvratné. Spýtaj sa Peet/Klaudia najprv." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qiE 'curl.*-X *DELETE.*dns_records'; then
  echo "Blocked: mazanie DNS záznamu je rizikové. Spýtaj sa Peet/Klaudia najprv." >&2
  exit 2
fi

if echo "$COMMAND" | grep -qiE 'curl.*(user/tokens)'; then
  echo "Blocked: vytváranie/rotácia API tokenov treba potvrdiť s Peet/Klaudia." >&2
  exit 2
fi

exit 0
