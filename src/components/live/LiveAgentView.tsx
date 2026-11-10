import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Sparkles,
  Volume2,
  VolumeX,
  Radio,
  Save,
  MessageSquare,
  ChevronDown,
  Activity,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { UserSettings } from '../../types/index';
import { api } from '../../services/api';

interface LiveAgentViewProps {
  settings: UserSettings;
  onSaveToChat?: (title: string, messages: Array<{ role: 'user' | 'assistant'; content: string }>) => void;
  onClose?: () => void;
}

interface TranscriptTurn {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// Convert Float32Array PCM from Web Audio API ([-1.0, 1.0]) to 16-bit PCM Base64 string
function floatTo16BitPCMBase64(float32Array: Float32Array): string {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  const bytes = new Uint8Array(int16Array.buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Convert 24kHz 16-bit PCM Base64 string from Gemini Live to Float32Array for AudioContext playback
function base64ToFloat32Array(base64: string): Float32Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  const int16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(int16.length);
  for (let i = 0; i < int16.length; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

export const LiveAgentView: React.FC<LiveAgentViewProps> = ({ settings, onSaveToChat, onClose }) => {
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'connecting' | 'connected' | 'fallback_active' | 'disconnected' | 'error'
  >('idle');
  const [statusMessage, setStatusMessage] = useState('Ready to connect to Live MITALL Agent');
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState('Zephyr');
  const [transcripts, setTranscripts] = useState<TranscriptTurn[]>([]);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);

  // Audio & WebRTC Refs
  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoStreamRef = useRef<MediaStream | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const queuedSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Fallback speech synth
  const isFallbackRef = useRef(false);

  // Start Live Session
  const startLiveConnection = async () => {
    setConnectionStatus('connecting');
    setStatusMessage('Connecting to MITALL 3.8 Live agent...');

    try {
      // 1. Initialize Output AudioContext at 24kHz for model output playback
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const outCtx = new AudioCtx({ sampleRate: 24000 });
      outputAudioCtxRef.current = outCtx;
      nextStartTimeRef.current = outCtx.currentTime;

      // 2. Initialize Microphone capture at 16kHz
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      mediaStreamRef.current = micStream;

      const inCtx = new AudioCtx({ sampleRate: 16000 });
      inputAudioCtxRef.current = inCtx;
      const source = inCtx.createMediaStreamSource(micStream);
      const processor = inCtx.createScriptProcessor(4096, 1, 1);
      scriptProcessorRef.current = processor;

      // Audio Meter
      const analyser = inCtx.createAnalyser();
      analyser.fftSize = 64;
      source.connect(analyser);

      source.connect(processor);
      processor.connect(inCtx.destination);

      // Connect WebSocket
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?voice=${encodeURIComponent(selectedVoice)}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      processor.onaudioprocess = (e) => {
        if (isMicMuted || ws.readyState !== WebSocket.OPEN) return;
        const inputData = e.inputBuffer.getChannelData(0);

        // Simple RMS level detection
        let sum = 0;
        for (let i = 0; i < inputData.length; i++) {
          sum += inputData[i] * inputData[i];
        }
        const rms = Math.sqrt(sum / inputData.length);
        setIsUserSpeaking(rms > 0.04);
        setAudioLevel(Math.min(1, rms * 8));

        const base64PCM = floatTo16BitPCMBase64(inputData);
        ws.send(JSON.stringify({ audio: base64PCM }));
      };

      ws.onopen = () => {
        setConnectionStatus('connected');
        setStatusMessage('Live MITALL session active. Speak freely.');
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === 'connected') {
            console.log('[Live WS Connected]:', msg);
          } else if (msg.type === 'live_ready') {
            setConnectionStatus('connected');
            setStatusMessage(`Connected to ${msg.model} (Voice: ${msg.voice})`);
          } else if (msg.type === 'audio' && msg.audio) {
            setIsAgentSpeaking(true);
            playAudioChunk24kHz(msg.audio);
          } else if (msg.type === 'transcript') {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `tr-${Date.now()}-${Math.random()}`,
                role: msg.role === 'model' ? 'model' : 'user',
                text: msg.text,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
          } else if (msg.type === 'interrupted') {
            // User interrupted the model: immediately clear audio queue
            clearAudioQueue();
            setIsAgentSpeaking(false);
          } else if (msg.type === 'turnComplete') {
            setIsAgentSpeaking(false);
          } else if (msg.type === 'live_status' && msg.mode === 'interactive_fallback') {
            isFallbackRef.current = true;
            setConnectionStatus('fallback_active');
            setStatusMessage(msg.message || 'Interactive voice mode active.');
          } else if (msg.type === 'fallback_response' && msg.text) {
            setTranscripts((prev) => [
              ...prev,
              {
                id: `tr-${Date.now()}`,
                role: 'model',
                text: msg.text,
                timestamp: new Date().toLocaleTimeString(),
              },
            ]);
            speakFallbackText(msg.text);
          }
        } catch (err) {
          console.error('[Live onmessage error]:', err);
        }
      };

      ws.onerror = () => {
        setConnectionStatus('fallback_active');
        setStatusMessage('Live stream using local voice companion.');
      };

      ws.onclose = () => {
        if (connectionStatus === 'connected') {
          setConnectionStatus('disconnected');
          setStatusMessage('Live session ended.');
        }
      };
    } catch (err: any) {
      console.error('[Live start error]:', err);
      setConnectionStatus('error');
      setStatusMessage(`Microphone access required: ${err?.message || 'Permission denied'}`);
    }
  };

  // Playback 24kHz chunk with gapless buffer scheduling
  const playAudioChunk24kHz = (base64Audio: string) => {
    if (isAudioMuted || !outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;

    try {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const floatData = base64ToFloat32Array(base64Audio);
      const audioBuffer = ctx.createBuffer(1, floatData.length, 24000);
      audioBuffer.getChannelData(0).set(floatData);

      const sourceNode = ctx.createBufferSource();
      sourceNode.buffer = audioBuffer;
      sourceNode.connect(ctx.destination);

      const now = ctx.currentTime;
      // Gapless scheduling
      const startTime = Math.max(now, nextStartTimeRef.current);
      sourceNode.start(startTime);
      nextStartTimeRef.current = startTime + audioBuffer.duration;

      queuedSourcesRef.current.push(sourceNode);

      sourceNode.onended = () => {
        const idx = queuedSourcesRef.current.indexOf(sourceNode);
        if (idx > -1) queuedSourcesRef.current.splice(idx, 1);
        if (queuedSourcesRef.current.length === 0) {
          setIsAgentSpeaking(false);
        }
      };
    } catch (err) {
      console.error('[Playback Error]:', err);
    }
  };

  const clearAudioQueue = () => {
    queuedSourcesRef.current.forEach((src) => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // ignore
      }
    });
    queuedSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
  };

  const speakFallbackText = (text: string) => {
    if (isAudioMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.onstart = () => setIsAgentSpeaking(true);
    utterance.onend = () => setIsAgentSpeaking(false);
    utterance.onerror = () => setIsAgentSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  // Video Streaming (1 FPS JPEG)
  const toggleCamera = async () => {
    if (isCameraActive) {
      if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
      if (videoStreamRef.current) {
        videoStreamRef.current.getTracks().forEach((t) => t.stop());
        videoStreamRef.current = null;
      }
      setIsCameraActive(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoStreamRef.current = stream;
      if (videoElementRef.current) {
        videoElementRef.current.srcObject = stream;
      }
      setIsCameraActive(true);

      const hiddenCanvas = document.createElement('canvas');
      hiddenCanvas.width = 640;
      hiddenCanvas.height = 480;
      const ctx = hiddenCanvas.getContext('2d');

      // 1 frame per second as specified in live_api.md
      videoIntervalRef.current = window.setInterval(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        if (videoElementRef.current && ctx) {
          ctx.drawImage(videoElementRef.current, 0, 0, 640, 480);
          const base64Jpeg = hiddenCanvas.toDataURL('image/jpeg', 0.6).split(',')[1];
          if (base64Jpeg) {
            wsRef.current.send(JSON.stringify({ video: base64Jpeg }));
          }
        }
      }, 1000);
    } catch (err: any) {
      alert(`Could not access camera: ${err?.message || 'Permission denied'}`);
      setIsCameraActive(false);
    }
  };

  const handleSendText = () => {
    if (!textInput.trim() || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
    const q = textInput.trim();
    setTextInput('');

    setTranscripts((prev) => [
      ...prev,
      {
        id: `tr-${Date.now()}`,
        role: 'user',
        text: q,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    wsRef.current.send(JSON.stringify({ text: q }));
  };

  const handleDisconnect = () => {
    clearAudioQueue();
    if (videoIntervalRef.current) clearInterval(videoIntervalRef.current);
    if (videoStreamRef.current) videoStreamRef.current.getTracks().forEach((t) => t.stop());
    if (mediaStreamRef.current) mediaStreamRef.current.getTracks().forEach((t) => t.stop());
    if (scriptProcessorRef.current) scriptProcessorRef.current.disconnect();
    if (inputAudioCtxRef.current) inputAudioCtxRef.current.close().catch(() => {});
    if (outputAudioCtxRef.current) outputAudioCtxRef.current.close().catch(() => {});
    if (wsRef.current) wsRef.current.close();

    setConnectionStatus('disconnected');
    setStatusMessage('Session terminated. Click Connect to restart.');
    setIsAgentSpeaking(false);
    setIsUserSpeaking(false);
    setIsCameraActive(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handleDisconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Visualizer Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let angle = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Outer glowing ring
      const baseRadius = 55;
      const dynamicRadius = baseRadius + (isAgentSpeaking ? 16 : isUserSpeaking ? 12 : 2) * (1 + audioLevel);

      const grad = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, dynamicRadius + 30);
      if (isAgentSpeaking) {
        grad.addColorStop(0, 'rgba(99, 102, 241, 0.9)'); // Indigo/Violet
        grad.addColorStop(0.5, 'rgba(139, 92, 246, 0.4)');
        grad.addColorStop(1, 'rgba(99, 102, 241, 0)');
      } else if (isUserSpeaking) {
        grad.addColorStop(0, 'rgba(16, 185, 129, 0.9)'); // Emerald/Green
        grad.addColorStop(0.5, 'rgba(5, 150, 105, 0.4)');
        grad.addColorStop(1, 'rgba(16, 185, 129, 0)');
      } else {
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.6)'); // Blue
        grad.addColorStop(0.7, 'rgba(37, 99, 235, 0.2)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, dynamicRadius + 20, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Pulsing wavy orb
      ctx.beginPath();
      for (let a = 0; a < Math.PI * 2; a += 0.1) {
        const offset = Math.sin(a * 6 + angle) * (isAgentSpeaking ? 8 : isUserSpeaking ? 6 : 2);
        const r = dynamicRadius + offset;
        const x = centerX + Math.cos(a) * r;
        const y = centerY + Math.sin(a) * r;
        if (a === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = isAgentSpeaking ? '#a5b4fc' : isUserSpeaking ? '#6ee7b7' : '#93c5fd';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      angle += isAgentSpeaking ? 0.08 : isUserSpeaking ? 0.05 : 0.02;
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAgentSpeaking, isUserSpeaking, audioLevel]);

  const handleSaveTranscript = () => {
    if (transcripts.length === 0) return;
    const title = `Live Session (${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()})`;
    const mapped = transcripts.map((t) => ({
      role: t.role === 'model' ? ('assistant' as const) : ('user' as const),
      content: t.text,
    }));
    if (onSaveToChat) {
      onSaveToChat(title, mapped);
    } else {
      api.createConversation(title).then((conv) => {
        mapped.forEach((m) => {
          api.addMessage(conv.id, { role: m.role, content: m.content });
        });
        alert('Live conversation saved to recent chats!');
      });
    }
  };

  const isConnected = connectionStatus === 'connected' || connectionStatus === 'fallback_active';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#070a10] text-slate-100 overflow-hidden relative">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 shadow-lg shadow-indigo-600/30">
            <Radio className="w-5 h-5 text-white" />
            {isConnected && (
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-tight">MITALL Live Agent</h2>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  isConnected
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : connectionStatus === 'connecting'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {connectionStatus === 'connected'
                  ? 'Active 24kHz Stream'
                  : connectionStatus === 'fallback_active'
                  ? 'Interactive Mode'
                  : connectionStatus}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">{statusMessage}</p>
          </div>
        </div>

        {/* Right Action Items */}
        <div className="flex items-center gap-2">
          {/* Voice Switcher Dropdown */}
          <div className="relative">
            <select
              value={selectedVoice}
              disabled={isConnected}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="Zephyr">Voice: Zephyr (Clear, warm)</option>
              <option value="Puck">Voice: Puck (Engaging, lively)</option>
              <option value="Charon">Voice: Charon (Calm, deep)</option>
              <option value="Kore">Voice: Kore (Gentle, friendly)</option>
              <option value="Fenrir">Voice: Fenrir (Strong, confident)</option>
            </select>
          </div>

          {transcripts.length > 0 && (
            <button
              onClick={handleSaveTranscript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
              title="Save conversation transcript to chats"
            >
              <Save className="w-3.5 h-3.5 text-indigo-400" />
              <span>Save Chat</span>
            </button>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs transition-colors cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Interactive Stage */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
        {/* Left: Orb Stage & Video Preview */}
        <div className="flex-1 flex flex-col items-center justify-center p-6 relative overflow-hidden bg-gradient-to-b from-[#0b0f17] to-[#070a10]">
          {/* Subtle Cyber Grid Background */}
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

          {/* Video Feed PiP */}
          <video
            ref={videoElementRef}
            autoPlay
            playsInline
            muted
            className={`absolute top-4 right-4 w-44 h-32 rounded-2xl object-cover border-2 border-indigo-500/40 shadow-2xl transition-all duration-300 z-20 ${
              isCameraActive ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'
            }`}
          />

          {/* Central Animated Orb */}
          <div className="relative flex items-center justify-center w-72 h-72 my-auto">
            <canvas ref={canvasRef} width={288} height={288} className="w-full h-full" />

            <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
              <Sparkles
                className={`w-10 h-10 transition-transform duration-300 ${
                  isAgentSpeaking
                    ? 'text-indigo-300 scale-125 animate-spin'
                    : isUserSpeaking
                    ? 'text-emerald-300 scale-110'
                    : 'text-slate-400'
                }`}
              />
              <span className="text-xs font-semibold text-slate-300 mt-2">
                {isAgentSpeaking ? 'MITALL Speaking...' : isUserSpeaking ? 'Listening to you...' : isConnected ? 'Connected & Listening' : 'Offline'}
              </span>
            </div>
          </div>

          {/* Live Floating Controls */}
          <div className="flex items-center gap-3 p-2 rounded-2xl bg-slate-900/90 border border-slate-700/80 shadow-2xl backdrop-blur-lg mb-4 z-20">
            {!isConnected ? (
              <button
                onClick={startLiveConnection}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-blue-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Radio className="w-4 h-4 animate-pulse" />
                <span>Connect Live MITALL Agent</span>
              </button>
            ) : (
              <>
                {/* Mute Mic */}
                <button
                  onClick={() => setIsMicMuted(!isMicMuted)}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isMicMuted
                      ? 'bg-rose-600/20 text-rose-400 border border-rose-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
                >
                  {isMicMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-400" />}
                </button>

                {/* Camera Toggle */}
                <button
                  onClick={toggleCamera}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isCameraActive
                      ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-400'
                  }`}
                  title={isCameraActive ? 'Turn Off Camera' : 'Share Camera with MITALL'}
                >
                  {isCameraActive ? <Video className="w-5 h-5 text-indigo-400" /> : <VideoOff className="w-5 h-5" />}
                </button>

                {/* Speaker Volume Mute */}
                <button
                  onClick={() => setIsAudioMuted(!isAudioMuted)}
                  className={`p-3 rounded-xl transition-all cursor-pointer ${
                    isAudioMuted
                      ? 'bg-amber-600/20 text-amber-400 border border-amber-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                  }`}
                  title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                >
                  {isAudioMuted ? <VolumeX className="w-5 h-5 text-amber-400" /> : <Volume2 className="w-5 h-5" />}
                </button>

                {/* Interrupt / Stop Turn Button */}
                <button
                  onClick={clearAudioQueue}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  title="Interrupt current speech"
                >
                  Interrupt
                </button>

                {/* Disconnect Call */}
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 cursor-pointer"
                  title="Disconnect live session"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>End</span>
                </button>
              </>
            )}
          </div>

          {/* Quick Guidance */}
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span>Talk naturally: "Explain quantum physics", "Debug this logic", or "Help me brainstorm".</span>
          </div>
        </div>

        {/* Right: Live Transcript & Interaction Drawer */}
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-slate-800/80 bg-[#0d121c]/95 flex flex-col h-72 md:h-full">
          <div className="p-3.5 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-400" />
              <h3 className="text-xs font-bold text-slate-200">Live Transcript</h3>
            </div>
            <span className="text-[11px] text-slate-500">{transcripts.length} turns</span>
          </div>

          {/* Scrollable Transcripts */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {transcripts.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                <Bot className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                <p>No speech detected yet.</p>
                <p className="text-[11px] text-slate-600 mt-1">Start speaking into your mic to see real-time subtitles.</p>
              </div>
            ) : (
              transcripts.map((t) => (
                <div
                  key={t.id}
                  className={`flex flex-col text-xs rounded-xl p-3 ${
                    t.role === 'user'
                      ? 'bg-indigo-950/40 border border-indigo-800/40 ml-4 text-indigo-100'
                      : 'bg-slate-900 border border-slate-800 mr-4 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                    <span className="font-semibold flex items-center gap-1">
                      {t.role === 'user' ? (
                        <>
                          <User className="w-3 h-3 text-indigo-400" /> You
                        </>
                      ) : (
                        <>
                          <Bot className="w-3 h-3 text-emerald-400" /> MITALL
                        </>
                      )}
                    </span>
                    <span>{t.timestamp}</span>
                  </div>
                  <p className="leading-relaxed whitespace-pre-wrap">{t.text}</p>
                </div>
              ))
            )}
          </div>

          {/* Text Input Row for Mixed Voice + Text */}
          <div className="p-3 border-t border-slate-800/80 bg-slate-900/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendText();
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder={isConnected ? 'Type to live agent...' : 'Connect to speak or type...'}
                disabled={!isConnected}
                className="flex-1 p-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isConnected || !textInput.trim()}
                className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
