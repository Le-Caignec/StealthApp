import fs from 'node:fs/promises';
import figlet from 'figlet';
import { ethers } from 'ethers';

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};
  let tx = 'N/A';

  try {
    let lenderAddress; // App Secret
    let targetAddress; // App Secret
    let amount; // Requester Secret
    let rpcUrl; // Requester Secret

    //------------------APP Secret Handling ------------------
    const { IEXEC_APP_DEVELOPER_SECRET } = process.env;
    if (IEXEC_APP_DEVELOPER_SECRET) {
      const redactedAppSecret = IEXEC_APP_DEVELOPER_SECRET.replace(/./g, '*');
      const jsonSecret = JSON.parse(IEXEC_APP_DEVELOPER_SECRET);
      targetAddress = jsonSecret.targetAddress;
      if (!targetAddress) { 
        throw new Error("Target address is required in the app secret");
      }
      lenderAddress = jsonSecret.lenderAddress;
      if (!lenderAddress) {
        throw new Error("Lender address is required in the app secret");
      }
      console.log("🚀 ~ main ~ IEXEC_APP_DEVELOPER_SECRET:", IEXEC_APP_DEVELOPER_SECRET)
      console.log(`Got an app secret (${redactedAppSecret})!`);
    } else {
      console.log(`App secret is not set`);
    }

    //------------ Requester Secret Handling ------------
    //IEXEC_REQUESTER_SECRET_1 => Total Amount
    //IEXEC_REQUESTER_SECRET_2 => RPC URL
    const {
      IEXEC_REQUESTER_SECRET_1,
      IEXEC_REQUESTER_SECRET_2,
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
    const wallet = new ethers.Wallet(lenderAddress, provider);
    console.log('Wallet address:', wallet.address);

    // Validate target address
    if (!ethers.isAddress(targetAddress)) {
      throw new Error(`Invalid target address: ${targetAddress}`);
    }

    // Parse amount (assuming it's in ETH)
    const parseAmount = ethers.parseEther(amount);
    console.log('Transfer amount:', ethers.formatEther(parseAmount), 'ETH');

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');

    if (balance < parseAmount) {
      throw new Error(`Insufficient balance. Required: ${ethers.formatEther(parseAmount)} ETH, Available: ${ethers.formatEther(balance)} ETH`);
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
      console.log('Block number:', receipt.blockNumber);
      console.log('Gas used:', receipt.gasUsed.toString());
      tx = txResponse.hash;
    } else {
      throw new Error('Transaction failed');
    }

    // Transform input text into an ASCII Art text
    const asciiArtText = figlet.textSync(
      `Transfer successful, ${tx}`
    );

    //------------- Write the result to the output file ------------
    // Write result to IEXEC_OUT
    await fs.writeFile(`${IEXEC_OUT}/result.txt`, asciiArtText);

    // Build the "computed.json" object
    computedJsonObj = {
      'deterministic-output-path': `${IEXEC_OUT}/result.txt`,
      'transaction-hash': tx,
      'block-number': receipt.blockNumber,
      'gas-used': receipt.gasUsed.toString()
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
