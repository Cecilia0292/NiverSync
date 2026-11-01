import 'dotenv/config';
import express, { Request, Response } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

app.use(express.json());

// Initialize Google GenAI on server
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', serverTime: new Date().toISOString() });
});

// Generate personalized birthday messages
app.post('/api/ai/generate-message', async (req: Request, res: Response) => {
  try {
    const {
      name,
      relationship = 'Amigo(a)',
      age,
      tone = 'Emocionante e Carinhoso',
      interests = '',
      memories = '',
      length = 'médio',
      senderName = '',
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Nome do aniversariante é obrigatório.' });
    }

    const prompt = `Você é um especialista em comunicação e escrita criativa de mensagens de aniversário memoráveis.
Gere 3 versões de mensagens de aniversário para a seguinte pessoa:
- Nome: ${name}
- Relação: ${relationship}
- Idade (se informada): ${age || 'Não especificada'}
- Tom desejado principal: ${tone}
- Interesses / Hobbies / Características: ${interests || 'Nenhum informado'}
- Memórias / Piadas internas / Detalhes especiais: ${memories || 'Nenhum informado'}
- Tamanho preferido: ${length} (curto = 2-3 frases, médio = 1-2 parágrafos envolventes, longo = mensagem profunda com 2-3 parágrafos)
- Nome de quem está enviando (remetente): ${senderName || 'Não especificado'}

Retorne a resposta estritamente no formato JSON estruturado com:
1. mainMessage: A mensagem principal no tom solicitado, formatada com quebras de linha e emojis adequados para WhatsApp/E-mail.
2. warmMessage: Uma alternativa mais afetiva, calorosa e emocionante.
3. funnyMessage: Uma alternativa bem-humorada, descontraída ou divertida.
4. emailSubject: Um título criativo e chamativo para assunto de e-mail (caso o usuário decida enviar por e-mail).
5. giftIdeas: Uma lista de 3 ideias criativas de presentes ou gestos carinhosos baseados no perfil.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Você é um assistente atencioso e criativo especializado em mensagens de aniversário em português brasileiro, naturais, sem clichês vazios, com sentimento genuíno e emojis adequados.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mainMessage: {
              type: Type.STRING,
              description: 'Mensagem principal alinhada com o tom selecionado.',
            },
            warmMessage: {
              type: Type.STRING,
              description: 'Alternativa calorosa e emocionante.',
            },
            funnyMessage: {
              type: Type.STRING,
              description: 'Alternativa divertida e espirituosa.',
            },
            emailSubject: {
              type: Type.STRING,
              description: 'Assunto sugerido para e-mail.',
            },
            giftIdeas: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Lista de 3 ideias rápidas de presente ou surpresa.',
            },
          },
          required: ['mainMessage', 'warmMessage', 'funnyMessage', 'emailSubject', 'giftIdeas'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error generating birthday message:', error);
    return res.status(500).json({
      error: 'Não foi possível gerar a mensagem de aniversário no momento.',
      details: error?.message || 'Erro desconhecido',
    });
  }
});

// Refine or tweak an existing message
app.post('/api/ai/refine-message', async (req: Request, res: Response) => {
  try {
    const { currentMessage, instruction } = req.body;

    if (!currentMessage || !instruction) {
      return res.status(400).json({ error: 'Mensagem atual e instrução são obrigatórias.' });
    }

    const prompt = `Mensagem atual:
"${currentMessage}"

Instrução de ajuste do usuário:
"${instruction}"

Reescreva a mensagem atendendo rigorosamente à instrução solicitada, mantendo um tom natural em português brasileiro e emojis adequados para WhatsApp e E-mail. Retorne um JSON com o campo "refinedMessage".`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            refinedMessage: {
              type: Type.STRING,
              description: 'A mensagem ajustada.',
            },
          },
          required: ['refinedMessage'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error refining message:', error);
    return res.status(500).json({
      error: 'Falha ao ajustar a mensagem.',
      details: error?.message || 'Erro desconhecido',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 NiverSync server running at http://0.0.0.0:${port}`);
  });
}

startServer();
