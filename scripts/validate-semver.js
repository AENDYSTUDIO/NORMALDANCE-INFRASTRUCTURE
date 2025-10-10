#!/usr/bin/env node

/**
 * Semantic Versioning 2.0.0 Validator for NORMALDANCE
 *
 * This script validates that the project follows Semantic Versioning 2.0.0
 * according to the specification at https://semver.org/spec/v2.0.0.html
 */

import { execSync } from "child_process";
import { promises as fs } from "fs";

class SemVerValidator {
  constructor() {
    this.packageJsonPath = "./package.json";
    this.versionPattern =
      /^v?(\d+)\.(\d+)\.(\d+)(?:-((?:[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
  }

  async validate() {
    console.log("🔍 Validating Semantic Versioning 2.0.0 compliance...\n");

    let hasErrors = false;

    // Validate package.json version
    try {
      const versionValid = await this.validatePackageVersion();
      if (!versionValid) hasErrors = true;
    } catch (error) {
      console.error("❌ Error validating package version:", error.message);
      hasErrors = true;
    }

    // Validate Git tags
    try {
      const tagsValid = await this.validateGitTags();
      if (!tagsValid) hasErrors = true;
    } catch (error) {
      console.error("❌ Error validating Git tags:", error.message);
      hasErrors = true;
    }

    // Validate version increment rules
    try {
      const incrementValid = await this.validateVersionIncrement();
      if (!incrementValid) hasErrors = true;
    } catch (error) {
      console.error("❌ Error validating version increment:", error.message);
      hasErrors = true;
    }

    console.log("\n" + "=".repeat(50));
    if (hasErrors) {
      console.log("❌ Semantic Versioning validation FAILED");
      process.exit(1);
    } else {
      console.log("✅ Semantic Versioning validation PASSED");
      console.log("🎉 Project complies with Semantic Versioning 2.0.0");
    }
  }

  async validatePackageVersion() {
    console.log("📄 Validating package.json version...");

    try {
      const packageJson = JSON.parse(
        await fs.readFile(this.packageJsonPath, "utf8")
      );
      const version = packageJson.version;

      if (!version) {
        console.error("  ❌ No version found in package.json");
        return false;
      }

      console.log(`  📦 Current version: ${version}`);

      if (!this.versionPattern.test(version)) {
        console.error("  ❌ Version does not match SemVer 2.0.0 format");
        console.error(
          "  ℹ️  Expected format: MAJOR.MINOR.PATCH[-prerelease][+buildmetadata]"
        );
        return false;
      }

      const match = version.match(this.versionPattern);
      const major = match[1];
      const minor = match[2];
      const patch = match[3];
      const prerelease = match[4];
      const build = match[5];

      console.log(`  ✅ Valid SemVer format`);
      console.log(`     Major: ${major}, Minor: ${minor}, Patch: ${patch}`);

      if (prerelease) {
        console.log(`     Pre-release: ${prerelease}`);
      }

      if (build) {
        console.log(`     Build metadata: ${build}`);
      }

      // Check for leading zeros
      if (major.startsWith("0") && major !== "0") {
        console.error("  ❌ Major version cannot have leading zeros");
        return false;
      }

      if (minor.startsWith("0") && minor !== "0") {
        console.error("  ❌ Minor version cannot have leading zeros");
        return false;
      }

      if (patch.startsWith("0") && patch !== "0") {
        console.error("  ❌ Patch version cannot have leading zeros");
        return false;
      }

      console.log("  ✅ No leading zeros found");
      return true;
    } catch (error) {
      console.error(
        "  ❌ Failed to read or parse package.json:",
        error.message
      );
      return false;
    }
  }

  async validateGitTags() {
    console.log("\n🏷️  Validating Git tags...");

    try {
      // Get all tags
      const output = execSync("git tag --sort=-version:refname", {
        encoding: "utf8",
      });
      const tags = output
        .trim()
        .split("\n")
        .filter((tag) => tag);

      if (tags.length === 0) {
        console.log("  ⚠️  No Git tags found");
        return true;
      }

      console.log(`  🏷️  Found ${tags.length} tags`);

      let validTags = 0;
      let invalidTags = 0;

      for (const tag of tags) {
        // Remove 'v' prefix if present
        const version = tag.startsWith("v") ? tag.substring(1) : tag;

        if (this.versionPattern.test(version)) {
          validTags++;
          console.log(`  ✅ ${tag} - Valid SemVer`);
        } else {
          invalidTags++;
          console.error(`  ❌ ${tag} - Invalid SemVer format`);
        }
      }

      if (invalidTags > 0) {
        console.error(`  ❌ ${invalidTags} invalid tags found`);
        return false;
      }

      console.log(`  ✅ All ${validTags} tags are valid SemVer`);
      return true;
    } catch (error) {
      console.error("  ❌ Failed to get Git tags:", error.message);
      return false;
    }
  }

  async validateVersionIncrement() {
    console.log("\n📈 Validating version increment rules...");

    try {
      const packageJson = JSON.parse(
        await fs.readFile(this.packageJsonPath, "utf8")
      );
      const currentVersion = packageJson.version;

      // Get Git tags
      const output = execSync("git tag --sort=-version:refname", {
        encoding: "utf8",
      });
      const tags = output
        .trim()
        .split("\n")
        .filter(
          (tag) =>
            tag &&
            this.versionPattern.test(
              tag.startsWith("v") ? tag.substring(1) : tag
            )
        );

      if (tags.length === 0) {
        console.log("  ⚠️  No version tags found for comparison");
        return true;
      }

      // Get the latest tag
      const latestTag = tags[0];
      const latestVersion = latestTag.startsWith("v")
        ? latestTag.substring(1)
        : latestTag;

      console.log(`  📦 Current version: ${currentVersion}`);
      console.log(`  🏷️  Latest tag: ${latestTag}`);

      if (currentVersion === latestVersion) {
        console.log("  ⚠️  Current version matches latest tag (no increment)");
        return true;
      }

      // Parse versions
      const currentMatch = currentVersion.match(this.versionPattern);
      const latestMatch = latestVersion.match(this.versionPattern);

      if (!currentMatch || !latestMatch) {
        console.error("  ❌ Failed to parse version numbers");
        return false;
      }

      const currentMajor = parseInt(currentMatch[1]);
      const currentMinor = parseInt(currentMatch[2]);
      const currentPatch = parseInt(currentMatch[3]);

      const latestMajor = parseInt(latestMatch[1]);
      const latestMinor = parseInt(latestMatch[2]);
      const latestPatch = parseInt(latestMatch[3]);

      // Validate increment rules
      if (currentMajor < latestMajor) {
        console.error("  ❌ Major version decreased");
        return false;
      }

      if (currentMajor > latestMajor) {
        // Major version increased
        if (currentMajor - latestMajor > 1) {
          console.warn("  ⚠️  Major version skipped (e.g., 1.0.0 → 3.0.0)");
        } else {
          console.log("  ✅ Major version correctly incremented");
        }
        return true;
      }

      // Same major version
      if (currentMinor < latestMinor) {
        console.error("  ❌ Minor version decreased");
        return false;
      }

      if (currentMinor > latestMinor) {
        // Minor version increased
        if (currentMinor - latestMinor > 1) {
          console.warn("  ⚠️  Minor version skipped (e.g., 1.1.0 → 1.3.0)");
        } else {
          console.log("  ✅ Minor version correctly incremented");
        }
        return true;
      }

      // Same major and minor versions
      if (currentPatch < latestPatch) {
        console.error("  ❌ Patch version decreased");
        return false;
      }

      if (currentPatch > latestPatch) {
        // Patch version increased
        if (currentPatch - latestPatch > 1) {
          console.warn("  ⚠️  Patch version skipped (e.g., 1.0.1 → 1.0.3)");
        } else {
          console.log("  ✅ Patch version correctly incremented");
        }
        return true;
      }

      // Versions are the same
      console.log("  ℹ️  Version unchanged from latest tag");
      return true;
    } catch (error) {
      console.error(
        "  ❌ Failed to validate version increment:",
        error.message
      );
      return false;
    }
  }
}

// Run the validator
if (require.main === module) {
  const validator = new SemVerValidator();
  validator.validate().catch((error) => {
    console.error("Validation failed with error:", error);
    process.exit(1);
  });
}

export default SemVerValidator;
