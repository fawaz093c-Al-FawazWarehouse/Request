import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RefreshCw,
  Trash2,
  Paperclip,
  Check,
  ChevronDown,
  Zap,
  BrainCircuit,
  MessageSquare,
  BadgeCheck,
} from 'lucide-react';
import { OrderDraft } from '../types/pharmacy';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  modelUsed?: string;
}

interface GeminiChatbotProps {
  currentDraft?: OrderDraft;
  onApplyRecommendation?: (text: string) => void;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({ currentDraft }) => {
  const [model, setModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>(
    'gemini-3.8-flash'
  );
  const [role, setRole] = useState<'pharmacist_advisor' | 'order_optimizer' | 'bioscience_specialist'>(
    'pharmacist_advisor'
  );
  const [includeOrderContext, setIncludeOrderContext] = useState(true);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      content: `أهلاً بك زميلي الصيدلاني! 👋
أنا مساعدك الصيدلاني الذكي المدعوم بنماذج Gemini المتقدمة.
يمكنني مساعدتك في:
1. مراجعة أصناف طلبيتك وحساب أفضل بونص مالي وتوفيري.
2. التحقق من التداخلات والجرعات للمواد الفعالة.
3. اقتراح بدائل تجارية وسريرية للأصناف المفقودة في السوق السوري.

كيف يمكنني خدمتك في طلبيتك اليوم؟`,
      timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (overridePrompt?: string) => {
    const textToSend = (overridePrompt || input).trim();
    if (!textToSend || loading) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    let orderContext = '';
    if (includeOrderContext && currentDraft) {
      orderContext = `اسم الصيدلية: ${currentDraft.pharmacyName}
الصيدلاني: ${currentDraft.pharmacistName || 'غير مسجل'}
الأصناف في المسودة الحالية (${currentDraft.items.length} أصناف):
${currentDraft.items
  .map(
    (item, idx) =>
      `${idx + 1}. ${item.name} | الشركة: ${item.company} | المادة: ${item.activeIngredient || 'N/A'} | الكمية: ${
        item.quantity
      } | البونص: ${item.bonus} | البونص المجاني: ${item.freeBonusUnits} | السعر: ${item.unitPrice} ل.س`
  )
  .join('\n')}`;
    }

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          model,
          role,
          orderContext: orderContext || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'تعذر استلام رد النموذج الذكي');
      }

      const data = await res.json();
      const botMessage: Message = {
        id: `msg-${Date.now()}-reply`,
        role: 'assistant',
        content: data.reply,
        timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (err: any) {
      const errorMessage: Message = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `عذراً، حدث خطأ أثناء معالجة الطلب: ${err.message || 'يرجى إعادة المحاولة.'}`,
        timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: 'msg-cleared',
        role: 'assistant',
        content: 'تم بدء محادثة جديدة. كيف يمكنني مساعدتك في طلبيات وأدوية مستودع الفواز؟',
        timestamp: new Date().toLocaleTimeString('ar-SY', { hour: '2-digit', minute: '2-digit' }),
        modelUsed: model,
      },
    ]);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl flex flex-col h-[750px] overflow-hidden">
      {/* Top Header & Settings Bar */}
      <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-base">مساعد Gemini الصيدلاني الذكي</h3>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
                Multi-Turn Chat
              </span>
            </div>
            <p className="text-xs text-slate-400">
              محادثة ذكية تفاعلية مع حفظ السياق واستشارة الصيدلاني في تفاصيل الطلبيات
            </p>
          </div>
        </div>

        {/* Controls: Model Switcher & Role Selector */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Model Switcher */}
          <div className="flex items-center bg-slate-800 rounded-xl p-1 border border-slate-700 text-xs">
            <button
              onClick={() => setModel('gemini-3.8-flash')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                model === 'gemini-3.8-flash' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="المهام العامة المتوازنة"
            >
              <Zap className="w-3 h-3" />
              gemini-3.8-flash
            </button>
            <button
              onClick={() => setModel('gemini-3.1-flash-lite')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                model === 'gemini-3.1-flash-lite' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="فائق السرعة للمهام البسيطة"
            >
              ⚡ flash-lite
            </button>
            <button
              onClick={() => setModel('gemini-4-argon')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all flex items-center gap-1 ${
                model === 'gemini-4-argon' ? 'bg-purple-500 text-white shadow-sm' : 'text-slate-300 hover:text-white'
              }`}
              title="المهام السريرية والتحليل المعقد"
            >
              <BrainCircuit className="w-3 h-3" />
              gemini-4-argon
            </button>
          </div>

          {/* Role Switcher */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
          >
            <option value="pharmacist_advisor">دور: خبير صيدلاني وسريري</option>
            <option value="order_optimizer">دور: مدير عروض وبونص المستودع</option>
            <option value="bioscience_specialist">دور: باحث علوم حيوية وكيمياء</option>
          </select>

          <button
            onClick={clearChat}
            className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all"
            title="مسح سجل المحادثة"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Context pill status bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="orderContextCheck"
            checked={includeOrderContext}
            onChange={(e) => setIncludeOrderContext(e.target.checked)}
            className="rounded text-teal-600 focus:ring-teal-500 w-3.5 h-3.5"
          />
          <label htmlFor="orderContextCheck" className="cursor-pointer font-medium flex items-center gap-1">
            <Paperclip className="w-3.5 h-3.5 text-slate-500" />
            إرفاق بيانات المسودة الحالية للصيدلية تلقائياً ({currentDraft?.items.length || 0} صنف)
          </label>
        </div>
        <span className="text-[11px] text-slate-400">
          النموذج النشط: <strong className="font-mono text-teal-700">{model}</strong>
        </span>
      </div>

      {/* Scrollable Chat Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white font-bold text-xs'
                  : 'bg-teal-600 text-white shadow-sm'
              }`}
            >
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-xs ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-tr-none'
                  : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}
            >
              <div className="whitespace-pre-line font-normal">{msg.content}</div>
              <div
                className={`mt-1.5 flex items-center gap-2 text-[10px] ${
                  msg.role === 'user' ? 'text-blue-200 justify-end' : 'text-slate-400 justify-start'
                }`}
              >
                <span>{msg.timestamp}</span>
                {msg.modelUsed && (
                  <span className="bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-mono">
                    {msg.modelUsed}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center gap-2 shadow-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-600" />
              جاري توليد الرد الصيدلاني الذكي بواسطة {model}...
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto text-xs">
        <span className="text-[11px] font-bold text-slate-400 shrink-0">مقترحات:</span>
        <button
          onClick={() => handleSend('راجع مسودة الطلبية الحالية وقدم لي نصائح لزيادة بونص الأصناف بأقل تكلفة')}
          className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap transition-all border border-slate-200 shrink-0"
        >
          💡 تعظيم بونص المسودة
        </button>
        <button
          onClick={() => handleSend('هل توجد أي تداخلات دوائية أو تحذيرات بين أصناف المسودة الحالية؟')}
          className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap transition-all border border-slate-200 shrink-0"
        >
          ⚠️ فحص التداخلات الدوائية
        </button>
        <button
          onClick={() => handleSend('اقترح عليّ أدوية كوفيد أو إنفلونزا موسمية عليها عروض قوية')}
          className="bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap transition-all border border-slate-200 shrink-0"
        >
          📦 أدوية شائعة ذات بونص مرتفع
        </button>
      </div>

      {/* Input Area */}
      <div className="p-3 bg-white border-t border-slate-200">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب استفسارك الصيدلاني أو اطلب مراجعة الطلبية هنا..."
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm font-medium"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold p-3 rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center shrink-0"
          >
            <Send className="w-5 h-5 rtl:rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
};
