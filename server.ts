import express, { Request, Response as ExpressResponse } from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for scientific fetch with retry
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 2, baseDelayMs = 500): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delay));
        continue;
      }
      return response;
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    }
  }
  throw new Error(`Exhausted retries for ${url}`);
}

// -------------------------------------------------------------
// 1. Bioscience & Pharmacology Routes (Science Skill)
// -------------------------------------------------------------

// PubChem Compound & Physicochemical properties
app.get('/api/science/pubchem', async (req: Request, res: ExpressResponse) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Drug/Compound name is required' });
    }

    // 1. Resolve Name to CID
    const cidRes = await fetchWithRetry(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/cids/JSON`);
    if (!cidRes.ok) {
      return res.status(404).json({ error: `Compound not found in PubChem: ${query}` });
    }
    const cidData = await cidRes.json();
    const cid = cidData?.IdentifierList?.CID?.[0];
    if (!cid) {
      return res.status(404).json({ error: `No CID found for ${query}` });
    }

    // 2. Fetch properties
    const propsUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,CanonicalSMILES,IsomericSMILES,InChI,InChIKey,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity/JSON`;
    const propsRes = await fetchWithRetry(propsUrl);
    const propsData = await propsRes.json();
    const prop = propsData?.PropertyTable?.Properties?.[0] || {};

    // 3. Compute Lipinski & Veber rules
    const mw = parseFloat(prop.MolecularWeight || '0');
    const logP = typeof prop.XLogP === 'number' ? prop.XLogP : parseFloat(prop.XLogP || '0');
    const hbd = parseInt(prop.HBondDonorCount || '0', 10);
    const hba = parseInt(prop.HBondAcceptorCount || '0', 10);
    const rotBonds = parseInt(prop.RotatableBondCount || '0', 10);
    const tpsa = parseFloat(prop.TPSA || '0');

    let lipinskiViolations = 0;
    if (mw > 500) lipinskiViolations++;
    if (logP > 5) lipinskiViolations++;
    if (hbd > 5) lipinskiViolations++;
    if (hba > 10) lipinskiViolations++;

    const lipinskiPass = lipinskiViolations <= 1;
    const veberPass = rotBonds <= 10 && tpsa <= 140;

    const imageUrl = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${cid}/PNG?image_size=350x350`;

    return res.json({
      cid,
      name: query,
      molecularFormula: prop.MolecularFormula,
      molecularWeight: prop.MolecularWeight,
      canonicalSmiles: prop.CanonicalSMILES,
      inChIKey: prop.InChIKey,
      xLogP: prop.XLogP,
      tpsa: prop.TPSA,
      hBondDonorCount: prop.HBondDonorCount,
      hBondAcceptorCount: prop.HBondAcceptorCount,
      rotatableBondCount: prop.RotatableBondCount,
      complexity: prop.Complexity,
      imageUrl,
      lipinski: {
        pass: lipinskiPass,
        violations: lipinskiViolations,
      },
      veber: {
        pass: veberPass,
      },
      provenance: 'PubChem PUG REST API [Experimentally Determined & Calculated]',
    });
  } catch (error: any) {
    console.error('PubChem Error:', error);
    return res.status(500).json({ error: error.message || 'Error fetching PubChem data' });
  }
});

// openFDA Adverse Drug Events & Safety Data
app.get('/api/science/openfda', async (req: Request, res: ExpressResponse) => {
  try {
    const query = (req.query.q as string || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ error: 'Drug name is required' });
    }

    const eventUrl = `https://api.fda.gov/drug/event.json?search=patient.drug.medicinalproduct:${encodeURIComponent(query)}&count=patient.reaction.reactionmeddrapt.exact`;
    const eventRes = await fetchWithRetry(eventUrl);
    let topReactions: Array<{ term: string; count: number }> = [];

    if (eventRes.ok) {
      const eventData = await eventRes.json();
      topReactions = (eventData.results || []).slice(0, 8);
    }

    // Try label info
    const labelUrl = `https://api.fda.gov/drug/label.json?search=openfda.generic_name:${encodeURIComponent(query)}+openfda.brand_name:${encodeURIComponent(query)}&limit=1`;
    let labelInfo: any = null;
    const labelRes = await fetchWithRetry(labelUrl);
    if (labelRes.ok) {
      const labelData = await labelRes.json();
      const item = labelData.results?.[0];
      if (item) {
        labelInfo = {
          indications: item.indications_and_usage?.[0]?.slice(0, 400),
          warnings: item.warnings?.[0]?.slice(0, 400) || item.boxed_warning?.[0]?.slice(0, 400),
          contraindications: item.contraindications?.[0]?.slice(0, 400),
        };
      }
    }

    return res.json({
      drug: query,
      topReactions,
      labelInfo,
      provenance: 'openFDA FAERS & Product Labeling API',
    });
  } catch (error: any) {
    console.error('openFDA Error:', error);
    return res.status(500).json({ error: error.message || 'Error querying openFDA' });
  }
});

// ChEMBL Target and Mechanism of Action
app.get('/api/science/chembl', async (req: Request, res: ExpressResponse) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Compound name is required' });
    }

    const chemblUrl = `https://www.ebi.ac.uk/chembl/api/data/molecule.json?pref_name__iexact=${encodeURIComponent(query)}`;
    const chemblRes = await fetchWithRetry(chemblUrl);
    if (!chemblRes.ok) {
      return res.status(404).json({ error: 'Compound not found in ChEMBL' });
    }
    const chemblData = await chemblRes.json();
    const molecule = chemblData?.molecules?.[0];

    if (!molecule) {
      return res.status(404).json({ error: 'No ChEMBL record found' });
    }

    const chemblId = molecule.molecule_chembl_id;
    let mechanisms: any[] = [];
    if (chemblId) {
      const mechUrl = `https://www.ebi.ac.uk/chembl/api/data/mechanism.json?molecule_chembl_id=${chemblId}`;
      const mechRes = await fetchWithRetry(mechUrl);
      if (mechRes.ok) {
        const mechData = await mechRes.json();
        mechanisms = mechData?.mechanisms || [];
      }
    }

    return res.json({
      chemblId,
      prefName: molecule.pref_name,
      maxPhase: molecule.max_phase,
      moleculeType: molecule.molecule_type,
      firstApproval: molecule.first_approval,
      mechanisms: mechanisms.slice(0, 5).map((m: any) => ({
        mechanism: m.mechanism_of_action,
        actionType: m.action_type,
        targetName: m.target_chembl_id,
      })),
      provenance: 'EMBL-EBI ChEMBL Database',
    });
  } catch (error: any) {
    console.error('ChEMBL Error:', error);
    return res.status(500).json({ error: error.message || 'Error querying ChEMBL' });
  }
});

// -------------------------------------------------------------
// 2. Google Search Grounding with Gemini 3.8 Flash
// -------------------------------------------------------------
app.post('/api/gemini/grounded-search', async (req: Request, res: ExpressResponse) => {
  try {
    const { prompt, context } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const systemInstruction = `أنت خبير صيدلاني وسريري وباحث دوائي متخصص في سوق الأدوية والصيدلة السورية والعالمية.
استخدم نتائج بحث Google للتحقق من أحدث المعلومات الدقيقة عن الأسعار الرسمية لوزارة الصحة، بدائل الأدوية، التحذيرات الطبية، الجرعات، التوفر في السوق، والتداخلات.
قدم إجابات منظمة باللغة العربية مع إبراز النقاط الجوهرية والبدائل العلمية والتجارية.`;

    const fullPrompt = context ? `سياق الطلبية أو المسودة الحالية:\n${context}\n\nسؤال الصيدلاني:\n${prompt}` : prompt;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: fullPrompt,
      config: {
        systemInstruction,
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || '';
    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;

    const searchQueries = groundingMetadata?.webSearchQueries || [];
    const searchChunks = groundingMetadata?.groundingChunks?.map((c: any) => ({
      title: c.web?.title || 'مصدر طبي / صيدلاني',
      url: c.web?.uri || '#',
    })) || [];

    return res.json({
      text,
      searchQueries,
      sources: searchChunks,
    });
  } catch (error: any) {
    console.error('Grounded Search Error:', error);
    return res.status(500).json({ error: error.message || 'Error executing grounded search' });
  }
});

// -------------------------------------------------------------
// 3. Multi-turn Chat with Gemini (flash, argon, flash-lite)
// -------------------------------------------------------------
app.post('/api/gemini/chat', async (req: Request, res: ExpressResponse) => {
  try {
    const { messages, model = 'gemini-3.8-flash', role = 'pharmacist_advisor', orderContext } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    // Role definitions
    const roleInstructions: Record<string, string> = {
      pharmacist_advisor: `أنت كبير الاستشاريين الصيدلانيين والسريريين في مستودع الفواز للأدوية.
تساعد الصيادلة وأصحاب الصيدليات بتقديم نصائح صيدلانية دقيقة، بدائل للأدوية المفقودة، معلومات الجرعات، وتنبيهات التداخلات الدوائية باللغة العربية المهنية.`,
      order_optimizer: `أنت مدير المبيعات وحساب العروض في مستودع الفواز للأدوية.
متخصص في مراجعة طلبيات الأدوية، حساب أفضل كميات للحصول على أقصى بونص مجاني، اقتراح تجميع الأصناف ذات العروض القوية، وتقديم تحليل للتوفير المالي وخصم الفاتورة.`,
      bioscience_specialist: `أنت باحث دكتوراه في العلوم الحيوية والحرائك الدوائية (Pharmacology & Medicinal Chemistry).
تشرح آلية عمل الدواء (Mechanism of Action)، خواصه الكيميائية والفيزيائية، مطابقة معايير ليبينسكي وقابلية الامتصاص الفموي، ومخاطر السمية والآثار الجانبية بدقة علمية موثقة.`,
    };

    let systemInstruction = roleInstructions[role] || roleInstructions.pharmacist_advisor;
    if (orderContext) {
      systemInstruction += `\n\n[بيانات المسودة والطلبية الحالية المحملة للصيدلية]:\n${orderContext}`;
    }

    // Format contents for generateContent
    const contents = messages.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content || '' }],
    }));

    // Choose requested model (gemini-3.8-flash, gemini-3.1-flash-lite, gemini-4-argon)
    const validModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'];
    const chosenModel = validModels.includes(model) ? model : 'gemini-3.8-flash';

    const response = await ai.models.generateContent({
      model: chosenModel,
      contents,
      config: {
        systemInstruction,
      },
    });

    const reply = response.text || '';
    return res.json({
      reply,
      model: chosenModel,
    });
  } catch (error: any) {
    console.error('Chat Error:', error);
    return res.status(500).json({ error: error.message || 'Error processing chat message' });
  }
});

// -------------------------------------------------------------
// 4. Gemini 3.8 Live API Voice WebSocket Server (/live)
// -------------------------------------------------------------
const wss = new WebSocketServer({ server, path: '/live' });

wss.on('connection', async (clientWs: WebSocket) => {
  console.log('Client connected to Live Voice API');
  let liveSession: any = null;

  try {
    liveSession = await ai.live.connect({
      model: 'gemini-3.8-live',
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
        },
        systemInstruction: `أنت المساعد الصوتي الذكي والسريع لمستودع الفواز للأدوية في سوريا.
تتحدث باللغة العربية بلهجة صيدلانية احترافية وودودة وواضحة جداً.
تجيب بإيجاز ودقة عن استفسارات الأدوية، حسابات البونص، تراكيب المواد الفعالة، والبدائل الدوائية لتسهيل عمل الصيدلاني أثناء تجهيز طلبيته.`,
      },
      callbacks: {
        onmessage: (message: any) => {
          const audio = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
          if (audio && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ audio }));
          }
          if (message.serverContent?.interrupted && clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ interrupted: true }));
          }
        },
        onerror: (err: any) => {
          console.error('Gemini Live session error:', err);
          if (clientWs.readyState === WebSocket.OPEN) {
            clientWs.send(JSON.stringify({ error: 'Live API error' }));
          }
        },
        onclose: () => {
          console.log('Gemini Live session closed');
        },
      },
    });

    clientWs.on('message', (data: any) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed.audio && liveSession) {
          liveSession.sendRealtimeInput({
            audio: { data: parsed.audio, mimeType: 'audio/pcm;rate=16000' },
          });
        }
      } catch (e) {
        console.error('Error forwarding client audio to Live session:', e);
      }
    });

    clientWs.on('close', () => {
      console.log('Client disconnected from Live Voice');
      if (liveSession) {
        try {
          liveSession.close();
        } catch (e) {}
      }
    });
  } catch (error: any) {
    console.error('Failed to initialize Gemini Live session:', error);
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(JSON.stringify({ error: 'Failed to connect to Live Voice API: ' + error.message }));
      clientWs.close();
    }
  }
});

// -------------------------------------------------------------
// 5. Mount Vite or Static Frontend
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: ExpressResponse) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });
}

startServer();
