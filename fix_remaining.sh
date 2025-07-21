#!/bin/bash

echo "Updating remaining @zibot/zihooks imports..."

# Update commands directory files
sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' commands/utility/Statistics.js
sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' commands/utility/profile.js
sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' commands/utility/feedback.js
sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' commands/utility/leaderboard.js
sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' commands/config/language.js
sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' commands/fun/tts.js
sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' commands/fun/ai.js

# Update lang directory files
sed -i 's|require("@zibot/zihooks").useConfig()|require("../utility/hooks").useConfig()|g' lang/en.js
sed -i 's|require("@zibot/zihooks").useConfig()|require("../utility/hooks").useConfig()|g' lang/vi.js

echo "All remaining files updated!"
