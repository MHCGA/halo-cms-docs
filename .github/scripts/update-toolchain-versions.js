import fs from "node:fs/promises";
import path from "node:path";

const packageJsonPath = "package.json";
const workflowsDirPath = path.join(".github", "workflows");
const actionsDirPath = path.join(".github", "actions");
const dryRun = process.argv.includes("--dry-run");
const releaseCooldownDays = 1;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

const appendGitHubOutput = async (name, value) => {
  const outputPath = process.env.GITHUB_OUTPUT;

  if (!outputPath) {
    return;
  }

  await fs.appendFile(outputPath, `${name}=${value}\n`);
};

const compareNumbers = (left, right) => left - right;

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

const compareSemVer = (left, right) =>
  compareNumbers(left.major, right.major) ||
  compareNumbers(left.minor, right.minor) ||
  compareNumbers(left.patch, right.patch);

const getReleaseCutoffDate = (days) => new Date(Date.now() - days * millisecondsPerDay);

const parseReleaseTimestamp = (value, { dateOnlyAsEndOfDay = false } = {}) => {
  if (typeof value !== "string") {
    return null;
  }

  const normalizedValue = value.trim();

  if (normalizedValue === "") {
    return null;
  }

  const isoTimestamp = /^\d{4}-\d{2}-\d{2}$/u.test(normalizedValue)
    ? `${normalizedValue}T${dateOnlyAsEndOfDay ? "23:59:59.999" : "00:00:00.000"}Z`
    : normalizedValue;
  const timestamp = new Date(isoTimestamp);

  if (Number.isNaN(timestamp.getTime())) {
    return null;
  }

  return timestamp;
};

const fetchLatestNodeMajor = async (releaseCutoffDate) => {
  const response = await fetch("https://nodejs.org/dist/index.json", {
    headers: {
      Accept: "application/json",
      "User-Agent": "halo-cms-docs-toolchain-updater",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Node.js releases: ${response.status} ${response.statusText}`);
  }

  const releases = await response.json();
  const stableVersions = releases
    .map((release) => ({
      publishedAt: parseReleaseTimestamp(release.date, { dateOnlyAsEndOfDay: true }),
      version: parseSemVer(release.version),
    }))
    .filter(
      ({ publishedAt, version }) =>
        publishedAt !== null && version !== null && publishedAt.getTime() <= releaseCutoffDate.getTime(),
    )
    .sort((left, right) => compareSemVer(right.version, left.version));

  if (stableVersions.length === 0) {
    throw new Error(`No stable Node.js versions found in release index before ${releaseCutoffDate.toISOString()}`);
  }

  return stableVersions[0].version.major;
};

const fetchLatestPnpmVersion = async (releaseCutoffDate) => {
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
  const stableVersions = Object.entries(metadata.time ?? {})
    .map(([version, publishedAt]) => ({
      publishedAt: parseReleaseTimestamp(publishedAt),
      version: version.trim(),
      semVer: parseSemVer(version),
    }))
    .filter(
      ({ publishedAt, semVer, version }) =>
        publishedAt !== null && semVer !== null && version !== "" && publishedAt.getTime() <= releaseCutoffDate.getTime(),
    )
    .sort((left, right) => compareSemVer(right.semVer, left.semVer));

  if (stableVersions.length === 0) {
    throw new Error(`No stable pnpm versions found before ${releaseCutoffDate.toISOString()}`);
  }

  return stableVersions[0].version;
};

const readFileWithLineEnding = async (filePath) => {
  const content = await fs.readFile(path.resolve(process.cwd(), filePath), { encoding: "utf8" });

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

const collectFiles = async (directoryPath, matcher) => {
  const absoluteDirectoryPath = path.resolve(process.cwd(), directoryPath);
  const dirEntries = await fs.readdir(absoluteDirectoryPath, { withFileTypes: true });
  const filePaths = [];

  for (const entry of dirEntries) {
    const relativePath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...(await collectFiles(relativePath, matcher)));
      continue;
    }

    if (entry.isFile() && matcher(entry.name)) {
      filePaths.push(relativePath);
    }
  }

  return filePaths.sort((left, right) => left.localeCompare(right));
};

const updatePackageJson = async (nodeMajor, pnpmVersion) => {
  const { content, lineEnding } = await readFileWithLineEnding(packageJsonPath);
  const packageJson = JSON.parse(content);
  const updatedFields = [];

  packageJson.engines ??= {};

  const nextNodeRange = `>=${nodeMajor}`;
  const nextPnpmRange = `^${pnpmVersion}`;
  const nextPackageManager = `pnpm@${pnpmVersion}`;

  if (packageJson.engines.node !== nextNodeRange) {
    packageJson.engines.node = nextNodeRange;
    updatedFields.push(`engines.node -> ${nextNodeRange}`);
  }

  if (packageJson.engines.pnpm !== nextPnpmRange) {
    packageJson.engines.pnpm = nextPnpmRange;
    updatedFields.push(`engines.pnpm -> ${nextPnpmRange}`);
  }

  if (packageJson.packageManager !== nextPackageManager) {
    packageJson.packageManager = nextPackageManager;
    updatedFields.push(`packageManager -> ${nextPackageManager}`);
  }

  if (updatedFields.length === 0) {
    return [];
  }

  const nextContent = `${JSON.stringify(packageJson, null, 2)}${lineEnding}`.replace(/\n/gu, lineEnding);
  await maybeWriteFile(packageJsonPath, nextContent);
  return updatedFields;
};

const updateNodeVersionReferences = async (filePath, nodeMajor) => {
  const { content, lineEnding } = await readFileWithLineEnding(filePath);

  if (!content.includes("actions/setup-node@")) {
    return [];
  }

  const updates = [];
  const nextContent = content.replace(
    /^(\s*node-version:\s*)(?:"([^"]+)"|'([^']+)'|([^\s#]+))(\s*(?:#.*)?)$/gmu,
    (match, prefix, doubleQuotedValue, singleQuotedValue, bareValue, suffix) => {
      const currentValue = doubleQuotedValue ?? singleQuotedValue ?? bareValue ?? "";
      const normalizedValue = currentValue.trim();

      if (!/^(\d+|lts\/\*)$/u.test(normalizedValue)) {
        return match;
      }

      if (normalizedValue === String(nodeMajor)) {
        return match;
      }

      updates.push(`node-version -> ${nodeMajor}`);

      if (doubleQuotedValue !== undefined) {
        return `${prefix}"${nodeMajor}"${suffix}`;
      }

      if (singleQuotedValue !== undefined) {
        return `${prefix}'${nodeMajor}'${suffix}`;
      }

      return `${prefix}${nodeMajor}${suffix}`;
    },
  );

  if (updates.length === 0) {
    return [];
  }

  await maybeWriteFile(filePath, nextContent.replace(/\n/gu, lineEnding));
  return updates;
};

const updateNodeVersionReferencesInFiles = async (nodeMajor) => {
  const workflowFiles = await collectFiles(workflowsDirPath, (fileName) => fileName.endsWith(".yml"));
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

const releaseCutoffDate = getReleaseCutoffDate(releaseCooldownDays);
const nodeMajor = await fetchLatestNodeMajor(releaseCutoffDate);
const pnpmVersion = await fetchLatestPnpmVersion(releaseCutoffDate);

console.log(`Applying release cooldown: ${releaseCooldownDays} day(s)`);
console.log(`Release cutoff: ${releaseCutoffDate.toISOString()}`);
console.log(`Resolved latest Node.js major: ${nodeMajor}`);
console.log(`Resolved latest pnpm version: ${pnpmVersion}`);

const updateGroups = [
  {
    filePath: packageJsonPath,
    updates: await updatePackageJson(nodeMajor, pnpmVersion),
  },
  ...(await updateNodeVersionReferencesInFiles(nodeMajor)),
].filter(({ updates }) => updates.length > 0);

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
