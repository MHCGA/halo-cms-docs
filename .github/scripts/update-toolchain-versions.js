import fs from "node:fs/promises";
import path from "node:path";

const rootPackageJsonPath = "package.json";
const workflowsDirPath = path.join(".github", "workflows");
const actionsDirPath = path.join(".github", "actions");
const dryRun = process.argv.includes("--dry-run");
const releaseCooldownMs = 24 * 60 * 60 * 1000;

const appendGitHubOutput = async (name, value) => {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    return;
  }

  await fs.appendFile(outputPath, `${name}=${value}\n`);
};

const stripUtf8Bom = (content) => content.replace(/^\uFEFF/u, "");
const detectJsonIndent = (content) => {
  const match = content.match(/\n( +)"/u);
  return match ? match[1].length : 2;
};
const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");

const parseSemVer = (version) => {
  const match = /^v?(\d+)\.(\d+)\.(\d+)$/u.exec(version);

  if (!match) {
    return null;
  }

  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
};

const formatSemVer = ({ major, minor, patch }) => `${major}.${minor}.${patch}`;
const compareSemVer = (left, right) => left.major - right.major || left.minor - right.minor || left.patch - right.patch;

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

const parseMajorVersion = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^v?(\d+)$/u.exec(value.trim());
  return match ? Number(match[1]) : null;
};

const getReleaseCooldownThreshold = () => Date.now() - releaseCooldownMs;

const hasReleaseClearedCooldown = (publishedAt, cooldownThreshold = getReleaseCooldownThreshold()) => {
  const timestamp = parseTimestamp(publishedAt);

  if (timestamp === null) {
    throw new Error(`Invalid published timestamp: ${publishedAt || "<empty>"}`);
  }

  return timestamp <= cooldownThreshold;
};

const parseNodeEngineMajor = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const match = /^\s*>=\s*(\d+)\s*$/u.exec(value);
  return match ? Number(match[1]) : null;
};

const parsePinnedSemVerString = (value) => {
  if (typeof value !== "string") {
    return null;
  }

  const match = /(\d+\.\d+\.\d+)/u.exec(value);
  return match?.[1] ?? null;
};

const readPackageJsonDocument = async (filePath = rootPackageJsonPath) => {
  const absolutePath = path.resolve(process.cwd(), filePath);
  const content = stripUtf8Bom(await fs.readFile(absolutePath, { encoding: "utf8" }));

  return {
    content,
    indent: detectJsonIndent(content),
    lineEnding: content.includes("\r\n") ? "\r\n" : "\n",
    packageJson: JSON.parse(content),
  };
};

const readTrackedToolchainVersions = async () => {
  const { packageJson } = await readPackageJsonDocument();
  const nodeMajor = parseNodeEngineMajor(packageJson.engines?.node);
  const pnpmVersion =
    parsePinnedSemVerString(packageJson.packageManager) ?? parsePinnedSemVerString(packageJson.engines?.pnpm);

  if (nodeMajor === null) {
    throw new Error(`Could not determine the tracked Node.js major from ${rootPackageJsonPath}`);
  }

  if (pnpmVersion === null || !parseSemVer(pnpmVersion)) {
    throw new Error(`Could not determine the tracked pnpm version from ${rootPackageJsonPath}`);
  }

  return {
    nodeMajor,
    pnpmVersion,
  };
};

const fetchNodeReleaseSchedule = async () => {
  const response = await fetch("https://raw.githubusercontent.com/nodejs/Release/main/schedule.json", {
    headers: {
      Accept: "application/json",
      "User-Agent": "halo-cms-docs-toolchain-updater",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch the Node.js release schedule: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

const fetchLatestLtsNodeRelease = async () => {
  const schedule = await fetchNodeReleaseSchedule();
  const now = Date.now();
  const latestLtsLine = Object.entries(schedule)
    .map(([version, details]) => ({
      codename: typeof details?.codename === "string" ? details.codename : null,
      end: parseTimestamp(details?.end),
      lts: parseTimestamp(details?.lts),
      major: parseMajorVersion(version),
      version,
    }))
    .filter(({ end, lts, major }) => major !== null && lts !== null && lts <= now && (end === null || end > now))
    .sort((left, right) => right.major - left.major)[0];

  if (!latestLtsLine) {
    throw new Error("Could not determine the current latest Node.js LTS major from the release schedule");
  }

  // GitHub exposes the exact release timestamp, which we need for the 24-hour cooldown.
  const response = await fetch("https://api.github.com/repos/nodejs/node/releases?per_page=100", {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "halo-cms-docs-toolchain-updater",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Node.js GitHub releases: ${response.status} ${response.statusText}`);
  }

  const releases = await response.json();
  const latestRelease = releases
    .map((release) => ({
      draft: release.draft === true,
      prerelease: release.prerelease === true,
      publishedAt: typeof release.published_at === "string" ? release.published_at : null,
      semVer: parseSemVer(release.tag_name),
      tagName: typeof release.tag_name === "string" ? release.tag_name : "",
    }))
    .filter(
      ({ draft, prerelease, publishedAt, semVer }) =>
        !draft && !prerelease && publishedAt !== null && semVer !== null && semVer.major === latestLtsLine.major,
    )
    .sort((left, right) => compareSemVer(right.semVer, left.semVer))[0];

  if (!latestRelease) {
    throw new Error(`Could not determine the latest stable release in the current LTS major ${latestLtsLine.version}`);
  }

  return {
    major: latestRelease.semVer.major,
    ltsCodename: latestLtsLine.codename,
    ltsLine: latestLtsLine.version,
    publishedAt: latestRelease.publishedAt,
    version: formatSemVer(latestRelease.semVer),
    versionTag: latestRelease.tagName,
  };
};

const fetchLatestPnpmRelease = async () => {
  const response = await fetch("https://registry.npmjs.org/pnpm", {
    headers: {
      Accept: "application/json",
      "User-Agent": "halo-cms-docs-toolchain-updater",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch pnpm metadata: ${response.status} ${response.statusText}`);
  }

  const metadata = await response.json();
  const latestVersion = typeof metadata["dist-tags"]?.latest === "string" ? metadata["dist-tags"].latest.trim() : "";
  const latestSemVer = parseSemVer(latestVersion);
  const publishedAt = typeof metadata.time?.[latestVersion] === "string" ? metadata.time[latestVersion] : null;

  if (latestSemVer === null || publishedAt === null) {
    throw new Error("Could not determine the current latest pnpm release from npm metadata");
  }

  return {
    publishedAt,
    version: formatSemVer(latestSemVer),
  };
};

const readFileWithLineEnding = async (filePath) => {
  const content = stripUtf8Bom(await fs.readFile(path.resolve(process.cwd(), filePath), { encoding: "utf8" }));

  return {
    content,
    lineEnding: content.includes("\r\n") ? "\r\n" : "\n",
  };
};

const maybeWriteFile = async (filePath, nextContent) => {
  if (dryRun) {
    return;
  }

  await fs.writeFile(path.resolve(process.cwd(), filePath), nextContent, { encoding: "utf8" });
};

const collectFiles = async (directoryPath, matcher, options = {}) => {
  const { ignoredDirectoryNames = new Set() } = options;
  const absoluteDirectoryPath = path.resolve(process.cwd(), directoryPath);
  const dirEntries = await fs.readdir(absoluteDirectoryPath, { withFileTypes: true });
  const filePaths = [];

  for (const entry of dirEntries) {
    const relativePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      if (ignoredDirectoryNames.has(entry.name)) {
        continue;
      }

      filePaths.push(...(await collectFiles(relativePath, matcher, options)));
      continue;
    }

    if (entry.isFile() && matcher(entry.name)) {
      filePaths.push(relativePath);
    }
  }

  return filePaths.sort((left, right) => left.localeCompare(right));
};

const collectTrackedPackageJsonPaths = async () => [rootPackageJsonPath];

const updatePackageJson = async (filePath, nodeMajor, pnpmVersion) => {
  const { indent, lineEnding, packageJson } = await readPackageJsonDocument(filePath);
  const updatedFields = [];
  const isRootPackageJson = filePath === rootPackageJsonPath;

  packageJson.engines ??= {};

  const nextNodeRange = `>=${nodeMajor}`;
  const nextPnpmRange = `^${pnpmVersion}`;
  const nextPackageManager = `pnpm@${pnpmVersion}`;

  if (packageJson.engines.node !== nextNodeRange) {
    packageJson.engines.node = nextNodeRange;
    updatedFields.push(`engines.node -> ${nextNodeRange}`);
  }

  if ((isRootPackageJson || packageJson.engines.pnpm != null) && packageJson.engines.pnpm !== nextPnpmRange) {
    packageJson.engines.pnpm = nextPnpmRange;
    updatedFields.push(`engines.pnpm -> ${nextPnpmRange}`);
  }

  if ((isRootPackageJson || packageJson.packageManager != null) && packageJson.packageManager !== nextPackageManager) {
    packageJson.packageManager = nextPackageManager;
    updatedFields.push(`packageManager -> ${nextPackageManager}`);
  }

  if (updatedFields.length === 0) {
    return [];
  }

  const nextContent = `${JSON.stringify(packageJson, null, indent)}${lineEnding}`.replace(/\n/gu, lineEnding);
  await maybeWriteFile(filePath, nextContent);
  return updatedFields;
};

const replaceStepInputValue = (content, actionPattern, inputName, nextValue) => {
  const lines = content.split(/\r?\n/u);
  const inputPattern = new RegExp(`^(\\s*${escapeRegExp(inputName)}:\\s*)(["']?)([^"'#\\s]+)\\2(\\s*(?:#.*)?)$`, "u");
  let changed = false;
  let stepUsesTargetAction = false;
  let withinWithBlock = false;
  let withIndent = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const normalizedLine = line.replace(/^(\s*)-\s+/u, "$1");
    const trimmed = line.trim();
    const indent = line.match(/^\s*/u)?.[0].length ?? 0;

    if (/^\s*-\s+/u.test(line)) {
      stepUsesTargetAction = false;
      withinWithBlock = false;
      withIndent = -1;
    }

    if (withinWithBlock && trimmed && indent <= withIndent) {
      withinWithBlock = false;
      withIndent = -1;
    }

    if (/^\s*uses:\s*/u.test(normalizedLine)) {
      stepUsesTargetAction = actionPattern.test(normalizedLine);
    }

    if (stepUsesTargetAction && /^\s*with:\s*$/u.test(normalizedLine)) {
      withinWithBlock = true;
      withIndent = indent;
      continue;
    }

    if (!stepUsesTargetAction || !withinWithBlock) {
      continue;
    }

    const match = line.match(inputPattern);

    if (!match || match[3] === nextValue) {
      continue;
    }

    lines[index] = `${match[1]}${match[2]}${nextValue}${match[2]}${match[4]}`;
    changed = true;
  }

  return {
    changed,
    nextContent: lines.join("\n"),
  };
};

const updateNodeVersionReferences = async (filePath, nodeMajor) => {
  const { content, lineEnding } = await readFileWithLineEnding(filePath);

  if (!content.includes("actions/setup-node@")) {
    return [];
  }

  const { changed, nextContent } = replaceStepInputValue(
    content,
    /uses:\s*actions\/setup-node@/u,
    "node-version",
    String(nodeMajor),
  );

  if (!changed || nextContent === content) {
    return [];
  }

  await maybeWriteFile(filePath, nextContent.replace(/\n/gu, lineEnding));
  return [`node-version -> ${nodeMajor}`];
};

const updateNodeVersionReferencesInFiles = async (nodeMajor) => {
  const workflowFiles = await collectFiles(
    workflowsDirPath,
    (fileName) => fileName.endsWith(".yml") || fileName.endsWith(".yaml"),
  );
  const actionFiles = await collectFiles(actionsDirPath, (fileName) => fileName === "action.yml");
  const targetFiles = [...workflowFiles, ...actionFiles];
  const updateGroups = [];

  for (const filePath of targetFiles) {
    const updates = await updateNodeVersionReferences(filePath, nodeMajor);

    if (updates.length > 0) {
      updateGroups.push({ filePath, updates });
    }
  }

  return updateGroups;
};

const trackedToolchainVersions = await readTrackedToolchainVersions();
const cooldownThreshold = getReleaseCooldownThreshold();
const latestNodeRelease = await fetchLatestLtsNodeRelease();
const latestPnpmRelease = await fetchLatestPnpmRelease();

// Only the current latest release is eligible for automation. If a newer latest
// appears less than 24 hours ago, skip that tool entirely instead of falling
// back to an older version that is no longer the latest.
const nodeMajor = hasReleaseClearedCooldown(latestNodeRelease.publishedAt, cooldownThreshold)
  ? latestNodeRelease.major
  : trackedToolchainVersions.nodeMajor;
const pnpmVersion = hasReleaseClearedCooldown(latestPnpmRelease.publishedAt, cooldownThreshold)
  ? latestPnpmRelease.version
  : trackedToolchainVersions.pnpmVersion;

console.log("Applying latest-only release cooldown: 24 elapsed hours");
console.log(`Release cutoff: ${new Date(cooldownThreshold).toISOString()}`);
console.log(
  `Latest Node.js LTS release: ${latestNodeRelease.versionTag} (${latestNodeRelease.ltsLine}${latestNodeRelease.ltsCodename ? ` ${latestNodeRelease.ltsCodename}` : ""}) published at ${latestNodeRelease.publishedAt}`,
);
console.log(`Latest pnpm release: ${latestPnpmRelease.version} published at ${latestPnpmRelease.publishedAt}`);

if (
  nodeMajor === trackedToolchainVersions.nodeMajor &&
  latestNodeRelease.major !== trackedToolchainVersions.nodeMajor
) {
  console.log(
    `Skipping Node.js update because the latest release in the current LTS line ${latestNodeRelease.versionTag} has not reached the 24-hour cooldown yet`,
  );
}

if (
  pnpmVersion === trackedToolchainVersions.pnpmVersion &&
  latestPnpmRelease.version !== trackedToolchainVersions.pnpmVersion
) {
  console.log(
    `Skipping pnpm update because the current latest release ${latestPnpmRelease.version} has not reached the 24-hour cooldown yet`,
  );
}

console.log(`Resolved Node.js major target: ${nodeMajor}`);
console.log(`Resolved pnpm version target: ${pnpmVersion}`);

const packageJsonUpdateGroups = [];

for (const filePath of await collectTrackedPackageJsonPaths()) {
  const updates = await updatePackageJson(filePath, nodeMajor, pnpmVersion);

  if (updates.length > 0) {
    packageJsonUpdateGroups.push({ filePath, updates });
  }
}

const updateGroups = [...packageJsonUpdateGroups, ...(await updateNodeVersionReferencesInFiles(nodeMajor))].filter(
  ({ updates }) => updates.length > 0,
);

if (updateGroups.length === 0) {
  console.log("No toolchain version updates were required");
} else {
  for (const { filePath, updates } of updateGroups) {
    console.log(`Updated ${filePath}`);

    for (const update of updates) {
      console.log(`- ${update}`);
    }
  }
}

await appendGitHubOutput("changed", updateGroups.length > 0 ? "true" : "false");
await appendGitHubOutput("node_major", String(nodeMajor));
await appendGitHubOutput("pnpm_version", pnpmVersion);
await appendGitHubOutput("updated_files", updateGroups.map(({ filePath }) => filePath).join(","));
await appendGitHubOutput(
  "update_count",
  String(updateGroups.reduce((count, group) => count + group.updates.length, 0)),
);

if (dryRun && updateGroups.length > 0) {
  process.exitCode = 10;
}
