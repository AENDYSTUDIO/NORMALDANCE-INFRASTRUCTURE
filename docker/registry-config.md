# Docker Registry Configuration for NormalDance

## Registry Setup

The NormalDance platform uses GitHub Container Registry (GHCR) as the primary Docker registry for storing and managing container images.

### Registry Details

- **Registry URL**: `ghcr.io`
- **Namespace**: `normaldance`
- **Repository**: `normaldance/normaldance`

### Image Tagging Strategy

- `latest` - Latest build from main branch
- `main-<commit-hash>` - Builds from main branch
- `develop-<commit-hash>` - Builds from develop branch
- `pr-<number>` - Builds from pull requests
- Semantic version tags (e.g., `v1.0.0`, `v1.0`, `v1`)

### Multi-Architecture Support

- **Platforms**: `linux/amd64`, `linux/arm64`
- **Buildx** is used for cross-platform builds
- **QEMU** emulation for multi-arch builds

### Security Configuration

- **Authentication**: GitHub Token with `packages:write` permission
- **Permissions**: Read for public access, write for CI/CD
- **Image scanning**: Enabled via GitHub security features

### Image Optimization

- **Layer caching**: GitHub Actions cache (gha)
- **BuildKit inline cache**: Enabled for faster rebuilds
- **Multi-stage builds**: Optimized for production
- **Alpine base images**: Minimize image size where possible

### Image Lifecycle

- **Retention**: Automatic cleanup of untagged images after 30 days
- **Cleanup policy**: Remove old development builds
- **Backup**: Images are backed up in GitHub's infrastructure

## CI/CD Integration

### Docker Build Process

1. **Checkout**: Code is checked out from the repository
2. **Buildx Setup**: Docker Buildx is initialized with multi-platform support
3. **Login**: Authenticate to GHCR using GitHub token
4. **Metadata**: Extract tags and labels using docker/metadata-action
5. **Build & Push**: Build and push images with layer caching
6. **Verification**: Verify image availability in registry

### Build Triggers

- **Push events**: Branch pushes to main/develop
- **Tag events**: New semantic version tags
- **Pull requests**: Verification builds for PRs
- **Manual triggers**: Workflow dispatch for emergency deployments

### Build Optimization

- **Cache strategy**: GitHub Actions cache for build layers
- **Incremental builds**: Only rebuild changed layers
- **Parallel builds**: Multiple services built simultaneously
- **Dockerfile optimization**: Multi-stage with minimal base images

## Registry Policies

### Access Control

- **Public images**: Production releases are publicly accessible
- **Private images**: Development builds are restricted to organization
- **Rate limits**: Standard GitHub Container Registry limits apply

### Image Management

- **Vulnerability scanning**: Automated security scans
- **Dependency tracking**: SBOM generation for all images
- **Image signing**: Content trust enabled
- **Manifest validation**: Ensure image integrity

## Deployment Integration

### Kubernetes Integration

- **ImagePullSecrets**: Configured for private image access
- **Rolling updates**: Zero-downtime deployments
- **Image verification**: SHA-based deployment verification
- **Rollback capability**: Quick rollback to previous versions

### Monitoring

- **Registry metrics**: Image pull statistics
- **Storage usage**: Monitor registry storage consumption
- **Image lifecycle**: Track image age and usage
- **Security alerts**: Automated vulnerability notifications
