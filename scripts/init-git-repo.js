const { createHash } = require("node:crypto");
const { deflateSync } = require("node:zlib");
const { mkdirSync, readdirSync, readFileSync, statSync, writeFileSync, existsSync } = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const gitDir = path.join(root, ".git");
const ignored = new Set([".git", ".tools", ".DS_Store"]);

function ensureDir(dir) {
  mkdirSync(dir, { recursive: true });
}

function writeObject(type, content) {
  const body = Buffer.isBuffer(content) ? content : Buffer.from(content);
  const header = Buffer.from(`${type} ${body.length}\0`);
  const store = Buffer.concat([header, body]);
  const hash = createHash("sha1").update(store).digest("hex");
  const objectDir = path.join(gitDir, "objects", hash.slice(0, 2));
  const objectPath = path.join(objectDir, hash.slice(2));

  ensureDir(objectDir);
  if (!existsSync(objectPath)) {
    writeFileSync(objectPath, deflateSync(store));
  }

  return hash;
}

function listEntries(dir) {
  return readdirSync(dir)
    .filter((name) => !ignored.has(name))
    .filter((name) => !name.endsWith(".zip"))
    .sort((a, b) => a.localeCompare(b));
}

function writeTree(dir) {
  const parts = [];

  for (const name of listEntries(dir)) {
    const fullPath = path.join(dir, name);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      const hash = writeTree(fullPath);
      parts.push(Buffer.concat([
        Buffer.from(`40000 ${name}\0`),
        Buffer.from(hash, "hex"),
      ]));
      continue;
    }

    if (!stats.isFile()) continue;

    const hash = writeObject("blob", readFileSync(fullPath));
    parts.push(Buffer.concat([
      Buffer.from(`100644 ${name}\0`),
      Buffer.from(hash, "hex"),
    ]));
  }

  return writeObject("tree", Buffer.concat(parts));
}

function initRepo() {
  ensureDir(path.join(gitDir, "objects"));
  ensureDir(path.join(gitDir, "refs", "heads"));
  const refPath = path.join(gitDir, "refs", "heads", "main");
  const parentHash = existsSync(refPath) ? readFileSync(refPath, "utf8").trim() : "";
  writeFileSync(path.join(gitDir, "HEAD"), "ref: refs/heads/main\n");
  writeFileSync(path.join(gitDir, "description"), "Orcamento Mecanico PWA\n");
  writeFileSync(
    path.join(gitDir, "config"),
    [
      "[core]",
      "\trepositoryformatversion = 0",
      "\tfilemode = true",
      "\tbare = false",
      "\tlogallrefupdates = true",
      "[init]",
      "\tdefaultBranch = main",
      "",
    ].join("\n"),
  );

  const treeHash = writeTree(root);
  const timestamp = Math.floor(Date.now() / 1000);
  const timezone = "-0300";
  const author = `Natalia Santos <natalia@example.local> ${timestamp} ${timezone}`;
  const messageIndex = process.argv.indexOf("--message");
  const message = messageIndex >= 0 ? process.argv[messageIndex + 1] : "Initial commit";
  const commit = [
    `tree ${treeHash}`,
    parentHash ? `parent ${parentHash}` : "",
    `author ${author}`,
    `committer ${author}`,
    "",
    message,
    "",
  ].filter((line, index) => line || index > 2).join("\n");
  const commitHash = writeObject("commit", commit);
  writeFileSync(refPath, `${commitHash}\n`);

  console.log(`Repositorio Git criado em ${gitDir}`);
  console.log(`Branch: main`);
  console.log(`Commit inicial: ${commitHash}`);
}

initRepo();
