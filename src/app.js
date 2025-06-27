import fs from 'node:fs/promises';
import figlet from 'figlet';
import { ethers } from 'ethers';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};

  try {
    let lenderPrivateKey; // ProtectedData Secret
    let targetAddress; // Requester Secret
    let kolAddress; // Requester Secret
    let amount; // Requester Secret
    let rpcUrl; // Requester Secret

    // ------------ Deserialize Protected Data ------------
    try {
      const deserializer = new IExecDataProtectorDeserializer();
      lenderPrivateKey = await deserializer.getValue(
        "lenderPrivateKey",
        "string"
      );
      console.log("Found a protected data");
      const redacted = lenderPrivateKey.replace(/./g, "*");
      console.log(`Got ProtectedData Value (${redacted})!`);
    } catch (e) {
      console.log("It seems there is an issue with your protected data:", e);
      throw new Error("Failed to get lender private key from protected data");
    }

    // ------------ Requester Secrets ------------
    const {
      IEXEC_REQUESTER_SECRET_1,
      IEXEC_REQUESTER_SECRET_2,
      IEXEC_REQUESTER_SECRET_3,
      IEXEC_REQUESTER_SECRET_4,
    } = process.env;

    if (IEXEC_REQUESTER_SECRET_1) {
      amount = IEXEC_REQUESTER_SECRET_1;
      console.log(
        `Got requester secret TOTAL AMOUNT (${amount.replace(/./g, "*")})!`
      );
    } else {
      throw new Error("Total amount is required");
    }

    if (IEXEC_REQUESTER_SECRET_2) {
      rpcUrl = IEXEC_REQUESTER_SECRET_2;
      console.log(
        `Got requester secret RPC URL (${rpcUrl.replace(/./g, "*")})!`
      );
    } else {
      throw new Error("RPC URL is required");
    }

    if (IEXEC_REQUESTER_SECRET_3) {
      targetAddress = IEXEC_REQUESTER_SECRET_3;
      console.log(
        `Got requester secret TARGET ADDRESS (${targetAddress.replace(
          /./g,
          "*"
        )})!`
      );
    } else {
      throw new Error("Target address is required");
    }

    if (IEXEC_REQUESTER_SECRET_4) {
      kolAddress = IEXEC_REQUESTER_SECRET_4;
      console.log(
        `Got requester secret KOL ADDRESS (${kolAddress.replace(/./g, "*")})!`
      );
    } else {
      throw new Error("KOL address is required");
    }

    // ------------ Blockchain Setup ------------
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    console.log(
      "Connected to network:",
      network.name,
      "Chain ID:",
      network.chainId.toString()
    );

    const wallet = new ethers.Wallet(lenderPrivateKey, provider);

    if (!ethers.isAddress(targetAddress)) {
      throw new Error(`Invalid target address: ${targetAddress}`);
    }

    const parseAmount = ethers.parseEther(amount);

    const balance = await provider.getBalance(wallet.address);
    if (balance < parseAmount) {
      throw new Error(`Insufficient balance.`);
    }

    // ------------ Escrow Check ------------
    const escrowAddress = "0x007d13fF43733c2CD390e6Ae2BD6BC20c275EB42";
    const escrowAbi = [
      "function getAvailableToInvest(address user) view returns (uint256)",
      "function markAsInvested(address user, uint256 amount) external",
    ];
    const escrowContract = new ethers.Contract(
      escrowAddress,
      escrowAbi,
      provider
    );

    const available = await escrowContract.getAvailableToInvest(kolAddress);
    console.log(
      `KOL available to invest: ${ethers.formatEther(available)} ETH`
    );

    if (available < parseAmount) {
      throw new Error(
        `KOL ${kolAddress} has insufficient investable funds: ${ethers.formatEther(
          available
        )} < ${ethers.formatEther(parseAmount)} ETH`
      );
    }

    // ------------ Transaction ------------
    const transaction = {
      to: targetAddress,
      value: parseAmount,
    };

    console.log("Sending transaction...");
    const txResponse = await wallet.sendTransaction(transaction);
    console.log("Transaction sent:", txResponse.hash);

    console.log("Waiting for confirmation...");
    const receipt = await txResponse.wait();

    if (receipt.status === 1) {
      console.log("Transaction confirmed!");

      // ------------ Mark as Invested ------------
      const escrowWithSigner = escrowContract.connect(wallet);
      try {
        const investTx = await escrowWithSigner.markAsInvested(
          kolAddress,
          parseAmount
        );
        console.log(`Calling markAsInvested... Tx: ${investTx.hash}`);
        await investTx.wait();
        console.log("markAsInvested confirmed!");
      } catch (e) {
        console.warn(
          "Warning: Transaction succeeded but markAsInvested failed:",
          e.message
        );
      }
    } else {
      throw new Error("Transaction failed");
    }

    const asciiArtText = figlet.textSync(`Transfer successful`);
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, asciiArtText);

    computedJsonObj = {
      "deterministic-output-path": `${IEXEC_OUT}/result.txt`,
      "transaction-hash": txResponse.hash,
    };
  } catch (e) {
    console.log('Error:', e.message);
    const asciiArtText = figlet.textSync('Transfer failed');
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, asciiArtText);

    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
      'error-message': e.message || 'Oops something went wrong'
    };
  } finally {
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj, null, 2)
    );
  }
};

main();
