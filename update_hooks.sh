#!/bin/bash

# Script to update all @zibot/zihooks imports in events directory

echo "Updating events files..."

# Update all files in events directory
find events -name "*.js" -type f -exec sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' {} \;
find events -name "*.js" -type f -exec sed -i 's|require("@zibot/zihooks").useConfig()|require("../../utility/hooks").useConfig()|g' {} \;

echo "Events files updated!"

# Update function files
echo "Updating functions files..."
find functions -name "*.js" -type f -exec sed -i 's|require("@zibot/zihooks")|require("../../utility/hooks")|g' {} \;

echo "Functions files updated!"

echo "All files updated successfully!"
