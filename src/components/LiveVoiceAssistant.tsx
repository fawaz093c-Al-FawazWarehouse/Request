import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  PhoneCall,
  PhoneOff,
  AlertCircle,
  Activity,
  Bot,
} from 'lucide-react';

interface LiveVoiceAssistantProps {
  onClose?: () => void;
  orderContext?: string;
}

export const LiveVoiceAssistant: React.FC<LiveVoiceAssistantProps> = ({ onClose, orderContext }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const isMutedRef = useRef<boolean>(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Convert Float32 audio to 16-bit PCM Little Endian base64
  const pcmToBase64 = (channelData: Float32Array): string => {
    const buffer = new ArrayBuffer(channelData.length * 2);
    const view = new DataView(buffer);
    for (let i = 0; i < channelData.length; i++) {
      let s = Math.max(-1, Math.min(1, channelData[i]));
      view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  // Play incoming 24kHz PCM audio chunk from model
  const playAudioChunk = (base64Audio: string) => {
    if (!outputAudioCtxRef.current) return;
    const ctx = outputAudioCtxRef.current;

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const binary = atob(base64Audio);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const pcm16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm16.length);
    for (let i = 0; i < pcm16.length; i++) {
      float32[i] = pcm16[i] / 32768.0;
    }

    const audioBuffer = ctx.createBuffer(1, float32.length, 24000);
    audioBuffer.copyToChannel(float32, 0, 0);

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;

    activeSourcesRef.current.push(source);
    setIsSpeaking(true);

    source.onended = () => {
      activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
      if (activeSourcesRef.current.length === 0) {
        setIsSpeaking(false);
      }
    };
  };

  const stopActiveAudio = () => {
    activeSourcesRef.current.forEach((src) => {
      try {
        src.stop();
      } catch (e) {}
    });
    activeSourcesRef.current = [];
    if (outputAudioCtxRef.current) {
      nextStartTimeRef.current = outputAudioCtxRef.current.currentTime;
    }
    setIsSpeaking(false);
  };

  const startVoiceSession = async () => {
    setIsConnecting(true);
    setErrorMessage(null);

    try {
      // 1. Audio contexts: 16kHz for input mic, 24kHz for output playback
      inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000,
      });
      outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000,
      });

      // 2. Microphone stream
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      mediaStreamRef.current = stream;

      // 3. WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/live`);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setIsConnecting(false);

        // Setup audio processing once connected
        if (!inputAudioCtxRef.current) return;
        const source = inputAudioCtxRef.current.createMediaStreamSource(stream);
        const processor = inputAudioCtxRef.current.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        source.connect(processor);
        processor.connect(inputAudioCtxRef.current.destination);

        processor.onaudioprocess = (e) => {
          if (isMutedRef.current || ws.readyState !== WebSocket.OPEN) return;
          const channel = e.inputBuffer.getChannelData(0);
          const base64 = pcmToBase64(channel);
          ws.send(JSON.stringify({ audio: base64 }));
        };
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.error) {
            setErrorMessage(msg.error);
          }
          if (msg.audio) {
            playAudioChunk(msg.audio);
          }
          if (msg.interrupted) {
            stopActiveAudio();
          }
        } catch (e) {
          console.error('Error handling WebSocket audio message:', e);
        }
      };

      ws.onerror = (e) => {
        console.error('WebSocket Live Voice error:', e);
        setErrorMessage('تعذر الاتصال بخدمة الصوت المباشر Live API');
        setIsConnecting(false);
      };

      ws.onclose = () => {
        setIsConnected(false);
        setIsConnecting(false);
        stopActiveAudio();
      };
    } catch (err: any) {
      console.error('Failed to start voice session:', err);
      setErrorMessage(err.message || 'يرجى السماح بالوصول إلى الميكروفون لبدء المحادثة الصوتية.');
      setIsConnecting(false);
    }
  };

  const endVoiceSession = () => {
    stopActiveAudio();

    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (inputAudioCtxRef.current) {
      inputAudioCtxRef.current.close().catch(() => {});
      inputAudioCtxRef.current = null;
    }
    if (outputAudioCtxRef.current) {
      outputAudioCtxRef.current.close().catch(() => {});
      outputAudioCtxRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setIsConnected(false);
    setIsConnecting(false);
    setIsSpeaking(false);
  };

  useEffect(() => {
    return () => {
      endVoiceSession();
    };
  }, []);

  return (
    <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background glow animation */}
      <div
        className={`absolute inset-0 bg-radial transition-all duration-700 pointer-events-none opacity-20 ${
          isSpeaking ? 'from-teal-400 via-transparent to-transparent' : 'from-blue-600 via-transparent to-transparent'
        }`}
      />

      <div className="relative z-10 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${
                isConnected
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/30'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-lg">المساعد الصوتي المباشر (Gemini 3.8 Live API)</h3>
                <span className="bg-teal-500/20 text-teal-300 text-[10px] px-2 py-0.5 rounded-full border border-teal-500/30 font-mono">
                  Live Native Voice
                </span>
              </div>
              <p className="text-xs text-slate-400">
                تحدث صوتياً بشكل مباشر وفوري مع الصيدلاني الذكي لحساب البونص والاستفسار عن الأدوية.
              </p>
            </div>
          </div>

          {onClose && (
            <button
              onClick={() => {
                endVoiceSession();
                onClose();
              }}
              className="text-slate-400 hover:text-white text-xs bg-slate-800 px-3 py-1.5 rounded-xl transition-all"
            >
              إغلاق
            </button>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-700/60 text-rose-200 rounded-2xl p-4 text-xs flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">خطأ في الجلسة: </span>
              {errorMessage}
            </div>
          </div>
        )}

        {/* Central Audio Waves Visualizer */}
        <div className="flex flex-col items-center justify-center py-6 space-y-5">
          <div className="relative flex items-center justify-center">
            {/* Animated Pulses */}
            {isConnected && (
              <>
                <div
                  className={`absolute w-36 h-36 rounded-full transition-all duration-500 ${
                    isSpeaking
                      ? 'bg-teal-500/20 animate-ping'
                      : isMuted
                      ? 'bg-rose-500/10'
                      : 'bg-blue-500/20 animate-pulse'
                  }`}
                />
                <div
                  className={`absolute w-28 h-28 rounded-full border transition-all ${
                    isSpeaking
                      ? 'border-teal-400 animate-spin'
                      : isMuted
                      ? 'border-rose-500/40'
                      : 'border-blue-400/40'
                  }`}
                />
              </>
            )}

            <button
              onClick={isConnected ? endVoiceSession : startVoiceSession}
              disabled={isConnecting}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-xl z-10 cursor-pointer ${
                isConnected
                  ? isSpeaking
                    ? 'bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-teal-500/50 scale-105'
                    : isMuted
                    ? 'bg-amber-600 text-white hover:bg-amber-500'
                    : 'bg-blue-600 text-white hover:bg-blue-500'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {isConnecting ? (
                <Radio className="w-8 h-8 animate-spin text-teal-300" />
              ) : isConnected ? (
                <Mic className="w-8 h-8" />
              ) : (
                <PhoneCall className="w-8 h-8" />
              )}
            </button>
          </div>

          {/* Status Label */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 text-sm font-bold">
              {isConnecting ? (
                <span className="text-amber-400 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 animate-spin" />
                  جاري الاتصال بنموذج gemini-3.8-live...
                </span>
              ) : isConnected ? (
                isSpeaking ? (
                  <span className="text-teal-300 flex items-center gap-1.5 animate-pulse">
                    <Volume2 className="w-4 h-4" />
                    المساعد الصوتي يتحدث الآن...
                  </span>
                ) : isMuted ? (
                  <span className="text-amber-400 flex items-center gap-1.5">
                    <MicOff className="w-4 h-4" />
                    الميكروفون مكتوم (اضغط لتفعيله)
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 animate-pulse" />
                    متصل - استمع إليك الآن (تفضل بالحديث)...
                  </span>
                )
              ) : (
                <span className="text-slate-400">انقر على الزر لبدء محادثة صوتية في الوقت الحقيقي</span>
              )}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              دقة صوتية 24kHz / التقاط ميكروفون 16kHz بنظام ثنائي الاتجاه (Full Duplex)
            </div>
          </div>

          {/* Controls Bar */}
          {isConnected && (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-2xl border transition-all text-xs font-bold flex items-center gap-2 ${
                  isMuted
                    ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 hover:bg-rose-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                {isMuted ? 'إلغاء كتم الصوت' : 'كتم الميكروفون'}
              </button>

              <button
                onClick={stopActiveAudio}
                className="p-3 rounded-2xl border border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold flex items-center gap-2"
                title="مقاطعة كلام المساعد"
              >
                <VolumeX className="w-4 h-4" />
                مقاطعة الكلام
              </button>

              <button
                onClick={endVoiceSession}
                className="p-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-md"
              >
                <PhoneOff className="w-4 h-4" />
                إنهاء المكالمة
              </button>
            </div>
          )}
        </div>

        {/* Suggested Voice Prompts */}
        <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-800">
          <div className="text-xs font-bold text-slate-400 mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            أفكار يمكنك قولها للمساعد الصوتي مباشرة:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
              💬 "ما هو أفضل بونص متاح حالياً لصنف اكزانتريك 40 ملغ؟"
            </div>
            <div className="text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
              💬 "إذا طلبت 30 علبة ايبوفين 400 ملغ كم علبة مجانية سأحصل؟"
            </div>
            <div className="text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
              💬 "هل يوجد تداخل بين الأموكسيسيلين والإيبوبروفين؟"
            </div>
            <div className="text-xs bg-slate-900/80 p-2.5 rounded-xl border border-slate-800 text-slate-300">
              💬 "اقترح عليّ مكملات عظمية متوفرة في المستودع عليها بونص ممتاز."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
