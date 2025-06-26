import fs from 'node:fs/promises';
import figlet from 'figlet';
import { ethers } from 'ethers';

const main = async () => {
  const { IEXEC_OUT } = process.env;

  let computedJsonObj = {};
  let tx = 'N/A';

  try {
    let targetAddress; //TODO change this to your target address
    let lenderAddress;

    //------------ Requester Secret Handling ------------
    //IEXEC_REQUESTER_SECRET_1 => Private Key
    //IEXEC_REQUESTER_SECRET_2 => Total Amount
    //IEXEC_REQUESTER_SECRET_3 => RPC URL
    //IEXEC_REQUESTER_SECRET_4 => Target Address
    const {
      IEXEC_REQUESTER_SECRET_1,
      IEXEC_REQUESTER_SECRET_2,
      IEXEC_REQUESTER_SECRET_3,
      IEXEC_REQUESTER_SECRET_4,
    } = process.env;

    if (IEXEC_REQUESTER_SECRET_1) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_1.replace(
        /./g,
        "*"
      );
      lenderAddress = IEXEC_REQUESTER_SECRET_1;
      console.log(
        `Got requester secret PRIVATE KEY (${redactedRequesterSecret})!`
      );
    } else {
      console.log(`Requester secret PRIVATE KEY is not set`);
      throw new Error("Private key is required");
    }

    if (IEXEC_REQUESTER_SECRET_2) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_2.replace(
        /./g,
        "*"
      );
      console.log(
        `Got requester secret TOTAL AMOUNT (${redactedRequesterSecret})!`
      );
    } else {
      console.log(`Requester secret TOTAL AMOUNT is not set`);
      throw new Error("Total amount is required");
    }

    if (IEXEC_REQUESTER_SECRET_3) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_3.replace(
        /./g,
        "*"
      );
      console.log(`Got requester secret RPC URL (${redactedRequesterSecret})!`);
    } else {
      console.log(`Requester secret RPC URL is not set`);
      throw new Error("RPC URL is required");
    }

    if (IEXEC_REQUESTER_SECRET_4) {
      const redactedRequesterSecret = IEXEC_REQUESTER_SECRET_4.replace(
        /./g,
        "*"
      );
      targetAddress = IEXEC_REQUESTER_SECRET_4;
      console.log(`Got TARGET ADDRESS (${redactedRequesterSecret})!`);
    } else {
      console.log(`Requester secret TARGET ADDRESS is not set`);
      throw new Error("Target address is required");
    }

    //------------ Stealth App Logic ------------
    console.log("Starting stealth transfer...");
    
    // Setup provider using the provided RPC URL
    const provider = new ethers.JsonRpcProvider(IEXEC_REQUESTER_SECRET_3);

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
    const amount = ethers.parseEther(IEXEC_REQUESTER_SECRET_2);
    console.log('Transfer amount:', ethers.formatEther(amount), 'ETH');

    // Check wallet balance
    const balance = await provider.getBalance(wallet.address);
    console.log('Wallet balance:', ethers.formatEther(balance), 'ETH');

    if (balance < amount) {
      throw new Error(`Insufficient balance. Required: ${ethers.formatEther(amount)} ETH, Available: ${ethers.formatEther(balance)} ETH`);
    }

    // Create transaction (ethers will handle gas estimation automatically)
    const transaction = {
      to: targetAddress,
      value: amount
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
