const { CF_ACCOUNT_ID, CF_PAGES_PROJECT, CF_API_TOKEN } = process.env;
const dryRun = process.env.DRY_RUN !== "false";
const maxAgeMs = Number(process.env.PROD_MAX_AGE_DAYS || 7) * 86400_000;

if (!CF_API_TOKEN) {
    console.log("cleanup: no CF_API_TOKEN, skipping (not a production build)");
    process.exit(0);
}

const base = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}` +
    `/pages/projects/${CF_PAGES_PROJECT}/deployments`;
const headers = { Authorization: `Bearer ${CF_API_TOKEN}` };

async function main() {
    const all = [];
    for (let page = 1; ; page++) {
        const res = await fetch(`${base}?page=${page}&per_page=25`, { headers });
        if (!res.ok) throw new Error(`list failed: ${res.status} ${await res.text()}`);
        const { result } = await res.json();
        all.push(...result);
        if (result.length < 25) break;
    }

    const ts = (d) => new Date(d.created_on).getTime();
    all.sort((a, b) => ts(b) - ts(a));

    const prod = all.filter((d) => d.environment === "production");
    const previews = all.filter((d) => d.environment === "preview");
    const toDelete = [];

    const seen = new Set();
    for (const d of previews) {
        const branch = d.deployment_trigger?.metadata?.branch ?? "unknown";
        if (seen.has(branch)) toDelete.push([d, `superseded preview on '${branch}'`]);
        else seen.add(branch);
    }

    const cutoff = Date.now() - maxAgeMs;
    for (const d of prod.slice(1)) {
        if (ts(d) < cutoff) toDelete.push([d, "production older than retention"]);
    }

    console.log(`cleanup: ${all.length} deployments, ${toDelete.length} to delete` +
        (dryRun ? " (dry run)" : ""));

    for (const [d, reason] of toDelete) {
        const label = `${d.id} [${d.environment}] ${d.created_on} - ${reason}`;
        if (dryRun) { console.log(`would delete ${label}`); continue; }
        const res = await fetch(`${base}/${d.id}?force=true`, { method: "DELETE", headers });
        console.log(res.ok ? `deleted ${label}` : `FAILED (${res.status}) ${label}`);
    }
}

main().catch((e) => console.error("cleanup error (ignored):", e.message));