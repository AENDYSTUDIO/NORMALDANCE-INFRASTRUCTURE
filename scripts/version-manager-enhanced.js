#!/usr/bin/env node

/**
 * Enhanced Version Manager for NORMALDANCE
 *
 * This script handles automatic version management, changelog generation,
 * and release creation based on Git commits and branch patterns.
 * Supports semantic versioning 2.0.0 with pre-release versions (alpha, beta, rc)
 *
 * Usage:
 *   node scripts/version-manager-enhanced.js <command> [options]
 *
 * Commands:
 *   bump [type]     - Bump version (patch, minor, major, prepatch, preminor, premajor)
 *   prerelease [tag] - Create pre-release version (alpha, beta, rc)
 *   current         - Show current version
 *   report          - Generate version report
 *   tags            - List version tags
 *   changelog       - Generate changelog
 *   release         - Create release
 */

import { execSync } from "child_process";
import { promises as fs } from "fs";

class EnhancedVersionManager {
  constructor() {
    this.packageJsonPath = "./package.json";
    this.changelogPath = "./CHANGELOG.md";
    this.versionPattern = /^v?\d+\.\d+\.\d+(?:-(?:alpha|beta|rc)\.\d+)?$/;
  }

  async run() {
    const args = process.argv.slice(2);

    if (args.length < 1) {
      this.showHelp();
      return;
    }

    const command = args[0];
    const options = args.slice(1);

    try {
      switch (command) {
        case "bump":
          await this.bump(options[0] || "patch");
          break;
        case "prerelease":
          await this.prerelease(options[0] || "alpha");
          break;
        case "current":
          await this.showCurrentVersion();
          break;
        case "report":
          await this.generateReport();
          break;
        case "tags":
          await this.listTags();
          break;
        case "changelog":
          await this.generateChangelog();
          break;
        case "release":
          await this.createRelease();
          break;
        default:
          console.error(`Unknown command: ${command}`);
          this.showHelp();
      }
    } catch (error) {
      console.error("Error:", error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
Enhanced Version Manager for NORMALDANCE

Usage: node scripts/version-manager-enhanced.js <command> [options]

Commands:
  bump [type]        - Bump version (patch, minor, major, prepatch, preminor, premajor)
  prerelease [tag]   - Create pre-release version (alpha, beta, rc)
  current            - Show current version
  report             - Generate version report
  tags               - List version tags
  changelog          - Generate changelog
  release            - Create release

Examples:
  node scripts/version-manager-enhanced.js bump patch
  node scripts/version-manager-enhanced.js bump minor
  node scripts/version-manager-enhanced.js bump major
  node scripts/version-manager-enhanced.js bump prepatch
  node scripts/version-manager-enhanced.js bump preminor
  node scripts/version-manager-enhanced.js bump premajor
  node scripts/version-manager-enhanced.js prerelease alpha
  node scripts/version-manager-enhanced.js prerelease beta
  node scripts/version-manager-enhanced.js prerelease rc
  node scripts/version-manager-enhanced.js current
  node scripts/version-manager-enhanced.js report
  node scripts/version-manager-enhanced.js tags
  node scripts/version-manager-enhanced.js changelog
  node scripts/version-manager-enhanced.js release
    `);
  }

  async bump(type = "patch") {
    const validTypes = [
      "patch",
      "minor",
      "major",
      "prepatch",
      "preminor",
      "premajor",
    ];
    if (!validTypes.includes(type)) {
      throw new Error(
        `Invalid bump type: ${type}. Use: ${validTypes.join(", ")}`
      );
    }

    console.log(`🚀 Bumping version (${type})...`);

    try {
      // Get current version
      const currentVersion = await this.getCurrentVersion();
      console.log(`Current version: ${currentVersion}`);

      // Bump version
      const bumpCommand = `npm version ${type} -m "chore(release): version bump to %s"`;
      console.log(`Running: ${bumpCommand}`);
      execSync(bumpCommand, { stdio: "inherit" });

      // Get new version
      const newVersion = await this.getCurrentVersion();
      console.log(`New version: ${newVersion}`);

      // Generate changelog
      await this.generateChangelog();

      console.log(`✅ Version bumped to ${newVersion}`);
    } catch (error) {
      console.error("❌ Version bump failed:", error.message);
      throw error;
    }
  }

  async prerelease(tag = "alpha") {
    const validTags = ["alpha", "beta", "rc"];
    if (!validTags.includes(tag)) {
      throw new Error(
        `Invalid pre-release tag: ${tag}. Use: ${validTags.join(", ")}`
      );
    }

    console.log(`🚀 Creating pre-release version (${tag})...`);

    try {
      // Get current version
      const currentVersion = await this.getCurrentVersion();
      console.log(`Current version: ${currentVersion}`);

      // Create pre-release version
      const prereleaseCommand = `npm version prerelease --preid=${tag} -m "chore(release): pre-release version bump to %s"`;
      console.log(`Running: ${prereleaseCommand}`);
      execSync(prereleaseCommand, { stdio: "inherit" });

      // Get new version
      const newVersion = await this.getCurrentVersion();
      console.log(`New version: ${newVersion}`);

      // Generate changelog
      await this.generateChangelog();

      console.log(`✅ Pre-release version created: ${newVersion}`);
    } catch (error) {
      console.error("❌ Pre-release creation failed:", error.message);
      throw error;
    }
  }

  async showCurrentVersion() {
    const version = await this.getCurrentVersion();
    console.log(version);
  }

  async getCurrentVersion() {
    try {
      const packageJson = JSON.parse(
        await fs.readFile(this.packageJsonPath, "utf8")
      );
      return packageJson.version;
    } catch (error) {
      throw new Error("Failed to read package.json");
    }
  }

  async generateReport() {
    console.log("📊 Generating version report...");

    const currentVersion = await this.getCurrentVersion();
    const tags = await this.getTags();
    const latestTag = tags.length > 0 ? tags[0] : "No tags found";

    console.log(`
📋 Version Report
================
Current Version: ${currentVersion}
Latest Tag: ${latestTag}
Total Tags: ${tags.length}
Tags List: ${tags.join(", ")}
    `);
  }

  async listTags() {
    const tags = await this.getTags();
    console.log(tags.join("\n"));
  }

  async getTags() {
    try {
      const output = execSync("git tag --sort=-version:refname", {
        encoding: "utf8",
      });
      return output
        .trim()
        .split("\n")
        .filter((tag) => this.versionPattern.test(tag));
    } catch (error) {
      return [];
    }
  }

  async generateChangelog() {
    console.log("📝 Generating changelog...");

    try {
      const currentVersion = await this.getCurrentVersion();
      const tags = await this.getTags();

      // Find the previous tag
      let previousTag = "initial";
      const currentIndex =
        tags.indexOf(`v${currentVersion}`) !== -1
          ? tags.indexOf(`v${currentVersion}`)
          : tags.indexOf(currentVersion);

      if (currentIndex > 0) {
        previousTag = tags[currentIndex + 1];
      }

      // Get commits since previous tag
      const commits = await this.getCommitsSinceTag(previousTag);

      // Generate changelog
      const changelog = this.generateChangelogContent(commits, currentVersion);

      // Update changelog file
      await this.updateChangelogFile(changelog);

      console.log(`✅ Changelog generated for version ${currentVersion}`);
    } catch (error) {
      console.error("❌ Changelog generation failed:", error.message);
      throw error;
    }
  }

  async getCommitsSinceTag(tag) {
    try {
      const since = tag === "initial" ? "1 month ago" : tag;
      const output = execSync(
        `git log --pretty=format:"%h|%s|%an|%ad" --date=short --since="${since}"`,
        { encoding: "utf8" }
      );
      return output
        .trim()
        .split("\n")
        .map((line) => {
          const [hash, message, author, date] = line.split("|");
          return { hash, message, author, date };
        });
    } catch (error) {
      return [];
    }
  }

  generateChangelogContent(commits, version) {
    const changes = {
      feat: [],
      fix: [],
      docs: [],
      style: [],
      refactor: [],
      test: [],
      chore: [],
      breaking: [],
      perf: [],
      ci: [],
      build: [],
    };

    // Parse commits
    commits.forEach((commit) => {
      const message = commit.message;
      const match = message.match(
        /^(feat|fix|docs|style|refactor|test|chore|perf|ci|build)(?:\((\w+)\))?!?:\s*(.+)$/
      );

      if (match) {
        const [, type, scope, description] = match;
        if (message.includes("!") || message.includes("BREAKING CHANGE")) {
          changes.breaking.push(
            `- ${scope ? `**${scope}**: ` : ""}${description} (BREAKING CHANGE)`
          );
        } else {
          changes[type].push(
            `- ${scope ? `**${scope}**: ` : ""}${description}`
          );
        }
      } else if (message.includes("BREAKING CHANGE")) {
        changes.breaking.push(
          `- ${message.split(":")[1] || "Breaking change"}`
        );
      }
    });

    // Generate changelog content
    let content = `## [${version}] - ${
      new Date().toISOString().split("T")[0]
    }\n\n`;

    // Add breaking changes first
    if (changes.breaking.length > 0) {
      content += `### ⚠️ BREAKING CHANGES\n\n`;
      changes.breaking.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add features
    if (changes.feat.length > 0) {
      content += `### ✨ Features\n\n`;
      changes.feat.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add fixes
    if (changes.fix.length > 0) {
      content += `### 🐛 Bug Fixes\n\n`;
      changes.fix.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add performance improvements
    if (changes.perf.length > 0) {
      content += `### ⚡ Performance Improvements\n\n`;
      changes.perf.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add documentation
    if (changes.docs.length > 0) {
      content += `### 📚 Documentation\n\n`;
      changes.docs.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add style changes
    if (changes.style.length > 0) {
      content += `### 💅 Style\n\n`;
      changes.style.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add refactorings
    if (changes.refactor.length > 0) {
      content += `### 🔧 Refactor\n\n`;
      changes.refactor.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add tests
    if (changes.test.length > 0) {
      content += `### 🧪 Tests\n\n`;
      changes.test.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add build system changes
    if (changes.build.length > 0) {
      content += `### 🏗️ Build System\n\n`;
      changes.build.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add continuous integration changes
    if (changes.ci.length > 0) {
      content += `### 🔄 Continuous Integration\n\n`;
      changes.ci.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add chores
    if (changes.chore.length > 0) {
      content += `### 🔄 Chores\n\n`;
      changes.chore.forEach((change) => {
        content += `${change}\n`;
      });
      content += "\n";
    }

    // Add commit list
    content += `### 📝 Commits\n\n`;
    commits.slice(0, 10).forEach((commit) => {
      content += `- ${commit.message.split("\n")[0]} (${commit.hash})\n`;
    });

    if (commits.length > 10) {
      content += `\n... and ${commits.length - 10} more commits\n`;
    }

    return content;
  }

  async updateChangelogFile(newContent) {
    try {
      let existingContent = "";

      // Read existing changelog
      try {
        existingContent = await fs.readFile(this.changelogPath, "utf8");
      } catch (error) {
        // File doesn't exist, create new one
        existingContent =
          "# Changelog\n\nAll notable changes to this project will be documented in this file.\n\n";
      }

      // Insert new content after the header
      const headerEnd = existingContent.indexOf("\n## [");
      if (headerEnd === -1) {
        // No existing versions, append to the end
        existingContent += "\n" + newContent;
      } else {
        // Insert new version before the first existing version
        existingContent =
          existingContent.substring(0, headerEnd) +
          "\n" +
          newContent +
          existingContent.substring(headerEnd);
      }

      // Write updated changelog
      await fs.writeFile(this.changelogPath, existingContent);
    } catch (error) {
      throw new Error("Failed to update changelog file");
    }
  }

  async createRelease() {
    console.log("🚀 Creating release...");

    try {
      const currentVersion = await this.getCurrentVersion();
      const tagName = `v${currentVersion}`;

      // Check if tag already exists
      const tags = await this.getTags();
      if (tags.includes(tagName) || tags.includes(currentVersion)) {
        console.log(
          `⚠️ Tag ${tagName} already exists. Skipping release creation.`
        );
        return;
      }

      // Create tag
      console.log(`Creating tag: ${tagName}`);
      execSync(`git tag -a ${tagName} -m "Release ${currentVersion}"`, {
        stdio: "inherit",
      });

      // Push tag
      console.log("Pushing tag...");
      execSync("git push --tags", { stdio: "inherit" });

      console.log(`✅ Release ${tagName} created successfully`);
    } catch (error) {
      console.error("❌ Release creation failed:", error.message);
      throw error;
    }
  }
}

// Run the script
if (require.main === module) {
  const manager = new EnhancedVersionManager();
  manager.run();
}

module.exports = EnhancedVersionManager;
