import dotenv from 'dotenv';
dotenv.config();

import { bot } from './bot';
import { walletMenuCallbacks } from './connect-wallet-menu';
import {
    handleConnectCommand,
    handleDisconnectCommand,
    handleSendWalletCommand,
    handleShowMyWalletCommand
} from './commands-handlers';
import { getStorage, initRedisClient } from './ton-connect/storage';
import TelegramBot from 'node-telegram-bot-api';

async function main(): Promise<void> {
    await initRedisClient();

    const callbacks = {
        ...walletMenuCallbacks
    };

    bot.on('callback_query', query => {
        if (!query.data) {
            return;
        }

        let request: { method: string; data: string };

        try {
            request = JSON.parse(query.data);
        } catch {
            return;
        }

        if (!callbacks[request.method as keyof typeof callbacks]) {
            return;
        }

        callbacks[request.method as keyof typeof callbacks](query, request.data);
    });

    bot.onText(/\/connect/, handleConnectCommand);

    bot.onText(/\/send_wallet/, handleSendWalletCommand);
    bot.onText(/Отправить ещё раз/, handleSendWalletCommand)

    // bot.onText(/\/send_tx/, handleSendTXCommand);

    bot.onText(/\/disconnect/, handleDisconnectCommand);

    bot.onText(/\/my_wallet/, handleShowMyWalletCommand);

    bot.onText(/\/start/, (msg: TelegramBot.Message) => {
        bot.sendMessage(
            msg.chat.id,
            `
Добро пожаловать! Этот бот поможет Вам получить сертификат участника конференции. Введите команду /connect, чтобы начать.`
        );

        const storage = getStorage(msg.chat.id);
        storage.setItem("code", msg.text?.split(" ")[1] || "")
    });
}

main();
