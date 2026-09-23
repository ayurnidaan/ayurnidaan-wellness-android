import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const read = (path) => readFileSync(path, 'utf8');
const app = read('App.tsx');
const supabaseClient = read(join('src', 'lib', 'supabase.ts'));
const migration = read(join('supabase', 'migrations', '20260922090000_security_hardening.sql'));
const functionRoot = join('supabase', 'functions');
const edgeFiles = readdirSync(functionRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && entry.name !== '_shared')
  .map((entry) => join(functionRoot, entry.name, 'index.ts'));
const edgeSource = edgeFiles.map(read).join('\n');
const aiChat = read(join(functionRoot, 'ai-chat', 'index.ts'));

const checks = [
  ['native sessions use SecureStore', supabaseClient.includes("from 'expo-secure-store'") && !supabaseClient.includes("AsyncStorage")],
  ['the client cannot write final paid-resource tables', !/from\(['"](?:appointments|shop_orders|shop_order_items)['"]\)\.(?:insert|upsert|update)/.test(app)],
  ['demo payment bypasses are absent', !/PAYMENT_PROCESSING_ENABLED|demoOrdersKey|demoAppointmentsKey/.test(app)],
  ['appointment and shop writes are revoked', /revoke insert, update on table public\.appointments from authenticated/.test(migration) && /revoke insert on table public\.shop_orders from authenticated/.test(migration) && /revoke insert on table public\.shop_order_items from authenticated/.test(migration)],
  ['payment fulfilment locks the transaction and is service-only', /function public\.fulfil_verified_payment/.test(migration) && /for update/.test(migration) && /grant execute on function public\.fulfil_verified_payment\(uuid, text\) to service_role/.test(migration)],
  ['consent is versioned and append-only', /create table if not exists public\.consent_events/.test(migration) && /document_sha256/.test(migration) && /function public\.update_privacy_settings/.test(migration)],
  ['optional personalisation is not required for onboarding', /const ready = documentRead && termsAccepted;/.test(app) && /Optional: use my personal data/.test(app)],
  ['stored health context is gated before AI retrieval', /const storedContextAllowed = profile\?\.ai_context_enabled === true/.test(edgeSource) && /storedContextAllowed \? await Promise\.all/.test(edgeSource)],
  ['the adult-only boundary is enforced in the app and database', /ageFromDateOfBirth\(normalizedDob\)/.test(app) && /create trigger profiles_require_adult/.test(migration)],
  ['doctor applications require authentication and uploaded files', /if caller_id is null then raise exception 'Authentication required'/.test(migration) && /doctor-verification-files/.test(migration) && /doctor_identity_fingerprint/.test(migration)],
  ['Edge Functions do not use wildcard CORS', !/Access-Control-Allow-Origin["']?\s*:\s*["']\*["']/.test(edgeSource)],
  ['AI and payment endpoints invoke the database quota', ['ai-chat', 'current-health-chat', 'generate-food-plan', 'generate-supplement-recommendations', 'generate-yoga-plan', 'scan-food-meal', 'razorpay-payment'].every((name) => read(join(functionRoot, name, 'index.ts')).includes('consumeRateLimit'))],
  ['AI Vaidya responses are normalised to plain text', aiChat.includes('const sanitiseAIReply') && aiChat.includes('.replace(/\\u2014/g, ", ")') && aiChat.includes('.replace(/#/g, "")') && aiChat.includes('.replace(/\\*/g, "")')],
  ['AI Vaidya guidance is constrained to Ayurveda', ['Prakriti', 'Vikriti', 'Agni', 'Ama', 'Dinacharya', 'Ritucharya', 'Ahara', 'Vihara'].every((term) => aiChat.includes(term)) && aiChat.includes('Present Ayurvedic concepts as the traditional Ayurvedic view')],
];

const failed = checks.filter(([, passed]) => !passed);
for (const [name, passed] of checks) console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}`);
if (failed.length) process.exitCode = 1;
