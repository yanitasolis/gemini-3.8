import express from 'express';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '50mb' }));

const PORT = process.env.PORT || 3000;

// Initialize Gemini SDK
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// API Routes

// 1. Text / Chat Generation Endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.8-flash', systemInstruction, temperature = 0.7, thinkingLevel } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Se requiere un array de mensajes válido.' });
    }

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const config: any = {
      temperature: Number(temperature),
    };

    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    if (thinkingLevel && (model.includes('gemini-3') || model.includes('3.8') || model.includes('3.1'))) {
      config.thinkingConfig = { thinkingLevel };
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    res.json({ text: response.text || 'Sin respuesta generada.' });
  } catch (error: any) {
    console.error('Error in /api/gemini/chat:', error);
    res.status(500).json({ error: error.message || 'Error interno del servidor Gemini.' });
  }
});

// 2. Chat Streaming Endpoint (SSE)
app.post('/api/gemini/chat-stream', async (req, res) => {
  try {
    const { messages, model = 'gemini-3.8-flash', systemInstruction, temperature = 0.7 } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Se requiere un array de mensajes válido.' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));

    const config: any = {
      temperature: Number(temperature),
    };
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }

    const responseStream = await ai.models.generateContentStream({
      model,
      contents,
      config,
    });

    for await (const chunk of responseStream) {
      if (chunk.text) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('Error in /api/gemini/chat-stream:', error);
    res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`);
    res.end();
  }
});

// 3. Vision & Multimodal Analysis Endpoint
app.post('/api/gemini/vision', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType = 'image/jpeg', model = 'gemini-3.8-flash' } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: 'Se requiere una imagen en formato base64.' });
    }

    const imagePart = {
      inlineData: {
        mimeType,
        data: imageBase64,
      },
    };
    const textPart = {
      text: prompt || 'Analiza esta imagen detalladamente en español.',
    };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, textPart] },
    });

    res.json({ text: response.text || 'No se pudo analizar la imagen.' });
  } catch (error: any) {
    console.error('Error in /api/gemini/vision:', error);
    res.status(500).json({ error: error.message || 'Error al procesar la imagen con Gemini.' });
  }
});

// 4. Image Generation Endpoint
app.post('/api/gemini/image', async (req, res) => {
  try {
    const { prompt, aspectRatio = '1:1', imageSize = '1K', highQuality = false } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Se requiere un texto descriptivo para generar la imagen.' });
    }

    const model = highQuality ? 'gemini-3.1-flash-image' : 'gemini-3.1-flash-lite-image';

    const response = await ai.models.generateContent({
      model,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio,
          imageSize,
        },
      },
    });

    let imageUrl = '';
    let description = '';

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imageUrl = `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        } else if (part.text) {
          description += part.text;
        }
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'El modelo no devolvió ninguna imagen.' });
    }

    res.json({ imageUrl, description });
  } catch (error: any) {
    console.error('Error in /api/gemini/image:', error);
    res.status(500).json({ error: error.message || 'Error al generar la imagen.' });
  }
});

// 5. Text-to-Speech (TTS) Endpoint (Supports Single Speaker & Dual-Speaker Podcast)
app.post('/api/gemini/tts', async (req, res) => {
  try {
    const { text, voiceName = 'Kore', style, isDualSpeaker = false, speaker1Name = 'Alex', speaker1Voice = 'Puck', speaker2Name = 'Sam', speaker2Voice = 'Kore', dialogueParts } = req.body;

    if (isDualSpeaker && dialogueParts && Array.isArray(dialogueParts)) {
      // Dual-speaker podcast / screenplay mode using gemini-3.8-flash-tts
      const parts = dialogueParts.map((d: any) => ({
        text: `${d.speaker}: ${d.text}`,
        speechMetadata: {
          speaker: d.speaker,
          style: d.style || 'Conversacional y natural'
        }
      }));

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: [{ role: 'user', parts }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: [
                {
                  speaker: speaker1Name,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker1Voice } }
                },
                {
                  speaker: speaker2Name,
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: speaker2Voice } }
                }
              ]
            }
          }
        }
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        return res.status(500).json({ error: 'No se pudo generar el audio dual-speaker.' });
      }
      return res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    }

    // Single Speaker Mode
    if (!text) {
      return res.status(400).json({ error: 'Se requiere texto para sintetizar.' });
    }

    const model = 'gemini-3.8-flash-lite-tts';
    const speechPart: any = { text };
    if (style) {
      speechPart.speechMetadata = { style };
    }

    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [speechPart] }],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'No se pudo generar el audio.' });
    }

    res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
  } catch (error: any) {
    console.error('Error in /api/gemini/tts:', error);
    res.status(500).json({ error: error.message || 'Error al sintetizar voz.' });
  }
});

// Setup Vite middleware in development or serve static in production
async function setupServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Servidor Gemini 3.8 corriendo en http://localhost:${PORT}`);
  });
}

setupServer();
