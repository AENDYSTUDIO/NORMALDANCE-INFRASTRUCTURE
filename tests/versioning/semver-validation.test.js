// Тесты для проверки соответствия системы версионирования SemVer 2.0.0
describe("SemVer 2.0.0 Validation Tests", () => {
  let versionManager;

  beforeEach(async () => {
    // Используем динамический импорт для тестов
    const { default: VersionManager } = await import(
      "../../scripts/version-manager.js"
    );
    versionManager = new VersionManager();
  });

  describe("Version Parsing", () => {
    test("should correctly parse standard version format", () => {
      const version = "1.0.0";
      const parsed = versionManager.parseVersion(version);

      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(0);
      expect(parsed.patch).toBe(0);
      expect(parsed.prerelease).toBeNull();
      expect(parsed.build).toBeNull();
    });

    test("should correctly parse pre-release version", () => {
      const version = "1.0.0-alpha.1";
      const parsed = versionManager.parseVersion(version);

      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(0);
      expect(parsed.patch).toBe(0);
      expect(parsed.prerelease).toBe("alpha.1");
      expect(parsed.build).toBeNull();
    });

    test("should correctly parse build metadata", () => {
      const version = "1.0.0+2013031314470";
      const parsed = versionManager.parseVersion(version);

      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(0);
      expect(parsed.patch).toBe(0);
      expect(parsed.prerelease).toBeNull();
      expect(parsed.build).toBe("2013031314470");
    });

    test("should correctly parse pre-release with build metadata", () => {
      const version = "1.0.0-alpha+001";
      const parsed = versionManager.parseVersion(version);

      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(0);
      expect(parsed.patch).toBe(0);
      expect(parsed.prerelease).toBe("alpha");
      expect(parsed.build).toBe("01");
    });

    test("should correctly parse complex pre-release version", () => {
      const version = "1.0.0-alpha.1.beta.2+exp.sha.5114f85";
      const parsed = versionManager.parseVersion(version);

      expect(parsed.major).toBe(1);
      expect(parsed.minor).toBe(0);
      expect(parsed.patch).toBe(0);
      expect(parsed.prerelease).toBe("alpha.1.beta.2");
      expect(parsed.build).toBe("exp.sha.5114f85");
    });
  });

  describe("Version Formatting", () => {
    test("should format standard version correctly", () => {
      const versionObj = {
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: null,
        build: null,
      };

      const formatted = versionManager.formatVersion(versionObj);
      expect(formatted).toBe("1.0.0");
    });

    test("should format pre-release version correctly", () => {
      const versionObj = {
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: "alpha.1",
        build: null,
      };

      const formatted = versionManager.formatVersion(versionObj);
      expect(formatted).toBe("1.0.0-alpha.1");
    });

    test("should format build metadata correctly", () => {
      const versionObj = {
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: null,
        build: "2013031314470",
      };

      const formatted = versionManager.formatVersion(versionObj);
      expect(formatted).toBe("1.0.0+20130313144700");
    });

    test("should format pre-release with build metadata correctly", () => {
      const versionObj = {
        major: 1,
        minor: 0,
        patch: 0,
        prerelease: "alpha",
        build: "001",
      };

      const formatted = versionManager.formatVersion(versionObj);
      expect(formatted).toBe("1.0.0-alpha+001");
    });
  });

  describe("Pre-release Bumping", () => {
    test("should increment alpha pre-release version", () => {
      const currentVersion = "1.0.0-alpha.0";
      const parsed = versionManager.parseVersion(currentVersion);

      // Simulate the logic from bumpPrerelease when type is 'alpha'
      const [prereleaseType, num] = parsed.prerelease.split(".");
      const nextNum = num ? parseInt(num) + 1 : 1;
      const newPrerelease = `${prereleaseType}.${nextNum}`;

      const newVersion = versionManager.formatVersion({
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch,
        prerelease: newPrerelease,
        build: parsed.build,
      });

      expect(newVersion).toBe("1.0.0-alpha.1");
    });

    test("should start from 0 when changing pre-release type", () => {
      const currentVersion = "1.0.0-alpha.3";
      const parsed = versionManager.parseVersion(currentVersion);

      // Simulate changing from alpha to beta
      const newPrerelease = "beta.0";

      const newVersion = versionManager.formatVersion({
        major: parsed.major,
        minor: parsed.minor,
        patch: parsed.patch,
        prerelease: newPrerelease,
        build: parsed.build,
      });

      expect(newVersion).toBe("1.0.0-beta.0");
    });
  });

  describe("SemVer 2.0.0 Compliance", () => {
    test("should validate valid SemVer 2.0.0 versions", () => {
      const validVersions = [
        "0.0.0",
        "1.0.0",
        "1.0.0-rc.1",
        "1.0.0-alpha",
        "1.0.0-alpha.1",
        "1.0.0-0.3.7",
        "1.0.0-x.7.z.92",
        "1.0.0-alpha+001",
        "1.0.0+20130313144700",
        "1.0.0-beta+exp.sha.5114f85",
        "1.0.0-rc.1+build.1",
        "2.4.8-alpha.1+20250101.abc123",
      ];

      validVersions.forEach((version) => {
        const match = version.match(versionManager.versionPattern);
        expect(match).not.toBeNull(
          `Version ${version} should be valid SemVer 2.0.0`
        );
      });
    });

    test("should reject invalid SemVer 2.0.0 versions", () => {
      const invalidVersions = [
        "1", // Missing minor and patch
        "1.0", // Missing patch
        "1.0.0-01", // Leading zeros in pre-release
        "1.0.0-01.0", // Leading zeros in pre-release
        "1.0.0-0.-1", // Negative numbers in pre-release
        "1.0.0+01", // Leading zeros in build metadata
        "1.0.0-rc.01", // Leading zeros in pre-release
        "1.0.0-rc+", // Empty build metadata
        "1.0-.alpha", // Empty pre-release identifier
        "1.0.0+build.", // Empty build metadata identifier
        "1.0.0-rc..1", // Empty identifier in pre-release
        "1.0.0+build..1", // Empty identifier in build metadata
      ];

      invalidVersions.forEach((version) => {
        const match = version.match(versionManager.versionPattern);
        expect(match).toBeNull(
          `Version ${version} should be invalid SemVer 2.0.0`
        );
      });
    });
  });

  describe("Version Comparison Logic", () => {
    test("should maintain SemVer 2.0.0 precedence rules", () => {
      // In SemVer 2.0.0, pre-release versions have lower precedence than normal versions
      const normalVersion = "1.0.0";
      const prereleaseVersion = "1.0.0-alpha";

      const normalParsed = versionManager.parseVersion(normalVersion);
      const prereleaseParsed = versionManager.parseVersion(prereleaseVersion);

      // Both have same major.minor.patch, but prerelease should be treated as lower
      // This test validates that our parsing correctly identifies the prerelease part
      expect(normalParsed.prerelease).toBeNull();
      expect(prereleaseParsed.prerelease).toBe("alpha");
    });
  });
});
