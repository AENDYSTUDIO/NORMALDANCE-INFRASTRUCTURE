# SecurityManager Implementation & Deduplication Plan

## Current State Analysis

From the search results, I can see the following security utilities exist:

### Existing Files:

1. **SecurityManager.ts** - Basic implementation with ISecurityService interface
2. **xss-csrf.ts** - Comprehensive XSS/CSRF protection with context-aware sanitization
3. **sanitize.ts** - Unified sanitizers importing from xss-csrf.ts
4. **telegram-validator.ts** - Telegram Mini App security validation
5. **security-utils.ts** - Basic security utilities (number validation, suspicious pattern detection)
6. **index.ts** - Main security module exports

### Identified Overlaps:

1. **XSS/CSRF functionality** exists in both `xss-csrf.ts` and `sanitize.ts`
2. **Sanitization functions** are duplicated across multiple files
3. **Security utilities** are scattered across different modules

## Implementation Plan

### Phase 1: SecurityManager Enhancement

1. **Enhance SecurityManager.ts** with:
   - CSP integration from config/csp.ts
   - Rate limiting capabilities
   - KMS/MPC integrations for secure keys and sessions
   - STRIDE threat model implementation
   - Centralized error handling

### Phase 2: Deduplication

1. **Compare input-sanitizer.ts and input-validator.ts**:

   - Identify overlapping validation functions
   - Keep unified versions in SecurityManager
   - Create legacy layer with @deprecated warnings

2. **Deduplicate xss-csrf.ts, sanitize.ts, and BaseValidator.ts**:

   - Move all sanitization functions to sanitize.ts
   - Create unified export interface
   - Implement legacy compatibility layer

3. **Move sanitizeFilename**:
   - Transfer from input-sanitizer to sanitize.ts
   - Add comprehensive tests

### Phase 3: Integration & Testing

1. **Update index.ts** with unified exports and legacy aliases
2. **Implement STRIDE threat model** for:
   - Authentication security
   - Payment security
   - Web3 transaction security
3. **Ensure ≥90% test coverage** for critical security paths
4. **Verify SAST/DAST compliance** and CSP enablement

## Technical Architecture

### SecurityManager Enhanced Features:

```typescript
class SecurityManager implements ISecurityService {
  // Enhanced features:
  - CSP header generation from config/csp.ts
  - Rate limiting with configurable thresholds
  - KMS/MPC integration for key management
  - STRIDE threat modeling
  - Centralized error handling and logging
  - Unified sanitization interface
}
```

### Deduplication Strategy:

1. **sanitize.ts** becomes the single source of truth for all sanitization
2. **xss-csrf.ts** provides core implementation details
3. **SecurityManager** provides unified API layer
4. **Legacy aliases** maintain backward compatibility

### CSP Integration:

- Import `getCspHeader` from config/csp.ts
- Integrate with SecurityManager's `getSecurityHeaders()` method
- Ensure CSP is enabled by default

## Implementation Steps

1. **Enhance SecurityManager** with CSP integration and advanced features
2. **Deduplicate utilities** by analyzing overlaps and creating unified implementations
3. **Create legacy layer** with @deprecated warnings for backward compatibility
4. **Update index.ts** with unified exports
5. **Implement comprehensive testing** with ≥90% coverage
6. **Verify security metrics** and compliance

## Success Criteria

- SecurityManager with unified sanitization, XSS/CSRF, CSP headers
- Rate limiting and centralized error handling
- KMS/MPC integrations for secure keys and sessions
- STRIDE threat model implementation
- Deduplicated security utilities with legacy compatibility
- ≥90% test coverage for critical security paths
- SAST/DAST compliance with CSP enabled by default
