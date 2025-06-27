
![SKULD Banner](./assets/banner.png)

# 🤖 SKULD — Confidential Token Sender Bot

SKULD is a privacy-first Telegram bot that enables users to **send ETH confidentially** using stealth addresses and iExec Trusted Execution Environments (TEE).  
It aims to **mitigate sandwich attacks and market manipulation**, particularly by KOLs (Key Opinion Leaders), allowing users to buy tokens in a **non-traceable, non-manipulable** way.

---

## 🛡️ Why SKULD?

Market manipulation and MEV (Miner Extractable Value) attacks such as **sandwich attacks** affect retail investors by allowing bots and whales to frontrun or backrun their transactions.

SKULD addresses this problem by:

- Using **stealth addresses** to obfuscate destination wallets.
- Locking funds into an **Escrow contract** on-chain.
- Matching orders in a **trusted enclave** using [iExec TEE](https://iex.ec).
- Ensuring that the **transaction origin and content remain confidential**.

---

## ✨ Features

- 🧾 Confidential fund transfers via Telegram.
- 🔐 Escrow locking before task execution.
- 🔍 Secret Transaction tracking via Etherscan.
- 🧠 Lender task fulfillment using iExec infrastructure.
- 📬 Dynamic Telegram messaging (funds locked → order placed → filled → task complete).
- 🌐 Supports **Sepolia Testnet** (customizable).

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/your-username/skuld-bot.git
cd skuld-bot
```

### 2. Test the iApp

```bash
EXPERIMENTAL_TDX_APP=true iapp test --requesterSecret 1=0.00001 2=https://sepolia.gateway.tenderly.co/56OqCbuPte15zM70pAt1Ws 3=0x... 4=0x5... --protectedData "protectedData"
```

### 2. Run SKULd deployed iApp

```bash
EXPERIMENTAL_TDX_APP=true iapp run 0xbb46C4c5dc4060C1A52a796a5e609A2b2ba10165 --requesterSecret 1=0.00001 2=https://sepolia.gateway.tenderly.co/56OqCbuPte15zM70pAt1Ws 3=0x... 4=0x... --protectedData 0xE0Bd093D2d75b175BadaeCD87DC95E8993D1dc93
```

### 3. Deploy a New App

```bash
EXPERIMENTAL_TDX_APP=true iapp deploy
```
