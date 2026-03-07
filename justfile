# Solunar Clock Task Runner

# Show this help message
default:
    @just --list --justfile {{justfile()}}

# Start development server
dev:
    pnpm vite --port 8888 --strictPort

# Run kiosk mode (Chromium)
kiosk:
    chromium-browser --app=http://localhost:8888 --window-size=480,800 --window-position=0,0 --kiosk --user-data-dir=/tmp/solunar-kiosk --no-first-run

# Build for production
build:
    pnpm build

# Run linting
lint:
    pnpm lint

# Run formatting check
format:
    pnpm format

# Run combined check (lint + format)
check:
    pnpm check

# Type check the project
type-check:
    pnpm type-check

# Run tests
test:
    pnpm vitest run

# Run tests in watch mode
test-watch:
    pnpm vitest
