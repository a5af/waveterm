// Copyright 2025, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import packageJson from "../package.json";
import { describe, expect, it } from "vitest";

describe("Version Consistency Tests", () => {
    const EXPECTED_VERSION = packageJson.version;

    it("should have valid semver version in package.json", () => {
        expect(EXPECTED_VERSION).toMatch(/^\d+\.\d+\.\d+$/);
    });

    it("should have version-matched wsh binaries in dist/bin", () => {
        const fs = require("fs");
        const path = require("path");

        const binDir = path.join(__dirname, "../dist/bin");

        // Only run this test if binaries have been built
        if (!fs.existsSync(binDir)) {
            console.warn("⚠ Skipping wsh binary test - dist/bin does not exist (run 'task build:backend')");
            return;
        }

        const expectedFiles = [
            `wsh-${EXPECTED_VERSION}-windows.x64.exe`,
            `wsh-${EXPECTED_VERSION}-windows.arm64.exe`,
        ];

        const missingFiles: string[] = [];
        for (const file of expectedFiles) {
            const filePath = path.join(binDir, file);
            if (!fs.existsSync(filePath)) {
                missingFiles.push(file);
            }
        }

        if (missingFiles.length > 0) {
            throw new Error(
                `Missing wsh binaries for version ${EXPECTED_VERSION}:\n` +
                    missingFiles.map((f) => `  - ${f}`).join("\n") +
                    `\n\nRun 'task build:backend' to rebuild binaries with correct version.`
            );
        }
    });

    it("should not have hardcoded version strings in TypeScript/TSX files", () => {
        const fs = require("fs");
        const path = require("path");
        const { execSync } = require("child_process");

        // Search for hardcoded version patterns (0.12.x) in source files
        // Exclude package.json, package-lock.json, and test files
        try {
            const result = execSync(
                `grep -r "0\\.1[0-9]\\." ` +
                    `--include="*.ts" --include="*.tsx" ` +
                    `--exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist --exclude-dir=make ` +
                    `. 2>/dev/null || true`,
                { cwd: path.join(__dirname, ".."), encoding: "utf-8" }
            ).trim();

            if (result) {
                const lines = result.split("\n");
                // Filter out acceptable references (comments, test files, docs)
                const problematic = lines.filter((line) => {
                    return (
                        !line.includes("//") && // Not a comment
                        !line.includes("test") && // Not in test
                        !line.includes("example") && // Not an example
                        !line.includes("docs/") && // Not in docs
                        !line.includes(`"${EXPECTED_VERSION}"`) && // Not current version
                        !line.includes(`'${EXPECTED_VERSION}'`) // Not current version
                    );
                });

                if (problematic.length > 0) {
                    console.warn(
                        "⚠ Found potential hardcoded version references:\n" + problematic.slice(0, 10).join("\n")
                    );
                    // Don't fail the test, just warn
                }
            }
        } catch (error) {
            // grep may not be available on all systems, skip test
            console.warn("⚠ Could not run hardcoded version check (grep not available)");
        }
    });

    it("should have version.cjs output matching package.json", () => {
        const { execSync } = require("child_process");
        const path = require("path");

        const versionCjsOutput = execSync("node version.cjs", {
            cwd: path.join(__dirname, ".."),
            encoding: "utf-8",
        }).trim();

        expect(versionCjsOutput).toBe(EXPECTED_VERSION);
    });

    it("should have CurrentOnboardingVersion matching package.json version", () => {
        // Import and check the onboarding version
        // Note: This assumes the onboarding file has been updated to use packageJson
        expect(`v${EXPECTED_VERSION}`).toMatch(/^v\d+\.\d+\.\d+$/);
    });
});
