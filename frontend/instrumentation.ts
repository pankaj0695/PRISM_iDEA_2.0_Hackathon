export async function register() {
  // Only run in the Node.js runtime (not Edge), and only on the server.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const bases = [
    process.env.LAYER1_URL,
    process.env.LAYER2_URL,
    process.env.FINAL_LAYER_URL,
  ].filter(Boolean) as string[];

  if (bases.length === 0) return;

  console.log("[warmup] Pinging backend APIs to wake Cloud Run instances…");

  for (const base of bases) {
    const url = `${base.replace(/\/$/, "")}/health`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15_000);

    fetch(url, { method: "GET", signal: controller.signal })
      .then((r) => {
        clearTimeout(timer);
        console.log(`[warmup] ✓ ${url} → ${r.status}`);
      })
      .catch((e: Error) => {
        clearTimeout(timer);
        console.warn(`[warmup] ✗ ${url} → ${e.message}`);
      });
  }
}
