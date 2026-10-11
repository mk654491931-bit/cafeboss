#!/usr/bin/env node
/**
 * GitHub bağlantısını doğrular.
 *
 * Kontrol ettikleri:
 *   1) GITHUB_TOKEN tanımlı mı ve geçerli mi?  -> GET /user
 *   2) Hedef repo erişilebilir mi, boş mu?    -> GET /repos/{owner}/{repo}
 *
 * Kullanım:  bun run github:check
 * Anahtar:   projenin "Keys / API keys" sekmesine GITHUB_TOKEN ekleyin.
 *
 * DİKKAT: token'ı asla VITE_ önekiyle eklemeyin — Vite tüm VITE_ değişkenlerini
 * tarayıcı paketine gömer. GITHUB_TOKEN yalnızca sunucu/CLI tarafında kullanılır.
 */

import { execFileSync } from "node:child_process";

const API = "https://api.github.com";
const DEFAULT_REPO = "mk654491931-bit/cafe-menu-app";

function detectRepo() {
  if (process.env.GITHUB_REPO) return process.env.GITHUB_REPO.trim();
  try {
    const url = execFileSync("git", ["remote", "get-url", "origin"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
    const m = url.match(/github\.com[:/]+([^/]+\/[^/]+?)(?:\.git)?$/);
    if (m) return m[1];
  } catch {
    /* git yoksa varsayılana düş */
  }
  return DEFAULT_REPO;
}

async function gh(path, token) {
  return fetch(`${API}${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "boss-cafe-check",
      "X-GitHub-Api-Version": "2022-11-28",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
}

function line(label, ok, detail) {
  const mark = ok ? "OK " : "!! ";
  console.log(`${mark} ${label}${detail ? ` — ${detail}` : ""}`);
}

const repo = detectRepo();
const token = process.env.GITHUB_TOKEN?.trim();

console.log(`GitHub bağlantı kontrolü (repo: ${repo})\n`);

if (!token) {
  line("GITHUB_TOKEN", false, "tanımlı değil");
  console.log("\nAnahtarı eklemek için:");
  console.log("  1) https://github.com/settings/tokens adresinden bir token oluştur");
  console.log("     (repo içeriği için classic token + 'repo' scope; sadece okuma için 'repo:read' yeterli)");
  console.log("  2) Freebuff projesinin Keys / API keys sekmesine GITHUB_TOKEN adıyla kaydet");
  console.log("  3) Tekrar çalıştır: bun run github:check\n");
  process.exit(1);
}

const userRes = await gh("/user", token);
if (!userRes.ok) {
  line("GITHUB_TOKEN", false, `API ${userRes.status} — token geçersiz veya scope eksik`);
  process.exit(1);
}
const user = await userRes.json();
line("GITHUB_TOKEN", true, `hesap: ${user.login}`);

const repoRes = await gh(`/repos/${repo}`, token);
if (!repoRes.ok) {
  line("Repo erişimi", false, `API ${repoRes.status} — repo yok veya token bu repoya erişemiyor`);
  process.exit(1);
}
const r = await repoRes.json();
const empty = r.size === 0;
line("Repo erişimi", true, `${r.full_name} (private: ${r.private}, default: ${r.default_branch})`);
line(
  "Repo içeriği",
  true,
  empty
    ? "boş — push edilmeyi bekliyor"
    : `${r.size} KB içerik var (push edersen non-fast-forward olabilir)`
);
