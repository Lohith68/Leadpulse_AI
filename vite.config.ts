import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { GoogleGenAI } from '@google/genai';

function crmApiPlugin(): Plugin {
  return {
    name: 'crm-server-api',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const url = new URL(req.url, 'http://localhost:3000');

        // Helper to parse JSON body
        const readBody = async (): Promise<any> => {
          return new Promise((resolve, reject) => {
            let data = '';
            req.on('data', chunk => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch (e) {
                resolve({});
              }
            });
            req.on('error', reject);
          });
        };

        const sendJson = (statusCode: number, obj: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(obj));
        };

        try {
          if (url.pathname === '/api/ai/pitch' && req.method === 'POST') {
            const body = await readBody();
            const { lead, company, contact, activities } = body;

            const apiKey = process.env.GEMINI_API_KEY;
            let pitchContent = '';

            if (apiKey) {
              const ai = new GoogleGenAI({ apiKey });
              const prompt = `You are a Principal Enterprise Account Executive at LEADPULSE AI CRM.
Generate a tailored, high-conversion sales brief and pitch strategy for the following enterprise lead:

Target Lead ID: ${lead?.id}
Company: ${company?.name} (Industry: ${company?.industry}, Size: ${company?.size}, Territory: ${company?.territory}, Annual Revenue: $${company?.annualRevenue?.toLocaleString()})
Key Contact: ${contact?.firstName} ${contact?.lastName} (${contact?.jobTitle}, Level: ${contact?.roleLevel}, Email: ${contact?.email})
Product Interest: ${lead?.productInterest}
Current Lead Score: ${lead?.totalScore}/100 (${lead?.scoreCategory})
Fit Score: ${lead?.fitScore}/30 | Intent Score: ${lead?.intentScore}/40 | Engagement: ${lead?.engagementScore}/30
Recent Activities: ${activities?.map((a: any) => `${a.type} (${a.timestamp})`).join(', ') || 'No recorded touchpoints'}

Provide a structured, executive-grade briefing with:
1. Executive Account Overview & Pain Point Hypothesis
2. Tailored Value Proposition (specifically mapped to their size & vertical)
3. Personalized Email Outreach Draft (Subject line + 3 short high-impact paragraphs)
4. Objection Handling & Strategic Discovery Questions
5. Recommended Immediate Next Step & SLA Urgency
Keep the tone confident, consultative, and enterprise-ready.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
              });
              pitchContent = response.text || '';
            } else {
              // High-quality fallback if API key is pending
              pitchContent = `### Executive Account Brief: ${company?.name || 'Target Account'}

**Account Alignment & Opportunity Overview**
${company?.name} is a high-priority enterprise account in the ${company?.industry || 'Technology'} vertical (${company?.size || '500+'} employees). With a calculated Lead Score of ${lead?.totalScore || 85}/100 (${lead?.scoreCategory || 'HOT'}), their recent engagement indicates strong purchase intent for **${lead?.productInterest || 'Enterprise Cloud'}**.

**Personalized Value Proposition**
By deploying LEADPULSE AI, ${company?.name} can automate qualification routing across ${company?.territory || 'their operating territory'}, eliminate compliance breaches, and accelerate pipeline velocity by up to 34% within the first two fiscal quarters.

**High-Conversion Outreach Template**
**Subject:** Scaling ${company?.name}'s ${lead?.productInterest || 'Cloud'} infrastructure with verified ROI

Hi ${contact?.firstName || 'there'},

I noticed your team recently evaluated enterprise criteria for ${lead?.productInterest || 'intelligent sales infrastructure'}. Leading organizations in ${company?.industry || 'your sector'} frequently face challenges with fragmented lead visibility and sales cycle delays.

LEADPULSE AI delivers transparent 100-point fit & intent scoring coupled with automated SLA routing, ensuring zero high-priority prospects drop through the cracks.

Do you have 15 minutes this Thursday at 2:00 PM for a high-level architectural walkthrough?

Best regards,
${lead?.assignedRepName || 'Enterprise Sales Specialist'} | LEADPULSE AI

**Key Discovery Questions:**
1. How is your team currently prioritizing accounts showing multiple intent touchpoints?
2. What are your primary regulatory or compliance boundaries regarding automated outreach?`;
            }

            return sendJson(200, { success: true, pitch: pitchContent });
          }

          if (url.pathname === '/api/ai/analyze-anomaly' && req.method === 'POST') {
            const body = await readBody();
            const { anomaly } = body;

            const apiKey = process.env.GEMINI_API_KEY;
            let analysis = '';

            if (apiKey) {
              const ai = new GoogleGenAI({ apiKey });
              const prompt = `You are a Chief Compliance & Revenue Operations Officer.
Analyze the following sales operations anomaly:
Type: ${anomaly?.type}
Severity: ${anomaly?.severity}
Affected Record: ${anomaly?.affectedRecordId} (${anomaly?.affectedEntity})
Expected Decision: ${anomaly?.expectedDecision}
Actual Decision: ${anomaly?.actualDecision}
Details: ${anomaly?.details}

Provide an incident assessment covering:
1. Operational & Legal Impact (e.g. GDPR liability, sales cycle friction, pipeline distortion)
2. Root Cause Analysis
3. Recommended Immediate Remediation Steps
4. Preventative System Constraint to permanently avoid recurrence.`;

              const response = await ai.models.generateContent({
                model: 'gemini-3.8-flash',
                contents: prompt,
              });
              analysis = response.text || '';
            } else {
              analysis = `### Anomaly Root Cause & Remediation Brief

**Incident:** ${anomaly?.type} (${anomaly?.severity} Severity)
**Affected Entity:** ${anomaly?.affectedEntity} [${anomaly?.affectedRecordId}]

**1. Operational & Regulatory Impact:**
This event represents a deviation where ${anomaly?.actualDecision} was attempted instead of ${anomaly?.expectedDecision}. In an enterprise production CRM, this could create regulatory exposure under GDPR/CCPA or distort pipeline forecasting.

**2. Immediate Remediation:**
- Maintain defensive block on the communication gateway.
- Transition status of affected record to RESOLVED with an administrative audit log.
- Verify territory routing tables and reassign orphaned prospects.

**3. Preventative Invariant:**
Enforced via client-side gateway guards and Firestore ABAC security rules preventing unauthorized write mutations.`;
            }

            return sendJson(200, { success: true, analysis });
          }

          return sendJson(404, { error: 'Not found' });
        } catch (error) {
          console.error('API Server error:', error);
          return sendJson(500, { error: error instanceof Error ? error.message : 'Internal Server Error' });
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), crmApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
