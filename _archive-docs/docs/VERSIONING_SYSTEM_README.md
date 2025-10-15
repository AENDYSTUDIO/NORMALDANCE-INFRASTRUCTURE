# NormalDANCE Versioning System

## Overview

This document describes the versioning system for the NormalDANCE project, which follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) specification. The system includes automated tools for version management, changelog generation, and release creation.

## Version Format

NormalDANCE versions follow the format `MAJOR.MINOR.PATCH` with optional pre-release and build metadata:

- **MAJOR** version: Incompatible API changes
- **MINOR** version: Backward-compatible functionality
- **PATCH** version: Backward-compatible bug fixes
- **Pre-release**: Identifiers preceded by a hyphen (e.g., `-alpha.1`)
- **Build metadata**: Identifiers preceded by a plus sign (e.g., `+20251009`)

Examples:

- `1.0.0` - Production release
- `1.0.1-alpha.1` - Alpha pre-release
- `1.0.1-beta.2` - Beta pre-release
- `1.0.1-rc.1` - Release candidate
- `1.0.1+build.123` - Build metadata

## Tools

### Enhanced Version Manager

The enhanced version manager (`scripts/version-manager-enhanced.js`) provides comprehensive version management capabilities.

#### Installation

No installation required. The script uses Node.js built-in modules.

#### Usage

```bash
# Show help
node scripts/version-manager-enhanced.js

# Show current version
node scripts/version-manager-enhanced.js current

# Bump versions
node scripts/version-manager-enhanced.js bump patch    # 1.0.0 → 1.0.1
node scripts/version-manager-enhanced.js bump minor    # 1.0.1 → 1.1.0
node scripts/version-manager-enhanced.js bump major    # 1.1.0 → 2.0.0

# Pre-release versions
node scripts/version-manager-enhanced.js bump prepatch  # 1.0.0 → 1.0.1-alpha.0
node scripts/version-manager-enhanced.js bump preminor  # 1.0.1 → 1.1.0-alpha.0
node scripts/version-manager-enhanced.js bump premajor  # 1.1.0 → 2.0.0-alpha.0

# Create pre-release from current version
node scripts/version-manager-enhanced.js prerelease alpha  # 1.0.0 → 1.0.1-alpha.0
node scripts/version-manager-enhanced.js prerelease beta   # 1.0.1-alpha.0 → 1.0.1-beta.0
node scripts/version-manager-enhanced.js prerelease rc     # 1.0.1-beta.0 → 1.0.1-rc.0

# Generate changelog
node scripts/version-manager-enhanced.js changelog

# Create release (Git tag)
node scripts/version-manager-enhanced.js release

# Show version report
node scripts/version-manager-enhanced.js report

# List Git tags
node scripts/version-manager-enhanced.js tags
```

### Semantic Versioning Validator

The validator (`scripts/validate-semver.js`) checks compliance with Semantic Versioning 2.0.0.

#### Usage

```bash
# Validate versioning compliance
node scripts/validate-semver.js
```

## Workflow

### 1. Development

During development, follow these practices:

1. Use conventional commit messages:

   - `feat:` for new features (MINOR version)
   - `fix:` for bug fixes (PATCH version)
   - `feat!:` or `BREAKING CHANGE:` for breaking changes (MAJOR version)

2. Make changes to the codebase with descriptive commit messages

3. Push changes to the repository

### 2. Version Bumping

When ready to create a new version:

1. Determine the version increment type based on changes:

   - **PATCH**: Only bug fixes and non-breaking changes
   - **MINOR**: New features that are backward-compatible
   - **MAJOR**: Breaking changes

2. Run the appropriate bump command:

   ```bash
   # For bug fixes
   node scripts/version-manager-enhanced.js bump patch

   # For new features
   node scripts/version-manager-enhanced.js bump minor

   # For breaking changes
   node scripts/version-manager-enhanced.js bump major
   ```

### 3. Pre-release Process

For testing new features before official release:

1. Create alpha releases for internal testing:

   ```bash
   node scripts/version-manager-enhanced.js bump preminor
   # or
   node scripts/version-manager-enhanced.js prerelease alpha
   ```

2. Progress to beta for limited external testing:

   ```bash
   node scripts/version-manager-enhanced.js prerelease beta
   ```

3. Create release candidates for final testing:

   ```bash
   node scripts/version-manager-enhanced.js prerelease rc
   ```

4. Finalize the release:
   ```bash
   node scripts/version-manager-enhanced.js bump minor  # Remove pre-release tag
   ```

### 4. Release Creation

To create an official release:

1. Ensure version is correct:

   ```bash
   node scripts/version-manager-enhanced.js current
   ```

2. Validate Semantic Versioning compliance:

   ```bash
   node scripts/validate-semver.js
   ```

3. Generate changelog:

   ```bash
   node scripts/version-manager-enhanced.js changelog
   ```

4. Create Git tag and GitHub release:
   ```bash
   node scripts/version-manager-enhanced.js release
   ```

## Commit Message Guidelines

Follow conventional commits for automatic version detection:

| Type               | Version Impact | Description              |
| ------------------ | -------------- | ------------------------ |
| `feat:`            | MINOR          | New feature              |
| `fix:`             | PATCH          | Bug fix                  |
| `feat!:`           | MAJOR          | Breaking feature         |
| `BREAKING CHANGE:` | MAJOR          | Explicit breaking change |
| `docs:`            | PATCH          | Documentation            |
| `style:`           | PATCH          | Code style               |
| `refactor:`        | PATCH          | Refactoring              |
| `perf:`            | PATCH          | Performance              |
| `test:`            | PATCH          | Tests                    |
| `build:`           | PATCH          | Build system             |
| `ci:`              | PATCH          | CI config                |
| `chore:`           | PATCH          | Maintenance              |

Examples:

```bash
feat: add new user dashboard
fix: resolve login issue
feat!: remove deprecated API endpoint
docs: update API documentation
refactor!: restructure authentication module
```

## Changelog Management

The system automatically generates changelog entries grouped by change type:

- **BREAKING CHANGES** - Highlighted first
- **Features** - New functionality
- **Bug Fixes** - Resolved issues
- **Performance Improvements** - Optimizations
- **Documentation** - Docs updates
- **Style** - Formatting changes
- **Refactor** - Code restructuring
- **Tests** - Test updates
- **Build System** - Build changes
- **Continuous Integration** - CI updates
- **Chores** - Maintenance tasks

## Pre-release Types

NormalDANCE uses three pre-release types:

1. **Alpha** (`alpha`) - Early development versions for internal testing
2. **Beta** (`beta`) - Feature-complete versions for limited external testing
3. **Release Candidate** (`rc`) - Near-final versions for production testing

## Build Metadata

Build metadata is used to track:

- Build timestamps
- Git commit hashes
- CI/CD pipeline information
- Environment details

Example: `1.5.0+build.20251009.sha.abc1234.env.prod`

## Integration with CI/CD

The versioning system integrates with GitHub Actions:

1. **Version Detection**: Analyzes commit messages to determine version type
2. **Automatic Bumping**: Updates version in package.json
3. **Changelog Generation**: Creates changelog entries
4. **Release Creation**: Generates Git tags and GitHub releases
5. **Validation**: Ensures SemVer compliance

## Best Practices

### Version Management

1. Only increment versions when releasing
2. Never decrement version numbers
3. Maintain consistent versioning across components
4. Document breaking changes clearly

### Pre-releases

1. Clearly label pre-release versions
2. Communicate pre-release status to users
3. Progress systematically through pre-release stages
4. Gather feedback during pre-release phases

### Documentation

1. Update version in documentation
2. Maintain changelog accuracy
3. Provide migration guides for breaking changes
4. Document version-specific features

### Validation

1. Run SemVer validator before releases
2. Check version increment logic
3. Validate Git tag format
4. Ensure package.json version consistency

## Troubleshooting

### Common Issues

1. **Version validation fails**

   - Check package.json version format
   - Verify Git tags follow SemVer
   - Ensure version increments are correct

2. **Changelog not generated**

   - Verify Git history is accessible
   - Check commit message format
   - Ensure proper permissions

3. **Release creation fails**
   - Check Git tag permissions
   - Verify repository access
   - Confirm version doesn't already exist

### Recovery Procedures

1. **Incorrect version bump**

   - Manually edit package.json
   - Create new correct version
   - Document the correction

2. **Failed release**
   - Delete incorrect Git tag
   - Fix underlying issue
   - Retry release process

## Support

For questions about the versioning system:

- **Documentation**: See `docs/semantic-versioning-2.0.0-strategy.md`
- **Issues**: Create GitHub issues in the repository
- **Contact**: NormalDANCE DevOps Team

---

**Version**: 1.0.0  
**Last Updated**: 2025-10-09  
**Compliance**: Semantic Versioning 2.0.0
