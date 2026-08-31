import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform,
  Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';

import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';

WebBrowser.maybeCompleteAuthSession();

type Screen = 'splash' | 'welcome' | 'account' | 'profile' | 'home';
const logo = require('./assets/ayurnidaan-logo.png');

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession && screen !== 'splash') setScreen('welcome');
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function continueFromSplash() {
    if (!session) return setScreen('welcome');
    await routeAuthenticatedUser(session);
  }

  async function routeAuthenticatedUser(currentSession: Session) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('profile_completed_at')
      .eq('user_id', currentSession.user.id)
      .maybeSingle();
    setScreen(profile?.profile_completed_at ? 'home' : 'account');
  }

  async function handleAuthenticated(nextSession: Session) {
    setSession(nextSession);
    await routeAuthenticatedUser(nextSession);
  }

  if (screen === 'splash') return <BrandSplash onFinish={continueFromSplash} />;
  if (screen === 'welcome') {
    return <WelcomeScreen onAuthenticated={handleAuthenticated} />;
  }
  if (screen === 'account') return <AccountSetupScreen session={session} onComplete={() => setScreen('profile')} />;
  if (screen === 'profile') return <ProfileScreen session={session} onComplete={() => setScreen('home')} />;
  return <HomeScreen onSignOut={() => setScreen('welcome')} />;
}

function BrandSplash({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 650, useNativeDriver: true }).start();
    const timer = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(timer);
  }, [opacity]);

  function continueOnTap() {
    if (!ready || leaving) return;
    setLeaving(true);
    Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(onFinish);
  }

  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Continue" disabled={!ready || leaving} onPress={continueOnTap} style={styles.brandSplash}>
      <StatusBar style="dark" />
      <Animated.View style={[styles.brandBlock, { opacity }]}>
        <Image source={logo} style={styles.logoLarge} resizeMode="contain" />
        <Text style={styles.brandName}>Ayurnidaan</Text>
        <Text style={styles.brandSubtitle}>AI-powered Ayurveda for Personalized Health</Text>
        {ready ? <Text style={styles.tapHint}>Tap anywhere to continue</Text> : null}
      </Animated.View>
    </Pressable>
  );
}

function WelcomeScreen({ onAuthenticated }: { onAuthenticated: (session: Session) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function signInWithGoogle() {
    setLoading(true); setError('');
    const redirectTo = AuthSession.makeRedirectUri({ path: 'auth/callback' });
    const { data, error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google', options: { redirectTo, skipBrowserRedirect: true },
    });
    if (authError || !data.url) { setLoading(false); return setError(authError?.message ?? 'Could not start Google sign-in.'); }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      const params = extractAuthParams(result.url);
      if (params.access_token && params.refresh_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
        if (sessionError) setError(sessionError.message);
        if (sessionData.session) await onAuthenticated(sessionData.session);
      }
    }
    setLoading(false);
  }

  return (
    <ScreenFrame>
      <Image source={logo} style={styles.logoSmall} resizeMode="contain" />
      <Text style={styles.heading}>Welcome to Ayurnidaan</Text>
      <Text style={styles.copy}>Personalized health guidance combining Ayurveda, modern health information and AI.</Text>
      <View style={styles.card}>
        <PrimaryButton label="Continue with Google" loading={loading} onPress={signInWithGoogle} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScreenFrame>
  );
}

function AccountSetupScreen({ session, onComplete }: { session: Session | null; onComplete: () => void }) {
  const [name, setName] = useState('');
  const [accepted, setAccepted] = useState(false); const [loading, setLoading] = useState(false); const [error, setError] = useState('');

  async function saveAccountDetails() {
    if (!session?.user.id) return setError('Please sign in again.');
    if (!name.trim() || !accepted) return setError('Enter your name and accept the policies.');
    setLoading(true); setError('');
    const acceptedAt = new Date().toISOString();
    const { error: authError } = await supabase.auth.updateUser({
      data: { full_name: name.trim(), terms_accepted_at: acceptedAt },
    });
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: session.user.id,
      full_name: name.trim(),
      terms_accepted_at: acceptedAt,
    });
    setLoading(false);
    if (authError) return setError(authError.message);
    if (profileError) return setError(profileError.message);
    onComplete();
  }
  return (
    <ScreenFrame>
      <Text style={styles.eyebrow}>LET'S GET STARTED</Text>
      <Text style={styles.heading}>What should we call you?</Text>
      <Text style={styles.copy}>Tell us your name before creating your personalized health profile.</Text>
      <View style={styles.card}>
        <Field label="Full name" value={name} onChangeText={setName} placeholder="Your name" />
        <Pressable style={styles.checkRow} onPress={() => setAccepted((value) => !value)}>
          <View style={[styles.checkbox, accepted && styles.checkboxSelected]}>{accepted ? <Text style={styles.checkmark}>✓</Text> : null}</View>
          <Text style={styles.terms}>I accept the <Text style={styles.link}>Terms of Use</Text> and <Text style={styles.link}>Privacy Policy</Text>.</Text>
        </Pressable>
        <PrimaryButton label="Continue" loading={loading} onPress={saveAccountDetails} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScreenFrame>
  );
}

function ProfileScreen({ session, onComplete }: { session: Session | null; onComplete: () => void }) {
  const [dateOfBirth, setDateOfBirth] = useState(''); const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [height, setHeight] = useState(''); const [weight, setWeight] = useState(''); const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function saveProfile() {
    if (!session?.user.id) return setError('Please sign in again.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) || !sex || !Number(height) || !Number(weight)) return setError('Complete every field. Use YYYY-MM-DD for date of birth.');
    setLoading(true); setError('');
    const { error: profileError } = await supabase.from('profiles').upsert({
      user_id: session.user.id, full_name: session.user.user_metadata.full_name ?? null,
      date_of_birth: dateOfBirth, sex, height_cm: Number(height), weight_kg: Number(weight), profile_completed_at: new Date().toISOString(),
    });
    setLoading(false);
    if (profileError) return setError(profileError.message);
    onComplete();
  }
  return (
    <ScreenFrame scroll>
      <Text style={styles.eyebrow}>ONE LAST STEP</Text><Text style={styles.heading}>Create your health profile</Text>
      <Text style={styles.copy}>These details help personalize your wellness guidance.</Text>
      <View style={styles.card}>
        <Field label="Date of birth" value={dateOfBirth} onChangeText={setDateOfBirth} placeholder="YYYY-MM-DD" />
        <Text style={styles.label}>Sex</Text>
        <View style={styles.choiceRow}>{(['male', 'female'] as const).map((value) => <Pressable key={value} onPress={() => setSex(value)} style={[styles.choice, sex === value && styles.choiceSelected]}><Text style={[styles.choiceText, sex === value && styles.choiceTextSelected]}>{value === 'male' ? 'Male' : 'Female'}</Text></Pressable>)}</View>
        <View style={styles.measureRow}><View style={styles.measureField}><Field label="Height (cm)" value={height} onChangeText={setHeight} placeholder="170" keyboardType="decimal-pad" /></View><View style={styles.measureField}><Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="65" keyboardType="decimal-pad" /></View></View>
        <PrimaryButton label="Complete profile" loading={loading} onPress={saveProfile} />
        <Text style={styles.privacyNote}>Your health information is private and protected.</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    </ScreenFrame>
  );
}

function HomeScreen({ onSignOut }: { onSignOut: () => void }) {
  async function signOut() { await supabase.auth.signOut(); onSignOut(); }
  return <ScreenFrame><Image source={logo} style={styles.logoSmall} resizeMode="contain" /><Text style={styles.heading}>Your wellness journey starts here</Text><Text style={styles.copy}>Your Ayurnidaan home experience is ready to be built.</Text><SecondaryButton label="Sign out" onPress={signOut} /></ScreenFrame>;
}

function ScreenFrame({ children, scroll = false }: { children: React.ReactNode; scroll?: boolean }) {
  const content = <View style={styles.screenContent}>{children}</View>;
  return <SafeAreaView style={styles.safeArea}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{scroll ? <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</KeyboardAvoidingView></SafeAreaView>;
}
function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) { return <View><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#93A29D" style={styles.input} {...props} /></View>; }
function PrimaryButton({ label, loading, onPress }: { label: string; loading?: boolean; onPress: () => void }) { return <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{label}</Text>}</Pressable>; }
function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryButtonText}>{label}</Text></Pressable>; }
function extractAuthParams(url: string) { const fragment = url.split('#')[1] ?? url.split('?')[1] ?? ''; return Object.fromEntries(new URLSearchParams(fragment)); }

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: colors.background }, scrollContent: { flexGrow: 1 },
  screenContent: { flex: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 32 },
  brandSplash: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }, brandBlock: { alignItems: 'center', paddingHorizontal: 28 },
  logoLarge: { width: 230, height: 150 }, logoSmall: { width: 150, height: 96, alignSelf: 'center', marginBottom: 12 },
  brandName: { color: colors.primary, fontSize: 36, fontWeight: '700', letterSpacing: 0.5, marginTop: 8 }, brandSubtitle: { color: colors.text, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: 8 },
  tapHint: { color: colors.muted, fontSize: 13, marginTop: 34 },
  eyebrow: { color: colors.gold, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center', marginBottom: 8 }, heading: { color: colors.text, fontSize: 29, fontWeight: '700', lineHeight: 36, textAlign: 'center' },
  copy: { color: colors.muted, fontSize: 15, lineHeight: 23, textAlign: 'center', marginTop: 10, marginBottom: 24 },
  card: { backgroundColor: colors.surface, borderColor: '#EEE8DA', borderRadius: 24, borderWidth: 1, gap: 14, padding: 20, shadowColor: '#17352E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 22, elevation: 3 },
  label: { color: colors.text, fontSize: 13, fontWeight: '600', marginBottom: 7 }, input: { backgroundColor: '#FBFCFB', borderColor: colors.border, borderRadius: 14, borderWidth: 1, color: colors.text, fontSize: 16, minHeight: 52, paddingHorizontal: 15 },
  otpInput: { fontSize: 26, fontWeight: '700', letterSpacing: 10, textAlign: 'center' }, primaryButton: { alignItems: 'center', backgroundColor: colors.primary, borderRadius: 14, justifyContent: 'center', minHeight: 52, paddingHorizontal: 18 }, primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  secondaryButton: { alignItems: 'center', backgroundColor: '#FFFFFF', borderColor: colors.primary, borderRadius: 14, borderWidth: 1.5, justifyContent: 'center', minHeight: 52, paddingHorizontal: 18 }, secondaryButtonText: { color: colors.primary, fontSize: 16, fontWeight: '700' }, pressed: { opacity: 0.76 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 10 }, divider: { backgroundColor: colors.border, flex: 1, height: 1 }, dividerText: { color: colors.muted, fontSize: 11, fontWeight: '700' }, inlineRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 }, muted: { color: colors.muted, fontSize: 14 }, link: { color: colors.primary, fontWeight: '700' }, error: { color: colors.error, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  backButton: { alignSelf: 'flex-start', marginBottom: 22, paddingVertical: 5 }, backButtonText: { color: colors.primary, fontSize: 16, fontWeight: '700' }, checkRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 11 }, checkbox: { alignItems: 'center', borderColor: colors.border, borderRadius: 6, borderWidth: 1.5, height: 23, justifyContent: 'center', marginTop: 1, width: 23 }, checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary }, checkmark: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' }, terms: { color: colors.muted, flex: 1, fontSize: 13, lineHeight: 20 },
  choiceRow: { flexDirection: 'row', gap: 10 }, choice: { alignItems: 'center', borderColor: colors.border, borderRadius: 14, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 50 }, choiceSelected: { backgroundColor: colors.primary, borderColor: colors.primary }, choiceText: { color: colors.text, fontSize: 15, fontWeight: '600' }, choiceTextSelected: { color: '#FFFFFF' }, measureRow: { flexDirection: 'row', gap: 12 }, measureField: { flex: 1 }, privacyNote: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  policyDisclosure: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
