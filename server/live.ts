import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { db } from './db';
import { buildSystemPrompt } from './ai';

export function setupLiveAgentWebSocket(server: http.Server) {
  const wss = new WebSocketServer({ server, path: '/api/live' });

  wss.on('connection', async (clientWs: WebSocket, req: http.IncomingMessage) => {
    console.log('[Live Agent] Client connected via WebSocket');

    const url = new URL(req.url || '', 'http://localhost');
    const requestedVoice = url.searchParams.get('voice') || 'Zephyr';
    const customKey = url.searchParams.get('key') || '';
    const settings = db.getSettings();

    // Prepare system prompt for live agent
    const systemPrompt = `You are MITALL, an engaging, real-time voice intelligence and personal AI companion.
Speak naturally, conversationally, concisely, and with warmth.
You can discuss programming, mathematics, science, literature, history, and everyday tasks.
Keep spoken responses punchy, direct, and conversational unless the user asks for deep details.`;

    const apiKey = customKey.trim() || settings.geminiApiKey?.trim() || process.env.GEMINI_API_KEY?.trim() || '';

    // Notify client that connection is established
    clientWs.send(JSON.stringify({
      type: 'connected',
      voice: requestedVoice,
      hasKey: !!apiKey,
      timestamp: new Date().toISOString(),
    }));

    let session: any = null;
    let isLiveSessionActive = false;

    try {
      if (apiKey && apiKey !== 'MY_GEMINI_API_KEY' && !apiKey.startsWith('MY_')) {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: {
            apiVersion: 'v1alpha',
            headers: {
              'User-Agent': 'aistudio-build',
            },
          },
        });

        session = await ai.live.connect({
          model: 'gemini-3.8-live',
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: (['Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'].includes(requestedVoice) ? requestedVoice : 'Zephyr') as any,
                },
              },
            },
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            systemInstruction: systemPrompt,
          },
          callbacks: {
            onmessage: (message: LiveServerMessage) => {
              if (clientWs.readyState !== WebSocket.OPEN) return;

              // Spoken audio chunks from model (24kHz PCM)
              for (const part of message.serverContent?.modelTurn?.parts ?? []) {
                if (part.inlineData?.data) {
                  clientWs.send(JSON.stringify({
                    type: 'audio',
                    audio: part.inlineData.data,
                  }));
                }
              }

              // Agent speech-to-text transcript
              if (message.serverContent?.outputTranscription?.text) {
                clientWs.send(JSON.stringify({
                  type: 'transcript',
                  role: 'model',
                  text: message.serverContent.outputTranscription.text,
                }));
              }

              // User speech-to-text transcript
              if (message.serverContent?.inputTranscription?.text) {
                clientWs.send(JSON.stringify({
                  type: 'transcript',
                  role: 'user',
                  text: message.serverContent.inputTranscription.text,
                }));
              }

              // User spoke over the agent
              if (message.serverContent?.interrupted) {
                clientWs.send(JSON.stringify({ type: 'interrupted' }));
              }

              // Turn finished
              if (message.serverContent?.turnComplete) {
                clientWs.send(JSON.stringify({ type: 'turnComplete' }));
              }
            },
            onerror: (err: any) => {
              console.warn('[Live Session Warning]:', err?.message || err);
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({
                  type: 'live_status',
                  mode: 'interactive_fallback',
                  message: `Notice: ${err?.message || 'Live API busy'}. Switched to interactive voice fallback.`,
                }));
              }
            },
            onclose: () => {
              console.log('[Live Session] Upstream Gemini Live connection closed');
              if (clientWs.readyState === WebSocket.OPEN) {
                clientWs.send(JSON.stringify({ type: 'session_closed' }));
              }
            },
          },
        });

        isLiveSessionActive = true;
        clientWs.send(JSON.stringify({
          type: 'live_ready',
          model: 'gemini-3.8-live',
          voice: requestedVoice,
        }));
      } else {
        // Inform client to run interactive local voice mode
        clientWs.send(JSON.stringify({
          type: 'live_status',
          mode: 'interactive_fallback',
          message: 'Running in Interactive Voice Companion mode. Add GEMINI_API_KEY for native 24kHz Live API stream.',
        }));
      }
    } catch (err: any) {
      console.warn('[Live Connection Fallback]:', err?.message || err);
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(JSON.stringify({
          type: 'live_status',
          mode: 'interactive_fallback',
          message: `Live stream notice: ${err?.message || 'API key scope required'}. Interactive voice mode active.`,
        }));
      }
    }

    clientWs.on('message', async (data: Buffer | string) => {
      try {
        const payload = JSON.parse(data.toString());

        if (isLiveSessionActive && session) {
          if (payload.audio) {
            session.sendRealtimeInput({
              audio: { data: payload.audio, mimeType: 'audio/pcm;rate=16000' },
            });
          }
          if (payload.video) {
            session.sendRealtimeInput({
              video: { data: payload.video, mimeType: 'image/jpeg' },
            });
          }
          if (payload.text) {
            session.sendRealtimeInput({
              text: payload.text,
            });
          }
        } else {
          // Interactive fallback: if client sends text or speech query, respond with conversational synthesis
          if (payload.text || payload.query) {
            const query = payload.text || payload.query;
            const words = query.toLowerCase();
            let reply = `I hear you loud and clear. Regarding "${query}", MITALL is ready to assist.`;
            if (words.includes('hello') || words.includes('hi') || words.includes('hey')) {
              reply = `Hello! I am connected and listening live. How can I help you right now?`;
            } else if (words.includes('time') || words.includes('date')) {
              reply = `The current time is ${new Date().toLocaleTimeString()} on ${new Date().toLocaleDateString()}.`;
            } else if (words.includes('who are you')) {
              reply = `I am MITALL, your general-purpose live personal AI companion.`;
            }

            clientWs.send(JSON.stringify({
              type: 'fallback_response',
              text: reply,
            }));
          }
        }
      } catch (err) {
        console.error('[Live Message Handler Error]:', err);
      }
    });

    clientWs.on('close', () => {
      console.log('[Live Agent] Client disconnected');
      if (session && isLiveSessionActive) {
        try {
          session.close();
        } catch {
          // ignore
        }
      }
    });
  });

  return wss;
}
