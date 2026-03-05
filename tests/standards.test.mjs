import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const packageJsonPath = new URL("../package.json", import.meta.url);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));
const expectFile = (relativePath) => {
  assert.equal(existsSync(new URL(relativePath, root)), true, `${relativePath} should exist`);
};

test("MIT license exists", () => {
  expectFile("LICENSE");
});

test("security and contribution docs exist", () => {
  expectFile("SECURITY.md");
  expectFile("CONTRIBUTING.md");
});

test("core repo docs exist", () => {
  expectFile("docs/ARCHITECTURE.md");
  expectFile("docs/API.md");
  expectFile("docs/DATA-SOURCES.md");
  expectFile("docs/DEPLOYMENT.md");
});

test("repo governance files exist", () => {
  expectFile(".editorconfig");
  expectFile(".nvmrc");
  expectFile(".github/CODEOWNERS");
  expectFile(".github/dependabot.yml");
  expectFile(".github/pull_request_template.md");
});

test("required quality scripts exist", () => {
  assert.equal(typeof packageJson.scripts?.build, "string");
  assert.equal(typeof packageJson.scripts?.test, "string");
  assert.equal(typeof packageJson.scripts?.verify, "string");
  assert.equal(typeof packageJson.engines?.node, "string");
});

test("wrangler config exists for deployability", () => {
  expectFile("wrangler.toml");
});

test("core source layout is present", () => {
  expectFile("src");
  expectFile("functions");
  expectFile("public");
});

test("root remains readable", () => {
  const entries = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(entries.includes("<!doctype html>") || entries.includes("<!DOCTYPE html>"));
});
