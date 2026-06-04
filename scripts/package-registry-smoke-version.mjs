export const packageReleaseVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u;

export function assertRegistrySmokeVersion({ version, expectedVersion, expectedVersions }) {
  if (!version) {
    throw new Error(
      `BESLISMODEL_REGISTRY_SMOKE_VERSION is required, or run npm run check:package-registry-smoke:current for ${expectedVersion}`,
    );
  }
  if (expectedVersions.size !== 1) {
    throw new Error(
      `Registry smoke requires one package version, got ${[...expectedVersions].join(", ")}`,
    );
  }
  if (version !== expectedVersion) {
    throw new Error(
      `BESLISMODEL_REGISTRY_SMOKE_VERSION must equal package version ${expectedVersion}`,
    );
  }
  if (!packageReleaseVersionPattern.test(version)) {
    throw new Error(
      `BESLISMODEL_REGISTRY_SMOKE_VERSION must be a stable semver or semver prerelease, got ${version}`,
    );
  }
}
