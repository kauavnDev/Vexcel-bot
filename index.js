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

// 4. A Personalidade do Bot
const promptDeSistema = `Você é um administrador do servidor. Nossa comunidade é focada em tecnologia, projetos digitais e revenda de serviços.
- Aja como um humano membro da equipe.
- Você tem memória das conversas, então aja com naturalidade.
- Tire dúvidas dos membros, dê ideias para estruturar vendas ou códigos, e mantenha o clima do servidor organizado e produtivo.
- Seja carismático e um pouco sarcástico, mas sempre prestativo.`;

// 5. Configurando o cérebro com o modelo padrão
const model = genAI.getGenerativeModel({ 
  model: "gemini-pro",
  systemInstruction: promptDeSistema
});

// 6. Memória RAM por canal
const memoriasDosCanais = new Map();

client.on('ready', () => {
  console.log(`⚡ Cérebro conectado! Bot online como ${client.user.tag}`);
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
      const result = await chat.sendMessage(mensagemUsuario);
      const respostaIA = result.response.text();

      message.reply(respostaIA);

    } catch (error) {
      console.error("Erro no processamento:", error);
      message.reply("Deu um tilt nos meus circuitos, tenta de novo em instantes!");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
