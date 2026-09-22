require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenAI } = require('@google/genai');
const http = require('http');

// 1. Mini-servidor web para manter o Render online
http.createServer((req, res) => res.end('Bot online!')).listen(process.env.PORT || 3000);

// 2. Conexão com o Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 3. Conexão com a nova SDK do Google Gen AI
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// 4. A Personalidade do Bot
const promptDeSistema = `Você é um administrador do servidor. Nossa comunidade é focada em tecnologia, projetos digitais e revenda de serviços.
- Aja como um humano membro da equipe.
- Você tem memória das conversas, então aja com naturalidade.
- Tire dúvidas dos membros, dê ideias para estruturar vendas ou códigos, e mantenha o clima do servidor organizado e produtivo.
- Seja carismático e um pouco sarcástico, mas sempre prestativo.`;

// 5. Memória RAM por canal
const memoriasDosCanais = new Map();

client.on('ready', () => {
  console.log(`⚡ Cérebro conectado com a SDK nova! Bot online como ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  if (message.mentions.has(client.user)) {
    try {
      const mensagemUsuario = message.content.replace(/<@!?\d+>/g, '').trim();
      const channelId = message.channel.id;

      await message.channel.sendTyping();

      // Se não existe histórico para este canal, inicializa
      if (!memoriasDosCanais.has(channelId)) {
        memoriasDosCanais.set(channelId, []);
      }

      const historico = memoriasDosCanais.get(channelId);

      // Adiciona a fala do usuário ao histórico local
      historico.push({ role: 'user', parts: [{ text: mensagemUsuario }] });

      // Faz a requisição usando o modelo flash atualizado e injetando as regras de sistema junto
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: historico,
        config: {
          systemInstruction: promptDeSistema,
        }
      });

      const respostaIA = response.text;

      // Adiciona a resposta da IA ao histórico local para manter a memória
      historico.push({ role: 'model', parts: [{ text: respostaIA }] });

      message.reply(respostaIA);

    } catch (error) {
      console.error("Erro no processamento:", error);
      message.reply("Deu um tilt nos meus circuitos, tenta de novo em instantes!");
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
