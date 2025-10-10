# Semantic Versioning 2.0.0 Strategy for NormalDANCE

## Overview

This document outlines the implementation of Semantic Versioning (SemVer) 2.0.0 for the NormalDANCE project. Semantic Versioning is a set of rules and requirements that dictate how version numbers are assigned and incremented.

## Version Format

NormalDANCE versions follow the format `MAJOR.MINOR.PATCH`:

- **MAJOR** version: Incremented when making incompatible API changes
- **MINOR** version: Incremented when adding functionality in a backward-compatible manner
- **PATCH** version: Incremented when making backward-compatible bug fixes

Additional labels for pre-release and build metadata are available as extensions to the `MAJOR.MINOR.PATCH` format.

## Pre-release Versions

Pre-release versions may be denoted by appending a hyphen and a series of dot separated identifiers immediately following the patch version:

Examples:

- `1.0.0-alpha`
- `1.0.0-alpha.1`
- `1.0.0-0.3.7`
- `1.0.0-x.7.z.92`
- `1.0.0-beta.1`
- `1.0.0-rc.1`

### Pre-release Types

NormalDANCE uses the following pre-release types:

1. **Alpha** (`alpha`): Early development versions for internal testing
2. **Beta** (`beta`): Versions for external testing with limited audience
3. **Release Candidate** (`rc`): Near-final versions ready for production testing

## Build Metadata

Build metadata may be denoted by appending a plus sign and a series of dot separated identifiers immediately following the patch or pre-release version:

Examples:

- `1.0.0+20130313144700`
- `1.0.0+exp.sha.5114f85`
- `1.0.0-alpha+exp.sha.514f85`

## Version Increment Rules

### Patch Version (Z)

Incremented when:

- Bug fixes that do not affect the API
- Performance improvements
- Documentation updates
- Security patches that don't break compatibility
- Code refactoring that doesn't change functionality

### Minor Version (Y)

Incremented when:

- New functionality that is backward-compatible
- New API endpoints
- Deprecation of existing functionality (but not removal)
- Substantial new features
- Minor dependency updates

### Major Version (X)

Incremented when:

- Incompatible API changes
- Removing deprecated functionality
- Major architectural changes
- Breaking changes to existing APIs
- Major dependency upgrades that break compatibility

## Commit Message Conventions

To automate version detection, NormalDANCE follows conventional commit messages:

| Commit Type        | Version Impact | Description              |
| ------------------ | -------------- | ------------------------ |
| `feat:`            | MINOR          | New feature              |
| `fix:`             | PATCH          | Bug fix                  |
| `feat!:`           | MAJOR          | Breaking change feature  |
| `BREAKING CHANGE:` | MAJOR          | Explicit breaking change |
| `docs:`            | PATCH          | Documentation changes    |
| `style:`           | PATCH          | Code style changes       |
| `refactor:`        | PATCH          | Code refactoring         |
| `perf:`            | PATCH          | Performance improvements |
| `test:`            | PATCH          | Test changes             |
| `build:`           | PATCH          | Build system changes     |
| `ci:`              | PATCH          | CI configuration changes |
| `chore:`           | PATCH          | Maintenance tasks        |

## Pre-release Workflow

### Alpha Releases

1. Initial development versions
2. Internal testing only
3. May be unstable
4. Version format: `x.y.z-alpha.n`

### Beta Releases

1. Feature-complete versions
2. Limited external testing
3. More stable than alpha
4. Version format: `x.y.z-beta.n`

### Release Candidates

1. Near-final versions
2. Extensive testing
3. Production-like environment testing
4. Version format: `x.y.z-rc.n`

## Build Metadata Usage

Build metadata is used to track:

- Build timestamps
- Git commit hashes
- CI/CD pipeline information
- Environment information

Example: `1.5.0+build.20251009.sha.abc1234.env.prod`

## Version Management Tools

### Version Manager Script

The enhanced version manager script (`scripts/version-manager-enhanced.js`) provides:

1. **Version Bumping**:

   - `bump patch` - Increment patch version
   - `bump minor` - Increment minor version
   - `bump major` - Increment major version
   - `bump prepatch` - Create pre-release of next patch version
   - `bump preminor` - Create pre-release of next minor version
   - `bump premajor` - Create pre-release of next major version

2. **Pre-release Creation**:

   - `prerelease alpha` - Create alpha pre-release
   - `prerelease beta` - Create beta pre-release
   - `prerelease rc` - Create release candidate

3. **Version Information**:
   - `current` - Show current version
   - `report` - Generate version report
   - `tags` - List version tags
   - `changelog` - Generate changelog

### Package.json Integration

The version is stored in `package.json` and automatically updated by the version manager:

```json
{
  "version": "1.0.4"
}
```

## Changelog Management

### Format

Changelogs follow the Keep a Changelog format with additional sections:

```markdown
## [1.0.4] - 2025-10-09

### ⚠️ BREAKING CHANGES

- Description of breaking changes

### ✨ Features

- New feature description

### 🐛 Bug Fixes

- Bug fix description

### ⚡ Performance Improvements

- Performance improvement description

### 📚 Documentation

- Documentation update description

### 💅 Style

- Style change description

### 🔧 Refactor

- Refactoring description

### 🧪 Tests

- Test update description

### 🏗️ Build System

- Build system change description

### 🔄 Continuous Integration

- CI change description

### 🔄 Chores

- Maintenance task description
```

### Automation

The version manager automatically:

1. Generates changelog entries based on commit messages
2. Updates the CHANGELOG.md file
3. Maintains chronological order of releases

## Release Process

### 1. Development Phase

1. Developers make changes with conventional commit messages
2. Changes are merged to development branches
3. CI/CD pipeline runs tests and validation

### 2. Pre-release Phase

1. Create pre-release versions for testing
2. Deploy to test environments
3. Gather feedback and fix issues
4. Progress through alpha → beta → rc stages

### 3. Release Phase

1. Final validation in release candidate
2. Create final version (remove pre-release tag)
3. Generate and publish release artifacts
4. Deploy to production
5. Create Git tag and GitHub release

### 4. Post-release

1. Update documentation
2. Notify stakeholders
3. Monitor for issues
4. Plan next version

## Branch Strategy Integration

### Main Branch

- Contains production-ready code
- Releases are created from this branch
- Only stable versions are merged here

### Development Branch

- Active development happens here
- Pre-release versions are created from this branch
- Feature branches are merged here

### Feature Branches

- Individual features are developed here
- Follow naming convention: `feature/feature-name`
- Use conventional commit messages

### Release Branches

- Created for major releases
- Follow naming convention: `release/vX.Y.Z`
- Stabilization happens here

## Compatibility Guidelines

### API Compatibility

1. Maintain backward compatibility in MINOR releases
2. Document deprecated features
3. Provide migration guides for breaking changes
4. Maintain API documentation

### Database Compatibility

1. Schema changes in MAJOR versions only
2. Provide migration scripts
3. Maintain backward compatibility when possible
4. Document breaking schema changes

### Dependency Compatibility

1. Pin major versions of critical dependencies
2. Test with dependency updates
3. Document compatibility requirements
4. Provide upgrade guides

## Security Considerations

### Version Security

1. Security patches are released as PATCH versions
2. Critical security issues may warrant MAJOR version increment
3. Security advisories are published with affected versions
4. Backport security fixes to supported versions

### Pre-release Security

1. Pre-releases may contain security vulnerabilities
2. Not recommended for production use
3. Security testing is performed but may be incomplete
4. Report security issues in pre-releases

## Monitoring and Analytics

### Version Tracking

1. Track version adoption
2. Monitor for issues in specific versions
3. Measure upgrade patterns
4. Identify popular versions

### Release Metrics

1. Time between releases
2. Number of changes per release
3. Type of changes per release
4. User feedback on releases

## Best Practices

### Development

1. Use conventional commit messages
2. Follow the commit message types table
3. Write clear, descriptive commit messages
4. Reference issues and pull requests

### Versioning

1. Increment versions only when releasing
2. Never decrement version numbers
3. Maintain consistent versioning across all components
4. Document breaking changes clearly

### Pre-releases

1. Clearly label pre-release versions
2. Communicate pre-release status to users
3. Gather feedback during pre-release phases
4. Progress systematically through pre-release stages

### Documentation

1. Update version in documentation
2. Maintain changelog accuracy
3. Provide migration guides for breaking changes
4. Document version-specific features

## Tools and Automation

### Scripts

1. `version-manager-enhanced.js` - Primary version management tool
2. `changelog-generator.js` - Automated changelog creation
3. `release-validator.js` - Release validation tool

### CI/CD Integration

1. Automated version detection from commits
2. Automatic changelog generation
3. Git tag creation
4. Release artifact generation

### GitHub Integration

1. GitHub Releases for each version
2. Pre-release tagging
3. Release notes generation
4. Asset attachment to releases

## Support Policy

### Version Support

1. Latest MAJOR version receives active support
2. Previous MAJOR version receives security updates
3. Older versions are unsupported
4. Extended support available for enterprise customers

### Upgrade Path

1. Provide clear upgrade paths
2. Document breaking changes
3. Offer migration tools when possible
4. Maintain backward compatibility guides

## Future Considerations

### Versioning Extensions

1. Consider module-specific versioning for large components
2. Evaluate calendar versioning for time-sensitive releases
3. Explore semantic versioning for documentation

### Automation Improvements

1. Enhanced commit analysis
2. Automated release notes generation
3. Integration with project management tools
4. Machine learning for version impact prediction

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-09  
**Author**: NormalDANCE DevOps Team
