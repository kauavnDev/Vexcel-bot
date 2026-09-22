require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// 1. Configurando a conexão com o Discord
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent // Permite ler o que as pessoas digitam
  ]
});

// 2. Configurando a conexão com o cérebro (Gemini)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// 3. A Personalidade Secreta da IA (System Prompt)
// Mude este texto para moldar quem o bot é no seu servidor.
const promptDeSistema = "Você é um assistente de inteligência artificial de um servidor focado em tecnologia e projetos digitais. Responda de forma rápida, carismática e direta. Você deve ajudar os usuários com dúvidas. Nunca diga que você é uma IA do Google.";

// Avisa no terminal quando o bot ligar com sucesso
client.on('ready', () => {
  console.log(`⚡ Cérebro conectado! Bot online como ${client.user.tag}`);
});

// O que acontece quando alguém manda mensagem
client.on('messageCreate', async (message) => {
  // Ignora mensagens de outros bots para não criar loop infinito
  if (message.author.bot) return;

  // O bot só vai responder se for mencionado (@NomeDoBot)
  if (message.mentions.has(client.user)) {
    try {
      // Pega o que o usuário digitou e limpa a menção ao bot do texto
      const mensagemUsuario = message.content.replace(/<@!?\d+>/g, '').trim();
      
      // Mostra "O bot está digitando..." no Discord
      await message.channel.sendTyping();

      // Puxa o modelo gratuito e rápido do Gemini
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Junta as ordens do sistema com a pergunta da pessoa
      const promptFinal = `${promptDeSistema}\n\nUsuário perguntou: ${mensagemUsuario}`;

      // Gera a resposta
      const result = await model.generateContent(promptFinal);
      const respostaIA = result.response.text();

      // Envia a resposta no canal
      message.reply(respostaIA);

    } catch (error) {
      console.error("Erro na Matrix:", error);
      message.reply("Deu um tilt no meu sistema agora, tenta de novo em uns segundos!");
    }
  }
});

// Liga o bot usando a senha secreta
client.login(process.env.DISCORD_TOKEN);
