// Chạy một lần để đăng ký Entity Secret với Circle
// node scripts/setup-circle.js

const { initiateDeveloperControlledWalletsClient } = require("@circle-fin/developer-controlled-wallets");
require("fs");

const API_KEY       = "TEST_API_KEY:faae16f361b2e93162402784c4121311:a97c89cadad0beca2c7cdd7c4721d176";
const ENTITY_SECRET = "231bf96c8c06aedc35bf9e65f723f3bec736a6f5d684cd2151f9a01212cc738a";

async function main() {
  console.log("Connecting to Circle API...");
  const client = initiateDeveloperControlledWalletsClient({
    apiKey:       API_KEY,
    entitySecret: ENTITY_SECRET,
  });

  // Bước 1: Lấy public key để mã hóa entity secret
  console.log("\nStep 1: Getting public key...");
  const pkRes = await client.getPublicKey({});
  console.log("Public key:", pkRes.data?.publicKey?.slice(0, 40) + "...");

  // Bước 2: Tạo ciphertext từ entity secret
  console.log("\nStep 2: Generating entity secret ciphertext...");
  const cipherRes = await client.generateEntitySecretCiphertext();
  console.log("Ciphertext:", cipherRes.slice(0, 40) + "...");
  console.log("\nPaste this ciphertext at: https://console.circle.com > Developer > Entity Secret");
  console.log("\nFull ciphertext:\n" + cipherRes);

  // Bước 3: Tạo Wallet Set
  console.log("\nStep 3: Creating wallet set...");
  const wsRes = await client.createWalletSet({ name: "StoreScope AI" });
  const walletSetId = wsRes.data?.walletSet?.id;
  console.log("Wallet Set ID:", walletSetId);
  console.log("\nAdd to .env.local:");
  console.log(`CIRCLE_WALLET_SET_ID=${walletSetId}`);
}

main().catch(err => {
  console.error("Error:", err.message ?? err);
  process.exit(1);
});
