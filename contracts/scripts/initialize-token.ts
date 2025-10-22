import { AnchorProvider, Program, Wallet } from '@project-serum/anchor';
import { MintLayout, TOKEN_PROGRAM_ID, createInitializeMintInstruction } from '@solana/spl-token';
import { Connection, Keypair, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import fs from 'fs';
import path from 'path';

// Загружаем IDL для программы
const IDL = require('../target/idl/music_token.json');

// Конфигурация сети
const NETWORK = 'https://api.devnet.solana.com';
const PREFLIGHT_COMMITMENT = 'processed';

// Параметры токена
const TOKEN_CONFIG = {
  name: 'Normal Dance Music Token',
  symbol: 'MUSIC',
  decimals: 9,
  supply: 1_000_000_000, // 1 миллиард токенов
  uri: 'https://normaldance.com/token-metadata.json'
};

async function initializeToken() {
  try {
    console.log('🎵 Инициализация музыкального токена...');

    // Подключение к сети
    const connection = new Connection(NETWORK, PREFLIGHT_COMMITMENT);

    // Загружаем ключевую пару для деплоера
    const keypairPath = path.join(require('os').homedir(), '.config/solana/id.json');
    if (!fs.existsSync(keypairPath)) {
      throw new Error('Ключевая пара не найдена. Запустите: solana-keygen new');
    }

    const keypair = Keypair.fromSecretKey(
      new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, 'utf8')))
    );

    console.log('👤 Деплоер:', keypair.publicKey.toString());

    // Создаем провайдер
    const wallet = new Wallet(keypair);
    const provider = new AnchorProvider(connection, wallet, {
      preflightCommitment: PREFLIGHT_COMMITMENT,
    });

    // Загружаем программу
    const programId = new PublicKey('Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFp1Jff');
    const program = new Program(IDL, programId, provider);

    // Генерируем ключи для минта и токен аккаунта
    const mintKeypair = Keypair.generate();
    const tokenAccountKeypair = Keypair.generate();

    console.log('🔑 Минт адрес:', mintKeypair.publicKey.toString());
    console.log('💰 Токен аккаунт:', tokenAccountKeypair.publicKey.toString());

    // Создаем транзакцию для инициализации токена
    const tx = new Transaction().add(
      // Создаем аккаунт минта
      SystemProgram.createAccount({
        fromPubkey: keypair.publicKey,
        newAccountPubkey: mintKeypair.publicKey,
        space: MintLayout.span,
        lamports: await connection.getMinimumBalanceForRentExemption(MintLayout.span),
        programId: TOKEN_PROGRAM_ID,
      }),
      // Инициализируем минт
      createInitializeMintInstruction(
        mintKeypair.publicKey,
        TOKEN_CONFIG.decimals,
        keypair.publicKey, // authority
        keypair.publicKey, // freeze authority (optional)
        TOKEN_PROGRAM_ID
      )
    );

    // Подписываем транзакцию
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    tx.feePayer = keypair.publicKey;
    tx.sign(keypair, mintKeypair);

    // Отправляем транзакцию
    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction(signature, 'confirmed');

    console.log('✅ Токен успешно инициализирован!');
    console.log('🔗 Транзакция:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log('🏷️ Минт адрес:', mintKeypair.publicKey.toString());
    console.log('📊 Параметры токена:');
    console.log(`   Название: ${TOKEN_CONFIG.name}`);
    console.log(`   Символ: ${TOKEN_CONFIG.symbol}`);
    console.log(`   Децималс: ${TOKEN_CONFIG.decimals}`);
    console.log(`   Общая эмиссия: ${TOKEN_CONFIG.supply}`);

    // Сохраняем конфигурацию токена
    const config = {
      programId: programId.toString(),
      mintAddress: mintKeypair.publicKey.toString(),
      tokenAccount: tokenAccountKeypair.publicKey.toString(),
      deployer: keypair.publicKey.toString(),
      network: NETWORK,
      tokenConfig: TOKEN_CONFIG
    };

    fs.writeFileSync('token-config.json', JSON.stringify(config, null, 2));
    console.log('💾 Конфигурация сохранена в token-config.json');

  } catch (error) {
    console.error('❌ Ошибка инициализации токена:', error);
    process.exit(1);
  }
}

// Запускаем инициализацию
initializeToken().catch(console.error);