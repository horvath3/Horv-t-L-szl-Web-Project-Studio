import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: '60mb' }));

// API health endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Horvát László Studio Server'
  });
});

// ================= SECURE QUOTATION STATUS TRACKING API =================
interface StoredRequestRecord {
  id: string;
  requestId: string;
  name?: string;
  email?: string;
  projectName: string;
  projectType: string;
  projectCategory: string;
  gameName?: string;
  gameType?: string;
  platform?: string;
  status: string;
  internalStatus: string;
  publicStatus: string;
  publicStatusMessage?: string;
  promotionTitle?: string;
  createdAt: string;
  updatedAt: string;
}

let serverRequestIndex = new Map<string, StoredRequestRecord>([
  [
    'HL-3M8Q-54VN',
    {
      id: 'req-101',
      requestId: 'HL-3M8Q-54VN',
      name: 'Kovács Péter',
      email: 'peter.kovacs@example.com',
      projectName: 'SmartLogistics Portál',
      projectType: 'Webalkalmazás',
      projectCategory: 'Weboldal / Webalkalmazás',
      status: 'Ajánlat egyeztetése',
      internalStatus: 'Ajánlat egyeztetése',
      publicStatus: 'Ajánlat egyeztetése',
      publicStatusMessage: 'Az előzetes specifikáció és a modulok ütemezése jelenleg egyeztetés alatt áll.',
      createdAt: '2026-03-18T09:20:00.000Z',
      updatedAt: '2026-03-19T14:10:00.000Z'
    }
  ],
  [
    'HL-7K4P-92XM',
    {
      id: 'req-102',
      requestId: 'HL-7K4P-92XM',
      name: 'Tóth Andrea',
      email: 'andrea.toth@studio-art.hu',
      projectName: 'ArtisDesign Ékszer Weboldal',
      projectType: 'Weboldal',
      projectCategory: 'Weboldal / Webalkalmazás',
      status: 'Új',
      internalStatus: 'Új',
      publicStatus: 'Átnézés alatt',
      publicStatusMessage: 'Az ajánlatkérésedet jelenleg átnézem. Hamarosan e-mailben felveszem veled a kapcsolatot.',
      promotionTitle: 'Ingyenes weboldal készítés',
      createdAt: '2026-03-24T16:45:00.000Z',
      updatedAt: '2026-03-24T16:45:00.000Z'
    }
  ],
  [
    'HL-9G2M-41KP',
    {
      id: 'req-103',
      requestId: 'HL-9G2M-41KP',
      name: 'Szabó Dániel',
      email: 'daniel.szabo@gamedev-idea.hu',
      projectName: 'CityLine Transit – Egyedi Városi Buszszimulátor',
      projectType: 'Játékprojekt',
      projectCategory: 'Játékprojekt',
      gameName: 'CityLine Transit Simulator',
      gameType: 'Szimulátor',
      platform: 'Windows',
      status: 'Átnézés alatt',
      internalStatus: 'Átnézés alatt',
      publicStatus: 'Átnézés alatt',
      publicStatusMessage: 'A játékprojekt ötletedet és a kért mechanikákat jelenleg átnézem. Hamarosan e-mailben felveszem veled a kapcsolatot.',
      promotionTitle: '🎮 Ingyenes játékprojekt készítés',
      createdAt: '2026-03-25T11:20:00.000Z',
      updatedAt: '2026-03-25T11:20:00.000Z'
    }
  ]
]);

// Brute-force protection: Sliding window rate limiter per IP
const rateLimitStore = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_ATTEMPTS = 18; // max attempts per minute per IP

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitStore.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimitStore.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_ATTEMPTS;
}

const REQUEST_ID_REGEX = /^HL-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// Sync endpoint used by the application storage layer to keep server index updated
app.post('/api/requests/sync', (req: Request, res: Response) => {
  const { requests } = req.body;
  if (!Array.isArray(requests)) {
    return res.status(400).json({ error: 'Invalid sync payload' });
  }
  const nextMap = new Map<string, StoredRequestRecord>();
  for (const r of requests) {
    if (r && typeof r.requestId === 'string') {
      const normalizedId = r.requestId.trim().toUpperCase();
      nextMap.set(normalizedId, {
        id: r.id,
        requestId: normalizedId,
        name: typeof r.name === 'string' ? r.name.trim() : undefined,
        email: typeof r.email === 'string' ? r.email.trim() : undefined,
        projectName: r.projectName,
        projectType: r.projectType,
        projectCategory: r.projectCategory || (r.projectType === 'Játékprojekt' ? 'Játékprojekt' : 'Weboldal / Webalkalmazás'),
        gameName: r.gameName || undefined,
        gameType: r.gameType || undefined,
        platform: r.platform || undefined,
        status: r.status || 'Új',
        internalStatus: r.internalStatus || r.status || 'Új',
        publicStatus: r.publicStatus || r.status || 'Új',
        publicStatusMessage: r.publicStatusMessage || undefined,
        promotionTitle: r.promotionTitle || undefined,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt
      });
    }
  }
  serverRequestIndex = nextMap;
  return res.json({ synced: serverRequestIndex.size });
});

// Public status lookup endpoint (returns ONLY non-sensitive public status fields)
app.post('/api/request-status/lookup', (req: Request, res: Response) => {
  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'local';
  if (isRateLimited(clientIp)) {
    return res.status(429).json({
      error: 'Túl sok lekérdezési próbálkozás történt. Kérjük, várj egy percet, majd próbáld újra.',
      rateLimited: true
    });
  }

  const rawId = typeof req.body?.requestId === 'string' ? req.body.requestId.trim().toUpperCase() : '';

  if (!rawId || !REQUEST_ID_REGEX.test(rawId)) {
    return res.status(404).json({
      error: 'Nem találtunk ilyen ajánlatkérést. Ellenőrizd az azonosítót, majd próbáld újra.'
    });
  }

  const record = serverRequestIndex.get(rawId);
  if (!record) {
    return res.status(404).json({
      error: 'Nem találtunk ilyen ajánlatkérést. Ellenőrizd az azonosítót, majd próbáld újra.'
    });
  }

  const isGame = record.projectCategory === 'Játékprojekt' || record.projectType === 'Játékprojekt';

  // Strictly project ONLY non-sensitive public fields
  return res.json({
    status: {
      requestId: record.requestId,
      projectName: record.projectName,
      projectType: record.projectType,
      projectCategory: record.projectCategory || 'Weboldal / Webalkalmazás',
      gameName: isGame ? record.gameName || record.projectName : undefined,
      gameType: isGame ? record.gameType : undefined,
      platform: isGame ? record.platform : undefined,
      publicStatus: record.publicStatus || record.status || 'Új',
      publicStatusMessage: record.publicStatusMessage || undefined,
      promotionTitle: record.promotionTitle || undefined,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  });
});

// AI Project Requirement Analysis Endpoint
app.post('/api/ai/analyze-request', async (req: Request, res: Response) => {
  const { request } = req.body;
  if (!request) {
    return res.status(400).json({ error: 'Request body missing' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY not configured on server',
      fallback: true
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const isGame = request.projectCategory === 'Játékprojekt' || request.projectType === 'Játékprojekt';
    const gameContext = isGame
      ? `\nJáték neve: ${request.gameName || request.projectName}\nJáték típusa: ${request.gameType || 'Egyéb'}\nPlatform: ${request.platform || 'Windows'}\nMotor/technológia: ${request.engine || 'Nem megadott'}\nInspiráció (referencia játék): ${request.inspiration || 'Nincs megadva'} (FONTOS: saját ötleten és egyedi fejlesztésen alapuló projekt, a referencia játék csak inspiráció!)`
      : '';

    const prompt = `Elemezd az alábbi projektmegkeresést egy professzionális digitális projekt- és szoftverstúdió (Horvát László – Web & Project Studio) szemszögéből:
Projekt kategória: ${request.projectCategory || request.projectType}
Projekt neve: ${request.projectName}
Projekt típusa: ${request.projectType}${gameContext}
Megrendelő: ${request.name}
Rövid leírás: ${request.shortDescription}
Részletes leírás: ${request.detailedDescription}
Szükséges funkciók: ${JSON.stringify(request.requestedFeatures || request.requiredFeatures || [])}
Határidő: ${request.deadline || 'Nincs megadva'}
Költségkeret: ${request.budget || 'Nincs megadva'}

Készíts szakmai összefoglalót magyar nyelven a megadott JSON séma szerint. Ha játékprojektről van szó, hangsúlyozd az egyedi fejlesztést és a saját játékmechanikát.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Szakértő technológiai tanácsadó és projektbecslő vagy. Reális, modern és professzionális becsléseket adj.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: {
              type: Type.STRING,
              description: 'Tömör, 2-3 mondatos szakmai összefoglaló a projektről és értékajánlatról.'
            },
            estimatedWeeks: {
              type: Type.STRING,
              description: 'Becsült megvalósítási idő pl. "4-6 hét".'
            },
            suggestedTech: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Ajánlott modern technológiák és keretrendszerek.'
            },
            complexity: {
              type: Type.STRING,
              description: 'A projekt komplexitása: "Alacsony", "Közepes" vagy "Magas".'
            },
            recommendedNextSteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'A stúdió és az ügyfél következő javasolt lépései.'
            }
          },
          required: ['summary', 'estimatedWeeks', 'suggestedTech', 'complexity', 'recommendedNextSteps']
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({ analysis: parsed });
    } else {
      return res.status(500).json({ error: 'No response from model' });
    }
  } catch (err: any) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({
      error: err.message || 'Gemini API call failed',
      fallback: true
    });
  }
});

// AI Email Template Designer Endpoint (Section 9: ✨ AI e-mail tervező)
app.post('/api/ai/generate-email-template', async (req: Request, res: Response) => {
  const { prompt, targetStatus } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY not configured on server',
      fallback: true
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const aiPrompt = `Készíts egy professzionális, természetes magyar nyelvű ügyfél-értesítő e-mail sablont a „Horvát László – Web & Project Studio” számára.
Az adminisztrátor kérése: "${prompt}"
Célzott ajánlatkérési státusz: "${targetStatus || 'Átnézés alatt'}"

Használhatod az alábbi dinamikus helyőrző változókat a tárgyban és a szövegben:
{{customerName}}, {{projectName}}, {{projectCategory}}, {{gameName}}, {{gameType}}, {{platform}}, {{requestId}}, {{status}}, {{publicStatus}}, {{publicStatusMessage}}, {{createdAt}}, {{updatedAt}}, {{promotionName}}, {{websiteUrl}}

FONTOS:
- Soha ne tegyél bele belső admin megjegyzést vagy belső árképzést.
- Ha játékprojektről van szó, használhatod a {{gameName}}, {{gameType}} és {{platform}} változókat, és hangsúlyozd az egyedi fejlesztést és saját koncepciót.
- A stílus legyen modern, udvarias, szakmai és bizalomépítő.
- A CTA link alapértelmezetten legyen: "{{websiteUrl}}/ajanlat-statusz?id={{requestId}}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: aiPrompt,
      config: {
        systemInstruction:
          'Te a Horvát László – Web & Project Studio vezető kommunikációs és e-mail sablon tervező AI-ja vagy. Mindig természetes, választékos magyar nyelven írj.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: {
              type: Type.STRING,
              description: 'A sablon rövid, beszédes neve (pl. "Feldolgozás megkezdődött").'
            },
            subject: {
              type: Type.STRING,
              description: 'Az e-mail tárgya dinamikus változóval, pl. "{{projectName}} ({{requestId}})".'
            },
            preheader: {
              type: Type.STRING,
              description: 'Rövid előnézeti szöveg (1 mondat).'
            },
            introText: {
              type: Type.STRING,
              description: 'Megszólítás (Kedves {{customerName}}!) és bevezető bekezdés.'
            },
            bodyContent: {
              type: Type.STRING,
              description: 'A levél fő szakmai tartalma, amely tartalmazza a {{requestId}}, {{publicStatus}} és {{publicStatusMessage}} változókat is.'
            },
            nextStepsText: {
              type: Type.STRING,
              description: 'Következő lépések felsorolása vagy összefoglalása.'
            },
            ctaText: {
              type: Type.STRING,
              description: 'A fő CTA gomb felirata (pl. "Ajánlatkérés státuszának megtekintése").'
            },
            ctaLink: {
              type: Type.STRING,
              description: 'A CTA gomb URL-je, pl. "{{websiteUrl}}/ajanlat-statusz?id={{requestId}}".'
            },
            footerText: {
              type: Type.STRING,
              description: 'Rövid záró lábléc szöveg a Horvát László – Web & Project Studio nevében.'
            },
            icon: {
              type: Type.STRING,
              description: 'A státuszhoz illő egyetlen emoji ikon (pl. 👀, 💬, 🔨, 🎉).'
            },
            accentColor: {
              type: Type.STRING,
              description: 'Javasolt színséma: "indigo", "cyan", "purple", "emerald", "amber", "rose" vagy "slate".'
            }
          },
          required: [
            'name',
            'subject',
            'preheader',
            'introText',
            'bodyContent',
            'nextStepsText',
            'ctaText',
            'ctaLink',
            'footerText',
            'icon',
            'accentColor'
          ]
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({ template: parsed });
    } else {
      return res.status(500).json({ error: 'No response from model' });
    }
  } catch (err: any) {
    console.error('Gemini Email Template Generation Error:', err);
    return res.status(500).json({
      error: err.message || 'Gemini API call failed',
      fallback: true
    });
  }
});

// AI Dynamic Status Email Personalizer Endpoint (Section 8)
app.post('/api/ai/personalize-status-email', async (req: Request, res: Response) => {
  const { requestData, status, customInstruction } = req.body;
  if (!requestData) {
    return res.status(400).json({ error: 'requestData is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY not configured on server',
      fallback: true
    });
  }

  try {
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    const gameInfoLines =
      requestData.rawCategory === 'Játékprojekt'
        ? [
            requestData.gameName ? `Játék neve: ${requestData.gameName}` : '',
            requestData.gameType ? `Játék típusa: ${requestData.gameType}` : '',
            requestData.platform ? `Platform: ${requestData.platform}` : ''
          ]
            .filter(Boolean)
            .join('\n')
        : '';

    // Notice we strictly exclude adminNotes, budget, and confidential fields
    const prompt = `Fogalmazz meg egy személyre szabott, professzionális magyar nyelvű státuszértesítő e-mailt a „Horvát László – Web & Project Studio” nevében az alábbi ügyfélprojekt és aktuális státusz alapján:
Ügyfél neve: ${requestData.customerName}
Projekt kategória: ${requestData.projectCategory || requestData.projectType || 'Webes projekt'}
Projekt neve: ${requestData.projectName}
Projekt típusa: ${requestData.projectType || 'Webes projekt'}
${gameInfoLines ? `${gameInfoLines}\n` : ''}Projekt rövid leírása: ${requestData.shortDescription || ''}
Kért funkciók: ${Array.isArray(requestData.requiredFeatures) ? requestData.requiredFeatures.join(', ') : ''}
Ajánlatkérés azonosító: ${requestData.requestId}
Aktuális ügyfél-státusz: ${status || requestData.publicStatus}
Nyilvános státuszüzenet: ${requestData.publicStatusMessage || ''}
Kapcsolódó promóció: ${requestData.promotionName || 'Nincs'}
${customInstruction ? `További instrukció: ${customInstruction}` : ''}

A szöveg közvetlenül az ügyfélnek szóljon, természetesen hivatkozzon a projektjére (${requestData.projectName}), kategóriájára (${requestData.projectCategory || ''}) és az adott státuszra (${status || requestData.publicStatus}). Ne jeleníts meg üres mezőket, és ha játékprojektről van szó, hangsúlyozd a saját ötleten alapuló egyedi fejlesztést. Soha ne ígérj automatikusan fix árat.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Horvát László – Web & Project Studio szakmai kommunikációs asszisztense vagy. Professzionális, ügyfélbarát magyar e-mail szöveget generálsz.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            preheader: { type: Type.STRING },
            introText: { type: Type.STRING },
            bodyContent: { type: Type.STRING },
            nextStepsText: { type: Type.STRING },
            ctaText: { type: Type.STRING }
          },
          required: ['subject', 'preheader', 'introText', 'bodyContent', 'nextStepsText', 'ctaText']
        }
      }
    });

    if (response.text) {
      const parsed = JSON.parse(response.text.trim());
      return res.json({ emailContent: parsed });
    } else {
      return res.status(500).json({ error: 'No response from model' });
    }
  } catch (err: any) {
    console.error('Gemini Personalize Status Email Error:', err);
    return res.status(500).json({
      error: err.message || 'Gemini API call failed',
      fallback: true
    });
  }
});

// ================= GMAIL API + OAUTH 2.0 SECURE SERVER ENGINE =================
// Token Encryption in Server Memory (AES-256-GCM) - Never store plaintext tokens or log them
const SERVER_ENCRYPTION_SECRET =
  process.env.TOKEN_ENCRYPTION_SECRET || crypto.randomBytes(32).toString('hex');
const ENCRYPTION_KEY = crypto.scryptSync(SERVER_ENCRYPTION_SECRET, 'hl-studio-gmail-salt', 32);

interface EncryptedTokenVault {
  iv: string;
  authTag: string;
  ciphertext: string;
  email: string;
  scopeGranted: boolean;
  expiresAtMs: number;
  lastValidatedAt: string;
  errorState?: string;
}

let encryptedGmailVault: EncryptedTokenVault | null = null;

function encryptTokenForVault(plainToken: string): { iv: string; authTag: string; ciphertext: string } {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(plainToken, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    iv: iv.toString('hex'),
    authTag,
    ciphertext: encrypted
  };
}

function decryptTokenFromVault(vault: EncryptedTokenVault): string | null {
  try {
    const iv = Buffer.from(vault.iv, 'hex');
    const authTag = Buffer.from(vault.authTag, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(vault.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 10 ? token : null;
}

function isAuthorizedAdmin(req: Request): boolean {
  const adminHeader = req.headers['x-admin-auth'];
  return adminHeader === 'superadmin';
}

// Rate limiter specifically for Gmail sending (max 12 emails per minute per IP)
const gmailSendRateStore = new Map<string, number[]>();
function isGmailSendRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = gmailSendRateStore.get(ip) || [];
  const recent = list.filter((t) => now - t < 60000);
  recent.push(now);
  gmailSendRateStore.set(ip, recent);
  return recent.length > 12;
}

interface TokenValidationResult {
  valid: boolean;
  email: string | null;
  scopeGranted: boolean;
  expiresInSec: number;
  errorMessage?: string;
}

async function validateGoogleAccessToken(accessToken: string, fallbackEmail?: string): Promise<TokenValidationResult> {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`
    );
    if (!response.ok) {
      return {
        valid: false,
        email: fallbackEmail || null,
        scopeGranted: false,
        expiresInSec: 0,
        errorMessage: 'OAuth jogosultság lejárt vagy visszavonva. Kérjük, csatlakoztasd újra a Gmail-fiókot.'
      };
    }
    const data: any = await response.json();
    const scopes: string = typeof data.scope === 'string' ? data.scope : '';
    const hasGmailSend =
      scopes.includes('https://www.googleapis.com/auth/gmail.send') ||
      scopes.includes('https://mail.google.com/') ||
      scopes.includes('https://www.googleapis.com/auth/gmail.modify') ||
      scopes.includes('https://www.googleapis.com/auth/gmail.compose');

    const resolvedEmail = (typeof data.email === 'string' && data.email) || fallbackEmail || null;
    const expiresInSec = Number(data.expires_in) || 3500;

    if (!hasGmailSend) {
      return {
        valid: false,
        email: resolvedEmail,
        scopeGranted: false,
        expiresInSec,
        errorMessage:
          'A csatlakoztatott Google-fiókhoz nem lett megadva az e-mail küldési jogosultság (gmail.send). Csatlakoztasd újra a Gmailt, és pipáld be az engedélyt!'
      };
    }

    return {
      valid: true,
      email: resolvedEmail,
      scopeGranted: true,
      expiresInSec
    };
  } catch {
    return {
      valid: false,
      email: fallbackEmail || null,
      scopeGranted: false,
      expiresInSec: 0,
      errorMessage: 'Ideiglenes hálózati hiba a Google OAuth ellenőrzése közben.'
    };
  }
}

function encodeMimeHeaderUtf8(text: string): string {
  if (!text) return '';
  const clean = text.replace(/[\r\n]+/g, ' ').trim();
  return `=?UTF-8?B?${Buffer.from(clean, 'utf8').toString('base64')}?=`;
}

function wrapBase64Lines(b64: string, lineLength = 76): string {
  const lines: string[] = [];
  for (let i = 0; i < b64.length; i += lineLength) {
    lines.push(b64.slice(i, i + lineLength));
  }
  return lines.join('\r\n');
}

function buildMultipartMimeBase64Url(params: {
  fromName: string;
  fromEmail: string;
  toName: string;
  toEmail: string;
  subject: string;
  plainText: string;
  htmlBody: string;
}): string {
  const boundary = `hl_studio_mime_${crypto.randomBytes(12).toString('hex')}`;
  const encodedFromName = encodeMimeHeaderUtf8(params.fromName || 'Horvát László – Web & Project Studio');
  const encodedToName = encodeMimeHeaderUtf8(params.toName || params.toEmail);
  const encodedSubject = encodeMimeHeaderUtf8(params.subject || 'Értesítés az ajánlatkérésedről');

  const plainB64 = wrapBase64Lines(Buffer.from(params.plainText || '', 'utf8').toString('base64'));
  const htmlB64 = wrapBase64Lines(Buffer.from(params.htmlBody || '', 'utf8').toString('base64'));

  const mimeLines = [
    `From: ${encodedFromName} <${params.fromEmail}>`,
    `To: ${encodedToName} <${params.toEmail}>`,
    `Subject: ${encodedSubject}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    plainB64,
    '',
    `--${boundary}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    htmlB64,
    '',
    `--${boundary}--`,
    ''
  ];

  const rawMime = mimeLines.join('\r\n');
  return Buffer.from(rawMime, 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function mapGmailApiErrorToHungarian(status: number, errBody: any): { message: string; isAuthError: boolean } {
  const rawMessage =
    typeof errBody?.error?.message === 'string'
      ? errBody.error.message
      : typeof errBody?.error_description === 'string'
      ? errBody.error_description
      : '';
  const reason = errBody?.error?.errors?.[0]?.reason || '';

  if (status === 401 || reason === 'authError' || rawMessage.toLowerCase().includes('invalid credentials')) {
    return {
      message: 'OAuth jogosultság lejárt vagy visszavonva. Kérjük, csatlakoztasd újra a Gmail-fiókot a Beállításokban.',
      isAuthError: true
    };
  }
  if (status === 403) {
    if (reason === 'rateLimitExceeded' || reason === 'userRateLimitExceeded' || reason === 'dailyLimitExceeded') {
      return {
        message: 'Gmail API küldési korlát elérése (rate limit). Kérjük, várj néhány percet, majd próbáld újra.',
        isAuthError: false
      };
    }
    return {
      message:
        'Hiányzó Gmail API küldési jogosultság (gmail.send) vagy visszavont hozzáférés. Kérjük, csatlakoztasd újra a Gmail-fiókot.',
      isAuthError: true
    };
  }
  if (status === 429) {
    return {
      message: 'Gmail API küldési korlát elérése. Kérjük, próbáld újra egy kis idő múlva.',
      isAuthError: false
    };
  }
  if (status === 400) {
    return {
      message: 'A címzett e-mail címe hibás, vagy az üzenet formátuma érvénytelen a Gmail API számára.',
      isAuthError: false
    };
  }
  return {
    message: 'Gmail API hiba történt az üzenet továbbítása közben. Kérjük, próbáld újra.',
    isAuthError: false
  };
}

// 1. Connect & Validate Gmail Account (Server-Side Encrypted Session)
app.post('/api/gmail/connect', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: 'Nincs adminisztrátori jogosultság a Gmail csatlakoztatásához.' });
  }

  const token = extractBearerToken(req);
  const clientEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : undefined;

  if (!token) {
    return res.status(400).json({
      state: 'error',
      email: null,
      errorMessage: 'Hiányzó OAuth hozzáférési token. Kérjük, jelentkezz be újra a Google-fiókoddal.'
    });
  }

  const validation = await validateGoogleAccessToken(token, clientEmail);
  if (!validation.valid || !validation.email) {
    encryptedGmailVault = {
      ...encryptTokenForVault(token),
      email: validation.email || clientEmail || '',
      scopeGranted: validation.scopeGranted,
      expiresAtMs: 0,
      lastValidatedAt: new Date().toISOString(),
      errorState: validation.errorMessage || 'A Gmail kapcsolat ellenőrzése sikertelen.'
    };
    return res.status(400).json({
      state: 'error',
      email: validation.email || clientEmail || null,
      scopeGranted: validation.scopeGranted,
      errorMessage: validation.errorMessage || 'A Gmail kapcsolat ellenőrzése sikertelen.'
    });
  }

  const encrypted = encryptTokenForVault(token);
  encryptedGmailVault = {
    ...encrypted,
    email: validation.email,
    scopeGranted: true,
    expiresAtMs: Date.now() + validation.expiresInSec * 1000,
    lastValidatedAt: new Date().toISOString()
  };

  return res.json({
    state: 'connected',
    email: validation.email,
    scopeGranted: true,
    lastCheckedAt: encryptedGmailVault.lastValidatedAt
  });
});

// 2. Get Current Gmail Connection Status (Never returns tokens)
app.get('/api/gmail/status', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: 'Nincs adminisztrátori jogosultság.' });
  }

  const incomingToken = extractBearerToken(req);
  const tokenToCheck = incomingToken || (encryptedGmailVault ? decryptTokenFromVault(encryptedGmailVault) : null);

  if (!tokenToCheck) {
    return res.json({
      state: 'disconnected',
      email: null,
      scopeGranted: false,
      lastCheckedAt: new Date().toISOString()
    });
  }

  // If we validated within the last 45 seconds and it hasn't expired, return cached status quickly
  if (
    !incomingToken &&
    encryptedGmailVault &&
    !encryptedGmailVault.errorState &&
    encryptedGmailVault.expiresAtMs > Date.now() + 30000 &&
    Date.now() - new Date(encryptedGmailVault.lastValidatedAt).getTime() < 45000
  ) {
    return res.json({
      state: 'connected',
      email: encryptedGmailVault.email,
      scopeGranted: encryptedGmailVault.scopeGranted,
      lastCheckedAt: encryptedGmailVault.lastValidatedAt
    });
  }

  const validation = await validateGoogleAccessToken(tokenToCheck, encryptedGmailVault?.email);
  if (!validation.valid) {
    if (encryptedGmailVault) {
      encryptedGmailVault.errorState =
        validation.errorMessage || 'OAuth jogosultság lejárt vagy visszavonva.';
    }
    return res.json({
      state: 'error',
      email: validation.email || encryptedGmailVault?.email || null,
      scopeGranted: validation.scopeGranted,
      errorMessage:
        validation.errorMessage || 'OAuth jogosultság lejárt vagy visszavonva. Kérjük, csatlakoztasd újra a Gmail-fiókot.',
      lastCheckedAt: new Date().toISOString()
    });
  }

  const encrypted = encryptTokenForVault(tokenToCheck);
  encryptedGmailVault = {
    ...encrypted,
    email: validation.email || encryptedGmailVault?.email || '',
    scopeGranted: true,
    expiresAtMs: Date.now() + validation.expiresInSec * 1000,
    lastValidatedAt: new Date().toISOString()
  };

  return res.json({
    state: 'connected',
    email: encryptedGmailVault.email,
    scopeGranted: true,
    lastCheckedAt: encryptedGmailVault.lastValidatedAt
  });
});

// 3. Disconnect Gmail Account & Revoke Token
app.post('/api/gmail/disconnect', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({ error: 'Nincs adminisztrátori jogosultság.' });
  }

  const incomingToken = extractBearerToken(req);
  const tokenToRevoke = incomingToken || (encryptedGmailVault ? decryptTokenFromVault(encryptedGmailVault) : null);
  encryptedGmailVault = null;

  if (tokenToRevoke) {
    try {
      await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokenToRevoke)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
    } catch {
      // Ignore network errors during revoke; local server vault is already cleared
    }
  }

  return res.json({
    state: 'disconnected',
    email: null,
    lastCheckedAt: new Date().toISOString()
  });
});

// 4. Test Gmail Connection (Validates token + scope, and optionally sends a test email to self)
app.post('/api/gmail/test', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({
      success: false,
      error: 'Nincs adminisztrátori jogosultság a teszteléshez.'
    });
  }

  const incomingToken = extractBearerToken(req);
  const activeToken = incomingToken || (encryptedGmailVault ? decryptTokenFromVault(encryptedGmailVault) : null);

  if (!activeToken) {
    return res.status(400).json({
      success: false,
      state: 'disconnected',
      error: 'Gmail nincs csatlakoztatva. Kérjük, először kattints a „Kapcsolódás Gmailhez” gombra!'
    });
  }

  const validation = await validateGoogleAccessToken(activeToken, encryptedGmailVault?.email);
  if (!validation.valid || !validation.email) {
    if (encryptedGmailVault) {
      encryptedGmailVault.errorState = validation.errorMessage;
    }
    return res.status(401).json({
      success: false,
      state: 'error',
      email: validation.email || encryptedGmailVault?.email || null,
      error:
        validation.errorMessage ||
        'OAuth jogosultság lejárt vagy visszavonva. Kérjük, csatlakoztasd újra a Gmail-fiókot.'
    });
  }

  // Update encrypted vault with fresh validation
  encryptedGmailVault = {
    ...encryptTokenForVault(activeToken),
    email: validation.email,
    scopeGranted: true,
    expiresAtMs: Date.now() + validation.expiresInSec * 1000,
    lastValidatedAt: new Date().toISOString()
  };

  const sendTestEmail = !!req.body?.sendTestEmail;
  if (sendTestEmail) {
    try {
      const rawMime = buildMultipartMimeBase64Url({
        fromName: 'Horvát László – Web & Project Studio',
        fromEmail: validation.email,
        toName: 'Horvát László Studio Admin',
        toEmail: validation.email,
        subject: '✓ Gmail API Kapcsolat Teszt – Horvát László Studio',
        plainText:
          `Sikeres Gmail API kapcsolat teszt!\n\n` +
          `Csatlakoztatott feladó: ${validation.email}\n` +
          `Időpont: ${new Date().toLocaleString('hu-HU')}\n` +
          `Jogosultság: gmail.send (OAuth 2.0)\n\n` +
          `A Gmail API sikeresen átadta ezt a tesztüzenetet.`,
        htmlBody: `<!DOCTYPE html><html lang="hu"><body style="margin:0;padding:24px;background:#07090e;color:#e2e8f0;font-family:sans-serif;">
          <div style="max-width:540px;margin:0 auto;background:#0d111a;border:1px solid #1e293b;border-radius:16px;padding:28px;">
            <h2 style="margin:0 0 12px 0;color:#34d399;font-size:18px;">✓ Gmail API Kapcsolat Teszt Sikeres</h2>
            <p style="margin:0 0 16px 0;color:#cbd5e1;font-size:14px;line-height:1.6;">
              A <strong>Horvát László – Web &amp; Project Studio</strong> adminisztrációs rendszere sikeresen csatlakozott a Gmail API-hoz OAuth 2.0 hitelesítéssel.
            </p>
            <div style="background:#131826;border:1px solid #262f45;border-radius:12px;padding:14px;font-size:13px;color:#94a3b8;">
              <div>Feladó Gmail-cím: <strong style="color:#ffffff;">${validation.email}</strong></div>
              <div style="margin-top:4px;">Időpont: <strong style="color:#38bdf8;">${new Date().toLocaleString('hu-HU')}</strong></div>
            </div>
          </div>
        </body></html>`
      });

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawMime })
      });

      if (!sendRes.ok) {
        const errBody = await sendRes.json().catch(() => ({}));
        const mapped = mapGmailApiErrorToHungarian(sendRes.status, errBody);
        return res.status(sendRes.status).json({
          success: false,
          state: mapped.isAuthError ? 'error' : 'connected',
          email: validation.email,
          error: mapped.message
        });
      }

      return res.json({
        success: true,
        state: 'connected',
        email: validation.email,
        message: `✓ A Gmail OAuth kapcsolat aktív, és a teszt e-mailt a Gmail API sikeresen elküldte a(z) ${validation.email} címre.`
      });
    } catch {
      return res.status(502).json({
        success: false,
        state: 'error',
        email: validation.email,
        error: 'Ideiglenes hálózati vagy Gmail API hiba történt a teszt e-mail küldése közben.'
      });
    }
  }

  return res.json({
    success: true,
    state: 'connected',
    email: validation.email,
    message: `✓ A Gmail OAuth 2.0 kapcsolat és a küldési jogosultság (gmail.send) érvényes. Feladó: ${validation.email}`
  });
});

// 5. Send Status Notification Email via Gmail API (Strict Request & Recipient Verification)
const EMAIL_FORMAT_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.post('/api/gmail/send', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({
      success: false,
      error: 'Nincs adminisztrátori jogosultság e-mail küldésére.'
    });
  }

  const clientIp = (req.headers['x-forwarded-for'] as string) || req.ip || 'local';
  if (isGmailSendRateLimited(clientIp)) {
    return res.status(429).json({
      success: false,
      error: 'Küldési korlát elérése: túl sok e-mail küldési kérés történt rövid időn belül. Kérjük, várj egy percet.'
    });
  }

  const {
    requestId,
    recipientEmail,
    recipientName,
    subject,
    htmlBody,
    plainText,
    senderDisplayName
  } = req.body || {};

  const cleanRequestId = typeof requestId === 'string' ? requestId.trim().toUpperCase() : '';
  const cleanRecipientEmail = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';

  if (!cleanRecipientEmail || !EMAIL_FORMAT_REGEX.test(cleanRecipientEmail)) {
    return res.status(400).json({
      success: false,
      error: 'A címzett e-mail címe hiányzik vagy hibás formátumú.'
    });
  }

  if (!cleanRequestId) {
    return res.status(400).json({
      success: false,
      error: 'Hiányzó ajánlatkérés-azonosító (requestId).'
    });
  }

  // Security verification: Only allow sending to the email address registered on the matching ProjectRequest
  const storedRecord = serverRequestIndex.get(cleanRequestId);
  if (!storedRecord) {
    return res.status(404).json({
      success: false,
      error: `A megadott ajánlatkérés (${cleanRequestId}) nem található a szerver nyilvántartásában.`
    });
  }

  if (
    storedRecord.email &&
    storedRecord.email.trim().toLowerCase() !== cleanRecipientEmail.toLowerCase()
  ) {
    return res.status(403).json({
      success: false,
      error:
        'Biztonsági elutasítás: Csak az adott ajánlatkéréshez tartozó ügyfél e-mail címére küldhető értesítés.'
    });
  }

  if (!subject || typeof subject !== 'string' || !htmlBody || typeof htmlBody !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Az e-mail tárgya vagy tartalma hiányzik.'
    });
  }

  const incomingToken = extractBearerToken(req);
  const activeToken = incomingToken || (encryptedGmailVault ? decryptTokenFromVault(encryptedGmailVault) : null);

  if (!activeToken) {
    return res.status(401).json({
      success: false,
      code: 'GMAIL_NOT_CONNECTED',
      error: 'Gmail nincs csatlakoztatva. Kérjük, csatlakoztasd a Gmail-fiókodat az Admin → Beállítások oldalon.'
    });
  }

  const validation = await validateGoogleAccessToken(activeToken, encryptedGmailVault?.email);
  if (!validation.valid || !validation.email) {
    if (encryptedGmailVault) {
      encryptedGmailVault.errorState = validation.errorMessage;
    }
    return res.status(401).json({
      success: false,
      code: 'OAUTH_EXPIRED',
      error:
        validation.errorMessage ||
        'OAuth jogosultság lejárt vagy visszavonva. Kérjük, csatlakoztasd újra a Gmail-fiókot az Admin → Beállítások oldalon.'
    });
  }

  // Refresh encrypted vault
  encryptedGmailVault = {
    ...encryptTokenForVault(activeToken),
    email: validation.email,
    scopeGranted: true,
    expiresAtMs: Date.now() + validation.expiresInSec * 1000,
    lastValidatedAt: new Date().toISOString()
  };

  try {
    const rawMime = buildMultipartMimeBase64Url({
      fromName: senderDisplayName || 'Horvát László – Web & Project Studio',
      fromEmail: validation.email,
      toName: recipientName || storedRecord.name || cleanRecipientEmail,
      toEmail: cleanRecipientEmail,
      subject,
      plainText: plainText || subject,
      htmlBody
    });

    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawMime })
    });

    if (!gmailResponse.ok) {
      const errJson = await gmailResponse.json().catch(() => ({}));
      const mapped = mapGmailApiErrorToHungarian(gmailResponse.status, errJson);
      if (mapped.isAuthError && encryptedGmailVault) {
        encryptedGmailVault.errorState = mapped.message;
      }
      return res.status(gmailResponse.status).json({
        success: false,
        code: mapped.isAuthError ? 'OAUTH_EXPIRED' : 'GMAIL_API_ERROR',
        error: mapped.message
      });
    }

    const sentData: any = await gmailResponse.json().catch(() => ({}));

    return res.json({
      success: true,
      senderEmail: validation.email,
      recipientEmail: cleanRecipientEmail,
      messageId: sentData?.id || undefined,
      timestamp: new Date().toISOString(),
      message: '✓ Az e-mail sikeresen elküldve. (A Gmail API sikeresen átadta az üzenetet.)'
    });
  } catch {
    return res.status(502).json({
      success: false,
      code: 'NETWORK_ERROR',
      error: 'Ideiglenes hálózati vagy Gmail API hiba történt az e-mail küldése során.'
    });
  }
});

// 6. Send Capacity Reopen Notification to Waitlist Subscriber(s) via Gmail API
app.post('/api/gmail/send-waitlist', async (req: Request, res: Response) => {
  if (!isAuthorizedAdmin(req)) {
    return res.status(403).json({
      success: false,
      error: 'Nincs adminisztrátori jogosultság e-mail küldésére.'
    });
  }

  const { recipientEmail, recipientName, subject, htmlBody, plainTextBody } = req.body || {};
  const cleanRecipientEmail = typeof recipientEmail === 'string' ? recipientEmail.trim() : '';

  if (!cleanRecipientEmail || !EMAIL_FORMAT_REGEX.test(cleanRecipientEmail)) {
    return res.status(400).json({
      success: false,
      error: 'A címzett e-mail címe hiányzik vagy hibás formátumú.'
    });
  }

  const incomingToken = extractBearerToken(req);
  const activeToken =
    incomingToken || (encryptedGmailVault ? decryptTokenFromVault(encryptedGmailVault) : null);

  if (!activeToken) {
    return res.status(401).json({
      success: false,
      error: 'Gmail nincs csatlakoztatva. Kérjük, csatlakoztasd a Gmail-fiókodat az Admin → Beállítások oldalon.'
    });
  }

  const validation = await validateGoogleAccessToken(activeToken, encryptedGmailVault?.email);
  if (!validation.valid || !validation.email) {
    return res.status(401).json({
      success: false,
      error:
        validation.errorMessage ||
        'OAuth jogosultság lejárt vagy visszavonva. Kérjük, csatlakoztasd újra a Gmail-fiókot.'
    });
  }

  try {
    const rawMime = buildMultipartMimeBase64Url({
      fromName: 'Horvát László – Web & Project Studio',
      fromEmail: validation.email,
      toName: recipientName || cleanRecipientEmail,
      toEmail: cleanRecipientEmail,
      subject: subject || '🟢 Újra fogadunk projekteket! – Horvát László Studio',
      plainText: plainTextBody || subject || '',
      htmlBody: htmlBody || `<p>${plainTextBody || ''}</p>`
    });

    const gmailResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${activeToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ raw: rawMime })
    });

    if (!gmailResponse.ok) {
      const errJson = await gmailResponse.json().catch(() => ({}));
      const mapped = mapGmailApiErrorToHungarian(gmailResponse.status, errJson);
      return res.status(gmailResponse.status).json({
        success: false,
        error: mapped.message
      });
    }

    return res.json({
      success: true,
      senderEmail: validation.email,
      recipientEmail: cleanRecipientEmail
    });
  } catch {
    return res.status(502).json({
      success: false,
      error: 'Ideiglenes hálózati vagy Gmail API hiba történt az értesítés küldése során.'
    });
  }
});

// 7. Automatic Batch Waitlist Reopen Notification via Gmail API
app.post('/api/gmail/send-waitlist-batch', async (req: Request, res: Response) => {
  const { subscribers, studioName, ownerName, websiteUrl } = req.body || {};
  if (!Array.isArray(subscribers) || subscribers.length === 0) {
    return res.json({
      success: true,
      notifiedIds: [],
      sentCount: 0,
      failedCount: 0
    });
  }

  const incomingToken = extractBearerToken(req);
  const activeToken =
    incomingToken || (encryptedGmailVault ? decryptTokenFromVault(encryptedGmailVault) : null);

  if (!activeToken) {
    return res.status(401).json({
      success: false,
      notifiedIds: [],
      sentCount: 0,
      failedCount: subscribers.length,
      error:
        'Gmail nincs csatlakoztatva. Az automatikus várólista e-mailek kiküldéséhez csatlakoztasd a Gmail-fiókodat az Admin → Beállítások oldalon.'
    });
  }

  const validation = await validateGoogleAccessToken(activeToken, encryptedGmailVault?.email);
  if (!validation.valid || !validation.email) {
    return res.status(401).json({
      success: false,
      notifiedIds: [],
      sentCount: 0,
      failedCount: subscribers.length,
      error:
        validation.errorMessage ||
        'OAuth jogosultság lejárt vagy visszavonva. Kérjük, csatlakoztasd újra a Gmail-fiókot.'
    });
  }

  const effectiveStudio = studioName || 'Horvát László – Web & Project Studio';
  const effectiveOwner = ownerName || 'Horvát László';
  const effectiveOrigin = websiteUrl || process.env.APP_URL || 'http://localhost:3000';

  const notifiedIds: string[] = [];
  let failedCount = 0;
  let lastError = '';

  for (const sub of subscribers) {
    const cleanEmail = typeof sub?.email === 'string' ? sub.email.trim() : '';
    const subName = typeof sub?.name === 'string' && sub.name.trim() ? sub.name.trim() : 'Érdeklődő';
    const category = sub?.projectCategory || 'Projekt';
    const idea = typeof sub?.projectIdea === 'string' ? sub.projectIdea.trim() : '';

    if (!cleanEmail || !EMAIL_FORMAT_REGEX.test(cleanEmail)) {
      failedCount++;
      continue;
    }

    const subject = `🟢 Újra fogadunk projekteket! – ${category} (${effectiveStudio})`;
    const targetLink = `${effectiveOrigin}/projekt-igeny?category=${encodeURIComponent(category)}`;
    const plainText =
      `Kedves ${subName}!\n\n` +
      `Örömmel értesítelek, hogy a ${effectiveStudio} projektkapacitása újra megnyílt (🟢 Normál mód), így ismét fogadunk új ajánlatkéréseket a(z) ${category} kategóriában!\n\n` +
      (idea ? `Korábban megjelölt ötleted: „${idea}”\n\n` : '') +
      `Projektigényedet az alábbi linken küldheted be:\n${targetLink}\n\n` +
      `Üdvözlettel,\n${effectiveOwner}\n${effectiveStudio}`;

    const htmlBody = `<!DOCTYPE html>
<html lang="hu">
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background-color:#07090e;font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#f8fafc;">
  <div style="max-width:600px;margin:0 auto;background-color:#0d111a;border:1px solid #1e293b;border-radius:18px;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,0.6);">
    <div style="background:linear-gradient(135deg,#059669 0%,#4f46e5 100%);padding:24px 32px;">
      <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.2px;color:#d1fae5;margin-bottom:6px;">
        🟢 Projektkapacitás Újranyitva
      </div>
      <div style="font-size:20px;font-weight:800;color:#ffffff;">
        ${effectiveStudio}
      </div>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 14px 0;font-size:20px;color:#ffffff;">Kedves ${subName}!</h2>
      <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#cbd5e1;">
        Korábban értesítést kértél arról, amikor újra megnyílik a projektfogadásunk. Örömmel jelezzük, hogy a stúdió kapacitása ismét <strong style="color:#34d399;">🟢 Normál módba</strong> lépett, így újra fogadunk projekteket a(z) <strong style="color:#ffffff;">${category}</strong> kategóriában!
      </p>
      ${
        idea
          ? `<div style="margin:18px 0;padding:14px 18px;background-color:#131826;border-left:4px solid #6366f1;border-radius:10px;font-size:13.5px;color:#e2e8f0;">
              <div style="font-size:11px;text-transform:uppercase;color:#818cf8;font-weight:700;margin-bottom:4px;">Korábban megadott projektötleted:</div>
              <div>„${idea}”</div>
            </div>`
          : ''
      }
      <div style="margin:28px 0;text-align:center;">
        <a href="${targetLink}" target="_blank" style="display:inline-block;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;">
          🚀 Projektigény beküldése most &rarr;
        </a>
      </div>
      <p style="margin:0;font-size:13px;color:#94a3b8;line-height:1.6;">
        Várjuk a részletes elképzelésedet az ajánlatkérő felületen!
      </p>
    </div>
    <div style="background-color:#090c12;border-top:1px solid #1e293b;padding:20px 32px;font-size:12px;color:#64748b;">
      <strong style="color:#ffffff;">${effectiveOwner}</strong> · ${effectiveStudio}
    </div>
  </div>
</body>
</html>`;

    try {
      const rawMime = buildMultipartMimeBase64Url({
        fromName: effectiveStudio,
        fromEmail: validation.email,
        toName: subName,
        toEmail: cleanEmail,
        subject,
        plainText,
        htmlBody
      });

      const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${activeToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ raw: rawMime })
      });

      if (sendRes.ok) {
        if (sub.id) notifiedIds.push(sub.id);
      } else {
        failedCount++;
        const errJson = await sendRes.json().catch(() => ({}));
        lastError = mapGmailApiErrorToHungarian(sendRes.status, errJson).message;
      }
    } catch {
      failedCount++;
      lastError = 'Ideiglenes hálózati hiba a Gmail API hívás közben.';
    }
  }

  return res.json({
    success: failedCount === 0 || notifiedIds.length > 0,
    senderEmail: validation.email,
    notifiedIds,
    sentCount: notifiedIds.length,
    failedCount,
    error: failedCount > 0 ? lastError : undefined
  });
});

// ================= REAL-TIME WEB <-> ANDROID APP STATE SYNCHRONIZATION =================
const SYNC_DB_FILE = path.resolve(__dirname, '.studio-sync-db.json');

interface ServerSyncDatabase {
  updatedAt: number;
  entries: Record<string, { value: unknown; updatedAt: number }>;
}

let syncDbCache: ServerSyncDatabase = {
  updatedAt: 0,
  entries: {}
};

try {
  if (fs.existsSync(SYNC_DB_FILE)) {
    const raw = fs.readFileSync(SYNC_DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && parsed.entries) {
      syncDbCache = parsed;
    }
  }
} catch {
  // Ignore initial read error
}

function persistSyncDb() {
  try {
    fs.writeFileSync(SYNC_DB_FILE, JSON.stringify(syncDbCache), 'utf-8');
  } catch {
    // Ignore write error in read-only environments
  }
}

app.get('/api/sync/state', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    updatedAt: syncDbCache.updatedAt,
    entries: syncDbCache.entries
  });
});

app.post('/api/sync/state', (req: Request, res: Response) => {
  const { updates } = req.body || {};
  if (!updates || typeof updates !== 'object') {
    return res.status(400).json({ ok: false, error: 'Invalid updates payload' });
  }

  const now = Date.now();
  let changed = false;

  for (const [key, item] of Object.entries(updates)) {
    if (!key.startsWith('hl_studio_')) continue;
    const incomingVal = (item as { value?: unknown; updatedAt?: number })?.value;
    const incomingTs = Number((item as { updatedAt?: number })?.updatedAt) || now;
    const existing = syncDbCache.entries[key];

    if (!existing || incomingTs >= existing.updatedAt) {
      syncDbCache.entries[key] = {
        value: incomingVal,
        updatedAt: incomingTs
      };
      changed = true;
    }
  }

  if (changed) {
    syncDbCache.updatedAt = now;
    persistSyncDb();
  }

  return res.json({
    ok: true,
    updatedAt: syncDbCache.updatedAt
  });
});

// ================= PERMANENT IMAGE UPLOADS FOR STUDIO ASSETS & AVATARS =================
const UPLOADS_DIR = path.resolve(__dirname, '.studio-uploads');
const PUBLIC_UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');

[UPLOADS_DIR, PUBLIC_UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignore
    }
  }
});

// Serve uploaded assets statically under /uploads across both dev and prod
app.use('/uploads', express.static(UPLOADS_DIR));
app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR));

app.post('/api/upload/image', (req: Request, res: Response) => {
  try {
    const { base64Data, fileName, prefix = 'img' } = req.body || {};
    if (!base64Data || typeof base64Data !== 'string') {
      return res.status(400).json({ ok: false, error: 'Hiányzó képadat.' });
    }

    let ext = 'jpg';
    if (base64Data.startsWith('data:image/png')) ext = 'png';
    else if (base64Data.startsWith('data:image/webp')) ext = 'webp';
    else if (base64Data.startsWith('data:image/svg+xml')) ext = 'svg';
    else if (base64Data.startsWith('data:image/gif')) ext = 'gif';
    else if (fileName && typeof fileName === 'string') {
      const parts = fileName.split('.');
      if (parts.length > 1) {
        ext = parts.pop()?.toLowerCase() || 'jpg';
      }
    }

    const cleanBase64 = base64Data.includes(',')
      ? base64Data.split(',')[1]
      : base64Data;
    const buffer = Buffer.from(cleanBase64, 'base64');

    const cleanPrefix = String(prefix).replace(/[^a-zA-Z0-9_-]/g, '') || 'upload';
    const timestamp = Date.now();
    const randomSuffix = crypto.randomBytes(4).toString('hex');
    const finalFileName = `${cleanPrefix}_${timestamp}_${randomSuffix}.${ext}`;

    const filePath = path.resolve(UPLOADS_DIR, finalFileName);
    fs.writeFileSync(filePath, buffer);

    try {
      const publicPath = path.resolve(PUBLIC_UPLOADS_DIR, finalFileName);
      fs.writeFileSync(publicPath, buffer);
    } catch {
      // Ignore secondary write error
    }

    const publicUrl = `/uploads/${finalFileName}`;
    console.log(`[Upload] Image saved: ${publicUrl} (${buffer.length} bytes)`);

    return res.json({
      ok: true,
      url: publicUrl,
      fileName: finalFileName,
      sizeBytes: buffer.length
    });
  } catch (err: any) {
    console.error('Image upload error:', err);
    return res.status(500).json({ ok: false, error: err?.message || 'Kép mentési hiba a szerveren.' });
  }
});

// ================= REAL-TIME LIVE STREAM / "MIN DOLGOZOM MOST?" =================
export interface StreamOverlayConfig {
  enabled: boolean;
  mode: 'hud' | 'break';
  badgeText: string;
  title: string;
  subtitle?: string;
  position: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right' | 'bottom-bar';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  timerType?: 'countdown' | 'target-time' | 'none';
  targetTimestamp?: number;
  targetTimeDisplay?: string;
}

interface LiveStreamState {
  isLive: boolean;
  title: string;
  description: string;
  startedAt: number | null;
  lastFrame: string | null;
  lastFrameAt: number;
  isUnlisted: boolean;
  secretKey: string | null;
  overlay: StreamOverlayConfig | null;
}

let liveStreamState: LiveStreamState = {
  isLive: false,
  title: 'Élő fejlesztési munkafolyamat',
  description: 'Valós idejű képernyőmegosztás a stúdióból',
  startedAt: null,
  lastFrame: null,
  lastFrameAt: 0,
  isUnlisted: false,
  secretKey: null,
  overlay: null
};

// Track active viewers via heartbeats
const activeStreamViewers = new Map<string, number>();

// Clean up stale viewers (older than 15s) and stale stream (no frame for > 40s)
setInterval(() => {
  const now = Date.now();
  for (const [id, lastSeen] of activeStreamViewers.entries()) {
    if (now - lastSeen > 15000) {
      activeStreamViewers.delete(id);
    }
  }
  // Auto-offline if streamer closed tab or stopped sending frames for > 40 seconds
  if (liveStreamState.isLive && liveStreamState.lastFrameAt && (now - liveStreamState.lastFrameAt > 40000)) {
    liveStreamState.isLive = false;
    liveStreamState.lastFrame = null;
    liveStreamState.isUnlisted = false;
    liveStreamState.secretKey = null;
    liveStreamState.overlay = null;
    console.log('[LiveStream] Stream auto-ended due to inactivity timeout');
  }
}, 5000);

app.get('/api/live-stream/status', (req: Request, res: Response) => {
  const viewerId = (req.query.viewerId as string) || req.ip || 'viewer';
  if (viewerId) {
    activeStreamViewers.set(viewerId, Date.now());
  }

  const key = (req.query.key as string) || '';
  const isAdmin = req.headers['x-admin-auth'] === 'superadmin' || req.query.admin === 'true';

  // If stream is unlisted (ideiglenes közvetítés):
  // Only reveal live status to viewers with the matching secret key, or to admin
  if (liveStreamState.isLive && liveStreamState.isUnlisted) {
    const isKeyValid = Boolean(key && liveStreamState.secretKey && key === liveStreamState.secretKey);
    if (!isKeyValid && !isAdmin) {
      return res.json({
        ok: true,
        isLive: false,
        isUnlisted: true,
        title: '',
        description: '',
        startedAt: null,
        lastFrameAt: 0,
        hasFrame: false,
        viewersCount: 0,
        overlay: null
      });
    }
  }

  return res.json({
    ok: true,
    isLive: liveStreamState.isLive,
    isUnlisted: liveStreamState.isUnlisted,
    secretKey: isAdmin || (key && key === liveStreamState.secretKey) ? liveStreamState.secretKey : null,
    title: liveStreamState.title,
    description: liveStreamState.description,
    startedAt: liveStreamState.startedAt,
    lastFrameAt: liveStreamState.lastFrameAt,
    hasFrame: Boolean(liveStreamState.lastFrame),
    viewersCount: Math.max(1, activeStreamViewers.size),
    overlay: liveStreamState.overlay
  });
});

app.get('/api/live-stream/frame', (req: Request, res: Response) => {
  if (!liveStreamState.isLive || !liveStreamState.lastFrame) {
    return res.status(404).json({ ok: false, message: 'Nincs aktív élő közvetítés' });
  }

  // Security check for unlisted secret stream
  if (liveStreamState.isUnlisted) {
    const key = (req.query.key as string) || '';
    const isAdmin = req.headers['x-admin-auth'] === 'superadmin' || req.query.admin === 'true';
    if (!isAdmin && (!key || key !== liveStreamState.secretKey)) {
      return res.status(403).json({ ok: false, message: 'Hozzáférés megtagadva az ideiglenes közvetítéshez.' });
    }
  }

  if (liveStreamState.lastFrame.startsWith('data:')) {
    const parts = liveStreamState.lastFrame.split(',');
    const mime = parts[0].split(':')[1].split(';')[0] || 'image/jpeg';
    const buffer = Buffer.from(parts[1], 'base64');
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    return res.send(buffer);
  }

  return res.status(404).send('No frame');
});

app.post('/api/live-stream/broadcast', (req: Request, res: Response) => {
  const { frame, title, description, isUnlisted, secretKey, overlay } = req.body || {};
  if (!frame || typeof frame !== 'string') {
    return res.status(400).json({ ok: false, error: 'Hiányzó képernyőkép tartalom' });
  }

  const now = Date.now();
  if (!liveStreamState.isLive) {
    liveStreamState.startedAt = now;
  }
  liveStreamState.isLive = true;

  // Handle unlisted flag and secretKey (accepts persistent key from admin if provided)
  const wantUnlisted = Boolean(isUnlisted);
  liveStreamState.isUnlisted = wantUnlisted;
  if (wantUnlisted) {
    if (typeof secretKey === 'string' && secretKey.trim()) {
      liveStreamState.secretKey = secretKey.trim();
    } else if (!liveStreamState.secretKey) {
      liveStreamState.secretKey = crypto.randomBytes(6).toString('hex');
    }
  } else {
    liveStreamState.secretKey = null;
  }

  liveStreamState.title = typeof title === 'string' && title.trim() ? title.trim() : 'Aktuális fejlesztési munkafolyamat';
  liveStreamState.description = typeof description === 'string' ? description.trim() : '';
  liveStreamState.lastFrame = frame;
  liveStreamState.lastFrameAt = now;

  if (overlay !== undefined) {
    if (overlay === null) {
      liveStreamState.overlay = null;
    } else if (typeof overlay === 'object') {
      liveStreamState.overlay = overlay;
    }
  }

  return res.json({
    ok: true,
    isLive: true,
    isUnlisted: liveStreamState.isUnlisted,
    secretKey: liveStreamState.secretKey,
    viewersCount: Math.max(1, activeStreamViewers.size),
    overlay: liveStreamState.overlay
  });
});

app.post('/api/live-stream/stop', (_req: Request, res: Response) => {
  liveStreamState.isLive = false;
  liveStreamState.lastFrame = null;
  liveStreamState.lastFrameAt = 0;
  liveStreamState.isUnlisted = false;
  liveStreamState.secretKey = null;
  liveStreamState.overlay = null;

  // Notify all connected WebRTC viewers that the stream has stopped
  for (const [peerId, client] of signalingClients.entries()) {
    if (!client.isBroadcaster) {
      try {
        client.res.write(`data: ${JSON.stringify({ type: 'stream-ended' })}\n\n`);
      } catch {}
    }
  }

  console.log('[LiveStream] Stream stopped by broadcaster');
  return res.json({ ok: true, isLive: false });
});

// ================= 60 FPS WEBRTC REAL-TIME SIGNALING ENGINE =================
interface SignalingClient {
  res: Response;
  peerId: string;
  isBroadcaster: boolean;
  joinedAt: number;
}

const signalingClients = new Map<string, SignalingClient>();
const signalMessageQueue = new Map<string, any[]>();

function sendSseEvent(res: Response, data: any) {
  try {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
    res.flushHeaders?.();
  } catch (err) {
    // Ignore socket write errors
  }
}

// Update Stream Overlay / Break Screen live without restarting stream
app.post('/api/live-stream/overlay', (req: Request, res: Response) => {
  const { overlay } = req.body || {};
  if (overlay === null) {
    liveStreamState.overlay = null;
  } else if (overlay && typeof overlay === 'object') {
    liveStreamState.overlay = {
      enabled: Boolean(overlay.enabled),
      mode: overlay.mode === 'break' ? 'break' : 'hud',
      badgeText: typeof overlay.badgeText === 'string' && overlay.badgeText.trim() ? overlay.badgeText.trim() : (overlay.mode === 'break' ? 'SZÜNET' : 'ÉLŐ MUNKA'),
      title: typeof overlay.title === 'string' ? overlay.title.trim() : '',
      subtitle: typeof overlay.subtitle === 'string' ? overlay.subtitle.trim() : '',
      position: ['bottom-left', 'bottom-right', 'top-left', 'top-right', 'bottom-bar'].includes(overlay.position)
        ? overlay.position
        : 'bottom-left',
      size: ['sm', 'md', 'lg', 'xl'].includes(overlay.size) ? overlay.size : 'md',
      timerType: ['countdown', 'target-time', 'none'].includes(overlay.timerType)
        ? overlay.timerType
        : 'none',
      targetTimestamp: typeof overlay.targetTimestamp === 'number' ? overlay.targetTimestamp : undefined,
      targetTimeDisplay: typeof overlay.targetTimeDisplay === 'string' ? overlay.targetTimeDisplay.trim() : undefined
    };
  }

  // Broadcast overlay update to all connected signaling clients via SSE & queue
  const payload = {
    type: 'overlay-updated',
    overlay: liveStreamState.overlay
  };

  for (const [peerId, client] of signalingClients.entries()) {
    sendSseEvent(client.res, payload);
  }

  for (const peerId of signalMessageQueue.keys()) {
    const queue = signalMessageQueue.get(peerId) || [];
    queue.push(payload);
    if (queue.length > 20) queue.shift();
    signalMessageQueue.set(peerId, queue);
  }

  return res.json({ ok: true, overlay: liveStreamState.overlay });
});

// 1. WebRTC SSE Event Stream (Low-latency push signaling, unbuffered)
app.get('/api/live-stream/signal/events', (req: Request, res: Response) => {
  const peerId = (req.query.peerId as string) || '';
  const isBroadcaster = req.query.isBroadcaster === 'true';
  const key = (req.query.key as string) || '';
  const isAdmin = req.headers['x-admin-auth'] === 'superadmin' || req.query.admin === 'true';

  if (!peerId) {
    return res.status(400).send('peerId is required');
  }

  // Security check for unlisted stream
  if (!isBroadcaster && liveStreamState.isLive && liveStreamState.isUnlisted) {
    const isKeyValid = Boolean(key && liveStreamState.secretKey && key === liveStreamState.secretKey);
    if (!isKeyValid && !isAdmin) {
      return res.status(403).send('Invalid secret stream key');
    }
  }

  // Unbuffered SSE Headers for Cloud Run & Reverse Proxies
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  // Send immediate connection acknowledgment
  res.write(': connected\n\n');

  // Keep-alive ping every 10s to prevent cloud proxy disconnects
  const keepAliveInterval = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {}
  }, 10000);

  const client: SignalingClient = {
    res,
    peerId,
    isBroadcaster,
    joinedAt: Date.now()
  };

  signalingClients.set(peerId, client);

  // Send queued messages if any
  const queue = signalMessageQueue.get(peerId);
  if (queue && queue.length > 0) {
    queue.forEach((msg) => sendSseEvent(res, msg));
    signalMessageQueue.delete(peerId);
  }

  // If a viewer connected and stream is live, notify broadcaster immediately to initiate WebRTC offer
  if (!isBroadcaster && liveStreamState.isLive) {
    const broadcaster = signalingClients.get('broadcaster');
    if (broadcaster) {
      sendSseEvent(broadcaster.res, {
        type: 'viewer-joined',
        viewerId: peerId
      });
    }
  }

  req.on('close', () => {
    clearInterval(keepAliveInterval);
    signalingClients.delete(peerId);
    signalMessageQueue.delete(peerId);

    if (isBroadcaster) {
      // Notify all viewers broadcaster disconnected
      for (const [id, c] of signalingClients.entries()) {
        if (!c.isBroadcaster) {
          sendSseEvent(c.res, { type: 'broadcaster-disconnected' });
        }
      }
    } else {
      // Notify broadcaster viewer left
      const broadcaster = signalingClients.get('broadcaster');
      if (broadcaster) {
        sendSseEvent(broadcaster.res, {
          type: 'viewer-left',
          viewerId: peerId
        });
      }
    }
  });
});

// 2. Relay WebRTC Signal Message (Offer, Answer, ICE Candidate)
app.post('/api/live-stream/signal/message', (req: Request, res: Response) => {
  const { from, to, type, data, key } = req.body || {};
  if (!from || !to || !type) {
    return res.status(400).json({ ok: false, error: 'Invalid signal payload' });
  }

  // Security check for unlisted stream
  if (liveStreamState.isLive && liveStreamState.isUnlisted) {
    const isFromBroadcaster = from === 'broadcaster';
    const isAdmin = req.headers['x-admin-auth'] === 'superadmin';
    if (!isFromBroadcaster && !isAdmin && (!key || key !== liveStreamState.secretKey)) {
      return res.status(403).json({ ok: false, error: 'Unauthorized signal' });
    }
  }

  const targetClient = signalingClients.get(to);
  const payload = { from, to, type, data };

  if (targetClient) {
    sendSseEvent(targetClient.res, payload);
  } else {
    // Queue for target client in case SSE reconnecting
    const queue = signalMessageQueue.get(to) || [];
    queue.push(payload);
    // Keep max 20 messages
    if (queue.length > 20) queue.shift();
    signalMessageQueue.set(to, queue);
  }

  return res.json({ ok: true, delivered: Boolean(targetClient) });
});

// 3. Fallback Poll for Environments with Strict SSE Filtering
const handleSignalPoll = (req: Request, res: Response) => {
  const peerId = (req.query.peerId as string) || (req.body?.peerId as string) || '';
  if (!peerId) return res.status(400).json({ ok: false, error: 'peerId required' });

  const queue = signalMessageQueue.get(peerId) || [];
  signalMessageQueue.set(peerId, []);
  return res.json({ ok: true, messages: queue });
};
app.get('/api/live-stream/signal/poll', handleSignalPoll);
app.post('/api/live-stream/signal/poll', handleSignalPoll);

// Production / Dev handling
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    // Serve static build and assets in production
    app.use('/src/assets', express.static(path.resolve(__dirname, 'src/assets')));
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    // In development mode, mount Vite middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

startServer();
