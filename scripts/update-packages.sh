#!/bin/bash

# Script to update all packages in package.json to their latest versions

PACKAGE_JSON="package.json"

if [ ! -f "$PACKAGE_JSON" ]; then
    echo "Error: package.json not found"
    exit 1
fi

update_packages() {
    local section=$1
    echo ""
    echo "=== Updating $section ==="
    echo ""

    # Extract package names from the section
    packages=$(jq -r ".$section // {} | keys[]" "$PACKAGE_JSON" 2>/dev/null)

    if [ -z "$packages" ]; then
        echo "No packages found in $section"
        return
    fi

    for package in $packages; do
        current=$(jq -r ".$section[\"$package\"]" "$PACKAGE_JSON")

        # Get latest version from npm
        latest=$(npm view "$package" version 2>/dev/null)

        if [ -z "$latest" ]; then
            echo "  ⚠ $package: Could not fetch latest version"
            continue
        fi

        # Compare versions (strip ^ or ~ from current)
        current_clean=$(echo "$current" | sed 's/^[\^~]//')

        if [ "$current_clean" = "$latest" ]; then
            echo "  ✓ $package: $current (up to date)"
        else
            echo "  ↑ $package: $current → ^$latest"
            # Update package.json using jq
            tmp=$(mktemp)
            jq ".$section[\"$package\"] = \"^$latest\"" "$PACKAGE_JSON" > "$tmp" && mv "$tmp" "$PACKAGE_JSON"
        fi
    done
}

echo "Checking for package updates..."

update_packages "dependencies"
update_packages "devDependencies"

echo ""
echo "=== Done ==="
echo ""
echo "Run 'npm install' to install updated packages"
