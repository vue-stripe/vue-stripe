#!/bin/bash

# Vue Stripe - Bouldering/Rock Climbing Test Data Seeding Script
# Creates test products, prices, and customers in your Stripe account

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_FILE="$SCRIPT_DIR/stripe-fixtures.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Product IDs used by this script (for cleanup)
PRODUCT_IDS=(
    "prod_vuestripe_sender"
    "prod_vuestripe_crusher"
    "prod_vuestripe_projector"
    "prod_vuestripe_coaching"
    "prod_vuestripe_daypasses"
    "prod_vuestripe_lifetime"
    "prod_vuestripe_starterkit"
    "prod_vuestripe_teamtee"
)

# Customer emails used by this script (for cleanup)
CUSTOMER_EMAILS=(
    "alex@example.com"
    "lynn@example.com"
    "adam@example.com"
)

show_header() {
    echo -e "${CYAN}"
    echo "    ___  ____  _   _ _    ___  ___ ___ "
    echo "   | _ )/ __ \| | | | |  |   \| __| _ \\"
    echo "   | _ \ (__) | |_| | |__| |) | _||   /"
    echo "   |___/\____/ \___/|____|___/|___|_|_\\"
    echo -e "${NC}"
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Vue Stripe - Climbing Gym Test Data Seeding Script       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

check_prerequisites() {
    # Check if Stripe CLI is installed
    if ! command -v stripe &> /dev/null; then
        echo -e "${RED}Error: Stripe CLI is not installed.${NC}"
        echo ""
        echo "Install it with:"
        echo "  macOS:   brew install stripe/stripe-cli/stripe"
        echo "  Windows: scoop install stripe"
        echo "  Linux:   See https://stripe.com/docs/stripe-cli#install"
        echo ""
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Stripe CLI found"

    # Check if logged in
    if ! stripe config --list &> /dev/null; then
        echo -e "${RED}Error: Stripe CLI is not logged in.${NC}"
        echo ""
        echo "Run: stripe login"
        echo ""
        exit 1
    fi

    echo -e "${GREEN}✓${NC} Stripe CLI authenticated"
}

cleanup_existing() {
    echo ""
    echo -e "${YELLOW}Cleaning up existing Vue Stripe test data...${NC}"
    echo ""

    for product_id in "${PRODUCT_IDS[@]}"; do
        # Try to archive the product (this also archives associated prices)
        if stripe products update "$product_id" --active=false 2>/dev/null; then
            echo -e "  ${GREEN}✓${NC} Archived: $product_id"
        else
            echo -e "  ${BLUE}-${NC} Not found: $product_id (skipping)"
        fi
    done

    # Clean up test customers by email
    echo ""
    echo -e "${YELLOW}Cleaning up test customers...${NC}"

    for email in "${CUSTOMER_EMAILS[@]}"; do
        customer_id=$(stripe customers list --email="$email" --limit=1 2>/dev/null | grep -o '"id": "cus_[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$customer_id" ]; then
            stripe customers delete "$customer_id" 2>/dev/null && \
                echo -e "  ${GREEN}✓${NC} Deleted customer: $email" || \
                echo -e "  ${YELLOW}!${NC} Could not delete: $email"
        else
            echo -e "  ${BLUE}-${NC} Not found: $email (skipping)"
        fi
    done

    echo ""
    echo -e "${GREEN}Cleanup complete!${NC}"
}

show_plan() {
    echo ""
    echo -e "${YELLOW}This will create the following climbing gym test data:${NC}"
    echo ""
    echo -e "  ${CYAN}Gym Memberships:${NC}"
    echo "    • Sender Pass      - \$49/mo or \$490/yr   (off-peak access)"
    echo "    • Crusher Pass     - \$89/mo or \$890/yr   (24/7 + training boards)"
    echo "    • Pro Climber Pass - \$149/mo or \$1,490/yr (personal coaching)"
    echo ""
    echo -e "  ${CYAN}One-Time Purchases:${NC}"
    echo "    • Private Coaching Session  - \$125"
    echo "    • Climber Starter Kit       - \$149"
    echo "    • Gym Team T-Shirt          - \$35"
    echo "    • Lifetime Founding Member  - \$2,999"
    echo ""
    echo -e "  ${CYAN}Usage-Based:${NC}"
    echo "    • Day Pass Credits          - \$25/pass (metered)"
    echo ""
    echo -e "  ${CYAN}Test Customers:${NC}"
    echo "    • Alex Honnold  - Weekend boulderer, V5 climber"
    echo "    • Lynn Hill     - Trad climber, V4 grade"
    echo "    • Adam Ondra    - Competition climber, V12 beast"
    echo ""
}

run_fixtures() {
    echo -e "${BLUE}Creating test data...${NC}"
    echo ""

    # Run fixtures
    stripe fixtures "$FIXTURES_FILE"

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Seeding Complete!                       ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "View your data in the Stripe Dashboard:"
    echo -e "  ${BLUE}Products:${NC}  https://dashboard.stripe.com/test/products"
    echo -e "  ${BLUE}Customers:${NC} https://dashboard.stripe.com/test/customers"
    echo -e "  ${BLUE}Prices:${NC}    https://dashboard.stripe.com/test/prices"
    echo ""
    echo -e "${YELLOW}Lookup Keys for your code:${NC}"
    echo ""
    echo "  Subscriptions:"
    echo "    sender_monthly, sender_yearly"
    echo "    crusher_monthly, crusher_yearly"
    echo "    projector_monthly, projector_yearly"
    echo ""
    echo "  One-Time:"
    echo "    coaching_session, starter_kit, team_tee, lifetime_founding"
    echo ""
    echo "  Metered:"
    echo "    day_pass_credits"
    echo ""
}

show_usage() {
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  --clean        Clean up existing test data before seeding"
    echo "  --clean-only   Only clean up, don't create new data"
    echo "  --force        Skip confirmation prompts"
    echo "  --help         Show this help message"
    echo ""
}

# Parse arguments
CLEAN=false
CLEAN_ONLY=false
FORCE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --clean)
            CLEAN=true
            shift
            ;;
        --clean-only)
            CLEAN_ONLY=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        --help)
            show_usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
show_header
check_prerequisites

# Check if fixtures file exists
if [ ! -f "$FIXTURES_FILE" ] && [ "$CLEAN_ONLY" = false ]; then
    echo -e "${RED}Error: Fixtures file not found at $FIXTURES_FILE${NC}"
    exit 1
fi

if [ "$CLEAN_ONLY" = false ]; then
    echo -e "${GREEN}✓${NC} Fixtures file found"
fi

# Handle clean-only mode
if [ "$CLEAN_ONLY" = true ]; then
    if [ "$FORCE" = false ]; then
        echo ""
        read -p "This will archive all Vue Stripe test products and delete test customers. Continue? (y/N) " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            echo -e "${YELLOW}Cancelled.${NC}"
            exit 0
        fi
    fi
    cleanup_existing
    exit 0
fi

# Show what will be created
show_plan

# Handle cleanup before seeding
if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}Note: --clean flag set. Existing data will be cleaned first.${NC}"
    echo ""
fi

# Confirm before proceeding
if [ "$FORCE" = false ]; then
    read -p "Continue? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}Cancelled.${NC}"
        exit 0
    fi
fi

echo ""

# Run cleanup if requested
if [ "$CLEAN" = true ]; then
    cleanup_existing
    echo ""
fi

# Run fixtures
run_fixtures
