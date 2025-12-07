#!/bin/bash

# Vue Stripe - Link Authentication Test Data Seeding Script
# Creates test customers with various payment method states for Link auth testing

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FIXTURES_FILE="$SCRIPT_DIR/stripe-link-fixtures.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Customer emails used by this script (for cleanup)
LINK_CUSTOMER_EMAILS=(
    "margo.link.valid@example.com"
    "tommy.link.expired@example.com"
    "beth.link.declined@example.com"
    "ashima.link.insufficient@example.com"
    "janja.link.cvc@example.com"
    "brooke.link.3ds@example.com"
    "sasha.link.none@example.com"
)

show_header() {
    echo -e "${MAGENTA}"
    echo "   __    _       __     ___       __  __  "
    echo "  / /   (_)___  / /__  / _ |__ __/ /_/ /_ "
    echo " / /__ / / _ \\/ '_/ / __ / // / __/ __/"
    echo "/____/_/_//_/_/\\_\\ /_/ |_\\_,_/\\__/\\__/ "
    echo -e "${NC}"
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║   Vue Stripe - Link Authentication Test Data               ║${NC}"
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
    echo -e "${YELLOW}Cleaning up existing Link test customers...${NC}"
    echo ""

    for email in "${LINK_CUSTOMER_EMAILS[@]}"; do
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
    echo -e "${YELLOW}This will create the following Link authentication test customers:${NC}"
    echo ""
    echo -e "  ${CYAN}Valid Payment Methods:${NC}"
    echo "    • Margo Hayes     - margo.link.valid@example.com     (Valid Visa card)"
    echo ""
    echo -e "  ${CYAN}Invalid Payment Methods:${NC}"
    echo "    • Tommy Caldwell  - tommy.link.expired@example.com   (Expired card)"
    echo "    • Beth Rodden     - beth.link.declined@example.com   (Generic decline)"
    echo "    • Ashima Shiraishi- ashima.link.insufficient@example.com (Insufficient funds)"
    echo "    • Janja Garnbret  - janja.link.cvc@example.com       (CVC check fails)"
    echo ""
    echo -e "  ${CYAN}Requires Authentication:${NC}"
    echo "    • Brooke Raboutou - brooke.link.3ds@example.com      (3D Secure required)"
    echo ""
    echo -e "  ${CYAN}No Payment Method:${NC}"
    echo "    • Sasha DiGiulian - sasha.link.none@example.com      (No saved card)"
    echo ""
    echo -e "${MAGENTA}Test Scenarios:${NC}"
    echo ""
    echo "  1. ${GREEN}Valid Flow${NC}: Use margo.link.valid@example.com"
    echo "     → Payment should complete successfully"
    echo ""
    echo "  2. ${RED}Expired Card${NC}: Use tommy.link.expired@example.com"
    echo "     → Will fail with 'Your card has expired'"
    echo ""
    echo "  3. ${RED}Declined${NC}: Use beth.link.declined@example.com"
    echo "     → Will fail with 'Your card was declined'"
    echo ""
    echo "  4. ${RED}Insufficient Funds${NC}: Use ashima.link.insufficient@example.com"
    echo "     → Will fail with 'Your card has insufficient funds'"
    echo ""
    echo "  5. ${RED}CVC Fail${NC}: Use janja.link.cvc@example.com"
    echo "     → Will fail with CVC verification error"
    echo ""
    echo "  6. ${YELLOW}3D Secure${NC}: Use brooke.link.3ds@example.com"
    echo "     → Will require 3D Secure authentication modal"
    echo ""
    echo "  7. ${BLUE}New Card Flow${NC}: Use sasha.link.none@example.com"
    echo "     → User must enter new card details"
    echo ""
}

run_fixtures() {
    echo -e "${BLUE}Creating Link test data...${NC}"
    echo ""

    # Run fixtures
    stripe fixtures "$FIXTURES_FILE"

    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║               Link Test Data Created!                      ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "View your data in the Stripe Dashboard:"
    echo -e "  ${BLUE}Customers:${NC}       https://dashboard.stripe.com/test/customers"
    echo -e "  ${BLUE}Payment Methods:${NC} https://dashboard.stripe.com/test/payment_methods"
    echo ""
    echo -e "${YELLOW}Quick Reference:${NC}"
    echo ""
    echo "  Test Email                            Expected Result"
    echo "  ─────────────────────────────────────────────────────────"
    echo "  margo.link.valid@example.com          ✅ Success"
    echo "  tommy.link.expired@example.com        ❌ Expired card"
    echo "  beth.link.declined@example.com        ❌ Card declined"
    echo "  ashima.link.insufficient@example.com  ❌ Insufficient funds"
    echo "  janja.link.cvc@example.com            ❌ CVC check fails"
    echo "  brooke.link.3ds@example.com           🔐 3DS authentication"
    echo "  sasha.link.none@example.com           📝 Enter new card"
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
        read -p "This will delete all Link test customers. Continue? (y/N) " -n 1 -r
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
