import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, MessageSquare, Image as ImageIcon, Volume2, Code, 
  Settings, Send, Trash2, Copy, Check, Download, RefreshCw, 
  Upload, Sliders, Play, Square, Cpu, Compass, FileText, Bookmark, Plus, Mic, Users, Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type TabType = 'chat' | 'vision' | 'image' | 'tts' | 'lab';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  model: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [models, setModels] = useState([
    { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Recomendado)', desc: 'Ultrarrápido y versátil para tareas generales y texto.' },
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Razonamiento Avanzado)', desc: 'Máxima capacidad analítica, código y STEM complejo.' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', desc: 'Optimizado para máxima velocidad y tareas ligeras.' },
  ]);

  // Chat State
  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Nueva Conversación con Gemini 3.8',
      messages: [
        { role: 'assistant', content: '¡Hola! Soy **Gemini 3.8**, tu asistente de inteligencia artificial avanzado en español. ¿En qué puedo ayudarte hoy? Puedes pedirme escribir código, redactar ensayos, analizar ideas o resolver problemas complejos.' }
      ],
      model: 'gemini-3.8-flash'
    }
  ]);
  const [currentSessionId, setCurrentSessionId] = useState<string>('1');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [systemInstruction, setSystemInstruction] = useState<string>('Eres Gemini 3.8, un asistente de IA experto, amigable y preciso en español.');
  const [temperature, setTemperature] = useState<number>(0.7);
  const [thinkingLevel, setThinkingLevel] = useState<string>('HIGH');

  // Vision State
  const [visionImage, setVisionImage] = useState<string | null>(null);
  const [visionPrompt, setVisionPrompt] = useState<string>('¿Qué ves en esta imagen? Analízala detalladamente.');
  const [visionResult, setVisionResult] = useState<string>('');
  const [isAnalyzingVision, setIsAnalyzingVision] = useState<boolean>(false);

  // Image Generation State
  const [imagePrompt, setImagePrompt] = useState<string>('Un paisaje futurista cyberpunk de Madrid con taxis voladores al atardecer, estilo cinematográfico 4K.');
  const [imageAspectRatio, setImageAspectRatio] = useState<string>('1:1');
  const [imageSize, setImageSize] = useState<string>('1K');
  const [isHighQualityImage, setIsHighQualityImage] = useState<boolean>(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string>('');
  const [imageDesc, setImageDesc] = useState<string>('');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

  // TTS Voice State (AI Studio Voices: Kore, Puck, Charon, Fenrir, Zephyr)
  const [ttsMode, setTtsMode] = useState<'single' | 'podcast'>('single');
  const [ttsText, setTtsText] = useState<string>('Bienvenidos a Gemini 3.8 Español. La nueva era de la inteligencia artificial conversacional y síntesis de voz hiperrealista.');
  const [ttsVoice, setTtsVoice] = useState<string>('Kore');
  const [ttsStyle, setTtsStyle] = useState<string>('Cálido, profesional y amigable');
  
  // Podcast dual-speaker state
  const [speaker1Name, setSpeaker1Name] = useState<string>('Alex');
  const [speaker1Voice, setSpeaker1Voice] = useState<string>('Puck');
  const [speaker2Name, setSpeaker2Name] = useState<string>('Sam');
  const [speaker2Voice, setSpeaker2Voice] = useState<string>('Kore');
  const [podcastScript, setPodcastScript] = useState<string>(
    'Alex: ¡Hola a todos! <breath> Bienvenidos a nuestro podcast sobre las nuevas voces de Google AI Studio en Gemini 3.8.\nSam: ¡Así es! |yeah| Es impresionante cómo podemos crear diálogos dinámicos y naturales entre dos locutores.'
  );

  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Lab / Prompts State
  const [labCategory, setLabCategory] = useState<string>('code');
  const [labPrompt, setLabPrompt] = useState<string>('');
  const [labResult, setLabResult] = useState<string>('');
  const [isLabRunning, setIsLabRunning] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId) || sessions[0];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages, isGenerating]);

  // Handle Chat Send
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMsg = inputMessage;
    setInputMessage('');

    const updatedMessages: Message[] = [
      ...currentSession.messages,
      { role: 'user', content: userMsg }
    ];

    setSessions(prev => prev.map(s => s.id === currentSessionId ? { ...s, messages: updatedMessages } : s));
    setIsGenerating(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages,
          model: selectedModel,
          systemInstruction,
          temperature,
          thinkingLevel
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const assistantReply = data.text;
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
        ...s,
        messages: [...updatedMessages, { role: 'assistant', content: assistantReply }]
      } : s));
    } catch (err: any) {
      setSessions(prev => prev.map(s => s.id === currentSessionId ? {
        ...s,
        messages: [...updatedMessages, { role: 'assistant', content: `❌ Error al conectar con Gemini: ${err.message || 'Error desconocido'}` }]
      } : s));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewChat = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: `Nueva Conversación ${sessions.length + 1}`,
      messages: [{ role: 'assistant', content: '¡Hola! ¿En qué te puedo ayudar hoy con Gemini 3.8?' }],
      model: selectedModel
    };
    setSessions([newSession, ...sessions]);
    setCurrentSessionId(newId);
  };

  // Handle Vision Analysis
  const handleAnalyzeVision = async () => {
    if (!visionImage || isAnalyzingVision) return;
    setIsAnalyzingVision(true);
    setVisionResult('');

    try {
      const base64Data = visionImage.split(',')[1] || visionImage;
      const res = await fetch('/api/gemini/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: visionPrompt,
          imageBase64: base64Data,
          model: selectedModel
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setVisionResult(data.text);
    } catch (err: any) {
      setVisionResult(`❌ Error en análisis visual: ${err.message}`);
    } finally {
      setIsAnalyzingVision(false);
    }
  };

  // Handle Image Generation
  const handleGenerateImage = async () => {
    if (!imagePrompt.trim() || isGeneratingImage) return;
    setIsGeneratingImage(true);
    setGeneratedImageUrl('');
    setImageDesc('');

    try {
      const res = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: imagePrompt,
          aspectRatio: imageAspectRatio,
          imageSize,
          highQuality: isHighQualityImage
        })
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setGeneratedImageUrl(data.imageUrl);
      setImageDesc(data.description || '');
    } catch (err: any) {
      alert(`Error generando imagen: ${err.message}`);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Handle TTS Audio (Single & Dual Speaker Podcast)
  const handleGenerateTts = async () => {
    if (isGeneratingAudio) return;
    setIsGeneratingAudio(true);
    setAudioUrl(null);

    try {
      let body: any = {};
      if (ttsMode === 'single') {
        if (!ttsText.trim()) {
          setIsGeneratingAudio(false);
          return;
        }
        body = {
          text: ttsText,
          voiceName: ttsVoice,
          style: ttsStyle,
          isDualSpeaker: false
        };
      } else {
        if (!podcastScript.trim()) {
          setIsGeneratingAudio(false);
          return;
        }
        // Parse script lines like "Alex: text..."
        const lines = podcastScript.split('\n').filter(l => l.trim().length > 0);
        const dialogueParts = lines.map(line => {
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1) {
            const speaker = line.slice(0, colonIdx).trim();
            const text = line.slice(colonIdx + 1).trim();
            return { speaker, text, style: speaker === speaker1Name ? 'Locutor principal enérgico' : 'Co-locutor analítico' };
          }
          return { speaker: speaker1Name, text: line.trim(), style: 'Conversacional' };
        });

        body = {
          isDualSpeaker: true,
          speaker1Name,
          speaker1Voice,
          speaker2Name,
          speaker2Voice,
          dialogueParts
        };
      }

      const res = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const binary = atob(data.audioBase64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType || 'audio/wav' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err: any) {
      alert(`Error generando audio de Google AI Studio: ${err.message}`);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      callback(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <h1 className="font-bold text-lg bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
                Gemini 3.8
              </h1>
              <p className="text-xs text-slate-400 font-medium">Google AI Studio 🇪🇸</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="p-3 space-y-1 border-b border-slate-800">
          <button
            onClick={() => setActiveTab('chat')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'chat' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Chat & Razonamiento
          </button>
          <button
            onClick={() => setActiveTab('vision')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'vision' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Visión e Imágenes
          </button>
          <button
            onClick={() => setActiveTab('image')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'image' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Generador Visual (Nano)
          </button>
          <button
            onClick={() => setActiveTab('tts')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'tts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            Voces AI Studio & Podcast
          </button>
          <button
            onClick={() => setActiveTab('lab')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === 'lab' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Code className="w-4 h-4" />
            Laboratorio & Agentes
          </button>
        </div>

        {/* Sessions List (for chat tab) */}
        {activeTab === 'chat' && (
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            <div className="flex items-center justify-between px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              <span>Conversaciones</span>
              <button 
                onClick={handleNewChat}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition"
                title="Nuevo Chat"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {sessions.map(session => (
              <button
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs truncate transition ${
                  session.id === currentSessionId ? 'bg-slate-800 text-white font-medium border-l-2 border-indigo-500' : 'text-slate-400 hover:bg-slate-900 hover:text-slate-300'
                }`}
              >
                {session.messages[1]?.content?.slice(0, 28) || session.title}
              </button>
            ))}
          </div>
        )}

        {/* Footer info */}
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <span>Google AI Studio Voices</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Activo
          </span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-slate-950 overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 px-6 flex items-center justify-between bg-slate-900/50 backdrop-blur z-10">
          <div className="flex items-center gap-4">
            <h2 className="font-semibold text-base text-white flex items-center gap-2">
              {activeTab === 'chat' && <><MessageSquare className="w-5 h-5 text-indigo-400" /> Chat con Gemini 3.8</>}
              {activeTab === 'vision' && <><ImageIcon className="w-5 h-5 text-purple-400" /> Análisis Multimodal & Visión</>}
              {activeTab === 'image' && <><Sparkles className="w-5 h-5 text-pink-400" /> Generador de Imágenes AI</>}
              {activeTab === 'tts' && <><Volume2 className="w-5 h-5 text-emerald-400" /> Estudio de Voces AI Studio (Kore, Puck, Charon, Fenrir, Zephyr)</>}
              {activeTab === 'lab' && <><Code className="w-5 h-5 text-cyan-400" /> Laboratorio de Prompts & Código</>}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === 'chat' && (
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-indigo-500"
              >
                {models.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            )}
            <div className="px-3 py-1 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-medium">
              Google AI Studio 🎙️
            </div>
          </div>
        </header>

        {/* TAB 1: CHAT */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {currentSession.messages.map((msg, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={index}
                  className={`flex gap-4 max-w-3xl mx-auto ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shrink-0 shadow-md">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                  }`}>
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-slate-300">TÚ</span>
                    </div>
                  )}
                </motion.div>
              ))}
              {isGenerating && (
                <div className="flex gap-4 max-w-3xl mx-auto items-center text-slate-400 text-sm">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center animate-spin">
                    <RefreshCw className="w-4 h-4 text-white" />
                  </div>
                  <span className="animate-pulse">Gemini 3.8 está pensando y redactando en español...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-slate-900 border-t border-slate-800">
              <div className="max-w-3xl mx-auto flex gap-3 items-center">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Pregúntale cualquier cosa a Gemini 3.8..."
                  rows={2}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !inputMessage.trim()}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3.5 rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-indigo-600/20"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: VISION */}
        {activeTab === 'vision' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-purple-400" /> Análisis Multimodal & Visión
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Sube cualquier imagen para que Gemini 3.8 la analice en detalle.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="block text-xs font-semibold uppercase text-slate-400">1. Seleccionar Imagen</label>
                    <div className="border-2 border-dashed border-slate-700 rounded-xl p-6 text-center hover:border-purple-500 transition cursor-pointer relative">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, setVisionImage)} 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      {visionImage ? (
                        <img src={visionImage} alt="Preview" className="max-h-48 mx-auto rounded-lg object-contain" />
                      ) : (
                        <div className="space-y-2">
                          <Upload className="w-8 h-8 text-purple-400 mx-auto" />
                          <p className="text-sm text-slate-300 font-medium">Haz clic o arrastra una imagen aquí</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col justify-between">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">2. Pregunta o Instrucción</label>
                      <textarea
                        value={visionPrompt}
                        onChange={(e) => setVisionPrompt(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>
                    <button
                      onClick={handleAnalyzeVision}
                      disabled={!visionImage || isAnalyzingVision}
                      className="w-full py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-purple-600/20 flex items-center justify-center gap-2"
                    >
                      {isAnalyzingVision ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Analizar con Visión
                    </button>
                  </div>
                </div>

                {visionResult && (
                  <div className="mt-6 pt-6 border-t border-slate-800">
                    <h4 className="text-sm font-semibold text-purple-400 mb-3">Resultado:</h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 text-sm whitespace-pre-wrap">
                      {visionResult}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: IMAGE GENERATION */}
        {activeTab === 'image' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-pink-400" /> Generador Visual Nano Banana & Flash
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Crea imágenes hiperrealistas a partir de descripciones.
                </p>

                <div className="space-y-4">
                  <textarea
                    value={imagePrompt}
                    onChange={(e) => setImagePrompt(e.target.value)}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-pink-500 resize-none"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <select
                      value={imageAspectRatio}
                      onChange={(e) => setImageAspectRatio(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200"
                    >
                      <option value="1:1">1:1 Cuadrado</option>
                      <option value="16:9">16:9 Panorámico</option>
                      <option value="9:16">9:16 Vertical</option>
                    </select>

                    <select
                      value={imageSize}
                      onChange={(e) => setImageSize(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200"
                    >
                      <option value="1K">1K Estándar</option>
                      <option value="2K">2K Alta Definición</option>
                      <option value="4K">4K Ultra HD</option>
                    </select>

                    <button
                      onClick={handleGenerateImage}
                      disabled={isGeneratingImage || !imagePrompt.trim()}
                      className="py-2.5 bg-gradient-to-r from-pink-600 to-purple-600 text-white font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-pink-600/20 flex items-center justify-center gap-2"
                    >
                      {isGeneratingImage ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                      Generar Imagen
                    </button>
                  </div>
                </div>

                {generatedImageUrl && (
                  <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-4">
                    <img src={generatedImageUrl} alt="Generated" className="max-h-96 mx-auto rounded-xl object-contain shadow-2xl" />
                    <div>
                      <a href={generatedImageUrl} download="imagen.png" className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm">
                        <Download className="w-4 h-4" /> Descargar
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: GOOGLE AI STUDIO VOICES & PODCAST TTS */}
        {activeTab === 'tts' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                      <Volume2 className="w-5 h-5 text-emerald-400" /> Voces Oficiales de Google AI Studio
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      Explora las voces preconstruidas (Kore, Puck, Charon, Fenrir, Zephyr) y el nuevo modo Podcast Dual-Speaker.
                    </p>
                  </div>
                  <div className="flex gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={() => setTtsMode('single')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        ttsMode === 'single' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Voz Individual
                    </button>
                    <button
                      onClick={() => setTtsMode('podcast')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                        ttsMode === 'podcast' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Podcast (Dual-Speaker)
                    </button>
                  </div>
                </div>

                {/* AI Studio Voices Info Banner */}
                <div className="grid grid-cols-5 gap-2 mb-6">
                  {[
                    { name: 'Kore', desc: 'Cálida y clara' },
                    { name: 'Puck', desc: 'Enérgica y juvenil' },
                    { name: 'Charon', desc: 'Profunda y firme' },
                    { name: 'Fenrir', desc: 'Robusta y sólida' },
                    { name: 'Zephyr', desc: 'Suave y relajada' },
                  ].map(v => (
                    <div 
                      key={v.name}
                      onClick={() => { if (ttsMode === 'single') setTtsVoice(v.name); else setSpeaker1Voice(v.name); }}
                      className={`p-3 rounded-xl border text-center cursor-pointer transition ${
                        (ttsMode === 'single' ? ttsVoice === v.name : speaker1Voice === v.name || speaker2Voice === v.name)
                          ? 'bg-emerald-950 border-emerald-500 text-emerald-200 shadow-md'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-bold text-sm text-white">{v.name}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{v.desc}</div>
                    </div>
                  ))}
                </div>

                {ttsMode === 'single' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Texto para la voz seleccionada ({ttsVoice})</label>
                      <textarea
                        value={ttsText}
                        onChange={(e) => setTtsText(e.target.value)}
                        rows={3}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-400 mb-1">Estilo de interpretación</label>
                        <input
                          type="text"
                          value={ttsStyle}
                          onChange={(e) => setTtsStyle(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-sm text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-indigo-400 uppercase">Locutor 1</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={speaker1Name} 
                            onChange={(e) => setSpeaker1Name(e.target.value)} 
                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" 
                            placeholder="Nombre"
                          />
                          <select 
                            value={speaker1Voice} 
                            onChange={(e) => setSpeaker1Voice(e.target.value)} 
                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          >
                            <option value="Puck">Puck</option>
                            <option value="Kore">Kore</option>
                            <option value="Charon">Charon</option>
                            <option value="Fenrir">Fenrir</option>
                            <option value="Zephyr">Zephyr</option>
                          </select>
                        </div>
                      </div>

                      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                        <span className="text-xs font-bold text-purple-400 uppercase">Locutor 2</span>
                        <div className="grid grid-cols-2 gap-2">
                          <input 
                            type="text" 
                            value={speaker2Name} 
                            onChange={(e) => setSpeaker2Name(e.target.value)} 
                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white" 
                            placeholder="Nombre"
                          />
                          <select 
                            value={speaker2Voice} 
                            onChange={(e) => setSpeaker2Voice(e.target.value)} 
                            className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-white"
                          >
                            <option value="Kore">Kore</option>
                            <option value="Puck">Puck</option>
                            <option value="Charon">Charon</option>
                            <option value="Fenrir">Fenrir</option>
                            <option value="Zephyr">Zephyr</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">Guion del Podcast (Formato "Nombre: Texto" con soporte de |yeah|, |mhm|, &lt;breath&gt;)</label>
                      <textarea
                        value={podcastScript}
                        onChange={(e) => setPodcastScript(e.target.value)}
                        rows={5}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-500 resize-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleGenerateTts}
                  disabled={isGeneratingAudio}
                  className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  {isGeneratingAudio ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                  {ttsMode === 'single' ? `Sintetizar Voz (${ttsVoice})` : `Generar Podcast con ${speaker1Name} y ${speaker2Name}`}
                </button>

                {audioUrl && (
                  <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 inline-flex flex-col items-center gap-3">
                      <audio ref={audioRef} src={audioUrl} controls className="w-80" />
                      <a
                        href={audioUrl}
                        download="aistudio-voz.wav"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition"
                      >
                        <Download className="w-4 h-4" /> Descargar WAV
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: LAB & CODE */}
        {activeTab === 'lab' && (
          <div className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                  <Code className="w-5 h-5 text-cyan-400" /> Laboratorio de Prompts & Agentes Especializados
                </h3>
                <p className="text-sm text-slate-400 mb-6">
                  Selecciona una plantilla experta para potenciar tus tareas con Gemini 3.1 Pro.
                </p>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                  {[
                    { id: 'code', name: '💻 Desarrollador Senior', prompt: 'Actúa como arquitecto de software senior. Escribe código limpio en TypeScript/React para:' },
                    { id: 'copy', name: '✍️ Copywriter & SEO', prompt: 'Actúa como experto en marketing digital. Redacta un artículo optimizado sobre:' },
                    { id: 'explain', name: '📚 Profesor Experto', prompt: 'Explica de forma sencilla y paso a paso el siguiente concepto:' },
                    { id: 'legal', name: '⚖️ Asistente Jurídico', prompt: 'Analiza los puntos clave y obligaciones del siguiente texto:' },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => { setLabCategory(cat.id); setLabPrompt(cat.prompt); }}
                      className={`p-3 rounded-xl text-left border transition ${
                        labCategory === cat.id ? 'bg-cyan-950 border-cyan-500 text-cyan-200' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-semibold text-xs text-white">{cat.name}</div>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <textarea
                    value={labPrompt}
                    onChange={(e) => setLabPrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 focus:outline-none focus:border-cyan-500 resize-none"
                  />

                  <button
                    onClick={async () => {
                      if (!labPrompt.trim() || isLabRunning) return;
                      setIsLabRunning(true);
                      setLabResult('');
                      try {
                        const res = await fetch('/api/gemini/chat', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            messages: [{ role: 'user', content: labPrompt }],
                            model: 'gemini-3.1-pro-preview',
                            temperature: 0.5,
                            thinkingLevel: 'HIGH'
                          })
                        });
                        const data = await res.json();
                        if (data.error) throw new Error(data.error);
                        setLabResult(data.text);
                      } catch (err: any) {
                        setLabResult(`❌ Error: ${err.message}`);
                      } finally {
                        setIsLabRunning(false);
                      }
                    }}
                    disabled={isLabRunning || !labPrompt.trim()}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-cyan-600/20 flex items-center justify-center gap-2"
                  >
                    {isLabRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    Ejecutar con Gemini 3.1 Pro
                  </button>
                </div>

                {labResult && (
                  <div className="mt-8 pt-6 border-t border-slate-800">
                    <h4 className="text-sm font-semibold text-cyan-400 mb-3">Resultado:</h4>
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-slate-200 text-sm whitespace-pre-wrap font-mono">
                      {labResult}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
