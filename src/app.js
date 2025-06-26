import fs from 'node:fs/promises';
import figlet from 'figlet';
import { ethers } from 'ethers';
import { IExecDataProtectorDeserializer } from '@iexec/dataprotector-deserializer';

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};

  try {
    let lenderPrivateKey; // App Secret
    let targetAddress; // App Secret
    let amount; // Requester Secret
    let rpcUrl; // Requester Secret

    //---------------- Deserialize Protected Data ----------------
    try {
      const deserializer = new IExecDataProtectorDeserializer();
      // The protected data mock created for the purpose of this Hello World journey
      // contains an object with a key "secretText" which is a string
      lenderPrivateKey = await deserializer.getValue("lenderPrivateKey", "string")
      console.log('Found a protected data');
      const redactedProtectedDataValue = lenderPrivateKey.replace(
        /./g,
        "*"
      );
      console.log(
        `Got ProtectedData Value (${redactedProtectedDataValue})!`
      );
    } catch (e) {
      console.log('It seems there is an issue with your protected data:', e);
      throw new Error('Failed to get lender private key from protected data');
    }

    //------------ Requester Secret Handling ------------
    //IEXEC_REQUESTER_SECRET_1 => Total Amount
    //IEXEC_REQUESTER_SECRET_2 => RPC URL
    //IEXEC_REQUESTER_SECRET_3 => Target Address
    const {
      IEXEC_REQUESTER_SECRET_1,
      IEXEC_REQUESTER_SECRET_2,
      IEXEC_REQUESTER_SECRET_3
    } = process.env;

    if (IEXEC_REQUESTER_SECRET_1) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_1.replace(
        /./g,
        "*"
      );
      console.log(
        `Got requester secret TOTAL AMOUNT (${redactedRequesterSecret})!`
      );
      amount = IEXEC_REQUESTER_SECRET_1;
    } else {
      console.log(`Requester secret TOTAL AMOUNT is not set`);
      throw new Error("Total amount is required");
    }

    if (IEXEC_REQUESTER_SECRET_2) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_2.replace(
        /./g,
        "*"
      );
      rpcUrl = IEXEC_REQUESTER_SECRET_2;
      console.log(`Got requester secret RPC URL (${redactedRequesterSecret})!`);
    } else {
      console.log(`Requester secret RPC URL is not set`);
      throw new Error("RPC URL is required");
    }

    if (IEXEC_REQUESTER_SECRET_3) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_3.replace(
        /./g,
        "*"
      );
      targetAddress = IEXEC_REQUESTER_SECRET_3;
      console.log(`Got requester secret TARGET ADDRESS (${redactedRequesterSecret})!`);
    } else {
      console.log(`Requester secret TARGET ADDRESS is not set`);
      throw new Error("Target address is required");
    }

    //------------ Stealth App Logic ------------
    console.log("Starting stealth transfer...");
    
    // Setup provider using the provided RPC URL
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get network information
    const network = await provider.getNetwork();
    console.log(
      "Connected to network:",
      network.name,
      "Chain ID:",
      network.chainId.toString()
    );

    // Create wallet from private key
    const wallet = new ethers.Wallet(lenderPrivateKey, provider);

    // Validate target address
    if (!ethers.isAddress(targetAddress)) {
      throw new Error(`Invalid target address: ${targetAddress}`);
    }

    // Parse amount (assuming it's in ETH)
    const parseAmount = ethers.parseEther(amount);

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    if (balance < parseAmount) {
      throw new Error(`Insufficient balance.`);
    }

    // Create transaction (ethers will handle gas estimation automatically)
    const transaction = {
      to: targetAddress,
      value: parseAmount
    };

    console.log('Sending transaction...');
    
    // Send transaction
    const txResponse = await wallet.sendTransaction(transaction);
    console.log('Transaction sent:', txResponse.hash);
    
    // Wait for confirmation
    console.log('Waiting for confirmation...');
    const receipt = await txResponse.wait();
    
    if (receipt.status === 1) {
      console.log('Transaction confirmed!');
    } else {
      throw new Error('Transaction failed');
    }

    // Transform input text into an ASCII Art text
    const asciiArtText = figlet.textSync(
      `Transfer successful`
    );

    //------------- Write the result to the output file ------------
    // Write result to IEXEC_OUT
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, asciiArtText);

    // Build the "computed.json" object
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
      'transaction-hash': txResponse.hash,
    };
  } catch (e) {
    // Handle errors
    console.log('Error:', e.message);
    console.log(e);

    // Transform error into ASCII Art text
    const asciiArtText = figlet.textSync('Transfer failed');
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, asciiArtText);

    // Build the "computed.json" object with an error message
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
      'error-message': e.message || 'Oops something went wrong'
    };
  } finally {
    // Save the "computed.json" file
    await fs.writeFile(
      `${IEXEC_OUT}/computed.json`,
      JSON.stringify(computedJsonObj, null, 2)
    );
  }
};

main();
