const hre = require("hardhat");
const { ethers } = require("hardhat");
const {
  ecsign,
  toRpcSig,
  keccak256: keccak256_buffer,
} = require("ethereumjs-util");

const deploy_entry_point = require("./deploy/entrypoint.deploy");
const deploy_wallet_factory = require("./deploy/walletFactory.deploy");
const deploy_paymaster = require("./deploy/paymaster.deploy");
const deploy_nft = require("./deploy/nft.deploy");

function signUserOp(userOpHash, signer) {
  // Create the Ethereum Signed Message hash (similar to what ethers.js does internally)
  const msg1 = ethers.utils.solidityKeccak256(
    ["string", "bytes32"],
    ["\x19Ethereum Signed Message:\n32", userOpHash]
  );

  // Sign the hashed message using the signer's private key
  const signature = signer.signMessage(ethers.utils.arrayify(userOpHash));

  return signature;
}

async function main() {
  [deployer] = await ethers.getSigners();

  console.log("deployer address:", deployer.address);
  const salt = ethers.BigNumber.from("0x101983453434534");
  const unstakeDelay = 10;

  const entryPointAddress = "0xc8BAe8188F6AD53777Ca7773e588612fea246ded";
  const walletFactoryAddress = "0xAdd1ab5BC6E4b668cFB2d9845D3Ce8BCA973a822";
  const paymasterAddress = "0x00DB2a4A5344FcFA058A7C461e75251cfc597C4c";
  const nftAddress = "0xD8F36D54544E91D5C40b92c7e495c8CdBf43f0ff";

  const EntryPoint = await ethers.getContractFactory("EntryPoint");
  const epInstance = EntryPoint.attach(entryPointAddress);

  const WalletFactory = await ethers.getContractFactory("WalletFactory");
  const wfInstance = WalletFactory.attach(walletFactoryAddress);

  const PayMaster = await ethers.getContractFactory("PayMaster");
  const pmInstance = PayMaster.attach(paymasterAddress);

  const NFT = await ethers.getContractFactory("TaikoNFT");
  const nftInstance = NFT.attach(nftAddress);

  // const epInstance = await deploy_entry_point();
  // const wfInstance = await deploy_wallet_factory();
  // const pmInstance = await deploy_paymaster(epInstance);
  // const nftInstance = await deploy_nft();

  console.log("computing address");
  const sender = await wfInstance.computeAddress(
    epInstance.address,
    deployer.address,
    salt
  );
  console.log("Smart Contract Wallet Address:", sender);

  const UserOp = {
    sender: sender,
    nonce: 0,
    initCode: "0x",
    callData: "0x",
    callGasLimit: ethers.BigNumber.from("2000000"),
    verificationGasLimit: ethers.BigNumber.from("3000000"),
    preVerificationGas: ethers.BigNumber.from("1000000"),
    maxFeePerGas: "",
    maxPriorityFeePerGas: "",
    // maxFeePerGas: ethers.BigNumber.from("1000105660"),
    // maxPriorityFeePerGas: ethers.BigNumber.from("1000000000"),
    paymasterAndData: "0x",
    signature: "0x",
  };
  const { maxFeePerGas, maxPriorityFeePerGas } =
    await ethers.provider.getFeeData();
  UserOp.maxFeePerGas = maxFeePerGas;
  UserOp.maxPriorityFeePerGas = maxPriorityFeePerGas;

  //2. creating init code
  const initCode = ethers.utils.solidityPack(
    ["address", "bytes"],
    [
      wfInstance.address,
      wfInstance.interface.encodeFunctionData("deployWallet", [
        epInstance.address,
        deployer.address,
        salt,
      ]),
    ]
  );

  UserOp.initCode = initCode;

  // 3. Set paymaster on userOperation
  UserOp.paymasterAndData = ethers.utils.solidityPack(
    ["address"],
    [pmInstance.address]
  );

  // 4. Sign userOperation and attach signature
  console.log("get user op hash");
  const userOpHash = await epInstance.getUserOpHash(UserOp);
  console.log("signing user op");
  const signature = signUserOp(userOpHash, deployer);
  UserOp.signature = signature;
  console.log("adding stake");

  // const stakeTxn = await pmInstance.addStake(unstakeDelay, {
  //   value: ethers.utils.parseEther("0.1"),
  // });
  // console.log(stakeTxn);

  console.log("adding deposit");
  const depositTxn = await pmInstance.deposit({
    value: ethers.utils.parseEther("1"),
  });

  // const userOps = [UserOp];
  // console.log("calling handleOps");
  // const handleOpsTx = await epInstance.handleOps(userOps, deployer.address);
  // console.log("handleOps simulated successfully:", handleOpsTx);
}

// async function main() {
//   [deployer] = await ethers.getSigners();

//   console.log("Deployer address:", deployer.address);
//   const salt = ethers.BigNumber.from("0x101983453453465344534");
//   const unstakeDelay = 10;

//   // Use existing deployed contract addresses
//   const entryPointAddress = "0x1bBAEca49D5344Da6D5A394b746b70CF1a845f41";
//   const walletFactoryAddress = "0xeB3dbaeBbE9Ac93F8Ca18213314468E3c3659956";
//   const paymasterAddress = "0x2C1F357DA60874b39936f00Ce736163a231f6A9f";
//   const nftAddress = "0xB599657cDcEeCe0cBe19190c0f479BBA3B1F64D2";

//   // Create instances using the deployed contract addresses
//   const EntryPoint = await ethers.getContractFactory("EntryPoint");
//   const epInstance = EntryPoint.attach(entryPointAddress);

//   const WalletFactory = await ethers.getContractFactory("WalletFactory");
//   const wfInstance = WalletFactory.attach(walletFactoryAddress);

//   const PayMaster = await ethers.getContractFactory("PayMaster");
//   const pmInstance = PayMaster.attach(paymasterAddress);

//   const NFT = await ethers.getContractFactory("TaikoNFT");
//   const nftInstance = NFT.attach(nftAddress);

//   // Continue with the rest of the logic
//   console.log("Computing wallet address...");
//   const sender = await wfInstance.computeAddress(
//     epInstance.address,
//     deployer.address,
//     salt
//   );
//   console.log("Smart Contract Wallet Address:", sender);

//   const UserOp = {
//     sender: sender,
//     nonce: 0,
//     initCode: "0x",
//     callData: "0x",
//     callGasLimit: ethers.BigNumber.from("2000000"),
//     verificationGasLimit: ethers.BigNumber.from("3000000"),
//     preVerificationGas: ethers.BigNumber.from("1000000"),
//     maxFeePerGas: "",
//     maxPriorityFeePerGas: "",
//     paymasterAndData: "0x",
//     signature: "0x",
//   };

//   const { maxFeePerGas, maxPriorityFeePerGas } =
//     await ethers.provider.getFeeData();
//   UserOp.maxFeePerGas = maxFeePerGas;
//   UserOp.maxPriorityFeePerGas = maxPriorityFeePerGas;

//   // 2. Creating init code
//   const initCode = ethers.utils.solidityPack(
//     ["address", "bytes"],
//     [
//       wfInstance.address,
//       wfInstance.interface.encodeFunctionData("deployWallet", [
//         epInstance.address,
//         deployer.address,
//         salt,
//       ]),
//     ]
//   );
//   UserOp.initCode = initCode;

//   // 3. Set paymaster on userOperation
//   UserOp.paymasterAndData = ethers.utils.solidityPack(
//     ["address"],
//     [pmInstance.address]
//   );

//   // 4. Sign userOperation and attach signature
//   console.log("Get userOp hash...");
//   const userOpHash = await epInstance.getUserOpHash(UserOp);
//   console.log("Signing userOp...");
//   const signature = signUserOp(userOpHash, deployer);
//   UserOp.signature = signature;

//   // 5. Add stake and deposit for the Paymaster contract
//   // console.log("Adding stake...");
//   // const txnStake = await pmInstance.addStake(unstakeDelay, {
//   //   value: ethers.utils.parseEther("0.05"),
//   // });
//   // console.log("Stake txn:", txnStake);
//   // console.log("Adding deposit...");
//   // const txnDeposit = await pmInstance.deposit({
//   //   value: ethers.utils.parseEther("0.05"),
//   // });
//   // console.log("txnDeposit", txnDeposit);
//   // Simulate handleOps call
//   const userOps = [UserOp];
//   console.log("Calling handleOps...");
//   console.log("epInstance.address", epInstance.address);
//   const handleOpsTx = await epInstance.callStatic.handleOps(
//     userOps,
//     deployer.address
//   );
//   console.log("handleOps simulated successfully:", handleOpsTx);
// }

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
