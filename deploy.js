const { ethers, JsonRpcProvider } = require("ethers");
const fs = require("fs-extra");
require("dotenv").config();

async function main() {
    // http://127.0.0.1:7545
    // console.log(ethers.providers);
    // HTTP://172.28.208.1:7545
    // 0x77e856cbb1f04fa73c6f97efdafa1d25a88af1b4d6f47a56ab941926545dbf19
    let provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    // let wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
    const encryptedJson = fs.readFileSync("./.encryptedKey.json", "utf8");
    let wallet = ethers.Wallet.fromEncryptedJsonSync(
        encryptedJson,
        process.env.PRIVATE_KEY_PASSWORD,
    );
    wallet = await wallet.connect(provider);

    const abi = fs.readFileSync(
        "./SimpleStorage_sol_SimpleStorage.abi",
        "utf8",
    );
    const binary = fs.readFileSync(
        "./SimpleStorage_sol_SimpleStorage.bin",
        "utf8",
    );
    const contractFactory = new ethers.ContractFactory(abi, binary, wallet);
    console.log("Deploying, please wait...");
    const contract = await contractFactory.deploy(); // Stop here. waot for contract to deploy
    await contract.waitForDeployment(1);
    console.log(`Contract deployed to ${contract.address}`);
    // console.log("This is the deployment transaction(transaction response): ");
    // console.log(waitForDeployment);
    // console.log("This is the transaction receipt: ");
    // Get number
    let currentFavoriteNumber = await contract.retrieve();
    console.log(`Current Favorite Number: ${currentFavoriteNumber}`);
    console.log("Updating favorite number...");
    let transactionResponse = await contract.store(7);
    let transactionReceipt = await transactionResponse.wait();
    currentFavoriteNumber = await contract.retrieve();
    console.log(`New Favorite Number: ${currentFavoriteNumber}`);

    console.log(contract);
    // console.log(transactionReceipt);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
