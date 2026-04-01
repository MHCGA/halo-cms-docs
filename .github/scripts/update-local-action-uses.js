import fs from "node:fs/promises";
import path from "node:path";

const defaultActionRoot = path.join(".github", "actions");
const targetFilesFromArgs = process.argv.slice(2);
const releaseCooldownMs = 24 * 60 * 60 * 1000;

const collectActionYamlFiles = async (directoryPath) => {
  const absoluteDirectoryPath = path.resolve(process.cwd(), directoryPath);
  const dirEntries = await fs.readdir(absoluteDirectoryPath, { withFileTypes: true });
  const filePaths = [];

  for (const entry of dirEntries) {
    const relativePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...(await collectActionYamlFiles(relativePath)));
      continue;
    }

    if (entry.isFile() && entry.name === "action.yml") {
      filePaths.push(relativePath);
    }
  }

  return filePaths.sort((left, right) => left.localeCompare(right));
};

const githubToken = process.env.GITHUB_TOKEN ?? "";
const githubRepository = process.env.GITHUB_REPOSITORY ?? "local-action-updater";
const usesPattern =
  /^(\s*-?\s*uses:\s*)([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_./-]+)?)@([^\s#]+)(\s*(#.*)?)$/u;
const commitRefPattern = /^[0-9a-f]{7,40}$/iu;
const releaseTagUrlPattern = /\/releases\/tag\/([^/\s#]+)$/u;
const latestReleaseCache = new Map();
const repoMetadataCache = new Map();
const tagCommitCache = new Map();
const githubHeaders = {
  Accept: "application/vnd.github+json",
  "User-Agent": githubRepository,
  "X-GitHub-Api-Version": "2022-11-28",
};

if (githubToken) {
  githubHeaders.Authorization = `Bearer ${githubToken}`;
}

const appendGitHubOutput = (name, value) => {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    return;
  }

  return fs.appendFile(outputPath, `${name}=${value}\n`);
};

const parseStableSemVer = (tag) => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/u.exec(tag);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    tag,
  };
};

const parseTimestamp = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue === "") {
    return null;
  }

  const timestamp = Date.parse(normalizedValue);

  if (Number.isNaN(timestamp)) {
    return null;
  }

  return timestamp;
};

const extractRepositoryName = (usesTarget) => usesTarget.split("/").slice(0, 2).join("/");

const isCommitRef = (ref) => commitRefPattern.test(ref);

const extractSemVerTagFromComment = (comment) => {
  if (!comment.includes("#")) {
    return null;
  }

  const releaseTagUrlMatch = comment.match(releaseTagUrlPattern);

  if (releaseTagUrlMatch && /^v?\d+(?:\.\d+\.\d+)?$/u.test(releaseTagUrlMatch[1])) {
    return releaseTagUrlMatch[1];
  }

  const inlineTagMatch = comment.match(/#\s*(v?\d+(?:\.\d+\.\d+)?)\b/u);
  return inlineTagMatch ? inlineTagMatch[1] : null;
};

const replaceCommentTag = (comment, currentTag, nextTag) => {
  if (!comment || currentTag === nextTag) {
    return comment;
  }

  return comment
    .replace(`/releases/tag/${currentTag}`, `/releases/tag/${nextTag}`)
    .replace(
      new RegExp(`(^|#\\s*)${currentTag.replace(/\./gu, "\\.")}(?=\\b)`, "u"),
      (_, prefix) => `${prefix}${nextTag}`,
    );
};

const resolveTargetRef = (currentRef, latestVersion) => {
  const hasVPrefix = currentRef.startsWith("v");

  if (/^v?\d+$/u.test(currentRef)) {
    return `${hasVPrefix ? "v" : ""}${latestVersion.major}`;
  }

  if (/^v?\d+\.\d+\.\d+$/u.test(currentRef)) {
    return `${hasVPrefix ? "v" : ""}${latestVersion.major}.${latestVersion.minor}.${latestVersion.patch}`;
  }

  return null;
};

const getReleaseCooldownThreshold = () => Date.now() - releaseCooldownMs;

const hasReleaseClearedCooldown = (publishedAt, cooldownThreshold = getReleaseCooldownThreshold()) => {
  const timestamp = parseTimestamp(publishedAt);

  if (timestamp === null) {
    throw new Error(`Invalid published timestamp: ${publishedAt || "<empty>"}`);
  }

  return timestamp <= cooldownThreshold;
};

const logLatestReleaseStatus = (repository, latestRelease) => {
  if (latestRelease.eligible) {
    console.log(
      `Resolved ${repository} latest release ${latestRelease.latestVersion.tag} published at ${latestRelease.publishedAt}`,
    );
    return;
  }

  if (latestRelease.skipReason === "missing_latest_release") {
    console.log(
      `Skipped ${repository} because GitHub does not expose a latest release, so a strict 24-hour cooldown cannot be verified`,
    );
    return;
  }

  if (latestRelease.skipReason === "unsupported_latest_release") {
    console.log(
      `Skipped ${repository} because the current latest release cannot be mapped to a stable semver tag`,
    );
    return;
  }

  console.log(
    `Skipped ${repository} because latest release ${latestRelease.latestVersion.tag} was published at ${latestRelease.publishedAt} and has not reached the 24-hour cooldown`,
  );
};

const fetchRepositoryMetadata = async (repository) => {
  const cached = repoMetadataCache.get(repository);

  if (cached) {
    return cached;
  }

  const response = await fetch(`https://api.github.com/repos/${repository}`, {
    headers: githubHeaders,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch repository metadata for ${repository}: ${response.status} ${response.statusText}`);
  }

  const metadata = await response.json();
  repoMetadataCache.set(repository, metadata);
  return metadata;
};

const fetchLatestStableRelease = async (repository) => {
  const cached = latestReleaseCache.get(repository);

  if (cached) {
    return cached;
  }

  const response = await fetch(`https://api.github.com/repos/${repository}/releases/latest`, {
    headers: githubHeaders,
  });

  if (response.status === 404) {
    const latestRelease = {
      eligible: false,
      latestVersion: null,
      publishedAt: null,
      skipReason: "missing_latest_release",
    };

    latestReleaseCache.set(repository, latestRelease);
    logLatestReleaseStatus(repository, latestRelease);
    return latestRelease;
  }

  if (!response.ok) {
    throw new Error(
      `Failed to fetch the latest release for ${repository}: ${response.status} ${response.statusText}`,
    );
  }

  const release = await response.json();
  const latestVersion = parseStableSemVer(release.tag_name);
  const publishedAt = typeof release.published_at === "string" ? release.published_at : null;

  if (!latestVersion || publishedAt === null || release.draft === true || release.prerelease === true) {
    const latestRelease = {
      eligible: false,
      latestVersion,
      publishedAt,
      skipReason: "unsupported_latest_release",
    };

    latestReleaseCache.set(repository, latestRelease);
    logLatestReleaseStatus(repository, latestRelease);
    return latestRelease;
  }

  const latestRelease = {
    eligible: hasReleaseClearedCooldown(publishedAt),
    publishedAt,
    latestVersion,
    skipReason: null,
  };

  latestReleaseCache.set(repository, latestRelease);
  logLatestReleaseStatus(repository, latestRelease);
  return latestRelease;
};

const fetchCommitShaForTag = async (repository, tag) => {
  const cacheKey = `${repository}@${tag}`;
  const cached = tagCommitCache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const response = await fetch(`https://api.github.com/repos/${repository}/git/ref/tags/${encodeURIComponent(tag)}`, {
    headers: githubHeaders,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tag ref for ${repository}@${tag}: ${response.status} ${response.statusText}`);
  }

  const refData = await response.json();
  let commitSha = refData.object.sha;

  if (refData.object.type === "tag") {
    const annotatedTagResponse = await fetch(`https://api.github.com/repos/${repository}/git/tags/${commitSha}`, {
      headers: githubHeaders,
    });

    if (!annotatedTagResponse.ok) {
      throw new Error(
        `Failed to resolve annotated tag for ${repository}@${tag}: ${annotatedTagResponse.status} ${annotatedTagResponse.statusText}`,
      );
    }

    const annotatedTag = await annotatedTagResponse.json();
    commitSha = annotatedTag.object.sha;
  }

  tagCommitCache.set(cacheKey, commitSha);
  return commitSha;
};

const fetchDefaultBranchHeadSha = async (repository) => {
  const metadata = await fetchRepositoryMetadata(repository);
  const response = await fetch(`https://api.github.com/repos/${repository}/commits/${metadata.default_branch}`, {
    headers: githubHeaders,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch default branch HEAD for ${repository}: ${response.status} ${response.statusText}`);
  }

  const commit = await response.json();
  return commit.sha;
};

const buildCommitRefUpdate = async (repository, currentRef, suffix) => {
  const commentTag = extractSemVerTagFromComment(suffix);

  if (!commentTag) {
    const targetRef = await fetchDefaultBranchHeadSha(repository);
    return {
      nextRef: targetRef,
      nextSuffix: suffix,
      summary: `${currentRef} -> ${targetRef.slice(0, 12)}`,
    };
  }

  const latestRelease = await fetchLatestStableRelease(repository);

  // Keep release-based updates pinned to the current tracked version until the
  // newest GitHub latest release has been published for at least 24 hours.
  if (!latestRelease.eligible) {
    return null;
  }

  const targetTag = resolveTargetRef(commentTag, latestRelease.latestVersion);

  if (!targetTag) {
    return null;
  }

  const targetRef = await fetchCommitShaForTag(repository, targetTag);
  return {
    nextRef: targetRef,
    nextSuffix: replaceCommentTag(suffix, commentTag, targetTag),
    summary: `${currentRef.slice(0, 12)} -> ${targetRef.slice(0, 12)} (${commentTag} -> ${targetTag})`,
  };
};

const updateFile = async (filePath) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const originalContent = await fs.readFile(absolutePath, "utf8");
  const lineEnding = originalContent.includes("\r\n") ? "\r\n" : "\n";
  const lines = originalContent.split(/\r?\n/u);
  const updates = [];

  for (const [index, line] of lines.entries()) {
    const match = line.match(usesPattern);

    if (!match) {
      continue;
    }

    const [, prefix, usesTarget, currentRef, suffix = ""] = match;
    const repository = extractRepositoryName(usesTarget);
    let update = null;

    if (isCommitRef(currentRef)) {
      update = await buildCommitRefUpdate(repository, currentRef, suffix);
    } else {
      const latestRelease = await fetchLatestStableRelease(repository);

      if (!latestRelease.eligible) {
        continue;
      }

      const targetVersion = resolveTargetRef(currentRef, latestRelease.latestVersion);

      if (targetVersion) {
        update = {
          nextRef: targetVersion,
          nextSuffix: replaceCommentTag(suffix, currentRef, targetVersion),
          summary: `${currentRef} -> ${targetVersion}`,
        };
      }
    }

    if (!update) {
      continue;
    }

    if (update.nextRef === currentRef && update.nextSuffix === suffix) {
      continue;
    }

    lines[index] = `${prefix}${usesTarget}@${update.nextRef}${update.nextSuffix}`;
    updates.push(`${usesTarget}: ${update.summary}`);
  }

  if (updates.length === 0) {
    return [];
  }

  await fs.writeFile(absolutePath, lines.join(lineEnding));
  return updates;
};

const targetFiles =
  targetFilesFromArgs.length > 0 ? targetFilesFromArgs : await collectActionYamlFiles(defaultActionRoot);

if (targetFiles.length === 0) {
  console.error(`No action.yml files found under ${defaultActionRoot}`);
  process.exit(1);
}

if (targetFilesFromArgs.length === 0) {
  console.log(`Scanning ${defaultActionRoot}/**/action.yml`);
}

const updateGroups = [];
const cooldownThreshold = getReleaseCooldownThreshold();

console.log("Applying latest-only release cooldown: 24 elapsed hours");
console.log(`Release cutoff: ${new Date(cooldownThreshold).toISOString()}`);

for (const filePath of targetFiles) {
  const updates = await updateFile(filePath);

  if (updates.length === 0) {
    console.log(`No updates found in ${filePath}`);
    continue;
  }

  console.log(`Updated ${filePath}`);

  for (const update of updates) {
    console.log(`- ${update}`);
  }

  updateGroups.push({ filePath, updates });
}

const updatedFiles = updateGroups.map(({ filePath }) => filePath);
const updateCount = updateGroups.reduce((total, { updates }) => total + updates.length, 0);

await appendGitHubOutput("changed", updateGroups.length > 0 ? "true" : "false");
await appendGitHubOutput("update_count", String(updateCount));
await appendGitHubOutput("updated_files", updatedFiles.join(","));
