#!/usr/bin/env bash
set -eo pipefail

# Bump version across all WaveTerm fork configs and docs
# Updates version in package.json, package-lock.json, VERSION_HISTORY.md, and commits changes

# Colors
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
NC='\033[0m' # No Color

success() { echo -e "${GREEN}✓ $1${NC}"; }
info() { echo -e "${CYAN}→ $1${NC}"; }
error() { echo -e "${RED}✗ $1${NC}" >&2; }

# Parse arguments
TYPE=""
AGENT=""
MESSAGE=""
NO_COMMIT=false
NO_TAG=false

usage() {
    cat << EOF
Usage: $0 <type> [options]

Bump version across all WaveTerm fork configs and docs.

Arguments:
    type            Version bump type: patch, minor, major, or specific version (e.g., 0.12.5)

Options:
    --agent NAME    Agent name (default: current branch agent prefix or 'agentx')
    --message MSG   Commit message describing changes
    --no-commit     Skip git commit and tag creation
    --no-tag        Skip git tag creation (still commits)
    -h, --help      Show this help message

Examples:
    $0 patch
    $0 minor --agent agent2 --message "Add new terminal feature"
    $0 0.12.10
EOF
    exit 1
}

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        patch|minor|major)
            TYPE="$1"
            shift
            ;;
        [0-9]*.[0-9]*.[0-9]*)
            TYPE="$1"
            shift
            ;;
        --agent)
            AGENT="$2"
            shift 2
            ;;
        --message)
            MESSAGE="$2"
            shift 2
            ;;
        --no-commit)
            NO_COMMIT=true
            shift
            ;;
        --no-tag)
            NO_TAG=true
            shift
            ;;
        -h|--help)
            usage
            ;;
        *)
            error "Unknown argument: $1"
            usage
            ;;
    esac
done

if [[ -z "$TYPE" ]]; then
    error "Version type required"
    usage
fi

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
info "Current version: $CURRENT_VERSION"

# Determine new version
if [[ "$TYPE" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    # Specific version provided
    NEW_VERSION="$TYPE"
    info "Setting specific version: $NEW_VERSION"
    # Update package.json manually
    npm version "$NEW_VERSION" --no-git-tag-version >/dev/null
else
    # Use npm version to calculate new version
    info "Bumping $TYPE version..."
    NEW_VERSION=$(npm version "$TYPE" --no-git-tag-version 2>/dev/null | sed 's/^v//')
fi

success "New version: $NEW_VERSION"

# Determine agent name
if [[ -z "$AGENT" ]]; then
    BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")
    if [[ "$BRANCH" =~ ^(agent[a-z0-9]+)/ ]]; then
        AGENT="${BASH_REMATCH[1]}"
    else
        AGENT="agentx"
    fi
fi
info "Agent: $AGENT"

# Update VERSION_HISTORY.md
info "Updating VERSION_HISTORY.md..."
TODAY=$(date +%Y-%m-%d)
VERSION_HISTORY="VERSION_HISTORY.md"

if [[ -f "$VERSION_HISTORY" ]]; then
    # Update current version at top
    sed -i "s/Current Version: [0-9.]*\(-fork\)\?/Current Version: $NEW_VERSION-fork/" "$VERSION_HISTORY"

    # Add new entry to table
    CHANGE_MSG="${MESSAGE:-Version bump}"
    NEW_ENTRY="| $NEW_VERSION-fork | v0.12.0 | $TODAY | $AGENT | $CHANGE_MSG |"

    # Find the table header and insert after it
    sed -i "/| Fork Version | Upstream Base | Date | Agent | Changes |/,/|[-|]*|/ {
        /|[-|]*|/ a\\
$NEW_ENTRY
    }" "$VERSION_HISTORY"

    success "Updated VERSION_HISTORY.md"
else
    error "VERSION_HISTORY.md not found!"
fi

# Commit changes if requested
if [[ "$NO_COMMIT" != true ]]; then
    info "Committing version bump..."

    git add package.json package-lock.json VERSION_HISTORY.md

    if [[ -n "$MESSAGE" ]]; then
        COMMIT_MSG="chore: bump version to $NEW_VERSION

$MESSAGE"
    else
        COMMIT_MSG="chore: bump version to $NEW_VERSION"
    fi

    git commit -m "$COMMIT_MSG"
    success "Committed version bump"

    # Create git tag if requested
    if [[ "$NO_TAG" != true ]]; then
        info "Creating git tag v$NEW_VERSION-fork..."
        git tag -a "v$NEW_VERSION-fork" -m "Release $NEW_VERSION-fork"
        success "Created tag v$NEW_VERSION-fork"
        BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
        info "Push with: git push origin $BRANCH --tags"
    fi
fi

echo ""
success "Version bump complete: $CURRENT_VERSION -> $NEW_VERSION"
echo ""
info "Next steps:"
echo "  1. Review changes: git show HEAD"
BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
echo "  2. Push to remote: git push origin $BRANCH"
if [[ "$NO_TAG" != true ]]; then
    echo "  3. Push tags: git push origin --tags"
fi
