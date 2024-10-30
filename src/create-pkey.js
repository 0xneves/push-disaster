const ethers = require('ethers');

async function main() {
// Should create a random private key
const randomPrivateKey = ethers.Wallet.createRandom().privateKey;
console.log("Random Private Key: ", randomPrivateKey);
}

main();