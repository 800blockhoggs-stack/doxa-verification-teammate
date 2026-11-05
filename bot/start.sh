#!/bin/sh
# Doxa auto-ignition — runs after npm install when a codespace is created.
# Boots only when the Founder's key is present (Codespaces secret DISCORD_TOKEN).
# Without the key, the bot stays offline and says so — no crash, no leak.
if [ -n "$DISCORD_TOKEN" ]; then
  nohup node doxa-bot.js > ../doxa.log 2>&1 &
  echo "Doxa ignition: online (log: ../doxa.log)"
else
  echo "Doxa ignition: DISCORD_TOKEN not set — bot stays offline (set the Codespaces secret, rebuild)"
fi
