// Đăng ký Circle webhook subscription
// Chạy một lần: node scripts/register-circle-webhook.js <BASE_URL>
// Ví dụ:  node scripts/register-circle-webhook.js https://storescope-ai.vercel.app
//         node scripts/register-circle-webhook.js https://abc123.ngrok.io  (local dev)

const BASE_URL = process.argv[2];
if (!BASE_URL) {
  console.error("Usage: node scripts/register-circle-webhook.js <BASE_URL>");
  process.exit(1);
}

const API_KEY = process.env.CIRCLE_API_KEY;
if (!API_KEY) {
  console.error("Set CIRCLE_API_KEY env var first");
  process.exit(1);
}

const endpoint = `${BASE_URL.replace(/\/$/, "")}/api/circle/webhook`;

async function main() {
  // List existing subscriptions
  const listRes = await fetch("https://api.circle.com/v1/notifications/subscriptions", {
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
  });
  const list = await listRes.json();
  console.log("Existing subscriptions:", JSON.stringify(list.data?.subscriptions ?? [], null, 2));

  // Register new subscription
  const res = await fetch("https://api.circle.com/v1/notifications/subscriptions", {
    method: "POST",
    headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ endpoint }),
  });
  const data = await res.json();
  console.log("\nRegistered:", JSON.stringify(data, null, 2));
  console.log(`\nWebhook URL: ${endpoint}`);
}

main().catch(console.error);
