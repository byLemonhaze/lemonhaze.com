import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const root = new URL("../", import.meta.url);
const packageJsonPath = new URL("../package.json", import.meta.url);
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

test("MIT license exists", () => {
  assert.equal(existsSync(new URL("../LICENSE", import.meta.url)), true);
});

test("security and contribution docs exist", () => {
  assert.equal(existsSync(new URL("../SECURITY.md", import.meta.url)), true);
  assert.equal(existsSync(new URL("../CONTRIBUTING.md", import.meta.url)), true);
});

test("required quality scripts exist", () => {
  assert.equal(typeof packageJson.scripts?.build, "string");
  assert.equal(typeof packageJson.scripts?.test, "string");
  assert.equal(typeof packageJson.scripts?.verify, "string");
});

test("wrangler config exists for deployability", () => {
  assert.equal(existsSync(new URL("../wrangler.toml", import.meta.url)), true);
});

test("core source layout is present", () => {
  assert.equal(existsSync(new URL("../src", import.meta.url)), true);
  assert.equal(existsSync(new URL("../functions", import.meta.url)), true);
  assert.equal(existsSync(new URL("../public", import.meta.url)), true);
});

test("root remains readable", () => {
  const entries = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  assert.ok(entries.includes("<!doctype html>") || entries.includes("<!DOCTYPE html>"));
});
