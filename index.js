require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const http = require('http');

// 1. Mini-servidor web para manter o Render online (Porta 3000)
http.createServer((req, res) => res.end('Bot online!')).listen(process.env.PORT || 3000);

// 2. Conexão com o Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 3. Conexão com o Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 4. Configurando o cérebro limpo (sem conflitos de parâmetros)
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

// 5. Memória RAM por canal
const memoriasDosCanais = new Map();

client.on('ready', () => {
  console.log(`⚡ Cérebro conectado! @vexcel_bot online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user)) {
    try {
      const mensagemUsuario = message.content.replace(/<@!?\d+>/g, '').trim();
      const channelId = message.channel.id;

      await message.channel.sendTyping();

      if (!memoriasDosCanais.has(channelId)) {
        const novoChat = model.startChat({ history: [] });
        memoriasDosCanais.set(channelId, novoChat);
      }

      const chat = memoriasDosCanais.get(channelId);

      // Injetamos a personalidade de administrador direto no prompt enviado
      const promptComPersonalidade = `[Instrução Interna: Você é o @vexcel_bot, um administrador carismático, prestativo e um pouco sarcástico de um servidor de tecnologia, projetos digitais e revenda. Responda de forma natural e humana]. Mensagem do usuário: ${mensagemUsuario}`;

      const result = await chat.sendMessage(promptComPersonalidade);
      const respostaIA = result.response.text();

      message.reply(respostaIA);

    } catch (error) {
      console.error("Erro detalhado no processamento:", error);
      message.reply("Deu um tilt nos meus circuitos, tenta de novo em instantes!");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
