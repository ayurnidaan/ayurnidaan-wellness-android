import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Dimensions, Image, KeyboardAvoidingView, Modal, Platform, Pressable, SafeAreaView, ScrollView, StatusBar as NativeStatusBar, StyleSheet, Text, TextInput, View, type ImageSourcePropType, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as ImagePicker from 'expo-image-picker';
import { FunctionsHttpError, type Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';

WebBrowser.maybeCompleteAuthSession();
type Screen = 'splash' | 'intro' | 'auth' | 'account' | 'profile' | 'terms' | 'confirmation' | 'home' | 'prakriti' | 'currentHealth' | 'food' | 'yoga' | 'doctor' | 'shop' | 'profileHub' | 'ai';
type Dosha = 'vata' | 'pitta' | 'kapha';
type AssessmentAnswer = 'A' | 'B' | 'C';
type AssessmentQuestion = { prompt: string; options: Record<AssessmentAnswer, string> };
type ValidationMode = 'prakriti' | 'vikriti';
const logo = require('./assets/ayurnidaan-logo.png');
const configuredValidationMode = process.env.EXPO_PUBLIC_VALIDATION_MODE;
const validationMode: ValidationMode | null = configuredValidationMode === 'prakriti' || configuredValidationMode === 'vikriti'
  ? configuredValidationMode
  : null;
let openAIFromSharedNavigation: (() => void) | undefined;
const assessmentQuestions: AssessmentQuestion[] = [
  { prompt: 'How would you describe your natural body build?', options: { A: 'Thin or lean, with visible joints', B: 'Medium and balanced', C: 'Broad, heavy or muscular' } },
  { prompt: 'How does your skin usually feel?', options: { A: 'Dry, rough or thin', B: 'Soft and warm; gets red or irritated easily', C: 'Thick, smooth, oily and cool' } },
  { prompt: 'What is your appetite usually like?', options: { A: 'Changes often and feels unpredictable', B: 'Strong; I get irritable if food is late', C: 'Slow and steady; I can skip a meal easily' } },
  { prompt: 'Which weather bothers you the most?', options: { A: 'Cold, dry and windy', B: 'Hot and humid', C: 'Cold and damp' } },
  { prompt: 'How much do you usually sweat?', options: { A: 'Very little', B: 'A lot, often with a strong smell', C: 'A moderate and steady amount' } },
  { prompt: 'What is your natural hair like?', options: { A: 'Dry, thin, frizzy or breaks easily', B: 'Fine and soft; turned grey early', C: 'Thick, oily, wavy and dense' } },
  { prompt: 'How would you describe your eyes?', options: { A: 'Small, dry or often moving', B: 'Medium, sharp and sensitive to bright light', C: 'Large, moist and calm' } },
  { prompt: 'What is your stamina usually like?', options: { A: 'Strong for a short time, then tired quickly', B: 'Moderate and focused', C: 'Slow to start, but lasts a long time' } },
  { prompt: 'How does your body usually recover?', options: { A: 'Slowly and unpredictably; small illnesses happen often', B: 'Quickly after treatment; swelling or heat is common', C: 'Illness starts slowly and I rarely get sick' } },
  { prompt: 'What is your sleep usually like?', options: { A: 'Light and easily disturbed', B: 'Sound but usually shorter', C: 'Deep and heavy; waking up is difficult' } },
  { prompt: 'How do you usually learn and remember?', options: { A: 'Learn quickly but also forget quickly', B: 'Remember details clearly and logically', C: 'Learn slowly but remember for a long time' } },
  { prompt: 'How do you usually make decisions?', options: { A: 'I decide quickly, then often change my mind', B: 'I decide fast and confidently', C: 'I take time, then stay firm' } },
  { prompt: 'How do you react under pressure?', options: { A: 'I become worried or restless', B: 'I become irritated or intense', C: 'I stay calm and steady' } },
  { prompt: 'How would you describe your voice and speaking style?', options: { A: 'Fast, changing tone; very talkative at times', B: 'Sharp, clear and confident', C: 'Slow, deep, steady and gentle' } },
  { prompt: 'What are your bones and joints like?', options: { A: 'Light bones with visible joints', B: 'Medium build', C: 'Thick, heavy and strong bones' } },
  { prompt: 'What is your natural skin tone?', options: { A: 'Dusky or brown', B: 'Reddish, copper or yellow', C: 'Fair, pale and even' } },
  { prompt: 'What are your nails usually like?', options: { A: 'Dry, rough and break easily', B: 'Soft, pink and grow quickly', C: 'Thick, smooth, shiny and grow slowly' } },
  { prompt: 'What are your teeth and gums naturally like?', options: { A: 'Uneven teeth, with gaps or some teeth sticking out', B: 'Medium teeth; yellowish, gums bleed easily', C: 'Large, strong, white teeth with firm gums' } },
  { prompt: 'How do you usually walk?', options: { A: 'Quick, light and sometimes uneven', B: 'Fast, purposeful and confident', C: 'Slow, steady and grounded' } },
  { prompt: 'How does your weight usually change?', options: { A: 'It is hard for me to gain weight', B: 'My weight stays steady easily', C: 'I gain weight easily and lose it slowly' } },
  { prompt: 'What were you like as a child?', options: { A: 'Thin, restless and ate little', B: 'Medium build, strong hunger and competitive', C: 'Well-built, calm and had a good appetite' } },
  { prompt: 'Which traits are common in your family?', options: { A: 'Lean build, quick nature and changing moods', B: 'Strong nature, early grey hair and ambition', C: 'Heavier build, calm nature and easy weight gain' } },
  { prompt: 'What are your bowel movements usually like?', options: { A: 'Irregular, dry or hard; constipation is common', B: 'Soft or loose and more frequent', C: 'Well-formed and regular' } },
  { prompt: 'How often do you feel thirsty?', options: { A: 'It changes and feels unpredictable', B: 'I feel very thirsty often', C: 'I feel little thirst and can go long without water' } },
  { prompt: 'Which tastes do you naturally prefer?', options: { A: 'Sweet, sour and salty', B: 'Sweet, bitter and dry tastes; less spicy or sour', C: 'Spicy, bitter and dry tastes' } },
];
const assessmentOptionImages = [
  { A: require('./assets/options/q01-a.webp'), B: require('./assets/options/q01-b.webp'), C: require('./assets/options/q01-c.webp') },
  { A: require('./assets/options/q02-a.webp'), B: require('./assets/options/q02-b.webp'), C: require('./assets/options/q02-c.webp') },
  { A: require('./assets/options/q03-a.webp'), B: require('./assets/options/q03-b.webp'), C: require('./assets/options/q03-c.webp') },
  { A: require('./assets/options/q04-a.webp'), B: require('./assets/options/q04-b.webp'), C: require('./assets/options/q04-c.webp') },
  { A: require('./assets/options/q05-a.webp'), B: require('./assets/options/q05-b.webp'), C: require('./assets/options/q05-c.webp') },
  { A: require('./assets/options/q06-a.webp'), B: require('./assets/options/q06-b.webp'), C: require('./assets/options/q06-c.webp') },
  { A: require('./assets/options/q07-a.webp'), B: require('./assets/options/q07-b.webp'), C: require('./assets/options/q07-c.webp') },
  { A: require('./assets/options/q08-a.webp'), B: require('./assets/options/q08-b.webp'), C: require('./assets/options/q08-c.webp') },
  { A: require('./assets/options/q09-a.webp'), B: require('./assets/options/q09-b.webp'), C: require('./assets/options/q09-c.webp') },
  { A: require('./assets/options/q10-a.webp'), B: require('./assets/options/q10-b.webp'), C: require('./assets/options/q10-c.webp') },
  { A: require('./assets/options/q11-a.webp'), B: require('./assets/options/q11-b.webp'), C: require('./assets/options/q11-c.webp') },
  { A: require('./assets/options/q12-a.webp'), B: require('./assets/options/q12-b.webp'), C: require('./assets/options/q12-c.webp') },
  { A: require('./assets/options/q13-a.webp'), B: require('./assets/options/q13-b.webp'), C: require('./assets/options/q13-c.webp') },
  { A: require('./assets/options/q14-a.webp'), B: require('./assets/options/q14-b.webp'), C: require('./assets/options/q14-c.webp') },
  { A: require('./assets/options/q15-a.webp'), B: require('./assets/options/q15-b.webp'), C: require('./assets/options/q15-c.webp') },
  { A: require('./assets/options/q16-a.webp'), B: require('./assets/options/q16-b.webp'), C: require('./assets/options/q16-c.webp') },
  { A: require('./assets/options/q17-a.webp'), B: require('./assets/options/q17-b.webp'), C: require('./assets/options/q17-c.webp') },
  { A: require('./assets/options/q18-a.webp'), B: require('./assets/options/q18-b.webp'), C: require('./assets/options/q18-c.webp') },
  { A: require('./assets/options/q19-a.webp'), B: require('./assets/options/q19-b.webp'), C: require('./assets/options/q19-c.webp') },
  { A: require('./assets/options/q20-a.webp'), B: require('./assets/options/q20-b.webp'), C: require('./assets/options/q20-c.webp') },
  { A: require('./assets/options/q21-a.webp'), B: require('./assets/options/q21-b.webp'), C: require('./assets/options/q21-c.webp') },
  { A: require('./assets/options/q22-a.webp'), B: require('./assets/options/q22-b.webp'), C: require('./assets/options/q22-c.webp') },
  { A: require('./assets/options/q23-a.webp'), B: require('./assets/options/q23-b.webp'), C: require('./assets/options/q23-c.webp') },
  { A: require('./assets/options/q24-a.webp'), B: require('./assets/options/q24-b.webp'), C: require('./assets/options/q24-c.webp') },
  { A: require('./assets/options/q25-a.webp'), B: require('./assets/options/q25-b.webp'), C: require('./assets/options/q25-c.webp') },
] as const;
const termsDocumentPages = [
  require('./assets/legal/terms-page-1.png'),
  require('./assets/legal/terms-page-2.png'),
  require('./assets/legal/terms-page-3.png'),
  require('./assets/legal/terms-page-4.png'),
  require('./assets/legal/terms-page-5.png'),
  require('./assets/legal/terms-page-6.png'),
] as const;
const termsDocumentPdf = require('./assets/legal/ayurnidaan-terms-privacy-v4.2.pdf');
export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [session, setSession] = useState<Session | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  openAIFromSharedNavigation = () => setScreen('ai');
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) await routeUser(data.session);
      if (active) setAuthChecked(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => { active = false; data.subscription.unsubscribe(); };
  }, []);
  async function routeUser(currentSession: Session) {
    const { data } = await supabase.from('profiles').select('full_name, mobile_number, date_of_birth, sex, height_cm, weight_kg, terms_accepted_at, profile_completed_at').eq('user_id', currentSession.user.id).maybeSingle();
    if (validationMode) {
      const hasDoctorDetails = Boolean(data?.profile_completed_at && data?.full_name?.trim() && data?.mobile_number?.trim());
      const hasValidationDetails = Boolean(data?.full_name?.trim() && data?.mobile_number?.trim());
      setScreen(hasDoctorDetails ? 'confirmation' : hasValidationDetails ? 'terms' : 'account');
      return;
    }
    const hasBasicDetails = Boolean(data?.full_name?.trim() && data?.date_of_birth && data?.sex && data?.height_cm && data?.weight_kg);
    setScreen(data?.profile_completed_at ? 'home' : hasBasicDetails ? 'terms' : data?.full_name?.trim() ? 'profile' : 'account');
  }
  async function finishSplash() { if (session) await routeUser(session); else setScreen('intro'); }
  async function authenticated(nextSession: Session) { setSession(nextSession); await routeUser(nextSession); }
  let content: React.ReactNode;
  if (!authChecked) content = <View style={styles.splash}><StatusBar style="light" /><ActivityIndicator color="#D2A33D" /></View>;
  else if (screen === 'splash') content = <BrandSplash onFinish={finishSplash} />;
  else if (screen === 'intro') content = <IntroScreen onContinue={() => setScreen('auth')} />;
  else if (screen === 'auth') content = <AuthScreen onBack={() => setScreen('intro')} onAuthenticated={authenticated} />;
  else if (screen === 'account') content = validationMode
    ? <ValidationAccountScreen session={session} onBack={() => setScreen('auth')} onComplete={() => setScreen('terms')} />
    : <AccountScreen session={session} onBack={() => setScreen('auth')} onComplete={() => setScreen('profile')} />;
  else if (screen === 'profile') content = <ProfileScreen session={session} onBack={() => setScreen('account')} onComplete={() => setScreen('terms')} />;
  else if (screen === 'terms') content = <TermsConsentScreen session={session} onBack={() => setScreen(validationMode ? 'account' : 'profile')} onComplete={() => setScreen('confirmation')} />;
  else if (screen === 'confirmation') content = <ConfirmationScreen session={session} mode={validationMode} onContinue={() => setScreen(validationMode === 'vikriti' ? 'currentHealth' : validationMode === 'prakriti' ? 'prakriti' : 'home')} />;
  else if (screen === 'prakriti') content = <PrakritiAssessment session={session} onExit={() => setScreen('home')} onNextAssessment={() => setScreen('currentHealth')} />;
  else if (screen === 'currentHealth') content = <CurrentHealthAssessment session={session} onExit={() => setScreen('home')} onReturnToStart={() => setScreen('confirmation')} />;
  else if (screen === 'food') content = <FoodScreen session={session} onExit={() => setScreen('home')} onOpenDoctor={() => setScreen('doctor')} onOpenShop={() => setScreen('shop')} onOpenProfile={() => setScreen('profileHub')} onOpenAI={() => setScreen('ai')} />;
  else if (screen === 'yoga') content = <YogaScreen session={session} onExit={() => setScreen('home')} onOpenDoctor={() => setScreen('doctor')} onOpenShop={() => setScreen('shop')} onOpenProfile={() => setScreen('profileHub')} onOpenAI={() => setScreen('ai')} />;
  else if (screen === 'doctor') content = <DoctorFlow session={session} onExit={() => setScreen('home')} onOpenShop={() => setScreen('shop')} onOpenProfile={() => setScreen('profileHub')} onOpenAI={() => setScreen('ai')} />;
  else if (screen === 'shop') content = <ShopFlow session={session} onExit={() => setScreen('home')} onOpenDoctor={() => setScreen('doctor')} onOpenProfile={() => setScreen('profileHub')} onOpenAI={() => setScreen('ai')} />;
  else if (screen === 'profileHub') content = <ProfileHub session={session} onExit={() => setScreen('home')} onOpenShop={() => setScreen('shop')} onOpenDoctor={() => setScreen('doctor')} onOpenAI={() => setScreen('ai')} onRetakePrakriti={() => setScreen('prakriti')} onRetakeVikriti={() => setScreen('currentHealth')} onLogout={async () => { await supabase.auth.signOut(); setSession(null); setScreen('intro'); }} />;
  else if (screen === 'ai') content = <AIChat onExit={() => setScreen('home')} onOpenShop={() => setScreen('shop')} onOpenDoctor={() => setScreen('doctor')} onOpenProfile={() => setScreen('profileHub')} />;
  else content = <HomeScreen session={session} onStartPrakriti={() => setScreen('prakriti')} onStartCurrentHealth={() => setScreen('currentHealth')} onOpenFood={() => setScreen('food')} onOpenYoga={() => setScreen('yoga')} onOpenDoctor={() => setScreen('doctor')} onOpenShop={() => setScreen('shop')} onOpenProfile={() => setScreen('profileHub')} onOpenAI={() => setScreen('ai')} />;

  const darkStatusBarBackground = screen === 'splash' || screen === 'confirmation' || screen === 'home' || screen === 'currentHealth' || screen === 'food' || screen === 'yoga' || screen === 'ai';
  return <View style={[styles.appViewport, darkStatusBarBackground ? styles.appViewportDark : styles.appViewportLight]}>{content}</View>;
}

function BrandSplash({ onFinish }: { onFinish: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    const timer = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(timer);
  }, [opacity]);
  function continueOnTap() {
    if (!ready || leaving) return;
    setLeaving(true);
    Animated.timing(opacity, { toValue: 0, duration: 350, useNativeDriver: true }).start(onFinish);
  }
  return <Pressable accessibilityRole="button" accessibilityLabel="Continue" disabled={!ready || leaving} onPress={continueOnTap} style={styles.splash}>
    <StatusBar style="light" /><View style={styles.splashCircleTop} /><View style={styles.splashCircleBottom} />
    <Animated.View style={[styles.splashContent, { opacity }]}>
      <View style={styles.splashLogoPanel}><Image source={logo} style={styles.splashLogo} resizeMode="contain" /></View>
      <Text style={styles.splashSubtitle}>AI-powered Ayurveda for{`\n`}personalised health</Text>
      {ready ? <Text style={styles.splashTap}>Tap anywhere to continue</Text> : null}
    </Animated.View>
  </Pressable>;
}

function IntroScreen({ onContinue }: { onContinue: () => void }) {
  return <ScreenFrame>
    <View style={styles.introTop}>
      <View style={styles.welcomeEmblem}><View style={styles.welcomeStem} /><View style={[styles.welcomeLeaf, styles.welcomeLeafLeft]} /><View style={[styles.welcomeLeaf, styles.welcomeLeafRight]} /><View style={styles.welcomeGround} /></View>
      <Text style={styles.introKicker}>WELCOME TO</Text><Text style={styles.introTitle}>Ayurnidaan</Text>
      <Text style={styles.introCopy}>Your personalised health journey{`\n`}begins here.</Text>
    </View>
    <View style={styles.introActions}><PrimaryButton label="Get started" onPress={onContinue} onboarding />
      <Pressable onPress={onContinue} style={styles.loginLink}><Text style={styles.muted}>Already have an account? <Text style={styles.link}>Log in</Text></Text></Pressable>
    </View>
  </ScreenFrame>;
}

function AuthScreen({ onBack, onAuthenticated }: { onBack: () => void; onAuthenticated: (session: Session) => Promise<void> }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  function comingSoon(method: string) { setError(''); setNotice(`${method} sign-in is coming soon. Please continue with Google for now.`); }
  async function signInWithGoogle() {
    setLoading(true); setError(''); setNotice('');
    const redirectTo = AuthSession.makeRedirectUri({ path: 'auth/callback' });
    const isWeb = Platform.OS === 'web';
    const webRedirectTo = isWeb && typeof window !== 'undefined' ? window.location.origin : redirectTo;
    const { data, error: startError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: webRedirectTo, skipBrowserRedirect: !isWeb } });
    if (startError || !data.url) { setLoading(false); return setError(startError?.message ?? 'Could not start Google sign-in.'); }
    if (isWeb) return;
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === 'success') {
      const params = extractAuthParams(result.url);
      if (params.access_token && params.refresh_token) {
        const { data: resultData, error: sessionError } = await supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token });
        if (sessionError) setError(sessionError.message);
        if (resultData.session) await onAuthenticated(resultData.session);
      }
    }
    setLoading(false);
  }
  return <ScreenFrame scroll alignTop>
    <BackButton onPress={onBack} onboarding /><Text style={styles.pageTitle}>Log in or sign up</Text>
    <Text style={styles.pageSubtitle}>Sign in once to begin the doctor validation assessment.</Text>
    <View style={[styles.socialRow, { marginTop: 34 }]}>
      <SocialButton symbol="G" label="Google" loading={loading} onPress={signInWithGoogle} />
    </View>
    {notice ? <Text style={styles.notice}>{notice}</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}
    <Text style={styles.policy}>You’ll review the Terms of Use and Privacy Policy during onboarding.</Text>
  </ScreenFrame>;
}

function AccountScreen({ session, onBack, onComplete }: { session: Session | null; onBack: () => void; onComplete: () => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function save() {
    if (!session?.user.id) return setError('Please sign in again.');
    if (!name.trim()) return setError('Enter your name to continue.');
    setLoading(true); setError('');
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    const { error: profileError } = await supabase.from('profiles').upsert({ user_id: session.user.id, full_name: name.trim() });
    setLoading(false); if (authError) return setError(authError.message); if (profileError) return setError(profileError.message); onComplete();
  }
  return <ScreenFrame scroll alignTop>
    <OnboardingProgress step={1} onBack={onBack} /><Text style={styles.pageTitle}>Tell us about you</Text><Text style={styles.pageSubtitle}>Let's start with your name.</Text>
    <View style={styles.form}><Field label="FULL NAME" value={name} onChangeText={setName} placeholder="Ananya" autoCapitalize="words" autoComplete="name" onboarding />
      <PrimaryButton label="Continue" loading={loading} onPress={save} onboarding />{error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  </ScreenFrame>;
}

function ValidationAccountScreen({ session, onBack, onComplete }: { session: Session | null; onBack: () => void; onComplete: () => void }) {
  const [name, setName] = useState(session?.user.user_metadata.full_name ?? ''); const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function save() {
    if (!session?.user.id) return setError('Please sign in again.');
    const normalizedMobile = mobile.replace(/\D/g, '');
    if (!name.trim() || normalizedMobile.length < 10) return setError('Enter your name and a valid mobile number.');
    setLoading(true); setError('');
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    const { error: profileError } = await supabase.from('profiles').upsert({ user_id: session.user.id, full_name: name.trim(), mobile_number: normalizedMobile });
    setLoading(false); if (authError) return setError(authError.message); if (profileError) return setError(profileError.message); onComplete();
  }
  return <ScreenFrame scroll alignTop>
    <OnboardingProgress step={1} onBack={onBack} /><Text style={styles.pageTitle}>Doctor details</Text><Text style={styles.pageSubtitle}>We’ll remember these details on this device.</Text>
    <View style={styles.form}><Field label="FULL NAME" value={name} onChangeText={setName} placeholder="Ananya" autoCapitalize="words" autoComplete="name" onboarding />
      <Field label="MOBILE NUMBER" value={mobile} onChangeText={setMobile} placeholder="98765 43210" keyboardType="phone-pad" autoComplete="tel" onboarding />
      <PrimaryButton label="Continue" loading={loading} onPress={save} onboarding />{error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  </ScreenFrame>;
}

function ProfileScreen({ session, onBack, onComplete }: { session: Session | null; onBack: () => void; onComplete: () => void }) {
  const [dob, setDob] = useState<Date | null>(null); const [showDobPicker, setShowDobPicker] = useState(false);
  const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [height, setHeight] = useState(''); const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function save() {
    if (!session?.user.id) return setError('Please sign in again.');
    const normalizedDob = dob ? localDateKey(dob) : null;
    if (!normalizedDob || !sex || !Number(height) || !Number(weight)) return setError('Complete every field and select your date of birth.');
    setLoading(true); setError('');
    const { error: saveError } = await supabase.from('profiles').upsert({ user_id: session.user.id, full_name: session.user.user_metadata.full_name ?? null, date_of_birth: normalizedDob, sex, height_cm: Number(height), weight_kg: Number(weight) });
    setLoading(false); if (saveError) return setError(saveError.message); onComplete();
  }
  return <ScreenFrame scroll alignTop>
    <OnboardingProgress step={2} onBack={onBack} /><Text style={styles.pageTitle}>Basic profile</Text><Text style={styles.pageSubtitle}>A few details so guidance fits you.</Text>
    <View style={styles.form}><View><Text style={styles.onboardingLabel}>DATE OF BIRTH</Text><Pressable accessibilityLabel="Select date of birth" accessibilityRole="button" onPress={() => setShowDobPicker(true)} style={styles.dobInput}><Text style={[styles.dobInputText, !dob && styles.dobPlaceholder]}>{dob ? formatDateOfBirth(dob) : 'DD / MM / YYYY'}</Text><Text style={styles.dobCalendarIcon}>▦</Text></Pressable></View>
      <Text style={styles.onboardingLabel}>SEX</Text><View style={styles.choiceRow}>{(['male', 'female'] as const).map(value => <Pressable key={value} onPress={() => setSex(value)} style={[styles.choice, sex === value && styles.choiceSelected]}><Text style={[styles.choiceText, sex === value && styles.choiceTextSelected]}>{value === 'male' ? 'Male' : 'Female'}</Text></Pressable>)}</View>
      <View style={styles.measureRow}><View style={styles.measureField}><Field label="HEIGHT  ·  CM" value={height} onChangeText={setHeight} placeholder="175" keyboardType="decimal-pad" onboarding /></View><View style={styles.measureField}><Field label="WEIGHT  ·  KG" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="decimal-pad" onboarding /></View></View>
      <PrimaryButton label="Continue" loading={loading} onPress={save} onboarding /><Text style={styles.privacy}>Your health information is private and protected.</Text>{error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
    <DateOfBirthCalendar onClose={() => setShowDobPicker(false)} onSelect={(value) => { setDob(value); setShowDobPicker(false); }} value={dob} visible={showDobPicker} />
  </ScreenFrame>;
}

function TermsConsentScreen({ session, onBack, onComplete }: { session: Session | null; onBack: () => void; onComplete: () => void }) {
  const [documentRead, setDocumentRead] = useState(false);
  const [personalisationAccepted, setPersonalisationAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const ready = documentRead && personalisationAccepted && termsAccepted;
  function handleDocumentScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - 24) setDocumentRead(true);
  }
  async function finishConsent() {
    if (!ready || !session?.user.id) return;
    setSaving(true); setError('');
    const acceptedAt = new Date().toISOString();
    const { error: authError } = await supabase.auth.updateUser({ data: { terms_accepted_at: acceptedAt, personalisation_consent_at: acceptedAt } });
    const { error: profileError } = await supabase.from('profiles').upsert({ user_id: session.user.id, terms_accepted_at: acceptedAt, health_personalisation: true, profile_completed_at: acceptedAt });
    setSaving(false);
    if (authError) return setError(authError.message);
    if (profileError) return setError(profileError.message);
    onComplete();
  }
  return <SafeAreaView style={styles.termsSafe}><StatusBar style="dark" /><View style={styles.termsPage}><BackButton onPress={onBack} onboarding /><Text style={styles.termsTitle}>Terms &amp; consent</Text><Text style={styles.termsIntro}>Read the document below, then confirm both statements to finish setting up.</Text><View style={styles.termsDocumentCard} testID={`embedded-terms-pdf-${String(termsDocumentPdf)}`}><View style={styles.termsDocumentHeader}><View style={styles.termsPdfIcon}><Text style={styles.termsPdfIconText}>PDF</Text></View><View style={styles.termsDocumentHeaderCopy}><Text style={styles.termsDocumentName}>Terms of Use &amp; Privacy Policy</Text><Text style={styles.termsDocumentMeta}>v4.2 · 6 pages · Sep 2026</Text></View><Text style={[styles.termsScrollHint, documentRead && styles.termsScrollHintRead]}>{documentRead ? 'Read' : 'Scroll to read'}</Text></View><ScrollView accessibilityLabel="Terms of Use and Privacy Policy document" nestedScrollEnabled onScroll={handleDocumentScroll} scrollEventThrottle={32} showsVerticalScrollIndicator style={styles.termsDocumentScroll}><View style={styles.termsDocumentPages}>{termsDocumentPages.map((page, index) => <Image key={index} source={page} resizeMode="contain" style={styles.termsDocumentPage} />)}<Text style={styles.termsDocumentEnd}>END OF DOCUMENT</Text></View></ScrollView></View><ConsentRow disabled={!documentRead} checked={personalisationAccepted} label="I allow my personal data to be used for personalization and recommendations." onPress={() => setPersonalisationAccepted(value => !value)} /><ConsentRow disabled={!documentRead} checked={termsAccepted} label="I have read and agree to the terms and conditions." onPress={() => setTermsAccepted(value => !value)} />{!documentRead ? <Text style={styles.termsLockedHint}>Scroll to the end of the document to enable consent.</Text> : null}{error ? <Text style={styles.termsError}>{error}</Text> : null}</View><View style={styles.termsFooter}><Pressable accessibilityRole="button" disabled={!ready || saving} onPress={finishConsent} style={[styles.termsContinue, ready && styles.termsContinueReady]}>{saving ? <ActivityIndicator color="#FFF" /> : <Text style={[styles.termsContinueText, ready && styles.termsContinueTextReady]}>{ready ? 'All set' : 'Continue'}</Text>}</Pressable></View></SafeAreaView>;
}

function ConsentRow({ disabled, checked, label, onPress }: { disabled: boolean; checked: boolean; label: string; onPress: () => void }) {
  return <Pressable accessibilityRole="checkbox" accessibilityState={{ checked, disabled }} disabled={disabled} onPress={onPress} style={[styles.termsConsentRow, disabled && styles.termsConsentRowDisabled]}><View style={[styles.termsCheckbox, checked && styles.termsCheckboxChecked]}>{checked ? <Text style={styles.termsCheckboxMark}>✓</Text> : null}</View><Text style={styles.termsConsentLabel}>{label}</Text></Pressable>;
}

function ConfirmationScreen({ session, mode, onContinue }: { session: Session | null; mode: ValidationMode | null; onContinue: () => void }) {
  const fullName = session?.user.user_metadata.full_name?.trim();
  const firstName = fullName?.split(/\s+/)[0] || 'there';
  return <SafeAreaView style={styles.welcomeSafe}><StatusBar style="light" />
    <View style={styles.confirmationContent}>
      <View style={styles.successCircle}><Text style={styles.successCheck}>✓</Text></View>
      <Text style={styles.confirmationTitle}>Welcome, {firstName}.</Text>
      <Text style={styles.confirmationCopy}>{mode
        ? `Help us clinically evaluate the significance of ${mode === 'vikriti' ? 'Vikriti' : 'Prakriti'} assessment.`
        : <>Two short assessments and Ayurnidaan{`\n`}can tailor food, yoga and treatment{`\n`}to you.</>}</Text>
    </View>
    <View style={styles.confirmationAction}><Pressable onPress={onContinue} style={styles.homeButton}><Text style={styles.homeButtonText}>{mode ? 'Start assessment' : 'Go to home'}</Text></Pressable></View>
  </SafeAreaView>;
}

function PrakritiAssessment({ session, onExit, onNextAssessment }: { session: Session | null; onExit: () => void; onNextAssessment: () => void }) {
  const [stage, setStage] = useState<'intro' | 'questions' | 'result'>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(AssessmentAnswer | null)[]>(assessmentQuestions.map(() => null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const currentAnswer = answers[questionIndex];

  function chooseAnswer(answer: AssessmentAnswer) {
    setAnswers((values) => values.map((value, index) => index === questionIndex ? answer : value));
  }
  async function continueQuestion() {
    if (!currentAnswer) return;
    if (questionIndex !== assessmentQuestions.length - 1) return setQuestionIndex((value) => value + 1);
    if (!session?.user.id) return setSaveError('Please sign in again before saving your assessment.');
    setSaving(true); setSaveError('');
    const percentages = calculateDoshaPercentages(answers);
    const { data, error } = await supabase.from('prakriti_assessments').insert({
      user_id: session.user.id,
      vata_percentage: percentages.vata,
      pitta_percentage: percentages.pitta,
      kapha_percentage: percentages.kapha,
      answers: answers.map((answer, index) => ({ question_number: index + 1, answer })),
      question_count: answers.length,
    }).select('id').single();
    setSaving(false);
    if (error) return setSaveError(error.message);
    setAssessmentId(data.id);
    setStage('result');
  }
  function goBack() {
    if (questionIndex === 0) setStage('intro');
    else setQuestionIndex((value) => value - 1);
  }

  function restartAssessment() {
    setQuestionIndex(0);
    setAnswers(assessmentQuestions.map(() => null));
    setAssessmentId(null);
    setSaveError('');
    setStage('intro');
  }

  if (stage === 'intro') return <AssessmentIntro onBack={validationMode === 'prakriti' ? undefined : onExit} onStart={() => setStage('questions')} />;
  if (stage === 'result') return <AssessmentResult session={session} assessmentId={assessmentId} answers={answers} validation={validationMode === 'prakriti'} onNext={validationMode === 'prakriti' ? restartAssessment : onNextAssessment} onBackHome={onExit} />;
  const question = assessmentQuestions[questionIndex];
  const progress = ((questionIndex + 1) / assessmentQuestions.length) * 100;
  return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <View style={styles.questionPage}>
      <BackButton onPress={goBack} />
      <Text style={styles.assessmentPageTitle}>Prakriti Assessment</Text>
      <Text style={styles.questionCount}>Question {questionIndex + 1} of {assessmentQuestions.length}</Text>
      <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress}%` }]} /></View>
      <Text style={styles.questionPrompt}>{question.prompt}</Text>
      <View style={styles.answerList}>
        {(Object.entries(question.options) as [AssessmentAnswer, string][]).map(([key, label]) => {
          const selected = currentAnswer === key;
          return <Pressable key={key} accessibilityRole="radio" accessibilityState={{ selected }} onPress={() => chooseAnswer(key)} style={[styles.answerOption, selected && styles.answerOptionSelected]}>
            <Image source={assessmentOptionImages[questionIndex][key]} style={[styles.answerImage, styles.answerImageContained]} resizeMode="contain" />
            <View style={styles.answerTextWrap}><Text style={styles.answerLetter}>{key}</Text><Text style={styles.answerLabel}>{label}</Text></View>
            <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
          </Pressable>;
        })}
      </View>
      <View style={styles.questionActions}>
        <SecondaryButton label="Back" onPress={goBack} />
        <View style={styles.continueHalf}><PrimaryButton label={questionIndex === assessmentQuestions.length - 1 ? 'See Results' : 'Continue'} loading={saving} onPress={continueQuestion} /></View>
      </View>
      {!currentAnswer ? <Text style={styles.answerHint}>Select one option to continue</Text> : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
    </View>
  </SafeAreaView>;
}

function AssessmentIntro({ onBack, onStart }: { onBack?: () => void; onStart: () => void }) {
  return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <View style={styles.assessmentIntroPage}>
      {onBack ? <BackButton onPress={onBack} onboarding /> : null}
      <View style={styles.assessmentIntroContent}>
        <Text style={styles.assessmentIntroEyebrow}>ASSESSMENT 1 OF 2</Text>
        <Text style={styles.assessmentIntroTitle}>Understand your natural{`\n`}health pattern</Text>
        <Text style={styles.assessmentIntroCopy}>Prakriti is your mind–body constitution. It sets the baseline for your diet, yoga and lifestyle guidance.</Text>
        <View style={styles.assessmentFacts}>
          <AssessmentFact icon="01" text="25 questions" />
          <AssessmentFact icon="02" text="Takes about five minutes" />
          <AssessmentFact icon="03" text="Answer for your lifelong tendencies" />
        </View>
      </View>
      <PrimaryButton label="Start assessment" onPress={onStart} />
    </View>
  </SafeAreaView>;
}

function AssessmentFact({ icon, text, detail }: { icon: string; text: string; detail?: string }) {
  return <View style={styles.assessmentFact}><View style={styles.factIcon}><Text style={styles.factIconText}>{icon}</Text></View><View style={styles.factTextWrap}><Text style={styles.factText}>{text}</Text>{detail ? <Text style={styles.factDetail}>{detail}</Text> : null}</View></View>;
}

function AssessmentResult({ session, assessmentId, answers, validation, onNext, onBackHome }: { session: Session | null; assessmentId: string | null; answers: (AssessmentAnswer | null)[]; validation: boolean; onNext: () => void; onBackHome: () => void }) {
  const [rating, setRating] = useState(0); const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false); const [submitted, setSubmitted] = useState(false); const [reviewError, setReviewError] = useState('');
  const percentages = calculateDoshaPercentages(answers);
  const entries: { key: Dosha; label: string; color: string; value: number }[] = [
    { key: 'vata', label: 'Vata', color: '#438B68', value: percentages.vata },
    { key: 'pitta', label: 'Pitta', color: '#C9902F', value: percentages.pitta },
    { key: 'kapha', label: 'Kapha', color: '#91B096', value: percentages.kapha },
  ];
  const maxValue = Math.max(...entries.map((entry) => entry.value));
  const dominant = entries.filter((entry) => entry.value === maxValue).map((entry) => entry.label);
  const dominantLabel = `${dominant.join('–')} dominant`;
  const tendencies = getNaturalTendencies(dominant);
  async function submitReview() {
    if (!session?.user.id || !assessmentId) return setReviewError('Your saved assessment could not be found.');
    if (!rating) return setReviewError('Please select a rating from 1 to 5 stars.');
    if (!feedback.trim()) return setReviewError('Please write a short review of the assessment.');
    setSubmitting(true); setReviewError('');
    const { data: reviewer } = await supabase.from('profiles').select('full_name, mobile_number').eq('user_id', session.user.id).maybeSingle();
    const { error } = await supabase.from('prakriti_validation_test_takes').insert({
      assessment_id: assessmentId,
      reviewer_user_id: session.user.id,
      reviewer_name: reviewer?.full_name ?? session.user.user_metadata.full_name ?? null,
      reviewer_mobile: reviewer?.mobile_number ?? null,
      vata_percentage: percentages.vata,
      pitta_percentage: percentages.pitta,
      kapha_percentage: percentages.kapha,
      answers: answers.map((answer, index) => ({ question_number: index + 1, answer })),
      accuracy_rating: rating,
      feedback: feedback.trim(),
    });
    setSubmitting(false); if (error) return setReviewError(error.message); setSubmitted(true); setTimeout(onNext, 1000);
  }
  return <SafeAreaView style={styles.prakritiResultSafe}>
    <StatusBar style="dark" />
    <View style={styles.resultHeader}><Text style={styles.prakritiResultEyebrow}>YOUR RESULT</Text><Text style={styles.prakritiResultTitle}>{dominantLabel}</Text></View>
    <ScrollView style={styles.prakritiResultScroll} contentContainerStyle={styles.prakritiResultPage}>
      <View style={styles.chartRow}>
        <View style={styles.doshaChart}>
          {Array.from({ length: 100 }, (_, index) => {
            const color = index < percentages.vata
              ? entries[0].color
              : index < percentages.vata + percentages.pitta
                ? entries[1].color
                : entries[2].color;
            return <View key={index} style={[styles.chartSegment, { backgroundColor: color, transform: [{ rotate: `${index * 3.6}deg` }, { translateY: -42 }] }]} />;
          })}
          <View style={styles.chartCenter}><Text style={styles.chartCenterLabel}>{dominant[0]}</Text><Text style={styles.chartCenterValue}>{maxValue}%</Text></View>
        </View>
        <View style={styles.legend}>{entries.map((entry) => <View key={entry.key} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: entry.color }]} /><Text style={styles.legendName}>{entry.label}</Text><Text style={styles.legendValue}>{entry.value}%</Text></View>)}</View>
      </View>
      <View style={styles.resultMeaning}><Text style={styles.resultSectionLabel}>WHAT THIS MEANS</Text><Text style={styles.prakritiResultBody}>{getResultMeaning(dominant)}</Text><View style={styles.resultDivider} /><Text style={styles.resultSectionLabel}>NATURAL TENDENCIES</Text>{tendencies.map((tendency) => <View key={tendency} style={styles.tendencyRow}><View style={styles.tendencyDot} /><Text style={styles.tendency}>{tendency}</Text></View>)}</View>
      {validation ? <View style={styles.reviewCard}><Text style={styles.reviewTitle}>How Accurate was the Assessment?</Text>
        <View style={styles.starRow}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} star${value > 1 ? 's' : ''}`} onPress={() => setRating(value)}><Text style={[styles.star, value <= rating && styles.starSelected]}>★</Text></Pressable>)}</View>
        <TextInput value={feedback} onChangeText={setFeedback} editable={!submitted} multiline placeholder="Write your feedback here..." placeholderTextColor="#8A918B" style={styles.feedbackInput} />
        {reviewError ? <Text style={styles.error}>{reviewError}</Text> : null}
        {submitted ? <Text style={styles.reviewThanks}>Thank you. Your review has been saved.</Text> : <PrimaryButton label="Submit feedback" loading={submitting} onPress={submitReview} />}
      </View> : <><PrimaryButton label="Next assessment" onPress={onNext} /><Pressable onPress={onBackHome} style={styles.resultHomeLink}><Text style={styles.resultHomeLinkText}>Back to home</Text></Pressable></>}
    </ScrollView>
  </SafeAreaView>;
}

function calculateDoshaPercentages(answers: (AssessmentAnswer | null)[]): Record<Dosha, number> {
  const completed = answers.filter((answer): answer is AssessmentAnswer => answer !== null);
  const counts = { A: 0, B: 0, C: 0 };
  completed.forEach((answer) => counts[answer]++);
  if (!completed.length) return { vata: 0, pitta: 0, kapha: 0 };
  const raw = [counts.A, counts.B, counts.C].map((count) => count * 100 / completed.length);
  const rounded = raw.map(Math.floor);
  let remainder = 100 - rounded.reduce((sum, value) => sum + value, 0);
  raw.map((value, index) => ({ index, fraction: value - rounded[index] })).sort((a, b) => b.fraction - a.fraction).forEach(({ index }) => { if (remainder > 0) { rounded[index]++; remainder--; } });
  return { vata: rounded[0], pitta: rounded[1], kapha: rounded[2] };
}

function getResultMeaning(dominant: string[]) {
  if (dominant.length > 1) return `You show a balanced combination of ${dominant.join(' and ')} qualities. Your wellbeing benefits from supporting both influences.`;
  const meanings: Record<string, string> = {
    Vata: 'Your constitution reflects movement, creativity and adaptability. Steady routines and grounding habits help you stay in balance.',
    Pitta: 'Your constitution reflects focus, drive and transformation. Cooling, calming habits help you stay in balance.',
    Kapha: 'Your constitution reflects stability, strength and calm. Energizing variety and regular movement help you stay in balance.',
  };
  return meanings[dominant[0]];
}

function getNaturalTendencies(dominant: string[]) {
  if (dominant.length > 1) return [`A blend of ${dominant.join(' and ')} qualities`, 'Balance improves with a steady daily rhythm'];
  const tendencies: Record<string, string[]> = {
    Vata: ['Quick thinking and variable energy', 'Regular routines support steadiness'],
    Pitta: ['Sharp digestion and steady appetite', 'Heat and intensity build up under stress'],
    Kapha: ['Calm nature and lasting endurance', 'Movement and variety support energy'],
  };
  return tendencies[dominant[0]];
}

type PatientContext = { vataPercentage: number; pittaPercentage: number; kaphaPercentage: number; age: number | null; gender: 'male' | 'female' | 'other' | null; heightCm: number | null; weightKg: number | null };
type GunaRow = { symptom: string; gunas: string[]; doshas: VikritiDosha[] };
type VikritiAssessmentResult = { assessmentId: string; conclusion: string; doshas: VikritiDosha[]; symptoms: string[]; reasoning: string; conversation: ChatMessage[]; patientContext: PatientContext; gunaRows?: GunaRow[] };

function CurrentHealthAssessment({ session, onExit, onReturnToStart }: { session: Session | null; onExit: () => void; onReturnToStart: () => void }) {
  const [stage, setStage] = useState<'intro' | 'patient' | 'chat' | 'ready' | 'result'>(validationMode === 'vikriti' ? 'patient' : 'intro');
  const [validationResult, setValidationResult] = useState<VikritiAssessmentResult | null>(null);
  const [patientContext, setPatientContext] = useState<PatientContext | null>(null);
  const [contextLoading, setContextLoading] = useState(validationMode !== 'vikriti');
  const [contextError, setContextError] = useState('');
  async function loadAppPatientContext() {
    if (validationMode === 'vikriti') return;
    if (!session?.user.id) { setContextLoading(false); setContextError('Please sign in again before starting the assessment.'); return; }
    setContextLoading(true); setContextError('');
    const [profileResult, prakritiResult] = await Promise.all([
      supabase.from('profiles').select('date_of_birth, sex, height_cm, weight_kg').eq('user_id', session.user.id).maybeSingle(),
      supabase.from('prakriti_assessments').select('vata_percentage, pitta_percentage, kapha_percentage').eq('user_id', session.user.id).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
    ]);
    setContextLoading(false);
    if (profileResult.error || prakritiResult.error) { setContextError(profileResult.error?.message || prakritiResult.error?.message || 'Could not load your assessment profile.'); return; }
    if (!prakritiResult.data) { setContextError('Complete your Prakriti assessment before starting the current health assessment.'); return; }
    const profile = profileResult.data;
    setPatientContext({
      vataPercentage: Number(prakritiResult.data.vata_percentage),
      pittaPercentage: Number(prakritiResult.data.pitta_percentage),
      kaphaPercentage: Number(prakritiResult.data.kapha_percentage),
      age: profile?.date_of_birth ? ageFromDateOfBirth(profile.date_of_birth) : null,
      gender: profile?.sex === 'male' || profile?.sex === 'female' ? profile.sex : null,
      heightCm: profile?.height_cm == null ? null : Number(profile.height_cm),
      weightKg: profile?.weight_kg == null ? null : Number(profile.weight_kg),
    });
  }
  useEffect(() => { if (validationMode !== 'vikriti') void loadAppPatientContext(); }, [session?.user.id]);
  if (stage === 'intro') return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <View style={styles.assessmentIntroPage}>
      {validationMode !== 'vikriti' ? <BackButton onPress={onExit} onboarding /> : null}
      <View style={styles.assessmentIntroContent}>
        <Text style={styles.assessmentIntroEyebrow}>ASSESSMENT 2 OF 2</Text>
        <Text style={styles.assessmentIntroTitle}>How are you feeling right now?</Text>
        <Text style={styles.assessmentIntroCopy}>Prakriti is your baseline. This one reads your current state, so guidance can respond to what has changed.</Text>
        <View style={styles.assessmentFacts}>
          <AssessmentFact icon="01" text="Your current symptoms" />
          <AssessmentFact icon="02" text="Lifestyle and habits" />
          <AssessmentFact icon="03" text="Medications and conditions" />
        </View>
      </View>
      {contextError ? <Text style={styles.error}>{contextError}</Text> : null}<PrimaryButton label="Start assessment" loading={contextLoading} onPress={() => { if (patientContext) setStage('chat'); else void loadAppPatientContext(); }} />
    </View>
  </SafeAreaView>;
  if (stage === 'patient') return <VikritiPatientContextScreen onContinue={(context) => { setPatientContext(context); setStage('chat'); }} />;
  if (stage === 'result' && validationResult) return <VikritiValidationResult session={session} result={validationResult} onRetake={onReturnToStart} />;
  if (stage === 'ready') return <HealthProfileReady onContinue={onExit} />;
  return <CurrentHealthChat session={session} patientContext={patientContext} showBack={validationMode !== 'vikriti'} onBack={() => setStage('intro')} onComplete={(result) => { if (validationMode === 'vikriti') { setValidationResult(result); setStage('result'); } else setStage('ready'); }} />;
}

function VikritiPatientContextScreen({ onContinue }: { onContinue: (context: PatientContext) => void }) {
  const [vata, setVata] = useState(''); const [pitta, setPitta] = useState(''); const [kapha, setKapha] = useState('');
  const [age, setAge] = useState(''); const [gender, setGender] = useState<PatientContext['gender']>(null); const [height, setHeight] = useState(''); const [weight, setWeight] = useState('');
  const [error, setError] = useState('');
  function optionalNumber(value: string) { return value.trim() ? Number(value) : null; }
  function continueToChat() {
    const values = [Number(vata), Number(pitta), Number(kapha)];
    if (values.some(value => !Number.isFinite(value) || value < 0 || value > 100) || values.reduce((sum, value) => sum + value, 0) !== 100) return setError('Enter valid Vata, Pitta and Kapha percentages that total 100%.');
    const patientAge = optionalNumber(age); const patientHeight = optionalNumber(height); const patientWeight = optionalNumber(weight);
    if ((patientAge !== null && (patientAge < 0 || patientAge > 120)) || (patientHeight !== null && (patientHeight < 30 || patientHeight > 300)) || (patientWeight !== null && (patientWeight < 1 || patientWeight > 500))) return setError('Check the optional age, height and weight values.');
    onContinue({ vataPercentage: values[0], pittaPercentage: values[1], kaphaPercentage: values[2], age: patientAge, gender, heightCm: patientHeight, weightKg: patientWeight });
  }
  return <SafeAreaView style={styles.assessmentSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.patientContextPage} keyboardShouldPersistTaps="handled">
    <Text style={styles.assessmentPageTitle}>Patient Prakriti</Text><Text style={styles.patientContextCopy}>Enter the patient’s established Prakriti before assessing their current Vikriti.</Text>
    <Text style={styles.patientSectionLabel}>PRAKRITI PERCENTAGES · REQUIRED</Text>
    <View style={styles.percentageRow}><View style={styles.percentageField}><Field label="VATA %" value={vata} onChangeText={setVata} placeholder="34" keyboardType="decimal-pad" /></View><View style={styles.percentageField}><Field label="PITTA %" value={pitta} onChangeText={setPitta} placeholder="33" keyboardType="decimal-pad" /></View><View style={styles.percentageField}><Field label="KAPHA %" value={kapha} onChangeText={setKapha} placeholder="33" keyboardType="decimal-pad" /></View></View>
    <Text style={styles.patientSectionLabel}>PATIENT DETAILS · OPTIONAL</Text>
    <Field label="AGE" value={age} onChangeText={setAge} placeholder="42" keyboardType="number-pad" />
    <Text style={styles.label}>GENDER</Text><View style={styles.patientGenderRow}>{(['male', 'female', 'other'] as const).map(value => <Pressable key={value} onPress={() => setGender(gender === value ? null : value)} style={[styles.choice, gender === value && styles.choiceSelected]}><Text style={[styles.choiceText, gender === value && styles.choiceTextSelected]}>{value[0].toUpperCase() + value.slice(1)}</Text></Pressable>)}</View>
    <View style={styles.measureRow}><View style={styles.measureField}><Field label="HEIGHT · CM" value={height} onChangeText={setHeight} placeholder="170" keyboardType="decimal-pad" /></View><View style={styles.measureField}><Field label="WEIGHT · KG" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="decimal-pad" /></View></View>
    {error ? <Text style={styles.error}>{error}</Text> : null}<PrimaryButton label="Continue to Vikriti Assessment" onPress={continueToChat} />
  </ScrollView></SafeAreaView>;
}

type VikritiDosha = 'Vata' | 'Pitta' | 'Kapha';
type VikritiFinding = { dosha: VikritiDosha; symptoms: string[]; reasoning: string };
type VikritiPhase = 'complaint' | 'complaintFollowUp' | 'domain' | 'domainFollowUp' | 'final' | 'concluding';
type PendingVikritiRequest =
  | { kind: 'followUp'; previousQuestion: string; patientResponse: string; conversation: ChatMessage[]; nextPhase: 'complaintFollowUp' | 'domainFollowUp' }
  | { kind: 'final'; conversation: ChatMessage[] };

const currentHealthOpening = 'Please describe the main symptom, complaint, or health concern you are experiencing right now.';
const finalComplaintQuestion = 'Any other complaints?';
const currentHealthQuestionnaireVersion = 'VIKRITI_CORE_V1.0';
type CurrentHealthAnswer = { id: string; text: string };
type CurrentHealthDomainQuestion = { id: string; question: string; answers: CurrentHealthAnswer[] };
type StoredCurrentHealthAnswer = { answer_id: string; text: string };
const currentHealthDomainQuestions: CurrentHealthDomainQuestion[] = [
  {
    id: 'Q1',
    question: 'How has your appetite been over the last 7–14 days?',
    answers: [
      { id: 'APPETITE_VARIABLE', text: 'It varies a lot — sometimes I feel hungry, sometimes I do not.' },
      { id: 'APPETITE_STRONG', text: 'I feel very hungry or need to eat more frequently than usual.' },
      { id: 'APPETITE_LOW', text: 'My appetite is low, and I often do not feel like eating.' },
      { id: 'APPETITE_NORMAL', text: 'My appetite is normal and fairly regular.' },
    ],
  },
  {
    id: 'Q2',
    question: 'How do you usually feel after eating a regular meal?',
    answers: [
      { id: 'POSTMEAL_BLOATING', text: 'I often feel bloated, gassy, or my digestion feels unpredictable.' },
      { id: 'POSTMEAL_BURNING', text: 'I often feel burning, acidity, sourness, or excessive heat.' },
      { id: 'POSTMEAL_HEAVINESS', text: 'I often feel heavy, sluggish, overly full, or sleepy after eating.' },
      { id: 'POSTMEAL_NORMAL', text: 'I usually feel comfortable and digest my food well.' },
    ],
  },
  {
    id: 'Q3',
    question: 'Which option best describes your bowel movements recently?',
    answers: [
      { id: 'STOOL_DRY_HARD', text: 'Hard, dry, or difficult to pass; I may feel constipated.' },
      { id: 'STOOL_LOOSE_BURNING', text: 'Loose or more frequent than usual, sometimes with burning or urgency.' },
      { id: 'STOOL_STICKY_HEAVY', text: 'Sticky, heavy, or difficult to clean; I may feel incompletely emptied.' },
      { id: 'STOOL_NORMAL', text: 'Mostly regular, well-formed, and comfortable.' },
      { id: 'STOOL_VARIABLE', text: 'They vary considerably from day to day.' },
    ],
  },
  {
    id: 'Q4',
    question: 'Have you noticed any of these changes in your urination recently?',
    answers: [
      { id: 'URINE_REDUCED_IRREGULAR', text: 'Urination is reduced, irregular, or sometimes difficult.' },
      { id: 'URINE_DARK_BURNING', text: 'Urine is unusually dark yellow, or I experience burning while urinating.' },
      { id: 'URINE_FREQUENT_INCREASED', text: 'I need to urinate much more frequently or in larger amounts than usual.' },
      { id: 'URINE_NORMAL', text: 'My urination is normal and comfortable.' },
    ],
  },
  {
    id: 'Q5',
    question: 'How has your sweating been recently compared with what is normal for you?',
    answers: [
      { id: 'SWEAT_LOW_DRY', text: 'I sweat very little, and my skin often feels dry.' },
      { id: 'SWEAT_HIGH_HOT', text: 'I sweat more than usual, especially with a feeling of heat, burning, or strong body odour.' },
      { id: 'SWEAT_STICKY_HEAVY', text: 'My sweating often feels sticky or is associated with a heavy/oily feeling.' },
      { id: 'SWEAT_NORMAL', text: 'My sweating feels normal for me.' },
    ],
  },
  {
    id: 'Q6',
    question: 'How has your thirst been recently?',
    answers: [
      { id: 'THIRST_VARIABLE', text: 'It is irregular — sometimes I feel thirsty and sometimes I hardly notice thirst.' },
      { id: 'THIRST_HIGH', text: 'I feel unusually thirsty or need to drink frequently.' },
      { id: 'THIRST_LOW_HEAVY', text: 'I generally feel little thirst, especially when I also feel heavy or sluggish.' },
      { id: 'THIRST_NORMAL', text: 'My thirst is normal and consistent.' },
    ],
  },
  {
    id: 'Q7',
    question: 'Which option best describes your sleep over the last 7–14 days?',
    answers: [
      { id: 'SLEEP_LIGHT_DISTURBED', text: 'My sleep is light, irregular, or frequently disturbed.' },
      { id: 'SLEEP_LOW_HOT', text: 'I sleep less than usual and often feel hot, restless, or irritable.' },
      { id: 'SLEEP_EXCESS_HEAVY', text: 'I sleep for a long time or feel sleepy often, and still feel heavy or sluggish after waking.' },
      { id: 'SLEEP_NORMAL', text: 'My sleep is generally restful and normal for me.' },
    ],
  },
];

function parseVikritiFindings(value: unknown): VikritiFinding[] | null {
  if (!Array.isArray(value) || value.length > 3) return null;
  const findings: VikritiFinding[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const candidate = item as Record<string, unknown>;
    if (candidate.dosha !== 'Vata' && candidate.dosha !== 'Pitta' && candidate.dosha !== 'Kapha') return null;
    if (!Array.isArray(candidate.symptoms) || !candidate.symptoms.length || !candidate.symptoms.every(symptom => typeof symptom === 'string' && symptom.trim())) return null;
    if (typeof candidate.reasoning !== 'string' || !candidate.reasoning.trim()) return null;
    findings.push({ dosha: candidate.dosha, symptoms: candidate.symptoms.map(symptom => String(symptom).trim()), reasoning: candidate.reasoning.trim() });
  }
  return new Set(findings.map(finding => finding.dosha)).size === findings.length ? findings : null;
}

function parseGunaRows(value: unknown): GunaRow[] | null {
  if (!Array.isArray(value) || value.length > 40) return null;
  const rows: GunaRow[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') return null;
    const candidate = item as Record<string, unknown>;
    if (typeof candidate.symptom !== 'string' || !candidate.symptom.trim()) return null;
    if (!Array.isArray(candidate.gunas) || !candidate.gunas.length || !candidate.gunas.every(guna => typeof guna === 'string' && guna.trim())) return null;
    if (!Array.isArray(candidate.doshas) || !candidate.doshas.every(dosha => dosha === 'Vata' || dosha === 'Pitta' || dosha === 'Kapha')) return null;
    rows.push({ symptom: candidate.symptom.trim(), gunas: candidate.gunas.map(String), doshas: candidate.doshas as VikritiDosha[] });
  }
  return rows;
}

function getVikritiConclusion(doshas: VikritiDosha[]) {
  if (!doshas.length) return 'No clear Dosha imbalance was identified';
  if (doshas.length === 3) return 'All Doshas are equally imbalanced';
  const label = doshas.length === 1 ? doshas[0] : `${doshas.slice(0, -1).join(', ')} and ${doshas.at(-1)}`;
  return `Your ${label} ${doshas.length === 1 ? 'dosha is' : 'doshas are'} imbalanced`;
}

function CurrentHealthChat({ session, patientContext, showBack = true, onBack, onComplete }: { session: Session | null; patientContext: PatientContext | null; showBack?: boolean; onBack: () => void; onComplete: (result: VikritiAssessmentResult) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: currentHealthOpening }]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [phase, setPhase] = useState<VikritiPhase>('complaint');
  const [complaintFollowUpsAnswered, setComplaintFollowUpsAnswered] = useState(0);
  const [domainQuestionIndex, setDomainQuestionIndex] = useState(0);
  const [domainAnswers, setDomainAnswers] = useState<Record<string, StoredCurrentHealthAnswer>>({});
  const [pendingRequest, setPendingRequest] = useState<PendingVikritiRequest | null>(null);
  const [inputHeight, setInputHeight] = useState(44);
  const scrollRef = useRef<ScrollView>(null);

  function getFunctionErrorMessage(functionError: unknown, data: unknown) {
    if (functionError instanceof FunctionsHttpError) return functionError.context.json().then((details: { error?: string }) => details?.error ?? '').catch(() => '');
    return Promise.resolve(typeof data === 'object' && data && 'error' in data ? String((data as { error?: unknown }).error ?? '') : '');
  }

  async function requestFollowUp(request: Extract<PendingVikritiRequest, { kind: 'followUp' }>) {
    setSending(true); setError('');
    setPendingRequest(request);
    const openingHistory = request.nextPhase === 'complaintFollowUp' ? request.conversation : undefined;
    const { data, error: functionError } = await supabase.functions.invoke('current-health-chat', { body: { mode: 'follow_up', previousQuestion: request.previousQuestion, patientResponse: request.patientResponse, patientContext, messages: openingHistory } });
    const reply = typeof data?.reply === 'string' ? data.reply.trim().replace(/^"|"$/g, '') : '';
    const options = Array.isArray(data?.options) ? data.options.filter((option: unknown): option is string => typeof option === 'string' && option.trim().length > 0).slice(0, 3) : [];
    const functionMessage = await getFunctionErrorMessage(functionError, data);
    if (functionError || !reply || options.length !== 3) { setSending(false); setError(functionMessage || functionError?.message || 'Could not continue the assessment. Please try again.'); return; }
    setMessages([...request.conversation, { role: 'assistant', content: reply, options }]);
    setPhase(request.nextPhase); setPendingRequest(null); setSending(false);
  }

  async function requestConclusion(request: Extract<PendingVikritiRequest, { kind: 'final' }>) {
    setSending(true); setError(''); setPendingRequest(request); setPhase('concluding');
    const { data, error: functionError } = await supabase.functions.invoke('current-health-chat', { body: { mode: 'final', messages: request.conversation, patientContext, assessmentMethod: 'guna-v1' } });
    const findings = parseVikritiFindings(data?.assessment?.imbalanced_doshas);
    const functionMessage = await getFunctionErrorMessage(functionError, data);
    if (functionError || findings === null) { setSending(false); setError(functionMessage || functionError?.message || 'The assessment did not return a valid conclusion. Please try again.'); return; }
    const doshas = findings.map(finding => finding.dosha);
    const conclusion = getVikritiConclusion(doshas);
    const parsedGunaRows = parseGunaRows(data?.assessment?.symptom_gunas);
    const gunaRows: GunaRow[] | undefined = parsedGunaRows ?? undefined;
    if (!gunaRows || findings.length > 3) { setSending(false); setError('The assessment did not return the symptom–guna mapping. Please try again.'); return; }
    const symptoms = gunaRows ? gunaRows.map(row => row.symptom) : [...new Set(findings.flatMap(finding => finding.symptoms))];
    const reasoning = findings.length ? findings.map(finding => `${finding.dosha}: ${finding.reasoning}`).join(' ') : 'The available evidence was insufficient to support a Dosha imbalance.';
    const resultSummary = findings.length
      ? `${conclusion}\n${findings.map(finding => `${finding.dosha} symptoms: ${finding.symptoms.join(' | ')}\n${finding.dosha} reasoning: ${finding.reasoning}`).join('\n')}`
      : `${conclusion}\nReasoning: ${reasoning}`;
    const mappingSummary = gunaRows ? '\nSymptom | Gunas | Imbalanced Dosha\n' + gunaRows.map(row => `${row.symptom} | ${row.gunas.join(', ')} | ${row.doshas.join(', ')}`).join('\n') : '';
    const completedConversation: ChatMessage[] = [...request.conversation, { role: 'assistant', content: resultSummary + mappingSummary }];
    setMessages(completedConversation); setPendingRequest(null);
    if (!session?.user.id) { setSending(false); setError('Please sign in again before saving your assessment.'); return; }
    const { data: savedAssessment, error: saveError } = await supabase.from('current_health_assessments').insert({ user_id: session.user.id, symptoms, conclusion, vata_imbalanced: doshas.includes('Vata'), pitta_imbalanced: doshas.includes('Pitta'), kapha_imbalanced: doshas.includes('Kapha'), conversation: completedConversation, domain_answers: { questionnaire_version: currentHealthQuestionnaireVersion, responses: domainAnswers } }).select('id').single();
    if (saveError) { setSending(false); setError(saveError.message); return; }
    if (!validationMode) {
      const [{ error: foodPlanError }, { error: yogaPlanError }, { error: supplementPlanError }] = await Promise.all([
        supabase.functions.invoke('generate-food-plan', { body: { assessmentId: savedAssessment.id } }),
        supabase.functions.invoke('generate-yoga-plan', { body: { assessmentId: savedAssessment.id } }),
        supabase.functions.invoke('generate-supplement-recommendations', { body: { assessmentId: savedAssessment.id } }),
      ]);
      if (foodPlanError) console.warn('Food recommendation generation did not complete', foodPlanError.message);
      if (yogaPlanError) console.warn('Yoga recommendation generation did not complete', yogaPlanError.message);
      if (supplementPlanError) console.warn('Supplement recommendation generation did not complete', supplementPlanError.message);
    }
    if (!patientContext && validationMode === 'vikriti') { setSending(false); setError('Patient Prakriti details are missing. Please restart the assessment.'); return; }
    setSending(false);
    onComplete({ assessmentId: savedAssessment.id, conclusion, doshas, symptoms, reasoning: reasoning + mappingSummary, gunaRows, conversation: completedConversation, patientContext: patientContext ?? { vataPercentage: 0, pittaPercentage: 0, kaphaPercentage: 0, age: null, gender: null, heightCm: null, weightKg: null } });
  }

  function showDomainQuestion(index: number, conversation: ChatMessage[]) {
    const domainQuestion = currentHealthDomainQuestions[index];
    setDomainQuestionIndex(index); setPhase('domain');
    setMessages([...conversation, { role: 'assistant', content: domainQuestion.question, options: domainQuestion.answers.map(answer => answer.text) }]);
  }

  function sendAnswer(answer: string) {
    const content = answer.trim();
    if (!content || sending || pendingRequest) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content }];
    setInput(''); setInputHeight(44); setMessages(next);
    if (phase === 'complaint') { requestFollowUp({ kind: 'followUp', previousQuestion: currentHealthOpening, patientResponse: content, conversation: next, nextPhase: 'complaintFollowUp' }); return; }
    if (phase === 'complaintFollowUp') {
      const completedFollowUps = complaintFollowUpsAnswered + 1;
      setComplaintFollowUpsAnswered(completedFollowUps);
      const requiredFollowUps = 3;
      if (completedFollowUps < requiredFollowUps) {
        const previousQuestion = messages.at(-1)?.role === 'assistant' ? messages.at(-1)!.content : currentHealthOpening;
        requestFollowUp({ kind: 'followUp', previousQuestion, patientResponse: content, conversation: next, nextPhase: 'complaintFollowUp' });
      } else showDomainQuestion(0, next);
      return;
    }
    if (phase === 'domain') {
      const domainQuestion = currentHealthDomainQuestions[domainQuestionIndex];
      const selectedAnswer = domainQuestion.answers.find(option => option.text.toLowerCase() === content.toLowerCase());
      setDomainAnswers(current => ({ ...current, [domainQuestion.id]: { answer_id: selectedAnswer?.id ?? 'FREE_TEXT', text: selectedAnswer?.text ?? content } }));
      if (selectedAnswer?.id.endsWith('_NORMAL') || /^(normal|regular)[.!]?$/i.test(content)) {
        const nextIndex = domainQuestionIndex + 1;
        if (nextIndex < currentHealthDomainQuestions.length) showDomainQuestion(nextIndex, next);
        else { setPhase('final'); setMessages([...next, { role: 'assistant', content: finalComplaintQuestion }]); }
        return;
      }
      requestFollowUp({ kind: 'followUp', previousQuestion: domainQuestion.question, patientResponse: content, conversation: next, nextPhase: 'domainFollowUp' }); return;
    }
    if (phase === 'domainFollowUp') {
      const nextDomainIndex = domainQuestionIndex + 1;
      if (nextDomainIndex < currentHealthDomainQuestions.length) showDomainQuestion(nextDomainIndex, next);
      else { setPhase('final'); setMessages([...next, { role: 'assistant', content: finalComplaintQuestion }]); }
      return;
    }
    if (phase === 'final') requestConclusion({ kind: 'final', conversation: next });
  }
  function send() { sendAnswer(input); }
  function retry() {
    if (!pendingRequest) return;
    if (pendingRequest.kind === 'final') requestConclusion(pendingRequest);
    else requestFollowUp(pendingRequest);
  }
  const inputLocked = sending || pendingRequest !== null || phase === 'concluding';
  return <SafeAreaView style={styles.currentHealthChatSafe}><StatusBar style="light" /><KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={0}><View style={styles.currentHealthChatHeader}>{showBack ? <BackButton onPress={onBack} light /> : null}<View style={styles.currentHealthChatHeading}><Text style={styles.aiTitle}>Current Health Assessment</Text><Text style={styles.aiSubtitle}>A conversational Vikriti assessment</Text></View></View><ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.chatMessages} keyboardDismissMode="interactive" keyboardShouldPersistTaps="handled" onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>{messages.map((message, index) => <View key={index} style={[styles.chatMessageGroup, message.role === 'user' && styles.userMessageGroup]}><View style={[styles.chatBubble, styles.currentHealthMessageBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}><Text style={[styles.chatText, message.role === 'user' && styles.userChatText]}>{message.content}</Text></View>{message.role === 'assistant' && message.options?.length ? <View style={styles.answerSuggestionList}>{message.options.map(option => <Pressable key={option} disabled={inputLocked || index !== messages.length - 1} onPress={() => sendAnswer(option)} style={({ pressed }) => [styles.answerSuggestion, (inputLocked || index !== messages.length - 1) && styles.answerSuggestionDisabled, pressed && styles.pressed]}><Text style={styles.answerSuggestionText}>{option}</Text></Pressable>)}</View> : null}</View>)}{sending ? <View style={[styles.chatBubble, styles.assistantBubble]}><ActivityIndicator color="#075A3F" /></View> : null}{error ? <View style={styles.chatErrorCard}><Text style={styles.error}>{error}</Text><Pressable onPress={retry}><Text style={styles.chatRetry}>Try again</Text></Pressable></View> : null}</ScrollView><View style={styles.chatComposer}><TextInput value={input} onChangeText={setInput} editable={!inputLocked} multiline scrollEnabled={inputHeight >= 120} onFocus={() => requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }))} onContentSizeChange={(event) => { setInputHeight(Math.max(44, Math.min(120, event.nativeEvent.contentSize.height))); requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true })); }} placeholder="Describe how you are feeling..." placeholderTextColor="#929993" style={[styles.chatInput, styles.currentHealthChatInput, { height: inputHeight }]} /><Pressable disabled={inputLocked} onPress={send} style={[styles.chatSend, inputLocked && styles.chatSendDisabled]}><Text style={styles.chatSendText}>➤</Text></Pressable></View></KeyboardAvoidingView></SafeAreaView>;
}

function VikritiValidationResult({ session, result, onRetake }: { session: Session | null; result: VikritiAssessmentResult; onRetake: () => void }) {
  const [vikritiRating, setVikritiRating] = useState(0); const [vikritiComments, setVikritiComments] = useState('');
  const [foodRating, setFoodRating] = useState(0); const [foodComments, setFoodComments] = useState('');
  const [yogaRating, setYogaRating] = useState(0); const [yogaComments, setYogaComments] = useState('');
  const [supplementRating, setSupplementRating] = useState(0); const [supplementComments, setSupplementComments] = useState('');
  const [submitting, setSubmitting] = useState(false); const [submitted, setSubmitted] = useState(false); const [error, setError] = useState('');
  const [showFoodPlan, setShowFoodPlan] = useState(false); const [loadingFoodPlan, setLoadingFoodPlan] = useState(false);
  const [foodPlan, setFoodPlan] = useState<FoodPlanData | null>(null);
  const [showYogaPlan, setShowYogaPlan] = useState(false); const [loadingYogaPlan, setLoadingYogaPlan] = useState(false);
  const [yogaPlan, setYogaPlan] = useState<YogaPlanData | null>(null);
  const [showSupplementPlan, setShowSupplementPlan] = useState(false); const [loadingSupplementPlan, setLoadingSupplementPlan] = useState(false);
  const [supplementPlan, setSupplementPlan] = useState<SupplementPlanData | null>(null);
  async function getFunctionErrorMessage(functionError: unknown, data: unknown) {
    if (functionError instanceof FunctionsHttpError) return functionError.context.json().then((details: { error?: string }) => details?.error ?? '').catch(() => '');
    return typeof data === 'object' && data && 'error' in data ? String((data as { error?: unknown }).error ?? '') : '';
  }
  async function checkFoodRecommendations() {
    if (!session?.user.id) return setError('Please sign in again before checking food recommendations.');
    if (!vikritiRating) return setError('Please rate the Vikriti assessment from 1 to 5 stars.');
    if (!vikritiComments.trim()) return setError('Please write your comments about the Vikriti assessment.');
    setLoadingFoodPlan(true); setError('');
    const { data: existing } = await supabase.from('food_recommendation_plans').select('plan').eq('user_id', session.user.id).eq('current_health_assessment_id', result.assessmentId).maybeSingle();
    if (existing && isFoodPlanData(existing.plan)) {
      setFoodPlan(existing.plan); setShowFoodPlan(true); setLoadingFoodPlan(false); return;
    }
    const { data, error: functionError } = await supabase.functions.invoke('generate-food-plan', { body: { assessmentId: result.assessmentId, patientContext: result.patientContext } });
    const functionMessage = await getFunctionErrorMessage(functionError, data);
    if (functionError || !isFoodPlanData(data?.plan)) {
      setLoadingFoodPlan(false); setError(functionMessage || functionError?.message || 'Could not generate food recommendations. Please try again.'); return;
    }
    setFoodPlan(data.plan); setShowFoodPlan(true); setLoadingFoodPlan(false);
  }
  async function checkYogaRecommendations() {
    if (!session?.user.id) return setError('Please sign in again before checking yoga recommendations.');
    if (!foodRating) return setError('Please rate the food recommendations from 1 to 5 stars.');
    if (!foodComments.trim()) return setError('Please write your comments about the food recommendations.');
    setLoadingYogaPlan(true); setError('');
    const { data: existing } = await supabase.from('yoga_recommendation_plans').select('plan').eq('user_id', session.user.id).eq('current_health_assessment_id', result.assessmentId).maybeSingle();
    if (existing && isYogaPlanData(existing.plan)) {
      setYogaPlan(existing.plan); setShowYogaPlan(true); setLoadingYogaPlan(false); return;
    }
    const { data, error: functionError } = await supabase.functions.invoke('generate-yoga-plan', { body: { assessmentId: result.assessmentId, patientContext: result.patientContext } });
    const functionMessage = await getFunctionErrorMessage(functionError, data);
    if (functionError || !isYogaPlanData(data?.plan)) {
      setLoadingYogaPlan(false); setError(functionMessage || functionError?.message || 'Could not generate yoga recommendations. Please try again.'); return;
    }
    setYogaPlan(data.plan); setShowYogaPlan(true); setLoadingYogaPlan(false);
  }
  async function checkSupplementRecommendations() {
    if (!session?.user.id) return setError('Please sign in again before checking supplement recommendations.');
    if (!yogaRating) return setError('Please rate the yoga recommendations from 1 to 5 stars.');
    if (!yogaComments.trim()) return setError('Please write your comments about the yoga recommendations.');
    setLoadingSupplementPlan(true); setError('');
    const { data: existing } = await supabase.from('supplement_recommendation_plans').select('recommendations').eq('user_id', session.user.id).eq('current_health_assessment_id', result.assessmentId).maybeSingle();
    if (existing && isSupplementPlanData(existing.recommendations)) {
      setSupplementPlan(existing.recommendations); setShowSupplementPlan(true); setLoadingSupplementPlan(false); return;
    }
    const { data, error: functionError } = await supabase.functions.invoke('generate-supplement-recommendations', { body: { assessmentId: result.assessmentId, patientContext: result.patientContext } });
    const functionMessage = await getFunctionErrorMessage(functionError, data);
    if (functionError || !isSupplementPlanData(data)) {
      setLoadingSupplementPlan(false); setError(functionMessage || functionError?.message || 'Could not generate supplement recommendations. Please try again.'); return;
    }
    setSupplementPlan(data); setShowSupplementPlan(true); setLoadingSupplementPlan(false);
  }
  async function submitReview() {
    if (!session?.user.id) return setError('Please sign in again before saving this review.');
    if (!supplementRating) return setError('Please rate the supplement recommendations from 1 to 5 stars.');
    if (!supplementComments.trim()) return setError('Please write your comments about the supplement recommendations.');
    setSubmitting(true); setError('');
    const { data: reviewer } = await supabase.from('profiles').select('full_name, mobile_number').eq('user_id', session.user.id).maybeSingle();
    const { error: saveError } = await supabase.from('vikriti_validation_test_takes').insert({
      current_health_assessment_id: result.assessmentId,
      reviewer_user_id: session.user.id,
      reviewer_name: reviewer?.full_name ?? session.user.user_metadata.full_name ?? null,
      reviewer_mobile: reviewer?.mobile_number ?? null,
      prakriti_vata_percentage: result.patientContext.vataPercentage,
      prakriti_pitta_percentage: result.patientContext.pittaPercentage,
      prakriti_kapha_percentage: result.patientContext.kaphaPercentage,
      patient_age: result.patientContext.age,
      patient_gender: result.patientContext.gender,
      patient_height_cm: result.patientContext.heightCm,
      patient_weight_kg: result.patientContext.weightKg,
      conclusion: result.conclusion,
      vata_imbalanced: result.doshas.includes('Vata'),
      pitta_imbalanced: result.doshas.includes('Pitta'),
      kapha_imbalanced: result.doshas.includes('Kapha'),
      symptoms: result.symptoms,
      reasoning: result.reasoning,
      conversation: result.conversation,
      accuracy_rating: vikritiRating,
      comments: vikritiComments.trim(),
      food_recommendation_rating: foodRating,
      food_recommendation_comments: foodComments.trim(),
      yoga_recommendation_rating: yogaRating,
      yoga_recommendation_comments: yogaComments.trim(),
      supplement_recommendation_rating: supplementRating,
      supplement_recommendation_comments: supplementComments.trim(),
    });
    setSubmitting(false); if (saveError) return setError(saveError.message); setSubmitted(true);
  }
  if (!showFoodPlan || !foodPlan) return <SafeAreaView style={styles.assessmentSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.resultPage}>
    <Text style={styles.resultEyebrow}>YOUR VIKRITI RESULT</Text><Text style={styles.resultTitle}>Current Dosha Imbalance</Text>
    <View style={styles.vikritiResultCard}><Text style={styles.vikritiConclusion}>{result.conclusion}</Text>
      <View style={{ marginTop: 20, borderWidth: 1, borderColor: '#D9E2DA', borderRadius: 8, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', backgroundColor: '#E8F0EA', padding: 10 }}>
          {['Symptom', 'Gunas', 'Imbalanced dosha'].map((label, index) => <Text key={label} style={{ flex: index === 0 ? 1.4 : 1, fontWeight: '600', color: '#075A3F', paddingRight: 6 }}>{label}</Text>)}
        </View>
        {(result.gunaRows ?? []).map((row, index) => <View key={index} style={{ flexDirection: 'row', padding: 10, borderTopWidth: 1, borderColor: '#D9E2DA' }}>
          <Text style={{ flex: 1.4, paddingRight: 6, color: '#26352F' }}>{row.symptom}</Text>
          <Text style={{ flex: 1, paddingRight: 6, color: '#26352F' }}>{row.gunas.join(', ')}</Text>
          <Text style={{ flex: 1, color: '#26352F' }}>{row.doshas.join(', ')}</Text>
        </View>)}
      </View>
      {!result.gunaRows?.length ? <Text style={styles.resultBody}>No current symptoms with supported gunas were identified.</Text> : null}
    </View>
    <View style={styles.reviewCard}><Text style={styles.reviewTitle}>How Accurate was the Vikriti Assessment?</Text>
      <View style={styles.starRow}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} star${value > 1 ? 's' : ''} for the Vikriti assessment`} onPress={() => setVikritiRating(value)}><Text style={[styles.star, value <= vikritiRating && styles.starSelected]}>★</Text></Pressable>)}</View>
      <TextInput value={vikritiComments} onChangeText={setVikritiComments} multiline placeholder="Write your comments about the Vikriti assessment..." placeholderTextColor="#8A918B" style={styles.feedbackInput} />
    </View>
    {error ? <Text style={styles.error}>{error}</Text> : null}<PrimaryButton label="Check food recommendations" loading={loadingFoodPlan} onPress={checkFoodRecommendations} />
  </ScrollView></SafeAreaView>;
  if (!showYogaPlan || !yogaPlan) {
    const meals = ([['Morning', foodPlan.meals.morning], ['Midday', foodPlan.meals.midday], ['Evening', foodPlan.meals.evening]] as const).map(([title, meal]) => ({ title, ...meal }));
    return <SafeAreaView style={styles.assessmentSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={[styles.resultPage, styles.validationFoodPage]} showsVerticalScrollIndicator={false}>
      <Text style={styles.resultEyebrow}>PERSONALISED FOOD GUIDE</Text><Text style={styles.resultTitle}>Food Recommendations</Text><Text style={styles.validationFoodSubtitle}>{foodPacifyingLabel(result.conclusion)}</Text>
      <Text style={styles.foodSectionLabel}>TODAY’S MEALS</Text>
      <View style={styles.foodMealList}>{meals.map(meal => <View key={meal.title} style={styles.foodMealCard}><View style={styles.foodMealHeading}><Text style={styles.foodMealTitle}>{meal.title}</Text><Text style={styles.foodMealTime}>{meal.time}</Text></View><Text style={styles.foodMealCopy}>{meal.meal}</Text><View style={styles.foodMealTags}>{meal.tags.map((tag, index) => <View key={`${meal.title}-${tag}-${index}`} style={styles.foodMealTag}><Text style={styles.foodMealTagText}>{tag}</Text></View>)}</View></View>)}</View>
      <View style={styles.foodGuidanceRow}><View style={styles.foodGuidanceCard}><Text style={styles.foodGuidanceEyebrow}>FAVOUR</Text>{foodPlan.favour.map((item, index) => <View key={`${item}-${index}`} style={styles.foodGuidanceBulletRow}><Text style={styles.foodGuidanceBullet}>•</Text><Text style={styles.foodGuidanceItemText}>{item}</Text></View>)}</View><View style={styles.foodGuidanceCard}><Text style={[styles.foodGuidanceEyebrow, styles.foodLimitEyebrow]}>LIMIT</Text>{foodPlan.limit.map((item, index) => <View key={`${item}-${index}`} style={styles.foodGuidanceBulletRow}><Text style={[styles.foodGuidanceBullet, styles.foodLimitBullet]}>•</Text><Text style={styles.foodGuidanceItemText}>{item}</Text></View>)}</View></View>
      <View style={[styles.foodWhyCard, styles.validationFoodWhyCard]}><Text style={styles.foodWhyEyebrow}>WHY THIS PLAN</Text><Text style={styles.foodWhyCopy}>{foodPlan.why_this_plan}</Text></View>
      <View style={[styles.reviewCard, styles.validationFoodReviewCard]}><Text style={styles.reviewTitle}>How Accurate were the Food Recommendations?</Text>
        <View style={styles.starRow}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} star${value > 1 ? 's' : ''} for the food recommendations`} onPress={() => setFoodRating(value)}><Text style={[styles.star, value <= foodRating && styles.starSelected]}>★</Text></Pressable>)}</View>
        <TextInput value={foodComments} onChangeText={setFoodComments} multiline placeholder="Write your comments about the food recommendations..." placeholderTextColor="#8A918B" style={styles.feedbackInput} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Next: Yoga recommendations" loading={loadingYogaPlan} onPress={checkYogaRecommendations} />
      </View>
    </ScrollView></SafeAreaView>;
  }
  const selectedSession = yogaPlan.sessions[0];
  const totalMinutes = Number.parseInt(selectedSession.duration, 10) || selectedSession.practices.reduce((total, practice) => total + (Number.parseInt(practice.duration, 10) || 0), 0);
  if (!showSupplementPlan || !supplementPlan) return <SafeAreaView style={styles.assessmentSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={[styles.resultPage, styles.validationYogaPage]} showsVerticalScrollIndicator={false}>
      <Text style={styles.resultEyebrow}>PERSONALISED YOGA GUIDE</Text><Text style={styles.resultTitle}>Yoga Recommendations</Text><Text style={styles.validationYogaSubtitle}>{selectedSession.focus}</Text>
      <View style={styles.yogaSequenceHeading}><Text style={styles.yogaSequenceTitle}>Today’s sequence</Text><Text style={styles.yogaSequenceMeta}>{selectedSession.practices.length} poses · {totalMinutes} min</Text></View>
      <View style={styles.yogaPracticeList}>{selectedSession.practices.map((practice, index) => <View key={`${practice.yoga}-${index}`} style={styles.yogaPracticeRow}><View style={styles.yogaPracticeNumber}><Text style={styles.yogaPracticeNumberText}>{String(index + 1).padStart(2, '0')}</Text></View><View style={styles.yogaPracticeCopy}><Text style={styles.yogaPracticeName}>{practice.yoga}</Text><Text style={styles.yogaPracticeReason}>{practice.reasoning}</Text></View><Text style={styles.yogaPracticeDuration}>{shortYogaDuration(practice.duration)}</Text></View>)}</View>
      <View style={styles.yogaNoteCard}><Text style={styles.yogaNoteEyebrow}>PRACTICE NOTE</Text><Text style={styles.yogaNoteText}>{yogaPlan.why_this_plan}</Text></View>
      <View style={[styles.reviewCard, styles.validationYogaReviewCard]}><Text style={styles.reviewTitle}>How Accurate were the Yoga Recommendations?</Text>
        <View style={styles.starRow}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} star${value > 1 ? 's' : ''} for the yoga recommendations`} onPress={() => setYogaRating(value)}><Text style={[styles.star, value <= yogaRating && styles.starSelected]}>★</Text></Pressable>)}</View>
        <TextInput value={yogaComments} onChangeText={setYogaComments} multiline placeholder="Write your comments about the yoga recommendations..." placeholderTextColor="#8A918B" style={styles.feedbackInput} />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton label="Next: Supplement recommendations" loading={loadingSupplementPlan} onPress={checkSupplementRecommendations} />
      </View>
    </ScrollView></SafeAreaView>;
  return <SafeAreaView style={styles.assessmentSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={[styles.resultPage, styles.validationSupplementPage]} showsVerticalScrollIndicator={false}>
    <Text style={styles.resultEyebrow}>PERSONALISED SUPPLEMENT GUIDE</Text><Text style={styles.resultTitle}>Supplement Recommendations</Text><Text style={styles.validationSupplementSubtitle}>Selected for the patient’s current balance</Text>
    <View style={styles.supplementHeading}><Text style={styles.yogaSequenceTitle}>Recommended supplements</Text><Text style={styles.yogaSequenceMeta}>{supplementPlan.recommendations.length} selected</Text></View>
    <View style={styles.supplementList}>{supplementPlan.recommendations.map((recommendation, index) => <View key={`${recommendation.supplement}-${index}`} style={styles.supplementCard}>
      <View style={styles.supplementTitleRow}><View style={styles.yogaPracticeNumber}><Text style={styles.yogaPracticeNumberText}>{String(index + 1).padStart(2, '0')}</Text></View><View style={styles.supplementTitleCopy}><Text style={styles.supplementEyebrow}>SUPPLEMENT</Text><Text style={styles.supplementName}>{recommendation.supplement}</Text></View></View>
      <View style={styles.supplementReasonCard}><Text style={styles.yogaNoteEyebrow}>WHY THIS SUPPLEMENT</Text><Text style={styles.supplementReasonText}>{recommendation.reasoning}</Text></View>
    </View>)}</View>
    <View style={[styles.reviewCard, styles.validationSupplementReviewCard]}><Text style={styles.reviewTitle}>How Accurate were the Supplement Recommendations?</Text>
      <View style={styles.starRow}>{[1, 2, 3, 4, 5].map(value => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`${value} star${value > 1 ? 's' : ''} for the supplement recommendations`} disabled={submitted} onPress={() => setSupplementRating(value)}><Text style={[styles.star, value <= supplementRating && styles.starSelected]}>★</Text></Pressable>)}</View>
      <TextInput value={supplementComments} onChangeText={setSupplementComments} editable={!submitted} multiline placeholder="Write your comments about the supplement recommendations..." placeholderTextColor="#8A918B" style={styles.feedbackInput} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {submitted ? <><Text style={styles.reviewThanks}>Thank you. This test-take has been saved.</Text><PrimaryButton label="Return to Start Assessment" onPress={onRetake} /></> : <PrimaryButton label="Submit review" loading={submitting} onPress={submitReview} />}
    </View>
  </ScrollView></SafeAreaView>;
}

function CurrentHealthSummary({ symptoms, onContinue }: { symptoms: string[]; onContinue: () => void }) {
  const symptomSummary = symptoms.length ? symptoms.map((symptom) => symptom.replace(' / ', ', ')).join(', ') : 'None selected';
  return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <View style={styles.healthSummaryPage}>
      <View style={styles.summaryContent}>
        <Text style={styles.healthSummaryTitle}>Your Current Health{`\n`}Overview</Text>
        <View style={styles.summaryCard}>
          <SummaryRow label="Symptoms" value={symptomSummary} />
          <SummaryRow label="Lifestyle" value="Moderate Activity" />
          <SummaryRow label="Sleep" value={symptoms.includes('Poor Sleep') ? 'Irregular / Needs attention' : '6–7 hrs / Regular'} />
          <SummaryRow label="Stress" value="Moderate" last />
        </View>
      </View>
      <PrimaryButton label="Continue" onPress={onContinue} />
    </View>
  </SafeAreaView>;
}

function SummaryRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.summaryRow, last && styles.summaryRowLast]}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>;
}

function HealthProfileReady({ onContinue }: { onContinue: () => void }) {
  return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <View style={styles.healthReadyPage}>
      <View style={styles.healthReadyContent}>
        <View style={styles.readyIcon}><Text style={styles.readyIconCheck}>✓</Text></View>
        <Text style={styles.healthSummaryTitle}>Your Personalized{`\n`}Health Profile is Ready!</Text>
        <Text style={styles.readyCopy}>We have created your health profile using your information.</Text>
        <View style={styles.readyChecklist}>
          <ReadyItem label="Basic Profile" /><ReadyItem label="Prakriti Assessment" /><ReadyItem label="Current Health Assessment" />
        </View>
        <Text style={styles.readyFooter}>Let's unlock your personalized health experience.</Text>
      </View>
      <PrimaryButton label="Go to Home" onPress={onContinue} />
    </View>
  </SafeAreaView>;
}

function ReadyItem({ label }: { label: string }) {
  return <View style={styles.readyItem}><View style={styles.readyCheck}><Text style={styles.readyCheckText}>✓</Text></View><Text style={styles.readyLabel}>{label}</Text></View>;
}

function MeditationArt() {
  return <View style={styles.meditationArt}><View style={styles.meditationHalo} /><View style={styles.meditationHead} /><View style={styles.meditationBody} /><View style={styles.meditationArms} /><View style={styles.meditationLegs} /><View style={[styles.meditationLeaf, styles.meditationLeafLeft]} /><View style={[styles.meditationLeaf, styles.meditationLeafRight]} /></View>;
}

function HomeScreen({ session, onStartPrakriti, onStartCurrentHealth, onOpenFood, onOpenYoga, onOpenDoctor, onOpenShop, onOpenProfile, onOpenAI }: { session: Session | null; onStartPrakriti: () => void; onStartCurrentHealth: () => void; onOpenFood: () => void; onOpenYoga: () => void; onOpenDoctor: () => void; onOpenShop: () => void; onOpenProfile: () => void; onOpenAI: () => void }) {
  const fullName = session?.user.user_metadata.full_name?.trim();
  const firstName = fullName?.split(/\s+/)[0] || 'there';
  const [latestPrakriti, setLatestPrakriti] = useState<Record<Dosha, number> | null>(null);
  const [hasCurrentHealth, setHasCurrentHealth] = useState(false);
  const [latestVikriti, setLatestVikriti] = useState<string | null>(null);
  const [appointment, setAppointment] = useState<{ doctor_name: string; doctor_initials: string; appointment_date: string; appointment_time: string } | null>(null);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>(products);
  useEffect(() => {
    if (!session?.user.id) return;
    let active = true;
    Promise.all([
      supabase.from('prakriti_assessments').select('vata_percentage, pitta_percentage, kapha_percentage').eq('user_id', session.user.id).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('current_health_assessments').select('id, conclusion').eq('user_id', session.user.id).order('completed_at', { ascending: false }).limit(1),
      supabase.from('appointments').select('doctor_name, doctor_initials, appointment_date, appointment_time').eq('user_id', session.user.id).eq('status', 'booked').order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('shop_products').select('id, name, weight, price, mrp, icon, categories, tags, description, rating, rating_count').eq('active', true).order('sort_order').limit(100),
      supabase.from('supplement_recommendation_plans').select('recommendations').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]).then(([prakritiResult, healthResult, appointmentResult, productResult, recommendationResult]) => {
      if (!active) return;
      const result = prakritiResult.data;
      setLatestPrakriti(result ? { vata: result.vata_percentage, pitta: result.pitta_percentage, kapha: result.kapha_percentage } : null);
      setHasCurrentHealth(Boolean(healthResult.data?.length));
      setLatestVikriti(healthResult.data?.[0]?.conclusion ?? null);
      setAppointment(appointmentResult.data ?? null);
      if (productResult.data?.length) {
        const allProducts = productResult.data.map(item => ({ ...item, categories: item.categories ?? [], tags: item.tags ?? [], rating: `${Number(item.rating).toFixed(1)} (${item.rating_count})` }));
        const recommendationPlan = recommendationResult.data?.recommendations as { recommendations?: { supplement?: unknown }[] } | null | undefined;
        const names = Array.isArray(recommendationPlan?.recommendations) ? recommendationPlan.recommendations.flatMap(item => typeof item.supplement === 'string' ? [item.supplement] : []) : [];
        const personalized = names.flatMap(name => allProducts.find(product => product.name === name) ?? []);
        setRecommendedProducts(Array.isArray(recommendationPlan?.recommendations) ? personalized : allProducts.slice(0, 3));
      }
    });
    return () => { active = false; };
  }, [session?.user.id]);
  const hasPrakriti = Boolean(latestPrakriti);
  const assessmentsComplete = hasPrakriti && hasCurrentHealth;
  const dominantDosha = latestPrakriti ? (Object.entries(latestPrakriti).sort(([, a], [, b]) => b - a)[0][0] as Dosha) : null;
  const features = [
    { icon: '🥗', label: 'Food' }, { icon: '🧘', label: 'Yoga' },
    { icon: '◉', label: 'Pranayama' }, { icon: '◎', label: 'Panchakarma' },
    { icon: '♙', label: 'AI Assistant' }, { icon: '▣', label: 'Doctor' },
  ];
  const plans = [
    { icon: '🥣', title: 'Food', detail: 'Morning Dal Khichdi\nwith Curd' },
    { icon: '🧘', title: 'Yoga', detail: 'Pavanamuktasana\n(5 min)' },
    { icon: '◉', title: 'Pranayama', detail: 'Nadi Shodhana\n(5 min)' },
    { icon: '◷', title: 'Lifestyle', detail: 'Early Dinner\nBefore 8 PM' },
  ];
  if (assessmentsComplete && latestPrakriti && dominantDosha) return <CompletedHome firstName={firstName} percentages={latestPrakriti} dominantDosha={dominantDosha} vikritiConclusion={latestVikriti} appointment={appointment} recommendedProducts={recommendedProducts} onRetakePrakriti={onStartPrakriti} onUpdateHealth={onStartCurrentHealth} onOpenFood={onOpenFood} onOpenYoga={onOpenYoga} onOpenDoctor={onOpenDoctor} onOpenShop={onOpenShop} onOpenProfile={onOpenProfile} onOpenAI={onOpenAI} />;
  return <IncompleteHome firstName={firstName} hasPrakriti={hasPrakriti} onStartPrakriti={onStartPrakriti} onStartCurrentHealth={onStartCurrentHealth} onOpenFood={onOpenFood} onOpenYoga={onOpenYoga} onOpenDoctor={onOpenDoctor} onOpenShop={onOpenShop} onOpenProfile={onOpenProfile} onOpenAI={onOpenAI} />;
}

function IncompleteHome({ firstName, hasPrakriti, onStartPrakriti, onStartCurrentHealth, onOpenFood, onOpenYoga, onOpenDoctor, onOpenShop, onOpenProfile, onOpenAI }: { firstName: string; hasPrakriti: boolean; onStartPrakriti: () => void; onStartCurrentHealth: () => void; onOpenFood: () => void; onOpenYoga: () => void; onOpenDoctor: () => void; onOpenShop: () => void; onOpenProfile: () => void; onOpenAI: () => void }) {
  const initial = firstName.charAt(0).toUpperCase();
  const shortcuts = [
    { icon: '🍴', label: 'Food', onPress: onOpenFood },
    { icon: '𑁍', label: 'Yoga', onPress: onOpenYoga },
    { icon: '≋', label: 'Pranayama' },
    { icon: '♨', label: 'Panchakarma', onPress: onOpenDoctor },
    { icon: '♧', label: 'AI assistant', onPress: onOpenAI },
    { icon: '♧', label: 'Doctor', onPress: onOpenDoctor },
  ];
  return <SafeAreaView style={styles.homePreSafe}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.homePreScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.homePreHeader}><View><Text style={styles.homePreEyebrow}>GOOD MORNING</Text><Text style={styles.homePreName}>{firstName}</Text></View><Pressable accessibilityLabel="Open profile" onPress={onOpenProfile} style={styles.homePreAvatar}><Text style={styles.homePreAvatarText}>{initial}</Text></Pressable></View>
      <View style={styles.homePreBody}>
        <View style={styles.homeSetupCard}><Text style={styles.homeSetupEyebrow}>SET UP</Text><Text style={styles.homeSetupTitle}>Complete your assessments for{`\n`}personalised guidance</Text><View style={styles.homeSetupSteps}><HomeSetupStep number={hasPrakriti ? '✓' : '1'} active title="Prakriti assessment" copy={hasPrakriti ? 'Completed · tap to retake' : 'Your natural constitution'} onPress={hasPrakriti ? onStartPrakriti : undefined} /><HomeSetupStep number="2" active={hasPrakriti} title="Current health" copy="How you feel right now" /></View><Pressable onPress={hasPrakriti ? onStartCurrentHealth : onStartPrakriti} style={({ pressed }) => [styles.homeSetupButton, pressed && styles.pressed]}><Text style={styles.homeSetupButtonText}>{hasPrakriti ? 'Continue assessment' : 'Start now'}</Text></Pressable></View>
        <Text style={styles.homePreExploreLabel}>EXPLORE</Text><View style={styles.homePreGrid}>{shortcuts.map(shortcut => <Pressable key={shortcut.label} onPress={shortcut.onPress} style={({ pressed }) => [styles.homePreTile, pressed && styles.pressed]}><View style={styles.homePreTileIcon}><Text style={styles.homePreTileIconText}>{shortcut.icon}</Text></View><Text style={styles.homePreTileLabel}>{shortcut.label}</Text></Pressable>)}</View>
      </View>
    </ScrollView>
    <View style={styles.homePreBottomNav}><HomePreNav label="Home" active /><HomePreNav label="Doctor" onPress={onOpenDoctor} /><HomePreNav label="AI" onPress={onOpenAI} /><HomePreNav label="Shop" onPress={onOpenShop} /><HomePreNav label="Profile" onPress={onOpenProfile} /></View>
  </SafeAreaView>;
}

function HomeSetupStep({ number, active, title, copy, onPress }: { number: string; active: boolean; title: string; copy: string; onPress?: () => void }) {
  const content = <><View style={[styles.homeSetupNumber, active && styles.homeSetupNumberActive]}><Text style={[styles.homeSetupNumberText, active && styles.homeSetupNumberTextActive]}>{number}</Text></View><View style={styles.homeSetupStepCopy}><Text style={styles.homeSetupStepTitle}>{title}</Text><Text style={styles.homeSetupStepBody}>{copy}</Text></View></>;
  return onPress ? <Pressable onPress={onPress} style={styles.homeSetupStep}>{content}</Pressable> : <View style={styles.homeSetupStep}>{content}</View>;
}

const bottomNavIcons: Record<string, string> = { Home: '⌂', Doctor: '⚕', AI: '✧', Shop: '▢', Profile: '♙' };
function BottomBarItem({ label, active = false, onPress }: { label: string; active?: boolean; onPress?: () => void }) {
  const action = onPress ?? (label === 'AI' ? openAIFromSharedNavigation : undefined);
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={action} style={({ pressed }) => [styles.navItem, pressed && styles.navItemPressed]}>
    <View style={[styles.navIconPill, active && styles.navIconPillActive]}><Text style={[styles.navIconGlyph, active && styles.navIconGlyphActive]}>{bottomNavIcons[label] ?? '•'}</Text></View>
    <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
  </Pressable>;
}
function HomePreNav(props: { label: string; active?: boolean; onPress?: () => void }) { return <BottomBarItem {...props} />; }

type FoodTab = 'recommendations' | 'tracking';
type FoodPlanMeal = { time: string; meal: string; tags: string[] };
type FoodPlanData = { why_this_plan: string; meals: { morning: FoodPlanMeal; midday: FoodPlanMeal; evening: FoodPlanMeal }; favour: string[]; limit: string[] };
type FoodLogKey = keyof FoodPlanData['meals'];
type FoodNutrition = { calories: number; protein: number; fat: number };
type CustomFoodItem = FoodNutrition & { id: string; meal: FoodLogKey | 'snack'; name: string; servings: number };
type SupplementRecommendationData = { supplement: string; reasoning: string };
type SupplementPlanData = { recommendations: SupplementRecommendationData[] };
const fallbackFoodPlan: FoodPlanData = {
  why_this_plan: 'Pitta is elevated, so the plan leans cooling and lightly spiced, with meals kept to regular hours.',
  meals: {
    morning: { time: '7–9 AM', meal: 'Dal khichdi with curd, warm and lightly spiced', tags: ['Cooling', 'Easy to digest'] },
    midday: { time: '12–1 PM', meal: 'Rice, moong dal, lauki sabzi and a spoon of ghee', tags: ['Main meal', 'Low chilli'] },
    evening: { time: 'Before 8 PM', meal: 'Vegetable soup with one soft roti', tags: ['Light', 'Early'] },
  },
  favour: ['Gourds and cucumber', 'Moong dal and rice', 'Coriander and coconut', 'Sweet seasonal fruit'],
  limit: ['Very spicy foods', 'Deep-fried foods', 'Very sour pickles', 'Heavily salted foods'],
};
function isFoodPlanData(value: unknown): value is FoodPlanData { if (!value || typeof value !== 'object') return false; const plan = value as Record<string, unknown>; const meals = plan.meals && typeof plan.meals === 'object' ? plan.meals as Record<string, unknown> : null; return typeof plan.why_this_plan === 'string' && Boolean(meals) && ['morning', 'midday', 'evening'].every(key => { const meal = meals?.[key]; return Boolean(meal && typeof meal === 'object' && typeof (meal as Record<string, unknown>).time === 'string' && typeof (meal as Record<string, unknown>).meal === 'string' && Array.isArray((meal as Record<string, unknown>).tags)); }) && Array.isArray(plan.favour) && Array.isArray(plan.limit); }
function isSupplementPlanData(value: unknown): value is SupplementPlanData { if (!value || typeof value !== 'object') return false; const recommendations = (value as Record<string, unknown>).recommendations; return Array.isArray(recommendations) && recommendations.length > 0 && recommendations.every(item => Boolean(item && typeof item === 'object' && typeof (item as Record<string, unknown>).supplement === 'string' && typeof (item as Record<string, unknown>).reasoning === 'string')); }
function foodPacifyingLabel(vikruti: string) { const doshas = (['Vata', 'Pitta', 'Kapha'] as const).filter(dosha => vikruti.toLowerCase().includes(dosha.toLowerCase())); return `${(doshas.length ? doshas.join(' · ') : 'Balanced').toUpperCase()} PACIFYING`; }

function FoodScreen({ session, onExit, onOpenDoctor, onOpenShop, onOpenProfile, onOpenAI }: { session: Session | null; onExit: () => void; onOpenDoctor: () => void; onOpenShop: () => void; onOpenProfile: () => void; onOpenAI: () => void }) {
  const [tab, setTab] = useState<FoodTab>('recommendations');
  const [completed, setCompleted] = useState<Record<FoodLogKey, boolean>>({ morning: true, midday: false, evening: false });
  const [foodPlan, setFoodPlan] = useState<FoodPlanData>(fallbackFoodPlan);
  const [vikruti, setVikruti] = useState('Pitta');
  const [addingItem, setAddingItem] = useState(false);
  const [customItems, setCustomItems] = useState<CustomFoodItem[]>([]);
  useEffect(() => {
    if (!session?.user.id) return;
    let active = true;
    async function loadFoodPlan() {
      const { data } = await supabase.from('food_recommendation_plans').select('vikruti, plan').eq('user_id', session!.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!active) return;
      if (data && isFoodPlanData(data.plan)) { setFoodPlan(data.plan); if (typeof data.vikruti === 'string' && data.vikruti.trim()) setVikruti(data.vikruti); return; }
      const { data: assessment } = await supabase.from('current_health_assessments').select('id').eq('user_id', session!.user.id).order('completed_at', { ascending: false }).limit(1).maybeSingle();
      if (!assessment?.id || !active) return;
      const { data: generated } = await supabase.functions.invoke('generate-food-plan', { body: { assessmentId: assessment.id } });
      if (!active) return;
      if (isFoodPlanData(generated?.plan)) setFoodPlan(generated.plan);
      if (typeof generated?.vikruti === 'string' && generated.vikruti.trim()) setVikruti(generated.vikruti);
    }
    void loadFoodPlan();
    return () => { active = false; };
  }, [session?.user.id]);
  const completedCount = Object.values(completed).filter(Boolean).length;
  const percentage = Math.round(completedCount / 3 * 100);
  const toggleLog = (key: FoodLogKey) => setCompleted(current => ({ ...current, [key]: !current[key] }));
  if (addingItem) return <AddFoodItemScreen onBack={() => setAddingItem(false)} onSave={item => { setCustomItems(current => [...current, item]); setAddingItem(false); setTab('tracking'); }} />;
  return <SafeAreaView style={styles.foodSafe}>
    <StatusBar style="dark" />
    <View style={styles.foodHeader}>
      <View style={styles.foodTitleRow}><Pressable accessibilityLabel="Back to home" onPress={onExit} style={styles.foodBack}><Text style={styles.foodBackText}>‹</Text></Pressable><View><Text style={styles.foodEyebrow}>{foodPacifyingLabel(vikruti)}</Text><Text style={styles.foodTitle}>Food</Text></View></View>
      <View style={styles.foodTabs}><Pressable onPress={() => setTab('recommendations')} style={[styles.foodTab, tab === 'recommendations' && styles.foodTabActive]}><Text style={[styles.foodTabText, tab === 'recommendations' && styles.foodTabTextActive]}>Recommendations</Text></Pressable><Pressable onPress={() => setTab('tracking')} style={[styles.foodTab, tab === 'tracking' && styles.foodTabActive]}><Text style={[styles.foodTabText, tab === 'tracking' && styles.foodTabTextActive]}>Tracking</Text></Pressable></View>
    </View>
    {tab === 'recommendations'
      ? <FoodRecommendations plan={foodPlan} completed={completed} percentage={percentage} onToggle={toggleLog} />
      : <FoodTracking plan={foodPlan} completed={completed} customItems={customItems} onRemoveMeal={toggleLog} onRemoveCustom={id => setCustomItems(current => current.filter(item => item.id !== id))} onAddItem={() => setAddingItem(true)} />}
    <View style={styles.foodBottomNav}><HomePreNav label="Home" active onPress={onExit} /><HomePreNav label="Doctor" onPress={onOpenDoctor} /><HomePreNav label="AI" onPress={onOpenAI} /><HomePreNav label="Shop" onPress={onOpenShop} /><HomePreNav label="Profile" onPress={onOpenProfile} /></View>
  </SafeAreaView>;
}

function FoodRecommendations({ plan, completed, percentage, onToggle }: { plan: FoodPlanData; completed: Record<FoodLogKey, boolean>; percentage: number; onToggle: (key: FoodLogKey) => void }) {
  const meals = ([['morning', 'Morning', plan.meals.morning], ['midday', 'Midday', plan.meals.midday], ['evening', 'Evening', plan.meals.evening]] as const).map(([key, title, meal]) => ({ key, title, ...meal }));
  const openCount = 3 - Object.values(completed).filter(Boolean).length;
  return <ScrollView style={styles.foodBody} contentContainerStyle={styles.foodBodyContent} showsVerticalScrollIndicator={false}>
    <View style={styles.foodProgressCard}><FoodProgressRing percentage={percentage} /><View style={styles.foodProgressCopy}><Text style={styles.foodProgressTitle}>{openCount} {openCount === 1 ? 'meal' : 'meals'} still open</Text><Text style={styles.foodProgressBody}>Tick each meal as you eat it.{`\n`}Your weekly pattern shapes next{`\n`}week’s plan.</Text></View></View>
    <Text style={styles.foodSectionLabel}>TODAY’S MEALS</Text>
    <View style={styles.foodMealList}>{meals.map(meal => <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: completed[meal.key] }} key={meal.key} onPress={() => onToggle(meal.key)} style={[styles.foodMealCard, completed[meal.key] && styles.foodMealCardComplete]}><View style={styles.foodMealHeading}><View style={styles.foodMealHeadingLeft}><View style={[styles.foodMealCheck, completed[meal.key] && styles.foodMealCheckComplete]}>{completed[meal.key] ? <Text style={styles.foodMealCheckText}>✓</Text> : null}</View><Text style={styles.foodMealTitle}>{meal.title}</Text></View><Text style={styles.foodMealTime}>{meal.time}</Text></View><Text style={styles.foodMealCopy}>{meal.meal}</Text><View style={styles.foodMealTags}>{meal.tags.map(tag => <View key={tag} style={styles.foodMealTag}><Text style={styles.foodMealTagText}>{tag}</Text></View>)}</View></Pressable>)}</View>
    <View style={[styles.foodWhyCard, styles.foodWhyCardAfterMeals]}><Text style={styles.foodWhyEyebrow}>WHY THIS PLAN</Text><Text style={styles.foodWhyCopy}>{plan.why_this_plan}</Text></View>
    <View style={styles.foodGuidanceRow}><View style={styles.foodGuidanceCard}><Text style={styles.foodGuidanceEyebrow}>FAVOUR</Text>{plan.favour.map(item => <View key={item} style={styles.foodGuidanceBulletRow}><Text style={styles.foodGuidanceBullet}>•</Text><Text style={styles.foodGuidanceItemText}>{item}</Text></View>)}</View><View style={styles.foodGuidanceCard}><Text style={[styles.foodGuidanceEyebrow, styles.foodLimitEyebrow]}>LIMIT</Text>{plan.limit.map(item => <View key={item} style={styles.foodGuidanceBulletRow}><Text style={[styles.foodGuidanceBullet, styles.foodLimitBullet]}>•</Text><Text style={styles.foodGuidanceItemText}>{item}</Text></View>)}</View></View>
  </ScrollView>;
}

const mealNutrition: Record<FoodLogKey, FoodNutrition> = {
  morning: { calories: 418, protein: 18, fat: 12 },
  midday: { calories: 520, protein: 19, fat: 14 },
  evening: { calories: 360, protein: 10, fat: 8 },
};

function FoodTracking({ plan, completed, customItems, onRemoveMeal, onRemoveCustom, onAddItem }: { plan: FoodPlanData; completed: Record<FoodLogKey, boolean>; customItems: CustomFoodItem[]; onRemoveMeal: (key: FoodLogKey) => void; onRemoveCustom: (id: string) => void; onAddItem: () => void }) {
  const mealRows = (Object.keys(completed) as FoodLogKey[]).filter(key => completed[key]).map(key => ({ id: key, key, label: key === 'morning' ? 'MOR' : key === 'midday' ? 'MID' : 'EVE', name: plan.meals[key].meal, ...mealNutrition[key] }));
  const customRows = customItems.map(item => ({ id: item.id, key: null, label: item.meal === 'morning' ? 'MOR' : item.meal === 'midday' ? 'MID' : item.meal === 'evening' ? 'EVE' : 'SNK', name: item.name, calories: item.calories * item.servings, protein: item.protein * item.servings, fat: item.fat * item.servings }));
  const rows = [...mealRows, ...customRows];
  const totals = rows.reduce((sum, item) => ({ calories: sum.calories + item.calories, protein: sum.protein + item.protein, fat: sum.fat + item.fat }), { calories: 0, protein: 0, fat: 0 });
  return <ScrollView style={styles.foodBody} contentContainerStyle={styles.foodTrackingContent} showsVerticalScrollIndicator={false}>
    <View style={styles.foodMacroRow}><FoodMacroCard value={totals.calories} goal={1800} label="CALORIES" color="#43825F" /><FoodMacroCard value={totals.protein} goal={55} label="PROTEIN" color="#164D39" /><FoodMacroCard value={totals.fat} goal={45} label="FAT" color="#C89335" /></View>
    <View style={styles.foodSectionHeading}><Text style={styles.foodSectionLabel}>TODAY’S ITEMS</Text><Text style={styles.foodItemCount}>{rows.length} {rows.length === 1 ? 'item' : 'items'}</Text></View>
    <View style={styles.foodLogList}>{rows.map(row => <View key={row.id} style={styles.foodTrackedRow}><View style={styles.foodTrackedBadge}><Text style={styles.foodTrackedBadgeText}>{row.label}</Text></View><View style={styles.foodLogCopy}><Text numberOfLines={1} style={styles.foodTrackedName}>{row.name}</Text><Text style={styles.foodTrackedMeta}>{row.calories} kcal · P {row.protein}g · F {row.fat}g</Text></View><Pressable accessibilityLabel={`Remove ${row.name}`} onPress={() => row.key ? onRemoveMeal(row.key) : onRemoveCustom(row.id)} style={styles.foodRemoveButton}><Text style={styles.foodRemoveText}>×</Text></Pressable></View>)}</View>
    <Pressable onPress={onAddItem} style={({ pressed }) => [styles.foodAddItemButton, pressed && styles.pressed]}><Text style={styles.foodAddItemPlus}>＋</Text><Text style={styles.foodAddItemText}>Add an item</Text></Pressable>
    <Text style={styles.foodSectionLabel}>THIS WEEK</Text>
    <View style={styles.foodWeekCard}><View style={styles.foodBars}>{[72, 82, 56, 82, 52, 8, 7].map((height, index) => <View key={index} style={styles.foodBarColumn}><View style={[styles.foodBar, { height, backgroundColor: index === 2 || index === 4 ? '#C89335' : index > 4 ? '#E7E1D6' : '#43825F' }]} /><Text style={styles.foodBarLabel}>{['M','T','W','T','F','S','S'][index]}</Text></View>)}</View><View style={styles.foodWeekDivider} /><View style={styles.foodWeekSummary}><Text style={styles.foodWeekLabel}>Weekly adherence</Text><Text style={styles.foodWeekValue}>78%</Text></View></View>
  </ScrollView>;
}

function FoodMacroCard({ value, goal, label, color }: { value: number; goal: number; label: string; color: string }) {
  const percentage = Math.min(100, Math.round(value / goal * 100));
  return <View style={styles.foodMacroCard}><View style={styles.foodMacroRing}>{Array.from({ length: 32 }, (_, index) => <View key={index} style={[styles.foodMacroSegment, { backgroundColor: index < Math.round(32 * percentage / 100) ? color : '#E6E2D9', transform: [{ rotate: `${index * 11.25}deg` }, { translateY: -21 }] }]} />)}<View style={styles.foodMacroCenter}><Text style={styles.foodMacroValue}>{value}</Text></View></View><Text style={styles.foodMacroLabel}>{label}</Text><Text style={styles.foodMacroGoal}>of {goal}{label === 'CALORIES' ? '' : ' g'}</Text></View>;
}

function AddFoodItemScreen({ onBack, onSave }: { onBack: () => void; onSave: (item: CustomFoodItem) => void }) {
  const [meal, setMeal] = useState<CustomFoodItem['meal']>('midday');
  const [query, setQuery] = useState('curd');
  const [searched, setSearched] = useState(true);
  const [name, setName] = useState('Curd, plain');
  const [calories, setCalories] = useState('98');
  const [protein, setProtein] = useState('6');
  const [fat, setFat] = useState('5');
  const [servings, setServings] = useState(2);
  const parsed = { calories: Number(calories) || 0, protein: Number(protein) || 0, fat: Number(fat) || 0 };
  const mealOptions: { key: CustomFoodItem['meal']; label: string }[] = [{ key: 'morning', label: 'Morning' }, { key: 'midday', label: 'Midday' }, { key: 'evening', label: 'Evening' }, { key: 'snack', label: 'Snack' }];
  return <SafeAreaView style={styles.foodAddSafe}><StatusBar style="dark" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.foodAddScreen}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.foodAddContent} showsVerticalScrollIndicator={false}>
    <Pressable accessibilityLabel="Back to food tracking" onPress={onBack} style={styles.foodAddBack}><Text style={styles.foodAddBackText}>‹</Text></Pressable>
    <Text style={styles.foodAddTitle}>Add an item</Text><Text style={styles.foodAddSubtitle}>Pick a common food or enter the values yourself.</Text>
    <Text style={styles.foodAddLabel}>MEAL</Text><View style={styles.foodMealSelector}>{mealOptions.map(option => <Pressable key={option.key} onPress={() => setMeal(option.key)} style={[styles.foodMealOption, meal === option.key && styles.foodMealOptionActive]}><Text style={[styles.foodMealOptionText, meal === option.key && styles.foodMealOptionTextActive]}>{option.label}</Text></Pressable>)}</View>
    <Text style={styles.foodAddLabel}>SEARCH A FOOD</Text><View style={styles.foodSearchRow}><View style={styles.foodSearchInputWrap}><Text style={styles.foodSearchIcon}>⌕</Text><TextInput value={query} onChangeText={value => { setQuery(value); setSearched(false); }} placeholder="Search foods" placeholderTextColor="#9AA49F" style={styles.foodSearchInput} /><Pressable accessibilityLabel="Clear search" onPress={() => { setQuery(''); setSearched(false); }} style={styles.foodSearchClear}><Text style={styles.foodSearchClearText}>×</Text></Pressable></View><Pressable onPress={() => setSearched(Boolean(query.trim()))} style={styles.foodSearchButton}><Text style={styles.foodSearchButtonText}>Search</Text></Pressable></View>
    {searched ? <><Text style={styles.foodSearchResultCount}>1 result from the nutrient database</Text><Pressable onPress={() => setName('Curd, plain')} style={styles.foodSearchResult}><View><Text style={styles.foodSearchResultName}>Curd, plain</Text><Text style={styles.foodSearchResultServing}>1 katori · 150 g</Text></View><Text style={styles.foodSearchResultMeta}>98 kcal · 6P · 5F</Text></Pressable></> : null}
    <View style={styles.foodDetailsHeading}><Text style={styles.foodAddLabel}>DETAILS</Text><Text style={styles.foodDetailsAside}>From database · editable</Text></View><View style={styles.foodDetailsCard}><Text style={styles.foodFieldLabel}>Item</Text><TextInput value={name} onChangeText={setName} style={[styles.foodDetailInput, styles.foodDetailInputWide]} /><View style={styles.foodNutrientInputs}><FoodNumberField label="Calories" value={calories} onChange={setCalories} /><FoodNumberField label="Protein (g)" value={protein} onChange={setProtein} /><FoodNumberField label="Fat (g)" value={fat} onChange={setFat} /></View><View style={styles.foodServingRow}><Text style={styles.foodFieldLabel}>Servings</Text><View style={styles.foodServingControls}><Pressable accessibilityLabel="Decrease servings" onPress={() => setServings(value => Math.max(1, value - 1))} style={styles.foodServingButton}><Text style={styles.foodServingButtonText}>−</Text></Pressable><Text style={styles.foodServingValue}>{servings}</Text><Pressable accessibilityLabel="Increase servings" onPress={() => setServings(value => value + 1)} style={styles.foodServingButton}><Text style={styles.foodServingButtonText}>+</Text></Pressable></View></View></View>
    <View style={styles.foodAddsSummary}><Text style={styles.foodAddsSummaryLabel}>Adds to today</Text><Text style={styles.foodAddsSummaryValue}>{parsed.calories * servings} kcal · P {parsed.protein * servings}g · F {parsed.fat * servings}g</Text></View>
  </ScrollView><View style={styles.foodAddFooter}><Pressable disabled={!name.trim()} onPress={() => onSave({ id: `${Date.now()}`, meal, name: name.trim(), servings, ...parsed })} style={[styles.foodSaveButton, !name.trim() && styles.foodButtonDisabled]}><Text style={styles.foodSaveButtonText}>Save to today’s intake</Text></Pressable></View></KeyboardAvoidingView></SafeAreaView>;
}

function FoodNumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <View style={styles.foodNumberField}><Text style={styles.foodFieldLabel}>{label}</Text><TextInput keyboardType="numeric" value={value} onChangeText={onChange} style={styles.foodDetailInput} /></View>;
}

function FoodProgressRing({ percentage }: { percentage: number }) {
  const total = 40;
  const filled = Math.round(total * percentage / 100);
  return <View style={styles.foodRing}>{Array.from({ length: total }, (_, index) => <View key={index} style={[styles.foodRingSegment, { backgroundColor: index < filled ? '#43825F' : '#E6E2D9', transform: [{ rotate: `${index * 9}deg` }, { translateY: -29 }] }]} />)}<View style={styles.foodRingCenter}><Text style={styles.foodRingValue}>{percentage}%</Text><Text style={styles.foodRingToday}>TODAY</Text></View></View>;
}

type YogaPracticeData = { yoga: string; duration: string; reasoning: string };
type YogaSessionData = { day: number; duration: string; focus: string; practices: YogaPracticeData[] };
type YogaPlanData = { why_this_plan: string; sessions: YogaSessionData[] };
const bundledYogaPoseImages = [
  { name: 'Tadasana', file: '01-tadasana-mountain-pose.webp', source: require('./assets/yoga-realistic-clay-complete/01-tadasana-mountain-pose.webp') },
  { name: 'Vrikshasana', file: '02-vrikshasana-tree-pose.webp', source: require('./assets/yoga-realistic-clay-complete/02-vrikshasana-tree-pose.webp') },
  { name: 'Trikonasana', file: '03-trikonasana-triangle-pose.webp', source: require('./assets/yoga-realistic-clay-complete/03-trikonasana-triangle-pose.webp') },
  { name: 'Virabhadrasana I', file: '04-virabhadrasana-1-warrior-1.webp', source: require('./assets/yoga-realistic-clay-complete/04-virabhadrasana-1-warrior-1.webp') },
  { name: 'Virabhadrasana II', file: '05-virabhadrasana-2-warrior-2.webp', source: require('./assets/yoga-realistic-clay-complete/05-virabhadrasana-2-warrior-2.webp') },
  { name: 'Utkatasana', file: '06-utkatasana-chair-pose.webp', source: require('./assets/yoga-realistic-clay-complete/06-utkatasana-chair-pose.webp') },
  { name: 'Malasana', file: '07-malasana-garland-pose.webp', source: require('./assets/yoga-realistic-clay-complete/07-malasana-garland-pose.webp') },
  { name: 'Adho Mukha Svanasana', file: '08-adho-mukha-svanasana-downward-dog.webp', source: require('./assets/yoga-realistic-clay-complete/08-adho-mukha-svanasana-downward-dog.webp') },
  { name: 'Bhujangasana', file: '09-bhujangasana-cobra-pose.webp', source: require('./assets/yoga-realistic-clay-complete/09-bhujangasana-cobra-pose.webp') },
  { name: 'Salabhasana', file: '10-salabhasana-locust-pose.webp', source: require('./assets/yoga-realistic-clay-complete/10-salabhasana-locust-pose.webp') },
  { name: 'Setu Bandhasana', file: '11-setu-bandhasana-bridge-pose.webp', source: require('./assets/yoga-realistic-clay-complete/11-setu-bandhasana-bridge-pose.webp') },
  { name: 'Marjaryasana-Bitilasana', file: '12-marjaryasana-bitilasana-cat-cow.webp', source: require('./assets/yoga-realistic-clay-complete/12-marjaryasana-bitilasana-cat-cow.webp') },
  { name: 'Balasana', file: '13-balasana-childs-pose.webp', source: require('./assets/yoga-realistic-clay-complete/13-balasana-childs-pose.webp') },
  { name: 'Sukhasana', file: '14-sukhasana-easy-pose.webp', source: require('./assets/yoga-realistic-clay-complete/14-sukhasana-easy-pose.webp') },
  { name: 'Vajrasana', file: '15-vajrasana-thunderbolt-pose.webp', source: require('./assets/yoga-realistic-clay-complete/15-vajrasana-thunderbolt-pose.webp') },
  { name: 'Baddha Konasana', file: '16-baddha-konasana-bound-angle-pose.webp', source: require('./assets/yoga-realistic-clay-complete/16-baddha-konasana-bound-angle-pose.webp') },
  { name: 'Paschimottanasana', file: '17-paschimottanasana-seated-forward-bend.webp', source: require('./assets/yoga-realistic-clay-complete/17-paschimottanasana-seated-forward-bend.webp') },
  { name: 'Janu Sirsasana', file: '18-janu-sirsasana-head-to-knee-pose.webp', source: require('./assets/yoga-realistic-clay-complete/18-janu-sirsasana-head-to-knee-pose.webp') },
  { name: 'Ardha Matsyendrasana', file: '19-ardha-matsyendrasana-half-lord-of-fishes.webp', source: require('./assets/yoga-realistic-clay-complete/19-ardha-matsyendrasana-half-lord-of-fishes.webp') },
  { name: 'Supta Matsyendrasana', file: '20-supta-matsyendrasana-supine-spinal-twist.webp', source: require('./assets/yoga-realistic-clay-complete/20-supta-matsyendrasana-supine-spinal-twist.webp') },
  { name: 'Pavanamuktasana', file: '21-pavanamuktasana-wind-relieving-pose.webp', source: require('./assets/yoga-realistic-clay-complete/21-pavanamuktasana-wind-relieving-pose.webp') },
  { name: 'Apanasana', file: '22-apanasana-knees-to-chest-pose.webp', source: require('./assets/yoga-realistic-clay-complete/22-apanasana-knees-to-chest-pose.webp') },
  { name: 'Ananda Balasana', file: '23-ananda-balasana-happy-baby-pose.webp', source: require('./assets/yoga-realistic-clay-complete/23-ananda-balasana-happy-baby-pose.webp') },
  { name: 'Viparita Karani', file: '24-viparita-karani-legs-up-wall-pose.webp', source: require('./assets/yoga-realistic-clay-complete/24-viparita-karani-legs-up-wall-pose.webp') },
  { name: 'Supta Baddha Konasana', file: '25-supta-baddha-konasana-reclining-bound-angle.webp', source: require('./assets/yoga-realistic-clay-complete/25-supta-baddha-konasana-reclining-bound-angle.webp') },
  { name: 'Savasana', file: '26-savasana-corpse-pose.webp', source: require('./assets/yoga-realistic-clay-complete/26-savasana-corpse-pose.webp') },
  { name: 'Surya Namaskar', file: '27-surya-namaskar-sun-salutation.webp', source: require('./assets/yoga-realistic-clay-complete/27-surya-namaskar-sun-salutation.webp') },
  { name: 'Uttanasana', file: '28-uttanasana-standing-forward-bend.webp', source: require('./assets/yoga-realistic-clay-complete/28-uttanasana-standing-forward-bend.webp') },
  { name: 'Parsvakonasana', file: '29-parsvakonasana-extended-side-angle.webp', source: require('./assets/yoga-realistic-clay-complete/29-parsvakonasana-extended-side-angle.webp') },
  { name: 'Dhanurasana', file: '30-dhanurasana-bow-pose.webp', source: require('./assets/yoga-realistic-clay-complete/30-dhanurasana-bow-pose.webp') },
  { name: 'Makarasana', file: '31-makarasana-crocodile-pose.webp', source: require('./assets/yoga-realistic-clay-complete/31-makarasana-crocodile-pose.webp') },
] as const satisfies readonly { name: string; file: string; source: ImageSourcePropType }[];
const yogaPoseImageByFile = Object.fromEntries(bundledYogaPoseImages.map(item => [item.file, item.source])) as Record<string, ImageSourcePropType>;
const defaultYogaPoseImageFileByName = Object.fromEntries(bundledYogaPoseImages.map(item => [item.name, item.file])) as Record<string, string>;
const fallbackYogaPlan: YogaPlanData = {
  why_this_plan: 'This gentle three-day sequence supports steady movement, balance, and restoration while respecting your current Ayurvedic balance.',
  sessions: [
    { day: 1, duration: '15 minutes', focus: 'Cooling sequence', practices: [
      { yoga: 'Pavanamuktasana', duration: '5 minutes', reasoning: 'Wind-relieving pose, practised slowly while lying down.' },
      { yoga: 'Bhujangasana', duration: '5 minutes', reasoning: 'A gentle cobra lift with an easy, unforced breath.' },
      { yoga: 'Savasana', duration: '5 minutes', reasoning: 'Full rest with a soft and even breath.' },
    ] },
    { day: 2, duration: '15 minutes', focus: 'Strength and balance', practices: [
      { yoga: 'Tadasana', duration: '5 minutes', reasoning: 'A steady standing practice for posture and grounding.' },
      { yoga: 'Vrikshasana', duration: '5 minutes', reasoning: 'A gentle balance practice with calm focus.' },
      { yoga: 'Setu Bandhasana', duration: '5 minutes', reasoning: 'A supported bridge to open the front body gently.' },
    ] },
    { day: 3, duration: '15 minutes', focus: 'Calming and restoration', practices: [
      { yoga: 'Balasana', duration: '5 minutes', reasoning: 'A quiet resting posture with relaxed breathing.' },
      { yoga: 'Viparita Karani', duration: '5 minutes', reasoning: 'A restorative pause with the legs comfortably raised.' },
      { yoga: 'Makarasana', duration: '5 minutes', reasoning: 'A grounded prone rest to close the sequence.' },
    ] },
  ],
};
function isYogaPlanData(value: unknown): value is YogaPlanData {
  if (!value || typeof value !== 'object') return false;
  const plan = value as Record<string, unknown>;
  if (typeof plan.why_this_plan !== 'string' || !Array.isArray(plan.sessions) || plan.sessions.length !== 3) return false;
  return plan.sessions.every((session, index) => {
    if (!session || typeof session !== 'object') return false;
    const item = session as Record<string, unknown>;
    return item.day === index + 1 && typeof item.duration === 'string' && typeof item.focus === 'string' && Array.isArray(item.practices) && item.practices.length === 3 && item.practices.every(practice => {
      if (!practice || typeof practice !== 'object') return false;
      const pose = practice as Record<string, unknown>;
      return typeof pose.yoga === 'string' && typeof pose.duration === 'string' && typeof pose.reasoning === 'string';
    });
  });
}
function shortYogaDuration(value: string) { return value.replace(/\s*minutes?$/i, ' min'); }
function yogaDurationSeconds(value: string) {
  const minutes = Number.parseFloat(value);
  return Number.isFinite(minutes) && minutes > 0 ? Math.round(minutes * 60) : 60;
}
function formatYogaTimer(seconds: number) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, '0')}`;
}
function yogaHoldInstructions(practice: YogaPracticeData) {
  return [
    `Move into ${practice.yoga} slowly and settle into a comfortable, steady position.`,
    practice.reasoning,
    'Keep your breath soft and even, and ease out of the pose if you feel strain.',
  ];
}

type YogaFlow = 'overview' | 'mode' | 'pose' | 'transition' | 'complete';
type YogaMode = 'guided' | 'self-paced';

function YogaScreen({ session, onExit, onOpenDoctor, onOpenShop, onOpenProfile, onOpenAI }: { session: Session | null; onExit: () => void; onOpenDoctor: () => void; onOpenShop: () => void; onOpenProfile: () => void; onOpenAI: () => void }) {
  const [yogaPlan, setYogaPlan] = useState<YogaPlanData>(fallbackYogaPlan);
  const [poseImageFileByName, setPoseImageFileByName] = useState<Record<string, string>>(defaultYogaPoseImageFileByName);
  const [sessionIndex, setSessionIndex] = useState(0);
  const [flow, setFlow] = useState<YogaFlow>('overview');
  const [mode, setMode] = useState<YogaMode>('guided');
  const [poseIndex, setPoseIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [paused, setPaused] = useState(false);
  const [transitionSeconds, setTransitionSeconds] = useState(5);
  const [completionSeconds, setCompletionSeconds] = useState(5);
  useEffect(() => {
    if (!session?.user.id) return;
    let active = true;
    async function loadYogaPlan() {
      const { data: poseRows } = await supabase.from('yoga_poses').select('name, image_asset').eq('active', true).order('sort_order');
      if (active && poseRows?.length) {
        setPoseImageFileByName(Object.fromEntries(poseRows.flatMap(row => typeof row.image_asset === 'string' && yogaPoseImageByFile[row.image_asset] ? [[row.name, row.image_asset]] : [])));
      }
      const { data } = await supabase.from('yoga_recommendation_plans').select('plan').eq('user_id', session!.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (!active) return;
      if (data && isYogaPlanData(data.plan)) { setYogaPlan(data.plan); return; }
      const { data: assessment } = await supabase.from('current_health_assessments').select('id').eq('user_id', session!.user.id).order('completed_at', { ascending: false }).limit(1).maybeSingle();
      if (!assessment?.id || !active) return;
      const { data: generated } = await supabase.functions.invoke('generate-yoga-plan', { body: { assessmentId: assessment.id } });
      if (active && isYogaPlanData(generated?.plan)) setYogaPlan(generated.plan);
    }
    void loadYogaPlan();
    return () => { active = false; };
  }, [session?.user.id]);
  const selectedSession = yogaPlan.sessions[sessionIndex] ?? yogaPlan.sessions[0];
  const totalMinutes = Number.parseInt(selectedSession.duration, 10) || selectedSession.practices.reduce((total, practice) => total + (Number.parseInt(practice.duration, 10) || 0), 0);
  const weekdays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  function returnToYoga() {
    setFlow('overview');
    setPoseIndex(0);
    setRemainingSeconds(0);
    setPaused(false);
  }
  function beginSession() {
    const firstPractice = selectedSession.practices[0];
    if (!firstPractice) return;
    setPoseIndex(0);
    setRemainingSeconds(yogaDurationSeconds(firstPractice.duration));
    setPaused(false);
    setFlow('pose');
  }
  function finishCurrentPose() {
    setPaused(true);
    if (poseIndex >= selectedSession.practices.length - 1) {
      setCompletionSeconds(5);
      setFlow('complete');
      return;
    }
    setTransitionSeconds(5);
    setFlow('transition');
  }
  function beginNextPose() {
    const nextIndex = poseIndex + 1;
    const nextPractice = selectedSession.practices[nextIndex];
    if (!nextPractice) {
      setCompletionSeconds(5);
      setFlow('complete');
      return;
    }
    setPoseIndex(nextIndex);
    setRemainingSeconds(yogaDurationSeconds(nextPractice.duration));
    setPaused(false);
    setFlow('pose');
  }

  useEffect(() => {
    if (flow !== 'pose' || paused || remainingSeconds <= 0) return;
    const timer = setInterval(() => setRemainingSeconds(current => Math.max(0, current - 1)), 1000);
    return () => clearInterval(timer);
  }, [flow, paused, poseIndex, remainingSeconds > 0]);
  useEffect(() => {
    if (flow === 'pose' && remainingSeconds === 0 && mode === 'guided') finishCurrentPose();
  }, [flow, mode, remainingSeconds]);
  useEffect(() => {
    if (flow !== 'transition' || transitionSeconds <= 0) return;
    const timer = setTimeout(() => setTransitionSeconds(current => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [flow, transitionSeconds]);
  useEffect(() => {
    if (flow === 'transition' && transitionSeconds === 0 && mode === 'guided') beginNextPose();
  }, [flow, mode, transitionSeconds]);
  useEffect(() => {
    if (flow !== 'complete' || completionSeconds <= 0) return;
    const timer = setTimeout(() => setCompletionSeconds(current => Math.max(0, current - 1)), 1000);
    return () => clearTimeout(timer);
  }, [completionSeconds, flow]);
  useEffect(() => {
    if (flow === 'complete' && completionSeconds === 0) returnToYoga();
  }, [completionSeconds, flow]);

  if (flow === 'mode') {
    return <SafeAreaView style={styles.yogaSessionLightSafe}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.yogaModePage} showsVerticalScrollIndicator={false}>
        <Pressable accessibilityLabel="Back to Yoga" onPress={returnToYoga} style={styles.yogaSessionBack}><Text style={styles.yogaSessionBackText}>‹</Text></Pressable>
        <Text style={styles.yogaSessionEyebrow}>{selectedSession.focus.toUpperCase()} · {totalMinutes} MIN</Text>
        <Text style={styles.yogaModeTitle}>How would you like to practise?</Text>
        <View style={styles.yogaModeOptions}>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: mode === 'guided' }} onPress={() => setMode('guided')} style={[styles.yogaModeCard, mode === 'guided' && styles.yogaModeCardSelected]}>
            <View style={styles.yogaModeHeading}><View style={[styles.yogaRadio, mode === 'guided' && styles.yogaRadioSelected]}>{mode === 'guided' ? <View style={styles.yogaRadioDot} /> : null}</View><Text style={styles.yogaModeName}>Guided</Text></View>
            <Text style={styles.yogaModeCopy}>The timer counts down each pose and moves you on automatically. Best if you want to follow along without thinking about time.</Text>
            <Text style={styles.yogaModeMeta}>{totalMinutes} MIN · HANDS-FREE</Text>
          </Pressable>
          <Pressable accessibilityRole="radio" accessibilityState={{ checked: mode === 'self-paced' }} onPress={() => setMode('self-paced')} style={[styles.yogaModeCard, mode === 'self-paced' && styles.yogaModeCardSelected]}>
            <View style={styles.yogaModeHeading}><View style={[styles.yogaRadio, mode === 'self-paced' && styles.yogaRadioSelected]}>{mode === 'self-paced' ? <View style={styles.yogaRadioDot} /> : null}</View><Text style={styles.yogaModeName}>Self-paced</Text></View>
            <Text style={styles.yogaModeCopy}>The timer counts down but waits at the end of each pose. Tap Done whenever you are ready to continue.</Text>
            <Text style={styles.yogaModeMeta}>YOUR PACE · MANUAL NEXT</Text>
          </Pressable>
        </View>
        <View style={styles.yogaEitherCard}><Text style={styles.yogaEitherLabel}>EITHER WAY</Text><Text style={styles.yogaEitherCopy}>You get the same poses and instructions. Only the way you move between poses changes.</Text></View>
      </ScrollView>
      <View style={styles.yogaSessionFooter}><Pressable onPress={beginSession} style={({ pressed }) => [styles.yogaSessionPrimary, pressed && styles.pressed]}><Text style={styles.yogaSessionPrimaryText}>Start {mode === 'guided' ? 'guided' : 'self-paced'} session</Text></Pressable></View>
    </SafeAreaView>;
  }

  const currentPractice = selectedSession.practices[poseIndex] ?? selectedSession.practices[0];
  const currentPoseImage = yogaPoseImageByFile[poseImageFileByName[currentPractice?.yoga] ?? defaultYogaPoseImageFileByName[currentPractice?.yoga]];
  const currentDurationSeconds = yogaDurationSeconds(currentPractice?.duration ?? '1 minute');
  const poseProgress = currentDurationSeconds > 0 ? Math.max(0, Math.min(1, (currentDurationSeconds - remainingSeconds) / currentDurationSeconds)) : 0;

  if (flow === 'pose') {
    const instructions = yogaHoldInstructions(currentPractice);
    return <SafeAreaView style={styles.yogaSessionLightSafe}>
      <StatusBar style="dark" />
      <View style={styles.yogaPoseHeader}>
        <Pressable accessibilityLabel="End session" onPress={returnToYoga} style={styles.yogaClose}><Text style={styles.yogaCloseText}>×</Text></Pressable>
        <View><Text style={styles.yogaPoseEyebrow}>POSE {poseIndex + 1} OF {selectedSession.practices.length}</Text><Text numberOfLines={1} style={styles.yogaPoseTitle}>{currentPractice.yoga}</Text></View>
      </View>
      <View style={styles.yogaSegmentRow}>{selectedSession.practices.map((practice, index) => <View key={`${practice.yoga}-${index}`} style={styles.yogaSegmentTrack}><View style={[styles.yogaSegmentFill, { width: index < poseIndex ? '100%' : index === poseIndex ? `${Math.max(3, poseProgress * 100)}%` : '0%' }]} /></View>)}</View>
      <ScrollView contentContainerStyle={styles.yogaPoseScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.yogaPoseVisual}>{currentPoseImage ? <Image accessibilityLabel={`${currentPractice.yoga} pose illustration`} source={currentPoseImage} resizeMode="contain" style={styles.yogaPoseImage} /> : <><View style={styles.yogaPoseVisualIcon}><Text style={styles.yogaPoseVisualIconText}>◇</Text></View><Text style={styles.yogaPoseVisualTitle}>{currentPractice.yoga}</Text><Text style={styles.yogaPoseVisualCopy}>Follow the posture gently and stay within a comfortable range.</Text></>}</View>
        <View style={styles.yogaInstructionCard}><Text style={styles.yogaInstructionLabel}>HOW TO HOLD IT</Text>{instructions.map((instruction, index) => <View key={index} style={styles.yogaInstructionRow}><Text style={styles.yogaInstructionBullet}>•</Text><Text style={styles.yogaInstructionText}>{instruction}</Text></View>)}</View>
      </ScrollView>
      <View style={styles.yogaTimerPanel}>
        <View style={styles.yogaTimerDecor} /><Text style={styles.yogaTimerLabel}>HOLD FOR</Text><Text style={styles.yogaTimerValue}>{formatYogaTimer(remainingSeconds)}</Text>
        <View style={styles.yogaTimerTrack}><View style={[styles.yogaTimerFill, { width: `${poseProgress * 100}%` }]} /></View>
        <View style={styles.yogaTimerActions}><Pressable disabled={remainingSeconds === 0} onPress={() => setPaused(current => !current)} style={[styles.yogaTimerSecondary, remainingSeconds === 0 && styles.yogaButtonDisabled]}><Text style={styles.yogaTimerSecondaryText}>{paused ? 'Resume' : 'Pause'}</Text></Pressable><Pressable onPress={finishCurrentPose} style={styles.yogaTimerDone}><Text style={styles.yogaTimerDoneText}>Done</Text></Pressable></View>
      </View>
    </SafeAreaView>;
  }

  if (flow === 'transition') {
    const nextPractice = selectedSession.practices[poseIndex + 1];
    const heldDuration = formatYogaTimer(currentDurationSeconds);
    return <SafeAreaView style={styles.yogaTransitionSafe}>
      <StatusBar style="light" />
      <View style={styles.yogaTransitionPage}>
        <View style={styles.yogaTransitionCheck}><Text style={styles.yogaTransitionCheckText}>✓</Text></View>
        <Text style={styles.yogaTransitionEyebrow}>POSE {poseIndex + 1} OF {selectedSession.practices.length} COMPLETE</Text>
        <Text style={styles.yogaTransitionTitle}>{poseIndex === 0 ? 'Steady start' : 'Beautifully held'}</Text>
        <Text style={styles.yogaTransitionCopy}>The breath is settled and the sequence is flowing. Carry that same calm into the next pose.</Text>
        <View style={styles.yogaTransitionStats}><View><Text style={styles.yogaTransitionStatValue}>{heldDuration}</Text><Text style={styles.yogaTransitionStatLabel}>HELD</Text></View><View><Text style={styles.yogaTransitionStatValue}>{selectedSession.practices.length - poseIndex - 1}</Text><Text style={styles.yogaTransitionStatLabel}>POSES LEFT</Text></View></View>
        <View style={styles.yogaTransitionBottom}>
          <View style={styles.yogaUpNext}><View style={styles.yogaUpNextNumber}><Text style={styles.yogaUpNextNumberText}>{String(poseIndex + 2).padStart(2, '0')}</Text></View><View style={styles.yogaUpNextCopy}><Text style={styles.yogaUpNextLabel}>{mode === 'guided' && transitionSeconds > 0 ? `UP NEXT · ${transitionSeconds}S` : 'UP NEXT'}</Text><Text style={styles.yogaUpNextName}>{nextPractice?.yoga}</Text></View><Text style={styles.yogaUpNextDuration}>{nextPractice ? shortYogaDuration(nextPractice.duration) : ''}</Text></View>
          <Pressable disabled={transitionSeconds > 0} onPress={beginNextPose} style={[styles.yogaTransitionPrimary, transitionSeconds > 0 && styles.yogaTransitionPrimaryWaiting]}><Text style={styles.yogaTransitionPrimaryText}>{transitionSeconds > 0 ? `Next pose in ${transitionSeconds}s` : `Next pose · ${nextPractice?.yoga ?? ''}`}</Text></Pressable>
          <Pressable onPress={returnToYoga} style={styles.yogaEndSession}><Text style={styles.yogaEndSessionText}>End session</Text></Pressable>
        </View>
      </View>
    </SafeAreaView>;
  }

  if (flow === 'complete') {
    return <SafeAreaView style={styles.yogaCompleteSafe}>
      <StatusBar style="light" />
      <View style={styles.yogaCompleteDecorTop} /><View style={styles.yogaCompleteDecorBottom} />
      <View style={styles.yogaCompletePage}>
        <View style={styles.yogaCompleteCheckOuter}><View style={styles.yogaCompleteCheckInner}><Text style={styles.yogaCompleteCheckText}>✓</Text></View></View>
        <Text style={styles.yogaCompleteEyebrow}>{selectedSession.focus.toUpperCase()}</Text>
        <Text style={styles.yogaCompleteTitle}>Session complete</Text>
        <Text style={styles.yogaCompleteCopy}>Every pose is complete, start to finish. Keep this steady rhythm with you through the rest of your day.</Text>
        <View style={styles.yogaCompleteStats}><View style={styles.yogaCompleteStat}><Text style={styles.yogaCompleteStatValue}>{selectedSession.practices.length}</Text><Text style={styles.yogaCompleteStatLabel}>POSES</Text></View><View style={styles.yogaCompleteStat}><Text style={styles.yogaCompleteStatValue}>{totalMinutes}:00</Text><Text style={styles.yogaCompleteStatLabel}>PRACTISED</Text></View><View style={styles.yogaCompleteStat}><Text style={styles.yogaCompleteStatValue}>5</Text><Text style={styles.yogaCompleteStatLabel}>DAY STREAK</Text></View></View>
        <Text style={styles.yogaReturning}>Returning to Yoga in {completionSeconds}s</Text>
        <View style={styles.yogaCompleteBottom}><View style={styles.yogaCompleteProgress}><View style={[styles.yogaCompleteProgressFill, { width: `${((5 - completionSeconds) / 5) * 100}%` }]} /></View><Pressable onPress={returnToYoga} style={styles.yogaCompleteButton}><Text style={styles.yogaCompleteButtonText}>Go to Yoga now</Text></Pressable></View>
      </View>
    </SafeAreaView>;
  }

  return <SafeAreaView style={styles.yogaSafe}>
    <StatusBar style="dark" />
    <View style={styles.yogaHeader}>
      <View style={styles.yogaDecor} />
      <View style={styles.yogaHeadingRow}><Pressable accessibilityLabel="Back to home" onPress={onExit} style={styles.yogaBack}><Text style={styles.yogaBackText}>‹</Text></Pressable><View><Text style={styles.yogaEyebrow}>{selectedSession.focus.toUpperCase()}</Text><Text style={styles.yogaTitle}>Yoga</Text></View></View>
      <View style={styles.yogaStats}><View><Text style={styles.yogaStatValue}>{totalMinutes}</Text><Text style={styles.yogaStatLabel}>MINUTES</Text></View><View><Text style={styles.yogaStatValue}>{selectedSession.practices.length}</Text><Text style={styles.yogaStatLabel}>POSES</Text></View><View><Text style={styles.yogaStatValue}>4</Text><Text style={styles.yogaStatLabel}>DAY STREAK</Text></View></View>
    </View>
    <ScrollView style={styles.yogaBody} contentContainerStyle={styles.yogaBodyContent} showsVerticalScrollIndicator={false}>
      <View style={styles.yogaWeekHeading}><Text style={styles.yogaSectionLabel}>THIS WEEK</Text><View style={styles.yogaWeekLine} /></View>
      <View style={styles.yogaWeekRow}>{weekdays.map((day, index) => <Pressable key={`${day}-${index}`} onPress={() => index >= 4 && index <= 6 ? setSessionIndex(Math.min(index - 4, yogaPlan.sessions.length - 1)) : undefined} style={styles.yogaWeekDay}><View style={[styles.yogaWeekBox, index < 4 && styles.yogaWeekBoxComplete, index === sessionIndex + 4 && styles.yogaWeekBoxCurrent]}><Text style={[styles.yogaWeekMark, index < 4 && styles.yogaWeekMarkComplete]}>{index < 4 ? '✓' : index === sessionIndex + 4 ? '·' : ''}</Text></View><Text style={styles.yogaWeekDayLabel}>{day}</Text></Pressable>)}</View>
      <View style={styles.yogaSequenceHeading}><Text style={styles.yogaSequenceTitle}>Today’s sequence</Text><Text style={styles.yogaSequenceMeta}>{selectedSession.practices.length} poses · {totalMinutes} min</Text></View>
      <View style={styles.yogaPracticeList}>{selectedSession.practices.map((practice, index) => <View key={`${practice.yoga}-${index}`} style={styles.yogaPracticeRow}><View style={styles.yogaPracticeNumber}><Text style={styles.yogaPracticeNumberText}>{String(index + 1).padStart(2, '0')}</Text></View><View style={styles.yogaPracticeCopy}><Text numberOfLines={1} style={styles.yogaPracticeName}>{practice.yoga}</Text><Text numberOfLines={1} style={styles.yogaPracticeReason}>{practice.reasoning}</Text></View><Text style={styles.yogaPracticeDuration}>{shortYogaDuration(practice.duration)}</Text></View>)}</View>
      <View style={styles.yogaNoteCard}><Text style={styles.yogaNoteEyebrow}>PRACTICE NOTE</Text><Text style={styles.yogaNoteText}>{yogaPlan.why_this_plan}</Text></View>
    </ScrollView>
    <View style={styles.yogaAction}><Pressable onPress={() => setFlow('mode')} style={({ pressed }) => [styles.yogaStart, pressed && styles.pressed]}><Text style={styles.yogaStartText}>Start session · {totalMinutes} min</Text></Pressable></View>
    <View style={styles.yogaBottomNav}><HomePreNav label="Home" active onPress={onExit} /><HomePreNav label="Doctor" onPress={onOpenDoctor} /><HomePreNav label="AI" onPress={onOpenAI} /><HomePreNav label="Shop" onPress={onOpenShop} /><HomePreNav label="Profile" onPress={onOpenProfile} /></View>
  </SafeAreaView>;
}

function CompletedHome({ firstName, percentages, dominantDosha, vikritiConclusion, appointment, recommendedProducts, onRetakePrakriti, onUpdateHealth, onOpenFood, onOpenYoga, onOpenDoctor, onOpenShop, onOpenProfile, onOpenAI }: { firstName: string; percentages: Record<Dosha, number>; dominantDosha: Dosha; vikritiConclusion: string | null; appointment: { doctor_name: string; doctor_initials: string; appointment_date: string; appointment_time: string } | null; recommendedProducts: Product[]; onRetakePrakriti: () => void; onUpdateHealth: () => void; onOpenFood: () => void; onOpenYoga: () => void; onOpenDoctor: () => void; onOpenShop: () => void; onOpenProfile: () => void; onOpenAI: () => void }) {
  const dominantName = dominantDosha.charAt(0).toUpperCase() + dominantDosha.slice(1);
  const planItems = [
    { icon: '🍴', title: 'Food', timing: 'Morning', detail: 'Dal khichdi with curd, warm and lightly spiced', progress: '100%', color: '#4C8E6B' },
    { icon: '𑁍', title: 'Yoga', timing: '5 min', detail: 'Pavanamuktasana, before breakfast', progress: '58%', color: '#C89535' },
  ];
  const productsForHome = recommendedProducts.slice(0, 8);
  const secondaryDoshas = (Object.keys(percentages) as Dosha[]).filter(dosha => dosha !== dominantDosha);
  const doshaColors: Record<Dosha, string> = { vata: '#4C8E6B', pitta: '#C89535', kapha: '#79A083' };
  return <SafeAreaView style={styles.homeV2Safe}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={styles.homeV2Scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.homeV2Header}><View style={styles.homeV2Decor} /><Text style={styles.homeV2Eyebrow}>GOOD MORNING</Text><Text style={styles.homeV2Name}>{firstName}</Text></View>
      <View style={styles.homeV2Body}>
        <View style={styles.homeBalanceCard}>
          <View style={styles.homeBalanceChart}><ProfileDoshaDonut percentages={percentages} dominant={dominantDosha} /><View style={styles.homeBalanceLegend}>{secondaryDoshas.map(dosha => <View key={dosha} style={styles.homeBalanceLegendRow}><View style={[styles.homeBalanceDot, { backgroundColor: doshaColors[dosha] }]} /><Text style={styles.homeBalanceLegendName}>{dosha.charAt(0).toUpperCase() + dosha.slice(1)}</Text><Text style={styles.homeBalanceLegendValue}>{percentages[dosha]}%</Text></View>)}</View></View>
          <View style={styles.homeBalanceCopy}><Text style={styles.homeBalanceEyebrow}>YOUR CURRENT BALANCE</Text><Text style={styles.homeBalanceTitle}>{vikritiConclusion ?? `Your ${dominantName} dosha is imbalanced`}</Text><Text style={styles.homeBalanceBody}>Your latest assessments are ready for personalised guidance.</Text><View style={styles.homeBalanceActions}><Pressable onPress={onRetakePrakriti}><Text style={styles.homeBalanceLink}>Retake Prakriti</Text></Pressable><Pressable onPress={onUpdateHealth}><Text style={styles.homeBalanceLink}>Update health</Text></Pressable></View></View>
        </View>
        {appointment ? <Pressable onPress={onOpenDoctor} style={styles.homeAppointmentStrip}><View style={styles.homeAppointmentIcon}><Text style={styles.homeAppointmentIconText}>♧</Text></View><View style={styles.homeAppointmentCopy}><Text style={styles.homeAppointmentEyebrow}>UPCOMING APPOINTMENT</Text><Text numberOfLines={1} style={styles.homeAppointmentText}>{appointment.doctor_name} · {formatAppointmentDate(appointment.appointment_date)} at {appointment.appointment_time}</Text></View></Pressable> : null}
        <View style={styles.homeSectionHeading}><Text style={styles.homeSectionTitle}>Today’s plan</Text><Text style={styles.homeSectionAction}>View all</Text></View>
        <View style={styles.homePlanGrid}>{planItems.map(item => <Pressable key={item.title} onPress={item.title === 'Food' ? onOpenFood : item.title === 'Yoga' ? onOpenYoga : undefined} style={({ pressed }) => [styles.homePlanCard, pressed && styles.pressed]}><View style={styles.homePlanTop}><View style={styles.homePlanIcon}><Text style={styles.homePlanIconText}>{item.icon}</Text></View><Text style={styles.homePlanTitle}>{item.title}</Text><Text style={styles.homePlanTiming}>{item.timing}</Text></View><Text style={styles.homePlanDetail}>{item.detail}</Text><View style={styles.homePlanTrack}><View style={[styles.homePlanProgress, { backgroundColor: item.color, width: item.progress as `${number}%` }]} /></View></Pressable>)}</View>
        <View style={styles.homeSectionHeading}><Text style={styles.homeSectionTitle}>Recommended for you</Text><Pressable onPress={onOpenShop}><Text style={styles.homeSectionAction}>Shop</Text></Pressable></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.homeProductRow}>{productsForHome.map(product => <Pressable key={product.id} onPress={onOpenShop} style={styles.homeProductCard}><View style={styles.homeProductVisual}><Text style={styles.homeProductBrand}>AYUR</Text><Text style={styles.homeProductGlyph}>{productGlyph(product.name)}</Text></View><Text numberOfLines={1} style={styles.homeProductName}>{product.name}</Text><Text numberOfLines={1} style={styles.homeProductBenefit}>{product.categories[0] ?? 'General wellness'}</Text><View style={styles.homeProductFooter}><Text style={styles.homeProductPrice}>₹{product.price}</Text><View style={styles.homeProductAdd}><Text style={styles.homeProductAddText}>+</Text></View></View></Pressable>)}</ScrollView>
        <Text style={styles.homeExploreEyebrow}>EXPLORE</Text><View style={styles.homeExploreWrap}><Pressable onPress={onOpenDoctor} style={styles.homeExplorePill}><Text style={styles.homeExploreText}>Panchakarma</Text></Pressable><Pressable onPress={onOpenAI} style={styles.homeExplorePill}><Text style={styles.homeExploreText}>AI assistant</Text></Pressable><Pressable onPress={onOpenShop} style={styles.homeExplorePill}><Text style={styles.homeExploreText}>Supplements</Text></Pressable><Pressable onPress={onOpenProfile} style={styles.homeExplorePill}><Text style={styles.homeExploreText}>My health profile</Text></Pressable></View>
      </View>
    </ScrollView>
    <View style={styles.bottomNav}><NavItem icon="⌂" label="Home" active /><NavItem icon="✚" label="Doctor" onPress={onOpenDoctor} /><NavItem icon="♧" label="AI" onPress={onOpenAI} /><NavItem icon="🛍" label="Shop" onPress={onOpenShop} /><NavItem icon="♙" label="Profile" onPress={onOpenProfile} /></View>
  </SafeAreaView>;
}

type ShopOrderItem = { product_id: string; quantity: number; unit_price: number; product: { name: string; weight: string; icon: string } | null };
type ShopOrder = { id: string; total_amount: number; status: string; created_at: string; items: ShopOrderItem[] };
type BookedAppointment = { id: string; doctor_name: string; doctor_initials: string; appointment_date: string; appointment_time: string; consultation_type: string; status: string; discussion_summary: string | null; prescription: string | null };
type ProfilePrakriti = 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Vata-Pitta-Kapha';
type ProfileVikriti = 'Vata' | 'Pitta' | 'Kapha' | 'Vata-Pitta' | 'Pitta-Kapha' | 'Vata-Kapha' | 'Tridosha';
type ProfileHealthResult = { conclusion: string | null; symptoms: string[] | null; vata_imbalanced: boolean; pitta_imbalanced: boolean; kapha_imbalanced: boolean; completed_at?: string };

const prakritiDescriptions: Record<ProfilePrakriti, string> = {
  Vata: 'You tend to have a naturally active, creative, and adaptable nature, with quick thinking and a variable energy pattern. You may be more sensitive to changes in routine, environment, sleep, and diet.',
  Pitta: 'You tend to have a naturally focused, driven, and decisive nature, with strong digestion and a sharp intellect. You may be more sensitive to heat, intensity, stress, and excessive exertion.',
  Kapha: 'You tend to have a naturally calm, steady, patient, and grounded nature, with stable energy and good endurance. You may prefer consistency and routine and can be more prone to sluggishness when inactive.',
  'Vata-Pitta': "You tend to combine Vata's creativity and adaptability with Pitta's focus, determination, and sharp intellect. You may be energetic and ambitious while also being sensitive to irregular routines, stress, and excessive stimulation.",
  'Pitta-Kapha': "You tend to combine Pitta's drive and decisiveness with Kapha's calmness, stability, and endurance. You may have strong determination and sustained energy while generally preferring structure and consistency.",
  'Vata-Kapha': "You tend to combine Vata's creativity and adaptability with Kapha's calmness, patience, and stability. You may shift between periods of high activity and periods of needing rest, making balance and regularity particularly important.",
  'Vata-Pitta-Kapha': "You have a relatively balanced constitutional makeup, combining Vata's adaptability, Pitta's focus, and Kapha's stability. This can provide versatility across different situations, though your current state may still shift toward one or more Doshas.",
};
const diseaseVulnerability: Record<ProfileVikriti, string> = {
  Vata: 'Constipation, insomnia, anxiety and joint disorders', Pitta: 'Gastritis, acidity, inflammatory and skin disorders', Kapha: 'Obesity, congestion, metabolic disorders and Prameha',
  'Vata-Pitta': 'IBS-type disorders, headaches, inflammatory and skin disorders', 'Pitta-Kapha': 'Obesity with inflammation, metabolic, skin and liver disorders',
  'Vata-Kapha': 'Respiratory congestion, joint stiffness and constipation', Tridosha: 'Complex and mixed disease patterns',
};
const vikritiExplanations: Record<ProfileVikriti, string> = {
  Vata: 'An imbalance in Vata may affect movement, regulation, and bodily rhythms.',
  Pitta: 'An imbalance in Pitta may affect heat, digestion, and metabolic activity.',
  Kapha: 'An imbalance in Kapha may affect stability, lubrication, and metabolic activity.',
  'Vata-Pitta': 'An imbalance in Vata and Pitta may affect movement and regulation alongside heat and metabolic activity.',
  'Pitta-Kapha': 'An imbalance in Pitta and Kapha may affect heat and metabolism alongside stability and lubrication.',
  'Vata-Kapha': 'An imbalance in Vata and Kapha may affect movement and regulation alongside stability and lubrication.',
  Tridosha: 'An imbalance across all three Doshas may affect movement, heat and metabolism, and stability and lubrication.',
};
function getProfilePrakriti(result: { vata_percentage: number; pitta_percentage: number; kapha_percentage: number }): ProfilePrakriti {
  const values = [{ label: 'Vata', value: result.vata_percentage }, { label: 'Pitta', value: result.pitta_percentage }, { label: 'Kapha', value: result.kapha_percentage }] as const;
  const maximum = Math.max(...values.map(item => item.value));
  const dominant = values.filter(item => item.value === maximum).map(item => item.label);
  return dominant.join('-') as ProfilePrakriti;
}
function getProfileVikriti(result: ProfileHealthResult): ProfileVikriti | null {
  const doshas = [result.vata_imbalanced && 'Vata', result.pitta_imbalanced && 'Pitta', result.kapha_imbalanced && 'Kapha'].filter(Boolean) as ('Vata' | 'Pitta' | 'Kapha')[];
  if (doshas.length === 3) return 'Tridosha';
  return doshas.length ? doshas.join('-') as ProfileVikriti : null;
}

function ProfileHub({ session, onExit, onOpenShop, onOpenDoctor, onOpenAI, onRetakePrakriti, onRetakeVikriti, onLogout }: { session: Session | null; onExit: () => void; onOpenShop: () => void; onOpenDoctor: () => void; onOpenAI: () => void; onRetakePrakriti: () => void; onRetakeVikriti: () => void; onLogout: () => Promise<void> }) {
  const [loggingOut, setLoggingOut] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuProgress = useRef(new Animated.Value(0)).current;
  const [view, setView] = useState<'profile' | 'edit' | 'settings' | 'orders' | 'order' | 'appointments' | 'appointment'>('profile');
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<ShopOrder | null>(null);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [appointments, setAppointments] = useState<BookedAppointment[]>([]);
  const [orderCount, setOrderCount] = useState(0); const [upcomingAppointmentCount, setUpcomingAppointmentCount] = useState(0);
  const [selectedAppointment, setSelectedAppointment] = useState<BookedAppointment | null>(null);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [editName, setEditName] = useState(''); const [editDob, setEditDob] = useState('');
  const [editSex, setEditSex] = useState<'male' | 'female' | null>(null);
  const [editHeight, setEditHeight] = useState(''); const [editWeight, setEditWeight] = useState('');
  const [loadingProfile, setLoadingProfile] = useState(false); const [profileError, setProfileError] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null); const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [notifications, setNotifications] = useState(true); const [diet, setDiet] = useState<'vegetarian' | 'non-vegetarian' | 'vegan' | 'pescatarian'>('vegetarian');
  const [healthPersonalisation, setHealthPersonalisation] = useState(true); const [aiContext, setAiContext] = useState(false); const [doctorSharing, setDoctorSharing] = useState(false);
  const [showDietOptions, setShowDietOptions] = useState(false); const [savingSettings, setSavingSettings] = useState(false); const [settingsError, setSettingsError] = useState('');
  const [profilePrakriti, setProfilePrakriti] = useState<ProfilePrakriti | null>(null);
  const [profileScores, setProfileScores] = useState<Record<Dosha, number> | null>(null);
  const [profileHealth, setProfileHealth] = useState<ProfileHealthResult | null>(null);
  const [profileMetrics, setProfileMetrics] = useState<{ height: number | null; weight: number | null }>({ height: null, weight: null });
  const fullName = session?.user.user_metadata.full_name?.trim() || 'Ayurnidaan User';
  useEffect(() => { if (session?.user.id) supabase.from('profiles').select('avatar_url, height_cm, weight_kg').eq('user_id', session.user.id).maybeSingle().then(async ({ data }) => { setProfileMetrics({ height: data?.height_cm ?? null, weight: data?.weight_kg ?? null }); if (!data?.avatar_url) return setAvatarUrl(null); const signed = await supabase.storage.from('avatars').createSignedUrl(data.avatar_url, 3600); setAvatarUrl(signed.data?.signedUrl ?? null); }); }, [session?.user.id]);
  useEffect(() => {
    if (!session?.user.id) return;
    Promise.all([
      supabase.from('prakriti_assessments').select('vata_percentage, pitta_percentage, kapha_percentage').eq('user_id', session.user.id).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('current_health_assessments').select('conclusion, symptoms, vata_imbalanced, pitta_imbalanced, kapha_imbalanced, completed_at').eq('user_id', session.user.id).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
    ]).then(([prakritiResult, healthResult]) => {
      if (prakritiResult.data) { setProfilePrakriti(getProfilePrakriti(prakritiResult.data)); setProfileScores({ vata: prakritiResult.data.vata_percentage, pitta: prakritiResult.data.pitta_percentage, kapha: prakritiResult.data.kapha_percentage }); }
      if (healthResult.data) setProfileHealth(healthResult.data as ProfileHealthResult);
    });
  }, [session?.user.id]);
  useEffect(() => { if (!session?.user.id) return; const today = new Date().toISOString().slice(0, 10); Promise.all([supabase.from('shop_orders').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id), supabase.from('appointments').select('id', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('status', 'booked').gte('appointment_date', today)]).then(([orderResult, appointmentResult]) => { setOrderCount(orderResult.count ?? 0); setUpcomingAppointmentCount(appointmentResult.count ?? 0); }); }, [session?.user.id]);
  async function openOrders() {
    if (!session?.user.id) return;
    setLoadingOrders(true); setView('orders');
    const { data: orderRows } = await supabase.from('shop_orders').select('id, total_amount, status, created_at').eq('user_id', session.user.id).order('created_at', { ascending: false });
    const ids = (orderRows ?? []).map(order => order.id);
    const { data: itemRows } = ids.length ? await supabase.from('shop_order_items').select('order_id, product_id, quantity, unit_price, shop_products(name, weight, icon)').eq('user_id', session.user.id).in('order_id', ids) : { data: [] };
    setOrders((orderRows ?? []).map(order => ({ ...order, items: (itemRows ?? []).filter(item => item.order_id === order.id).map(item => ({ product_id: item.product_id, quantity: item.quantity, unit_price: item.unit_price, product: Array.isArray(item.shop_products) ? item.shop_products[0] ?? null : item.shop_products })) })));
    setOrderCount((orderRows ?? []).length);
    setLoadingOrders(false);
  }
  function showOrder(order: ShopOrder) { setSelectedOrder(order); setView('order'); }
  async function openAppointments() {
    if (!session?.user.id) return;
    setLoadingAppointments(true); setView('appointments');
    const { data } = await supabase.from('appointments').select('id, doctor_name, doctor_initials, appointment_date, appointment_time, consultation_type, status, discussion_summary, prescription').eq('user_id', session.user.id).order('appointment_date', { ascending: false }).order('created_at', { ascending: false });
    setAppointments(data ?? []); setUpcomingAppointmentCount((data ?? []).filter(item => item.status === 'booked' && item.appointment_date >= new Date().toISOString().slice(0, 10)).length); setLoadingAppointments(false);
  }
  function showAppointment(appointment: BookedAppointment) { setSelectedAppointment(appointment); setView('appointment'); }
  async function openEditProfile() {
    if (!session?.user.id) return;
    setLoadingProfile(true); setProfileError(''); setView('edit');
    const { data, error } = await supabase.from('profiles').select('full_name, date_of_birth, sex, height_cm, weight_kg, avatar_url').eq('user_id', session.user.id).maybeSingle();
    setLoadingProfile(false); if (error) return setProfileError(error.message);
    setEditName(data?.full_name ?? fullName); setEditDob(data?.date_of_birth ?? ''); setEditSex(data?.sex ?? null); setEditHeight(data?.height_cm?.toString() ?? ''); setEditWeight(data?.weight_kg?.toString() ?? '');
    if (data?.avatar_url) { const signed = await supabase.storage.from('avatars').createSignedUrl(data.avatar_url, 3600); setAvatarUrl(signed.data?.signedUrl ?? null); }
  }
  async function chooseAvatar() {
    if (!session?.user.id) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (result.canceled) return;
    setUploadingAvatar(true); setProfileError('');
    const asset = result.assets[0]; const bytes = await (await fetch(asset.uri)).arrayBuffer(); const extension = asset.mimeType?.split('/')[1] || 'jpg'; const path = `${session.user.id}/profile.${extension}`;
    const { error } = await supabase.storage.from('avatars').upload(path, bytes, { contentType: asset.mimeType ?? 'image/jpeg', upsert: true });
    if (!error) { const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600); setAvatarUrl(data?.signedUrl ?? null); await supabase.from('profiles').update({ avatar_url: path, updated_at: new Date().toISOString() }).eq('user_id', session.user.id); }
    setUploadingAvatar(false); if (error) setProfileError(error.message);
  }
  async function removeAvatar() {
    if (!session?.user.id) return;
    setUploadingAvatar(true); setProfileError('');
    const { data } = await supabase.from('profiles').select('avatar_url').eq('user_id', session.user.id).maybeSingle();
    if (data?.avatar_url) await supabase.storage.from('avatars').remove([data.avatar_url]);
    const { error } = await supabase.from('profiles').update({ avatar_url: null, updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
    setUploadingAvatar(false); if (error) return setProfileError(error.message); setAvatarUrl(null);
  }
  async function openSettings() {
    if (!session?.user.id) return;
    setView('settings'); setSettingsError('');
    const { data, error } = await supabase.from('profiles').select('notifications_enabled, diet_preference, health_personalisation, ai_context_enabled, doctor_sharing_enabled').eq('user_id', session.user.id).maybeSingle();
    if (error) return setSettingsError(error.message);
    setNotifications(data?.notifications_enabled ?? true); setDiet(data?.diet_preference ?? 'vegetarian'); setHealthPersonalisation(data?.health_personalisation ?? true); setAiContext(data?.ai_context_enabled ?? false); setDoctorSharing(data?.doctor_sharing_enabled ?? false);
  }
  async function saveSettings() {
    if (!session?.user.id) return;
    setSavingSettings(true); setSettingsError('');
    const { error } = await supabase.from('profiles').update({ notifications_enabled: notifications, diet_preference: diet, health_personalisation: healthPersonalisation, ai_context_enabled: aiContext, doctor_sharing_enabled: doctorSharing, updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
    setSavingSettings(false); if (error) return setSettingsError(error.message); setView('profile');
  }
  async function saveProfile() {
    if (!session?.user.id) return setProfileError('Please sign in again.');
    if (!editName.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(editDob) || !editSex || !Number(editHeight) || !Number(editWeight)) return setProfileError('Complete every field. Use YYYY-MM-DD for date of birth.');
    setLoadingProfile(true); setProfileError('');
    const { error } = await supabase.from('profiles').update({ full_name: editName.trim(), date_of_birth: editDob, sex: editSex, height_cm: Number(editHeight), weight_kg: Number(editWeight), diet_preference: diet, updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
    if (!error) await supabase.auth.updateUser({ data: { ...session.user.user_metadata, full_name: editName.trim() } });
    if (!error) setProfileMetrics({ height: Number(editHeight), weight: Number(editWeight) });
    setLoadingProfile(false); if (error) return setProfileError(error.message); setView('profile');
  }
  async function logout() { setLoggingOut(true); await onLogout(); setLoggingOut(false); }
  function openMenu() { setMenuOpen(true); Animated.timing(menuProgress, { toValue: 1, duration: 220, useNativeDriver: true }).start(); }
  function closeMenu(afterClose?: () => void) { Animated.timing(menuProgress, { toValue: 0, duration: 190, useNativeDriver: true }).start(() => { setMenuOpen(false); afterClose?.(); }); }
  function goFromMenu(action: () => void | Promise<void>) { closeMenu(() => { void action(); }); }
  if (view === 'order' && selectedOrder) return <OrderDetails order={selectedOrder} onBack={() => setView('orders')} />;
  if (view === 'appointment' && selectedAppointment) return <AppointmentDetails appointment={selectedAppointment} onBack={() => setView('appointments')} />;
  if (view === 'edit') return <PersonalDetailsScreen avatarUrl={avatarUrl} uploadingAvatar={uploadingAvatar} loading={loadingProfile} error={profileError} name={editName} dob={editDob} phone={session?.user.phone ?? ''} sex={editSex} height={editHeight} weight={editWeight} diet={diet} onBack={() => setView('profile')} onName={setEditName} onDob={setEditDob} onSex={setEditSex} onHeight={setEditHeight} onWeight={setEditWeight} onDiet={setDiet} onChooseAvatar={chooseAvatar} onRemoveAvatar={removeAvatar} onSave={saveProfile} />;
  if (view === 'settings') return <PrivacyConsentScreen notifications={notifications} healthPersonalisation={healthPersonalisation} aiContext={aiContext} doctorSharing={doctorSharing} saving={savingSettings} error={settingsError} onBack={() => setView('profile')} onNotifications={setNotifications} onHealthPersonalisation={setHealthPersonalisation} onAiContext={setAiContext} onDoctorSharing={setDoctorSharing} onSave={saveSettings} />;
  if (view === 'appointments') return <AppointmentsScreen appointments={appointments} loading={loadingAppointments} onBack={() => setView('profile')} onSelect={showAppointment} onBook={onOpenDoctor} />;
  if (view === 'orders') return <OrdersScreen orders={orders} loading={loadingOrders} onBack={() => setView('profile')} onSelect={showOrder} onShop={onOpenShop} />;
  const menuRows = [
    { label: 'Edit personal details', detail: 'Name, contact, diet', onPress: openEditProfile },
    { label: 'Privacy and consent', detail: 'Data sharing controls', onPress: openSettings },
    { label: 'My orders', detail: `${orderCount} ${orderCount === 1 ? 'order' : 'orders'}`, onPress: openOrders },
    { label: 'My appointments', detail: `${upcomingAppointmentCount} upcoming`, onPress: openAppointments },
    { label: 'Retake Prakriti assessment', detail: '25 questions', onPress: onRetakePrakriti },
    { label: 'Retake Vikriti assessment', detail: 'Conversational', onPress: onRetakeVikriti },
    { label: 'Help & support', detail: 'Ask the assistant' },
    ...(avatarUrl ? [{ label: 'Remove profile picture', detail: '', onPress: removeAvatar }] : []),
  ];
  const vikriti = profileHealth ? getProfileVikriti(profileHealth) : null;
  const symptoms = profileHealth?.symptoms?.filter(Boolean) ?? [];
  const initials = fullName.split(/\s+/).map((part: string) => part[0]).join('').slice(0, 2).toUpperCase();
  const memberYear = new Date(session?.user.created_at ?? Date.now()).getFullYear();
  const primaryDosha = profileScores ? (Object.entries(profileScores).sort((a, b) => b[1] - a[1])[0][0] as Dosha) : null;
  const checkedDate = profileHealth?.completed_at ? new Date(profileHealth.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : null;
  return <SafeAreaView style={styles.profileV2Safe}><StatusBar style="light" /><ScrollView style={styles.profileV2Scroll} contentContainerStyle={styles.profileV2Content} showsVerticalScrollIndicator={false}><View style={styles.profileV2Header}><View style={styles.profileV2HeaderTop}><Text style={styles.profileV2EyebrowLight}>MY HEALTH PROFILE</Text><Pressable accessibilityLabel="Open profile menu" onPress={openMenu} style={styles.profileMenuButton}><View style={styles.profileMenuBar} /><View style={styles.profileMenuBar} /><View style={styles.profileMenuBar} /></Pressable></View><Pressable onPress={openEditProfile} style={styles.profileV2Identity}><View style={styles.profileV2Avatar}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} /> : <Text style={styles.profileV2AvatarText}>{initials}</Text>}</View><View style={styles.profileV2IdentityCopy}><Text style={styles.profileV2Name}>{fullName}</Text><Text style={styles.profileV2Member}>{profilePrakriti ? `${profilePrakriti} prakriti` : 'Prakriti not assessed'}  ·  member since {memberYear}</Text></View></Pressable><View style={styles.profileV2Decor} /></View><View style={styles.profileV2Body}><View style={styles.profileSectionMeta}><Text style={styles.profileSectionEyebrow}>PRAKRITI  ·  YOUR BASELINE</Text><Text style={styles.profileSectionAside}>Fixed at birth</Text></View>{profileScores && profilePrakriti && primaryDosha ? <View style={styles.profilePrakritiPanel}><View style={styles.profileDonutColumn}><ProfileDoshaDonut percentages={profileScores} dominant={primaryDosha} /><ProfileDoshaLegend percentages={profileScores} /></View><View style={styles.profilePrakritiCopy}><Text style={styles.profilePrakritiName}>{profilePrakriti}</Text><Text style={styles.profilePrakritiDominant}>dominant</Text><Text style={styles.profilePrakritiDescription}>{prakritiDescriptions[profilePrakriti]}</Text></View></View> : <Text style={styles.profileEmptyCopy}>Complete your Prakriti assessment to reveal your natural baseline.</Text>}<View style={styles.profileV2Divider} /><View style={styles.profileSectionMeta}><Text style={styles.profileSectionEyebrow}>VIKRITI  ·  RIGHT NOW</Text><Text style={styles.profileSectionAside}>{checkedDate ? `Checked ${checkedDate}` : 'Not assessed'}</Text></View><View style={styles.profileVikritiCard}><Text style={styles.profileVikritiTitle}>{profileHealth?.conclusion ?? 'Your current balance is not assessed yet'}</Text><Text style={styles.profileVikritiExplanation}>{vikriti ? vikritiExplanations[vikriti] : 'Complete your current health assessment to understand your present balance.'}</Text><View style={styles.profileVikritiDivider} /><Text style={styles.profileSymptomsLabel}>KEY SYMPTOMS</Text>{symptoms.length ? <View style={styles.profileSymptomChips}>{symptoms.map((symptom, index) => <View key={`${symptom}-${index}`} style={styles.profileSymptomChip}><Text style={styles.profileSymptomText}>{symptom}</Text></View>)}</View> : <Text style={styles.profileEmptySymptoms}>No key symptoms recorded yet.</Text>}</View><View style={styles.profileVulnerabilityCard}><Text style={styles.profileVulnerabilityEyebrow}>DISEASE VULNERABILITY</Text><Text style={styles.profileVulnerabilityTitle}>{vikriti ? `You're most likely vulnerable to ${diseaseVulnerability[vikriti].toLowerCase()}.` : 'Complete both assessments to view your vulnerability pattern.'}</Text><View style={styles.profileVulnerabilityDivider} /><Text style={styles.profileVulnerabilityNote}>General wellness guidance based on your assessments, not a medical diagnosis.</Text><Pressable onPress={onOpenDoctor} style={styles.profileDoctorCta}><Text style={styles.profileDoctorCtaText}>Discuss with a doctor</Text></Pressable></View></View></ScrollView><View style={styles.bottomNav}><NavItem icon="⌂" label="Home" onPress={onExit} /><NavItem icon="✚" label="Doctor" onPress={onOpenDoctor} /><NavItem icon="♧" label="AI" onPress={onOpenAI} /><NavItem icon="🛍" label="Shop" onPress={onOpenShop} /><NavItem icon="♙" label="Profile" active /></View>{menuOpen ? <ProfileMenuDrawer fullName={fullName} rows={menuRows} loggingOut={loggingOut} progress={menuProgress} onClose={() => closeMenu()} onSelect={goFromMenu} onLogout={() => goFromMenu(logout)} /> : null}</SafeAreaView>;
}

function ProfileDoshaDonut({ percentages, dominant }: { percentages: Record<Dosha, number>; dominant: Dosha }) { const colors: Record<Dosha, string> = { vata: '#4C8E6B', pitta: '#C89535', kapha: '#79A083' }; return <View style={styles.profileDonut}>{Array.from({ length: 100 }, (_, index) => { const color = index < percentages.vata ? colors.vata : index < percentages.vata + percentages.pitta ? colors.pitta : colors.kapha; return <View key={index} style={[styles.profileDonutSegment, { backgroundColor: color, transform: [{ rotate: `${index * 3.6}deg` }, { translateY: -40 }] }]} />; })}<View style={styles.profileDonutCenter}><Text style={styles.profileDonutDosha}>{dominant.charAt(0).toUpperCase() + dominant.slice(1)}</Text><Text style={styles.profileDonutValue}>{percentages[dominant]}%</Text></View></View>; }
function ProfileDoshaLegend({ percentages }: { percentages: Record<Dosha, number> }) { const items: { key: Dosha; label: string; color: string }[] = [{ key: 'vata', label: 'Vata', color: '#4C8E6B' }, { key: 'pitta', label: 'Pitta', color: '#C89535' }, { key: 'kapha', label: 'Kapha', color: '#79A083' }]; return <View style={styles.profileDoshaLegend}>{items.map(item => <View key={item.key} style={styles.profileDoshaLegendRow}><View style={[styles.profileDoshaDot, { backgroundColor: item.color }]} /><Text style={styles.profileDoshaLabel}>{item.label}</Text><Text style={styles.profileDoshaPercent}>{percentages[item.key]}%</Text></View>)}</View>; }
function ProfileAccountRow({ label, detail, onPress }: { label: string; detail: string; onPress?: () => void | Promise<void> }) { return <Pressable accessibilityRole="button" disabled={!onPress} onPress={onPress} style={({ pressed }) => [styles.profileV2MenuRow, pressed && styles.pressed]}><Text style={styles.profileV2MenuLabel}>{label}</Text><Text numberOfLines={1} style={styles.profileV2MenuDetail}>{detail}</Text><Text style={styles.profileV2MenuChevron}>›</Text></Pressable>; }

function ProfileMenuDrawer({ fullName, rows, loggingOut, progress, onClose, onSelect, onLogout }: { fullName: string; rows: { label: string; detail: string; onPress?: () => void | Promise<void> }[]; loggingOut: boolean; progress: Animated.Value; onClose: () => void; onSelect: (action: () => void | Promise<void>) => void; onLogout: () => void }) {
  const panelWidth = Dimensions.get('window').width * 0.77;
  return <View style={styles.profileDrawerLayer}><Animated.View style={[styles.profileDrawerScrim, { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [0, .46] }) }]}><Pressable accessibilityLabel="Close profile menu" onPress={onClose} style={styles.profileDrawerScrimPress} /></Animated.View><Animated.View style={[styles.profileDrawerPanel, { width: panelWidth, transform: [{ translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [panelWidth, 0] }) }] }]}><View style={styles.profileDrawerHeader}><View><Text style={styles.profileDrawerEyebrow}>PROFILE  &  ACCOUNT</Text><Text style={styles.profileDrawerName}>{fullName}</Text></View><Pressable accessibilityLabel="Close profile menu" onPress={onClose} style={styles.profileDrawerClose}><Text style={styles.profileDrawerCloseText}>×</Text></Pressable></View><View style={styles.profileDrawerMenu}>{rows.map(row => <Pressable key={row.label} disabled={!row.onPress} onPress={() => row.onPress && onSelect(row.onPress)} style={({ pressed }) => [styles.profileDrawerRow, pressed && styles.pressed]}><View style={styles.profileDrawerRowCopy}><Text style={styles.profileDrawerRowLabel}>{row.label}</Text><Text style={styles.profileDrawerRowDetail}>{row.detail}</Text></View><Text style={styles.profileDrawerChevron}>›</Text></Pressable>)}</View><View style={styles.profileDrawerFooter}><Pressable disabled={loggingOut} onPress={onLogout} style={styles.profileDrawerLogout}>{loggingOut ? <ActivityIndicator color="#B85A47" /> : <Text style={styles.profileDrawerLogoutText}>Log out</Text>}</Pressable></View></Animated.View></View>;
}

type DietPreference = 'vegetarian' | 'non-vegetarian' | 'vegan' | 'pescatarian';
function PersonalDetailsScreen({ avatarUrl, uploadingAvatar, loading, error, name, dob, phone, sex, height, weight, diet, onBack, onName, onDob, onSex, onHeight, onWeight, onDiet, onChooseAvatar, onRemoveAvatar, onSave }: { avatarUrl: string | null; uploadingAvatar: boolean; loading: boolean; error: string; name: string; dob: string; phone: string; sex: 'male' | 'female' | null; height: string; weight: string; diet: DietPreference; onBack: () => void; onName: (value: string) => void; onDob: (value: string) => void; onSex: (value: 'male' | 'female') => void; onHeight: (value: string) => void; onWeight: (value: string) => void; onDiet: (value: DietPreference) => void; onChooseAvatar: () => void; onRemoveAvatar: () => void; onSave: () => void }) { const diets: { value: DietPreference; label: string }[] = [{ value: 'vegetarian', label: 'Vegetarian' }, { value: 'non-vegetarian', label: 'Non-veg' }, { value: 'vegan', label: 'Vegan' }, { value: 'pescatarian', label: 'Pescatarian' }]; return <SafeAreaView style={styles.profileSubSafe}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}><View style={styles.profileSubScreen}><ScrollView contentContainerStyle={styles.personalDetailsContent} keyboardShouldPersistTaps="handled"><BackButton onPress={onBack} /><Text style={styles.profileSubTitle}>Personal details</Text>{loading && !name ? <ActivityIndicator color="#164D39" style={styles.ordersLoader} /> : <><View style={styles.personalAvatarRow}><Pressable onPress={onChooseAvatar} style={styles.personalAvatar}>{avatarUrl ? <Image source={{ uri: avatarUrl }} style={styles.profileAvatarImage} /> : <Text style={styles.personalAvatarText}>{name.trim().charAt(0).toUpperCase() || 'A'}</Text>}</Pressable><View><Pressable onPress={onChooseAvatar}><Text style={styles.personalPhotoAction}>{uploadingAvatar ? 'Uploading…' : 'Change profile picture'}</Text></Pressable>{avatarUrl ? <Pressable onPress={onRemoveAvatar}><Text style={styles.personalPhotoRemove}>Remove picture</Text></Pressable> : null}</View></View><Field label="Full name" value={name} onChangeText={onName} autoCapitalize="words" /><View style={styles.personalTwoColumn}><View style={styles.personalColumn}><Field label="Date of birth" value={dob} onChangeText={onDob} placeholder="YYYY-MM-DD" /></View><View style={styles.personalColumn}><Field label="Mobile" value={phone} onChangeText={() => {}} keyboardType="phone-pad" /></View></View><View style={styles.personalTwoColumn}><View style={styles.personalColumn}><Field label="Height · cm" value={height} onChangeText={onHeight} keyboardType="decimal-pad" /></View><View style={styles.personalColumn}><Field label="Weight · kg" value={weight} onChangeText={onWeight} keyboardType="decimal-pad" /></View></View><Text style={styles.personalLabel}>SEX</Text><View style={styles.personalChoiceRow}>{(['male', 'female'] as const).map(value => <Pressable key={value} onPress={() => onSex(value)} style={[styles.personalChoice, sex === value && styles.personalChoiceSelected]}><Text style={[styles.personalChoiceText, sex === value && styles.personalChoiceTextSelected]}>{value === 'male' ? 'Male' : 'Female'}</Text></Pressable>)}</View><Text style={styles.personalLabel}>DIET  ·  TAILORS FOOD RECOMMENDATIONS</Text><View style={styles.personalDietRow}>{diets.map(option => <Pressable key={option.value} onPress={() => onDiet(option.value)} style={[styles.personalDietChoice, diet === option.value && styles.personalChoiceSelected]}><Text style={[styles.personalChoiceText, diet === option.value && styles.personalChoiceTextSelected]}>{option.label}</Text></Pressable>)}</View>{error ? <Text style={styles.error}>{error}</Text> : null}</>}</ScrollView><View style={styles.profileSubFooter}><PrimaryButton label="Save changes" loading={loading} onPress={onSave} /></View></View></KeyboardAvoidingView></SafeAreaView>; }

function PrivacyConsentScreen({ notifications, healthPersonalisation, aiContext, doctorSharing, saving, error, onBack, onNotifications, onHealthPersonalisation, onAiContext, onDoctorSharing, onSave }: { notifications: boolean; healthPersonalisation: boolean; aiContext: boolean; doctorSharing: boolean; saving: boolean; error: string; onBack: () => void; onNotifications: (value: boolean) => void; onHealthPersonalisation: (value: boolean) => void; onAiContext: (value: boolean) => void; onDoctorSharing: (value: boolean) => void; onSave: () => void }) { return <SafeAreaView style={styles.profileSubSafe}><StatusBar style="dark" /><View style={styles.profileSubScreen}><ScrollView contentContainerStyle={styles.profileSubContent}><BackButton onPress={onBack} /><Text style={styles.profileSubTitle}>Privacy and consent</Text><Text style={styles.profileSubIntro}>You control what Ayurnidaan uses and who can see it.{`\n`}Changes apply immediately.</Text><View style={styles.privacyRows}><PrivacyToggleRow title="Notifications" description="Plan reminders and appointment alerts" value={notifications} onChange={onNotifications} /><PrivacyToggleRow title="Health personalisation" description="Use your data to tailor recommendations" value={healthPersonalisation} onChange={onHealthPersonalisation} /><PrivacyToggleRow title="AI context" description="Let the assistant read your health record" value={aiContext} onChange={onAiContext} /><PrivacyToggleRow title="Doctor sharing" description="Let doctors see your health data" value={doctorSharing} onChange={onDoctorSharing} /></View><Text style={styles.privacyFootnote}>Your health information is stored privately. Read the <Text style={styles.privacyLink}>Privacy Policy</Text> for how it is handled.</Text>{error ? <Text style={styles.error}>{error}</Text> : null}</ScrollView><View style={styles.profileSubFooter}><PrimaryButton label="Save changes" loading={saving} onPress={onSave} /></View></View></SafeAreaView>; }
function PrivacyToggleRow({ title, description, value, onChange }: { title: string; description: string; value: boolean; onChange: (value: boolean) => void }) { return <View style={styles.privacyRow}><View style={styles.privacyRowCopy}><Text style={styles.privacyRowTitle}>{title}</Text><Text style={styles.privacyRowDescription}>{description}</Text></View><Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={[styles.privacyToggle, value && styles.privacyToggleOn]}><View style={[styles.privacyToggleKnob, value && styles.privacyToggleKnobOn]} /></Pressable></View>; }

function OrdersScreen({ orders, loading, onBack, onSelect, onShop }: { orders: ShopOrder[]; loading: boolean; onBack: () => void; onSelect: (order: ShopOrder) => void; onShop: () => void }) { const latest = orders[0]?.created_at ? formatOrderDate(orders[0].created_at) : ''; return <SafeAreaView style={styles.profileSubSafe}><StatusBar style="dark" /><View style={styles.profileListScreen}><BackButton onPress={onBack} /><Text style={styles.profileSubTitle}>My orders</Text>{orders.length ? <Text style={styles.profileListIntro}>{orders.length} {orders.length === 1 ? 'order' : 'orders'} · last placed {latest.split(',')[0]}</Text> : null}{loading ? <ActivityIndicator color="#164D39" style={styles.ordersLoader} /> : orders.length ? <ScrollView contentContainerStyle={styles.profileOrderList}>{orders.map(order => { const count = order.items.reduce((sum, item) => sum + item.quantity, 0); return <Pressable key={order.id} onPress={() => onSelect(order)} style={({ pressed }) => [styles.profileOrderCard, pressed && styles.pressed]}><View style={styles.profileOrderTop}><Text style={styles.profileOrderNumber}>#{order.id.slice(0, 8).toUpperCase()}</Text><Text style={styles.profileOrderAmount}>₹{order.total_amount.toLocaleString('en-IN')}</Text></View><Text style={styles.profileOrderDate}>{formatOrderDate(order.created_at)}</Text><View style={styles.profileOrderBottom}><View style={[styles.profileOrderStatus, order.status === 'delivered' && styles.profileOrderDelivered]}><Text style={styles.profileOrderStatusText}>{formatOrderStatus(order.status).toUpperCase()}</Text></View><Text style={styles.profileOrderCount}>{count} {count === 1 ? 'item' : 'items'}</Text><Text style={styles.profileOrderChevron}>›</Text></View></Pressable>; })}</ScrollView> : <View style={styles.noOrders}><Text style={styles.emptyCartTitle}>No previous orders</Text><Text style={styles.emptyCartCopy}>Orders you place will appear here.</Text><PrimaryButton label="Start shopping" onPress={onShop} /></View>}</View></SafeAreaView>; }

function AppointmentsScreen({ appointments, loading, onBack, onSelect, onBook }: { appointments: BookedAppointment[]; loading: boolean; onBack: () => void; onSelect: (appointment: BookedAppointment) => void; onBook: () => void }) { const today = new Date().toISOString().slice(0, 10); const upcoming = appointments.filter(item => item.status === 'booked' && item.appointment_date >= today); const past = appointments.filter(item => !upcoming.includes(item)); const renderAppointment = (appointment: BookedAppointment, isPast = false) => <Pressable key={appointment.id} onPress={() => onSelect(appointment)} style={({ pressed }) => [styles.profileAppointmentCard, pressed && styles.pressed]}><View style={[styles.profileAppointmentAvatar, isPast && styles.profileAppointmentAvatarPast]}><Text style={styles.profileAppointmentInitials}>{appointment.doctor_initials}</Text></View><View style={styles.profileAppointmentCopy}><Text style={styles.profileAppointmentName}>{appointment.doctor_name}</Text><Text style={styles.profileAppointmentDate}>{formatAppointmentDate(appointment.appointment_date)} · {appointment.appointment_time}</Text>{isPast ? null : <Text style={styles.profileAppointmentType}>{appointment.consultation_type.toUpperCase()}</Text>}</View>{isPast ? <Text style={styles.profileAppointmentCompleted}>COMPLETED</Text> : <Text style={styles.profileOrderChevron}>›</Text>}</Pressable>; return <SafeAreaView style={styles.profileSubSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.profileListScreen}><BackButton onPress={onBack} /><Text style={styles.profileSubTitle}>My appointments</Text>{loading ? <ActivityIndicator color="#164D39" style={styles.ordersLoader} /> : <><Text style={styles.profileListSection}>UPCOMING</Text>{upcoming.length ? upcoming.map(item => renderAppointment(item)) : <Text style={styles.profileEmptyList}>No upcoming appointments.</Text>}<Text style={styles.profileListSection}>PAST</Text>{past.length ? past.map(item => renderAppointment(item, true)) : <Text style={styles.profileEmptyList}>No past appointments.</Text>}<Pressable onPress={onBook} style={styles.profileBookAnother}><Text style={styles.profileBookAnotherText}>Book another appointment</Text></Pressable></>}</ScrollView></SafeAreaView>; }

function OrderDetails({ order, onBack }: { order: ShopOrder; onBack: () => void }) {
  const steps = ['Order Confirmed', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
  const progressByStatus: Record<string, number> = { placed: 0, packed: 1, shipped: 2, delivered: 4, cancelled: -1 };
  const progress = progressByStatus[order.status] ?? 0;
  return <SafeAreaView style={styles.profileSubSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.profileOrderDetails}><BackButton onPress={onBack} /><Text style={styles.profileSubTitle}>Order details</Text><View style={styles.profileOrderMetaLine}><Text style={styles.profileOrderNumber}>#{order.id.slice(0, 8).toUpperCase()}</Text><Text style={styles.profileOrderDate}>{formatOrderDate(order.created_at)}</Text></View><View style={styles.profileOrderItemsCard}>{order.items.map(item => <View key={item.product_id} style={styles.profileOrderItem}><View style={styles.profileOrderItemVisual}><Text style={styles.profileOrderItemGlyph}>{(item.product?.name ?? 'A').charAt(0)}</Text></View><View style={styles.profileOrderItemCopy}><Text style={styles.profileOrderItemName}>{item.product?.name ?? 'Ayurvedic Product'}</Text><Text style={styles.profileOrderItemWeight}>{item.product?.weight ?? ''}</Text><Text style={styles.profileOrderItemQuantity}>Qty {item.quantity}</Text></View><Text style={styles.profileOrderItemPrice}>₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}</Text></View>)}</View><View style={styles.profileOrderTotal}><Text style={styles.profileOrderTotalLabel}>Total amount</Text><Text style={styles.profileOrderTotalValue}>₹{order.total_amount.toLocaleString('en-IN')}</Text></View><Text style={styles.profileListSection}>TRACK ORDER</Text><View style={styles.profileTrackingCard}>{steps.map((step, index) => <View key={step} style={styles.profileTrackingStep}><View style={styles.profileTrackingMarkerColumn}><View style={[styles.profileTrackingMarker, index <= progress && styles.profileTrackingMarkerDone]}>{index <= progress ? <Text style={styles.profileTrackingCheck}>✓</Text> : null}</View>{index < steps.length - 1 ? <View style={[styles.profileTrackingLine, index < progress && styles.profileTrackingLineDone]} /> : null}</View><View style={styles.profileTrackingCopy}><Text style={[styles.profileTrackingLabel, index <= progress && styles.profileTrackingLabelDone]}>{step}</Text><Text style={styles.profileTrackingDate}>{index === 0 ? formatOrderDate(order.created_at) : index <= progress ? 'Updated recently' : 'Pending'}</Text></View></View>)}</View></ScrollView></SafeAreaView>;
}

function AppointmentDetails({ appointment, onBack }: { appointment: BookedAppointment; onBack: () => void }) { return <SafeAreaView style={styles.appointmentV2Safe}><StatusBar style="light" /><View style={styles.appointmentV2Header}><BackButton onPress={onBack} light /><View style={styles.appointmentV2Identity}><View style={styles.appointmentV2Avatar}><Text style={styles.appointmentV2Initials}>{appointment.doctor_initials}</Text></View><View style={styles.appointmentV2Copy}><Text style={styles.appointmentV2Name}>{appointment.doctor_name}</Text><Text style={styles.appointmentV2Meta}>{formatAppointmentDate(appointment.appointment_date)} · {appointment.appointment_time} · {appointment.consultation_type}</Text></View></View></View><View style={styles.appointmentV2Body}><ClinicalSection title="Discussion summary" icon="=" content={appointment.discussion_summary} empty="The doctor has not added a discussion summary yet." /><ClinicalSection title="Prescription" icon="Rx" content={appointment.prescription} empty="The doctor has not added a prescription yet." /><View style={styles.appointmentV2Actions}><Pressable style={styles.appointmentReschedule}><Text style={styles.appointmentRescheduleText}>Reschedule</Text></Pressable><Pressable style={styles.appointmentJoin}><Text style={styles.appointmentJoinText}>Join consultation</Text></Pressable></View></View></SafeAreaView>; }
function ClinicalSection({ title, icon, content, empty }: { title: string; icon: string; content: string | null; empty: string }) { return <View style={styles.clinicalV2Card}><View style={styles.clinicalV2TitleRow}><View style={styles.clinicalV2Icon}><Text style={styles.clinicalV2IconText}>{icon}</Text></View><Text style={styles.clinicalV2Title}>{title}</Text></View><Text style={[styles.clinicalV2Content, !content && styles.clinicalV2Empty]}>{content || empty}</Text></View>; }
function SettingToggle({ title, description, value, onChange }: { title: string; description?: string; value: boolean; onChange: (value: boolean) => void }) { return <View style={styles.settingRow}><View style={styles.settingCopy}><Text style={styles.settingTitle}>{title}</Text>{description ? <Text style={styles.settingDescription}>{description}</Text> : null}</View><Pressable accessibilityRole="switch" accessibilityState={{ checked: value }} onPress={() => onChange(!value)} style={[styles.toggle, value && styles.toggleOn]}><View style={[styles.toggleKnob, value && styles.toggleKnobOn]} /></Pressable></View>; }

function formatOrderDate(value: string) { return new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }); }
function formatOrderStatus(value: string) { return value.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '); }

type ChatMessage = { role: 'user' | 'assistant'; content: string; options?: string[] };
function AIChat({ onExit, onOpenShop, onOpenDoctor, onOpenProfile }: { onExit: () => void; onOpenShop: () => void; onOpenDoctor: () => void; onOpenProfile: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'assistant', content: 'Namaste! How can I support your wellness journey today?' }]);
  const [input, setInput] = useState(''); const [sending, setSending] = useState(false);
  async function send() { const content = input.trim(); if (!content || sending) return; const next: ChatMessage[] = [...messages, { role: 'user', content }]; setMessages(next); setInput(''); setSending(true); const { data } = await supabase.functions.invoke('ai-chat', { body: { messages: next } }); setMessages(current => [...current, { role: 'assistant', content: data?.reply || 'Upcoming feature' }]); setSending(false); }
  return <SafeAreaView style={styles.aiSafe}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={0}><View style={styles.aiHeader}><Text style={styles.aiTitle}>Ayurnidaan AI</Text><Text style={styles.aiSubtitle}>Your Ayurveda wellness assistant</Text></View><ScrollView style={styles.flex} contentContainerStyle={styles.chatMessages} keyboardShouldPersistTaps="handled">{messages.map((message, index) => <View key={index} style={[styles.chatBubble, message.role === 'user' ? styles.userBubble : styles.assistantBubble]}><Text style={[styles.chatText, message.role === 'user' && styles.userChatText]}>{message.content}</Text></View>)}{sending ? <View style={[styles.chatBubble, styles.assistantBubble]}><ActivityIndicator color="#075A3F" /></View> : null}</ScrollView><View style={styles.chatComposer}><TextInput value={input} onChangeText={setInput} onSubmitEditing={send} placeholder="Ask about your wellness..." placeholderTextColor="#929993" returnKeyType="send" style={styles.chatInput} /><Pressable onPress={send} style={styles.chatSend}><Text style={styles.chatSendText}>➤</Text></Pressable></View></KeyboardAvoidingView><View style={styles.bottomNav}><NavItem icon="⌂" label="Home" onPress={onExit} /><NavItem icon="✚" label="Doctor" onPress={onOpenDoctor} /><NavItem icon="♧" label="AI" active /><NavItem icon="🛍" label="Shop" onPress={onOpenShop} /><NavItem icon="♙" label="Profile" onPress={onOpenProfile} /></View></SafeAreaView>;
}

type Product = { id: string; name: string; weight: string; price: number; mrp: number; icon: string; categories: string[]; tags: string[]; description: string; rating: string };
type UserAddress = { id: string; label: string; recipient_name: string; address_line: string; city: string; state: string; postcode: string; is_default: boolean };
type PlacedShopOrder = { id: string; itemCount: number; total: number; addressLabel: string };
const shopCategories = ['Digestive Health', 'Stress & Sleep', 'Energy & Vitality', 'Immunity & Wellness', 'Joint & Muscle Health', 'Respiratory Health', 'Skin & Hair', "Women's Wellness", "Men's Wellness", 'Urinary & Kidney Health', 'Heart & Circulatory Health', 'Weight & Metabolism', 'Detox & Cleansing', 'Cognitive & Memory', 'General Wellness'];
const products: Product[] = [
  { id: 'ashwagandha', name: 'Ashwagandha', weight: '500 mg · 60 tablets', price: 599, mrp: 699, icon: 'A', categories: ['Energy & Vitality'], tags: ['recommended', 'best-seller'], description: 'Supports stress relief, sustained energy, restful sleep, and overall wellness.', rating: '4.7 (920)' },
  { id: 'triphala', name: 'Triphala', weight: '500 mg · 60 tablets', price: 399, mrp: 499, icon: 'T', categories: ['Digestive Health'], tags: ['recommended', 'best-seller'], description: 'A traditional Ayurvedic blend formulated to support digestion and daily wellbeing.', rating: '4.6 (540)' },
  { id: 'chyawanprash', name: 'Chyawanprash', weight: '500 g', price: 449, mrp: 549, icon: 'C', categories: ['Immunity & Wellness'], tags: ['recommended', 'best-seller'], description: 'A nourishing herbal formulation to support immunity, strength, and vitality.', rating: '4.8 (760)' },
  { id: 'brahmi', name: 'Brahmi', weight: '500 mg · 60 tablets', price: 499, mrp: 599, icon: 'B', categories: ['Cognitive & Memory'], tags: ['recommended', 'best-seller'], description: 'A traditional Ayurvedic formulation selected to support cognitive health and memory.', rating: '4.6 (420)' },
];

function ShopFlow({ session, onExit, onOpenDoctor, onOpenProfile, onOpenAI }: { session: Session | null; onExit: () => void; onOpenDoctor: () => void; onOpenProfile: () => void; onOpenAI: () => void }) {
  const [stage, setStage] = useState<'home' | 'details' | 'cart' | 'address' | 'success'>('home');
  const [selected, setSelected] = useState(products[0]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [shopProducts, setShopProducts] = useState(products);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [previouslyOrderedIds, setPreviouslyOrderedIds] = useState<string[]>([]);
  const [recommendedProductNames, setRecommendedProductNames] = useState<string[]>(products.slice(0, 3).map(product => product.name));
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<PlacedShopOrder | null>(null);
  const [addresses, setAddresses] = useState<UserAddress[]>([]); const [selectedAddress, setSelectedAddress] = useState<UserAddress | null>(null);
  const [addressReturn, setAddressReturn] = useState<'home' | 'checkout'>('home'); const [addingAddress, setAddingAddress] = useState(false);
  const [addressLabel, setAddressLabel] = useState('Home'); const [recipientName, setRecipientName] = useState(''); const [addressLine, setAddressLine] = useState('');
  const [addressCity, setAddressCity] = useState(''); const [addressState, setAddressState] = useState(''); const [addressPostcode, setAddressPostcode] = useState(''); const [addressError, setAddressError] = useState('');
  useEffect(() => {
    let active = true;
    supabase.from('shop_products').select('id, name, weight, price, mrp, icon, categories, tags, description, rating, rating_count').eq('active', true).order('sort_order').then(({ data }) => {
      if (!active || !data?.length) return;
      setShopProducts(data.map(item => ({ ...item, categories: item.categories ?? [], tags: item.tags ?? [], rating: `${Number(item.rating).toFixed(1)} (${item.rating_count})` })));
    });
    if (session?.user.id) supabase.from('shop_order_items').select('product_id').eq('user_id', session.user.id).then(({ data }) => {
      if (active) setPreviouslyOrderedIds([...new Set((data ?? []).map(item => item.product_id))]);
    });
    if (session?.user.id) void (async () => {
      const { data: savedPlan } = await supabase.from('supplement_recommendation_plans').select('recommendations').eq('user_id', session.user.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
      let plan = savedPlan?.recommendations as { recommendations?: { supplement?: unknown }[] } | null | undefined;
      if (!plan) {
        const { data: assessment } = await supabase.from('current_health_assessments').select('id').eq('user_id', session.user.id).order('completed_at', { ascending: false }).limit(1).maybeSingle();
        if (assessment?.id) {
          const { data: generated } = await supabase.functions.invoke('generate-supplement-recommendations', { body: { assessmentId: assessment.id } });
          plan = generated as { recommendations?: { supplement?: unknown }[] } | null | undefined;
        }
      }
      const names = Array.isArray(plan?.recommendations) ? plan.recommendations.flatMap(item => typeof item.supplement === 'string' ? [item.supplement] : []) : [];
      if (active && Array.isArray(plan?.recommendations)) setRecommendedProductNames(names);
    })();
    if (session?.user.id) supabase.from('user_addresses').select('id, label, recipient_name, address_line, city, state, postcode, is_default').eq('user_id', session.user.id).order('is_default', { ascending: false }).then(({ data }) => { if (active) { setAddresses(data ?? []); setSelectedAddress((data ?? [])[0] ?? null); } });
    return () => { active = false; };
  }, [session?.user.id]);
  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartItems = shopProducts.filter(product => cart[product.id]).map(product => ({ product, quantity: cart[product.id] }));
  const cartTotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleProducts = shopProducts.filter(product => (selectedCategory === 'All' || product.categories.includes(selectedCategory)) && (!normalizedSearch || `${product.name} ${product.description} ${product.categories.join(' ')} ${product.tags.join(' ')}`.toLowerCase().includes(normalizedSearch)));
  function addToCart(product: Product) { setCart(current => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 })); }
  function changeQuantity(id: string, amount: number) { setCart(current => { const next = Math.max(0, (current[id] ?? 0) + amount); const updated = { ...current }; if (next) updated[id] = next; else delete updated[id]; return updated; }); }
  function openProduct(product: Product) { setSelected(product); setStage('details'); }
  function openAddresses(returnTo: 'home' | 'checkout') { setAddressReturn(returnTo); setAddressError(''); setStage('address'); }
  async function saveAddress() {
    if (!session?.user.id) return;
    if (!recipientName.trim() || !addressLine.trim() || !addressCity.trim() || !addressState.trim() || !/^\d{6}$/.test(addressPostcode)) return setAddressError('Complete every field and enter a valid 6-digit postcode.');
    const { data, error } = await supabase.from('user_addresses').insert({ user_id: session.user.id, label: addressLabel.trim() || 'Home', recipient_name: recipientName.trim(), address_line: addressLine.trim(), city: addressCity.trim(), state: addressState.trim(), postcode: addressPostcode, is_default: addresses.length === 0 }).select('id, label, recipient_name, address_line, city, state, postcode, is_default').single();
    if (error || !data) return setAddressError(error?.message ?? 'Could not save address.');
    setAddresses(current => [data, ...current]); setSelectedAddress(data); setAddingAddress(false); setRecipientName(''); setAddressLine(''); setAddressCity(''); setAddressState(''); setAddressPostcode('');
  }
  async function confirmAddress() {
    if (!session?.user.id || !selectedAddress) { setAddressError('Select an address or add a new one before continuing.'); return; }
    await supabase.from('user_addresses').update({ is_default: false, updated_at: new Date().toISOString() }).eq('user_id', session.user.id);
    const { error } = await supabase.from('user_addresses').update({ is_default: true, updated_at: new Date().toISOString() }).eq('id', selectedAddress.id).eq('user_id', session.user.id);
    if (error) { setAddressError(error.message); return; }
    setAddresses(current => current.map(address => ({ ...address, is_default: address.id === selectedAddress.id })));
    if (addressReturn === 'checkout') await checkout(true); else setStage('home');
  }
  async function checkout(confirmed = false) {
    if (!session?.user.id) return setOrderError('Please sign in again before placing your order.');
    if (!confirmed) return openAddresses('checkout');
    if (!selectedAddress) { setAddressError('Select an address or add a new one before checkout.'); return; }
    setPlacingOrder(true); setOrderError('');
    const { data: order, error: orderInsertError } = await supabase.from('shop_orders').insert({ user_id: session.user.id, total_amount: cartTotal, delivery_postcode: selectedAddress.postcode, delivery_address_id: selectedAddress.id, delivery_address_label: selectedAddress.label, delivery_address_snapshot: `${selectedAddress.recipient_name}\n${selectedAddress.address_line}\n${selectedAddress.city}, ${selectedAddress.state} ${selectedAddress.postcode}` }).select('id').single();
    if (orderInsertError || !order) { setPlacingOrder(false); return setOrderError(orderInsertError?.message ?? 'Could not place your order.'); }
    const { error: itemsError } = await supabase.from('shop_order_items').insert(cartItems.map(({ product, quantity }) => ({ order_id: order.id, user_id: session.user.id, product_id: product.id, quantity, unit_price: product.price })));
    setPlacingOrder(false);
    if (itemsError) return setOrderError(itemsError.message);
    setPreviouslyOrderedIds(current => [...new Set([...current, ...cartItems.map(item => item.product.id)])]);
    setPlacedOrder({ id: order.id, itemCount: cartCount, total: cartTotal, addressLabel: selectedAddress.label });
    setStage('success');
  }
  if (stage === 'address') return <AddressBook mode={addressReturn === 'checkout' ? 'checkout' : 'shopping'} total={cartTotal} addresses={addresses} selected={selectedAddress} adding={addingAddress} fields={{ addressLabel, recipientName, addressLine, addressCity, addressState, addressPostcode }} error={addressError} onSelect={setSelectedAddress} onToggleAdd={() => setAddingAddress(!addingAddress)} onField={(field, value) => { if (field === 'label') setAddressLabel(value); if (field === 'name') setRecipientName(value); if (field === 'line') setAddressLine(value); if (field === 'city') setAddressCity(value); if (field === 'state') setAddressState(value); if (field === 'postcode') setAddressPostcode(value); }} onSave={saveAddress} onBack={() => setStage(addressReturn === 'checkout' ? 'cart' : 'home')} onConfirm={confirmAddress} confirming={placingOrder} />;
  if (stage === 'success') return <OrderSuccess order={placedOrder} onReturn={() => { setCart({}); setPlacedOrder(null); setStage('home'); }} />;
  if (stage === 'cart') return <ShopCart items={cartItems} total={cartTotal} error={orderError} placing={placingOrder} onBack={() => setStage('home')} onChange={changeQuantity} onCheckout={() => checkout()} />;
  if (stage === 'details') return <SafeAreaView style={styles.shopSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.productDetailPage}><BackButton onPress={() => setStage('home')} /><Text style={styles.shopTitle}>Product Details</Text><View style={styles.productDetailHero}><View style={styles.productDetailCopy}><Text style={styles.productDetailName}>{selected.name}</Text><Text style={styles.productWeight}>{selected.weight}</Text></View><ProductVisual product={selected} /></View><Text style={styles.productDetailPrice}>₹{selected.price}</Text><Text style={styles.productMrp}>MRP ₹{selected.mrp}</Text><View style={styles.ratingLine}><Text style={styles.ratingStar}>★</Text><Text style={styles.ratingText}>{selected.rating}</Text></View><Text style={styles.productDescription}>{selected.description}</Text><View style={styles.productAction}>{cart[selected.id] ? <ProductQuantityControl quantity={cart[selected.id]} onDecrease={() => changeQuantity(selected.id, -1)} onIncrease={() => changeQuantity(selected.id, 1)} large /> : <PrimaryButton label="Add to Cart" onPress={() => addToCart(selected)} />}</View></ScrollView><CartButton count={cartCount} onPress={() => setStage('cart')} /></SafeAreaView>;
  return <ShopHome products={visibleProducts} cart={cart} cartCount={cartCount} search={search} selectedCategory={selectedCategory} showAllCategories={showAllCategories} selectedAddress={selectedAddress} previouslyOrderedIds={previouslyOrderedIds} recommendedProductNames={recommendedProductNames} onSearch={setSearch} onCategory={setSelectedCategory} onToggleCategories={() => setShowAllCategories(current => !current)} onAddress={() => openAddresses('home')} onOpen={openProduct} onAdd={addToCart} onChange={changeQuantity} onCart={() => setStage('cart')} onExit={onExit} onOpenDoctor={onOpenDoctor} onOpenAI={onOpenAI} onOpenProfile={onOpenProfile} />;
}

function ShopHome({ products: visibleProducts, cart, cartCount, search, selectedCategory, showAllCategories, selectedAddress, previouslyOrderedIds, recommendedProductNames, onSearch, onCategory, onToggleCategories, onAddress, onOpen, onAdd, onChange, onCart, onExit, onOpenDoctor, onOpenAI, onOpenProfile }: { products: Product[]; cart: Record<string, number>; cartCount: number; search: string; selectedCategory: string; showAllCategories: boolean; selectedAddress: UserAddress | null; previouslyOrderedIds: string[]; recommendedProductNames: string[]; onSearch: (value: string) => void; onCategory: (value: string) => void; onToggleCategories: () => void; onAddress: () => void; onOpen: (product: Product) => void; onAdd: (product: Product) => void; onChange: (id: string, amount: number) => void; onCart: () => void; onExit: () => void; onOpenDoctor: () => void; onOpenAI: () => void; onOpenProfile: () => void }) {
  const filters = showAllCategories ? shopCategories : shopCategories.slice(0, 3);
  return <SafeAreaView style={styles.shopSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.shopHomeScroll} keyboardShouldPersistTaps="handled"><View style={styles.shopV2TopRow}><BackButton onPress={onExit} /><Text style={styles.shopTitle}>Shop</Text></View><View style={styles.shopSearch}><Text style={styles.shopSearchIcon}>⌕</Text><TextInput value={search} onChangeText={onSearch} placeholder="Search products" placeholderTextColor="#8B9690" style={styles.shopSearchInput} /></View><Pressable onPress={onAddress} style={styles.deliveryBar}><Text style={styles.deliveryPin}>⌖</Text><View style={styles.deliveryCopy}><Text style={styles.deliveryLabel}>DELIVER TO</Text><Text style={styles.deliveryAddress}>{selectedAddress ? `${selectedAddress.label} · ${selectedAddress.postcode}` : 'Add delivery address'}</Text></View><Text style={styles.deliveryArrow}>›</Text></Pressable><Text style={styles.shopCategoryHeading}>CATEGORIES</Text><View style={styles.categoryPills}><Pressable onPress={() => onCategory('All')} style={[styles.categoryPill, selectedCategory === 'All' && styles.categoryPillSelected]}><Text style={[styles.categoryPillText, selectedCategory === 'All' && styles.categoryPillTextSelected]}>All</Text></Pressable>{filters.map(category => <Pressable key={category} onPress={() => onCategory(category)} style={[styles.categoryPill, selectedCategory === category && styles.categoryPillSelected]}><Text style={[styles.categoryPillText, selectedCategory === category && styles.categoryPillTextSelected]}>{category}</Text></Pressable>)}<Pressable onPress={onToggleCategories} style={styles.categoryMorePill}><Text style={styles.categoryMoreText}>{showAllCategories ? 'Fewer filters' : 'More filters'}</Text></Pressable></View><ShopSection title="Recommended for you" products={recommendedProductNames.flatMap(name => visibleProducts.find(product => product.name === name) ?? [])} cart={cart} onOpen={onOpen} onAdd={onAdd} onChange={onChange} /><ShopSection title="Best sellers" products={visibleProducts.filter(product => product.tags.includes('best-seller'))} cart={cart} onOpen={onOpen} onAdd={onAdd} onChange={onChange} /><ShopSection title="Previously ordered" products={visibleProducts.filter(product => previouslyOrderedIds.includes(product.id))} cart={cart} onOpen={onOpen} onAdd={onAdd} onChange={onChange} /><ShopSection title="Explore" products={visibleProducts} cart={cart} onOpen={onOpen} onAdd={onAdd} onChange={onChange} />{!visibleProducts.length ? <Text style={styles.noProducts}>No products match your search and filters.</Text> : null}</ScrollView><CartButton count={cartCount} onPress={onCart} home /><View style={[styles.bottomNav, styles.shopBottomNav]}><NavItem icon="⌂" label="Home" onPress={onExit} /><NavItem icon="✚" label="Doctor" onPress={onOpenDoctor} /><NavItem icon="♧" label="AI" onPress={onOpenAI} /><NavItem icon="🛍" label="Shop" active /><NavItem icon="♙" label="Profile" onPress={onOpenProfile} /></View></SafeAreaView>;
}

function ShopSection({ title, products: sectionProducts, cart, onOpen, onAdd, onChange }: { title: string; products: Product[]; cart: Record<string, number>; onOpen: (product: Product) => void; onAdd: (product: Product) => void; onChange: (id: string, amount: number) => void }) { if (!sectionProducts.length) return null; return <View style={styles.shopSection}><View style={styles.shopSectionHeading}><Text style={styles.shopV2SectionTitle}>{title}</Text><Text style={styles.shopSectionCount}>{sectionProducts.length} items</Text></View><View style={styles.productGrid}>{sectionProducts.map(product => <ShopProductCard key={product.id} product={product} quantity={cart[product.id] ?? 0} onOpen={() => onOpen(product)} onAdd={() => onAdd(product)} onDecrease={() => onChange(product.id, -1)} onIncrease={() => onChange(product.id, 1)} />)}</View></View>; }

function ShopCart({ items, total, error, placing, onBack, onChange, onCheckout }: { items: { product: Product; quantity: number }[]; total: number; error: string; placing: boolean; onBack: () => void; onChange: (id: string, amount: number) => void; onCheckout: () => void }) { return <SafeAreaView style={styles.shopSafe}><StatusBar style="dark" /><View style={styles.shopPage}><BackButton onPress={onBack} /><Text style={styles.shopTitle}>My cart</Text><Text style={styles.cartSubtitle}>{items.length} {items.length === 1 ? 'item' : 'items'} · delivered in 3–5 days</Text>{items.length ? <><ScrollView contentContainerStyle={styles.cartList}>{items.map(({ product, quantity }) => <View key={product.id} style={styles.cartItem}><ProductVisual product={product} small /><View style={styles.cartItemInfo}><Text style={styles.cartItemName}>{product.name}</Text><Text style={styles.productWeight}>{product.weight}</Text><Text style={styles.cartItemPrice}>₹{product.price}</Text></View><View style={styles.quantityControl}><Pressable onPress={() => onChange(product.id, -1)} style={styles.quantityButton}><Text style={styles.quantityButtonText}>−</Text></Pressable><Text style={styles.quantityValue}>{quantity}</Text><Pressable onPress={() => onChange(product.id, 1)} style={[styles.quantityButton, styles.quantityButtonAdd]}><Text style={[styles.quantityButtonText, styles.quantityButtonTextAdd]}>+</Text></Pressable></View></View>)}<OrderSummary total={total} /></ScrollView><View style={styles.cartFooter}><View style={styles.cartFooterTotal}><View><Text style={styles.shopSummaryLabel}>TOTAL</Text></View><Text style={styles.cartFooterAmount}>₹{total.toLocaleString('en-IN')}</Text></View>{error ? <Text style={styles.error}>{error}</Text> : null}<PrimaryButton label="Checkout" loading={placing} onPress={onCheckout} /></View></> : <View style={styles.emptyCart}><Text style={styles.emptyCartIcon}>🛒</Text><Text style={styles.emptyCartTitle}>Your cart is empty</Text><Text style={styles.emptyCartCopy}>Add something from the shop to begin.</Text><PrimaryButton label="Continue shopping" onPress={onBack} /></View>}</View></SafeAreaView>; }

function AddressBook({ mode, total, addresses, selected, adding, fields, error, onSelect, onToggleAdd, onField, onSave, onBack, onConfirm, confirming }: { mode: 'checkout' | 'shopping'; total: number; addresses: UserAddress[]; selected: UserAddress | null; adding: boolean; fields: { addressLabel: string; recipientName: string; addressLine: string; addressCity: string; addressState: string; addressPostcode: string }; error: string; onSelect: (address: UserAddress) => void; onToggleAdd: () => void; onField: (field: 'label' | 'name' | 'line' | 'city' | 'state' | 'postcode', value: string) => void; onSave: () => void; onBack: () => void; onConfirm: () => void; confirming: boolean }) { return <SafeAreaView style={styles.shopSafe}><StatusBar style="dark" /><View style={styles.addressScreen}><ScrollView contentContainerStyle={styles.addressPage} keyboardShouldPersistTaps="handled"><BackButton onPress={onBack} /><Text style={styles.shopTitle}>Delivery address</Text><Text style={styles.addressHint}>{mode === 'checkout' ? 'Select an address and confirm it before placing your order.' : 'Choose where your orders should be delivered.'}</Text>{addresses.map(address => <Pressable key={address.id} onPress={() => onSelect(address)} style={[styles.addressCard, selected?.id === address.id && styles.addressCardSelected]}><View style={styles.addressRadio}>{selected?.id === address.id ? <View style={styles.addressRadioDot} /> : null}</View><View style={styles.addressCardCopy}><Text style={styles.addressCardTitle}>{address.label}</Text><Text style={styles.addressCardText}>{address.address_line}, {address.city}, {address.state} {address.postcode}{`\n`}{address.recipient_name}</Text></View></Pressable>)}<Pressable onPress={onToggleAdd} style={styles.addAddressButton}><Text style={styles.addAddressButtonText}>{adding ? '− Close form' : '+ Add a new address'}</Text></Pressable>{adding ? <View style={styles.addressForm}><Field label="Address label" value={fields.addressLabel} onChangeText={value => onField('label', value)} placeholder="Home" /><Field label="Recipient name" value={fields.recipientName} onChangeText={value => onField('name', value)} /><Field label="Address" value={fields.addressLine} onChangeText={value => onField('line', value)} placeholder="House number, street, locality" /><View style={styles.measureRow}><View style={styles.measureField}><Field label="City" value={fields.addressCity} onChangeText={value => onField('city', value)} /></View><View style={styles.measureField}><Field label="State" value={fields.addressState} onChangeText={value => onField('state', value)} /></View></View><Field label="Postcode" value={fields.addressPostcode} onChangeText={value => onField('postcode', value)} keyboardType="number-pad" maxLength={6} /><SecondaryButton label="Save address" onPress={onSave} /></View> : null}{mode === 'checkout' ? <><Text style={styles.summaryEyebrow}>ORDER SUMMARY</Text><OrderSummary total={total} /></> : null}{error ? <Text style={styles.error}>{error}</Text> : null}</ScrollView><View style={styles.addressFooter}><PrimaryButton label={mode === 'checkout' ? `Confirm address · ₹${total.toLocaleString('en-IN')}` : 'Save and continue shopping'} loading={confirming} onPress={onConfirm} /></View></View></SafeAreaView>; }

function OrderSummary({ total }: { total: number }) { return <View style={styles.orderSummaryCard}><View style={styles.orderSummaryRow}><Text style={styles.orderSummaryText}>Subtotal</Text><Text style={styles.orderSummaryText}>₹{total.toLocaleString('en-IN')}</Text></View><View style={styles.orderSummaryRow}><Text style={styles.orderSummaryText}>Delivery</Text><Text style={styles.orderSummaryText}>Free</Text></View><View style={styles.orderSummaryRow}><Text style={styles.orderSummaryTotal}>Total</Text><Text style={styles.orderSummaryTotal}>₹{total.toLocaleString('en-IN')}</Text></View></View>; }

function OrderSuccess({ order, onReturn }: { order: PlacedShopOrder | null; onReturn: () => void }) { const today = new Date(); const start = new Date(today); const end = new Date(today); start.setDate(today.getDate() + 5); end.setDate(today.getDate() + 7); const month = end.toLocaleDateString('en-IN', { month: 'short' }); const arrival = `${start.getDate()}–${end.getDate()} ${month} ${end.getFullYear()}`; return <Pressable accessibilityRole="button" accessibilityLabel="Return to shop" onPress={onReturn} style={styles.shopOrderSuccessPage}><StatusBar style="light" /><View style={styles.shopOrderSuccessDecor} /><View style={styles.shopOrderSuccessCheck}><Text style={styles.shopOrderSuccessCheckText}>✓</Text></View><Text style={styles.shopOrderSuccessTitle}>Order placed</Text><Text style={styles.shopOrderSuccessCopy}>Your Ayurvedic wellness products are being prepared. We will keep you updated on your order.</Text><View style={styles.shopOrderSuccessSummary}><SuccessRow label="ORDER" value={`#AY${(order?.id ?? '0000').slice(0, 4).toUpperCase()}`} /><SuccessRow label="ITEMS" value={`${order?.itemCount ?? 0} products`} /><SuccessRow label="DELIVER TO" value={order?.addressLabel ?? 'Home'} /><SuccessRow label="ARRIVING" value={arrival} /><SuccessRow label="PAID" value={`₹${(order?.total ?? 0).toLocaleString('en-IN')}`} last /></View><Text style={styles.shopOrderSuccessTap}>Tap anywhere to return to the shop</Text></Pressable>; }
function SuccessRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) { return <View style={[styles.shopOrderSuccessRow, last && styles.shopOrderSuccessRowLast]}><Text style={styles.shopOrderSuccessLabel}>{label}</Text><Text style={styles.shopOrderSuccessValue}>{value}</Text></View>; }

function ShopProductCard({ product, quantity, onOpen, onAdd, onDecrease, onIncrease }: { product: Product; quantity: number; onOpen: () => void; onAdd: () => void; onDecrease: () => void; onIncrease: () => void }) { return <Pressable onPress={onOpen} style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}><ProductVisual product={product} /><Text numberOfLines={1} style={styles.productName}>{product.name}</Text><Text numberOfLines={1} style={styles.productWeight}>{product.weight}</Text><Text style={styles.productPrice}>₹{product.price}</Text>{quantity ? <ProductQuantityControl quantity={quantity} onDecrease={onDecrease} onIncrease={onIncrease} /> : <Pressable onPress={(event) => { event.stopPropagation(); onAdd(); }} style={styles.quickAdd}><Text style={styles.quickAddText}>Add to cart</Text></Pressable>}</Pressable>; }
function productGlyph(name: string) { const glyphs: Record<string, string> = { Ashwagandha: 'अ', Chyawanprash: 'च', Triphala: 'त', Brahmi: 'ब', Shatavari: 'श', Tulsi: 'तु', Neem: 'नी', Giloy: 'गि', Amla: 'आ' }; return glyphs[name] ?? name.trim().charAt(0).toUpperCase(); }
function ProductVisual({ product, small = false }: { product: Product; small?: boolean }) { return <View style={[styles.productVisual, small && styles.productVisualSmall]}>{small ? null : <Text style={styles.productBottleText}>AYUR</Text>}<Text style={[styles.productVisualIcon, small && styles.productVisualIconSmall]}>{productGlyph(product.name)}</Text></View>; }
function ProductQuantityControl({ quantity, onDecrease, onIncrease, large = false }: { quantity: number; onDecrease: () => void; onIncrease: () => void; large?: boolean }) { return <View style={[styles.inlineQuantity, large && styles.inlineQuantityLarge]}><Pressable onPress={(event) => { event.stopPropagation(); onDecrease(); }} style={[styles.inlineQuantityButton, large && styles.inlineQuantityButtonLarge]}><Text style={styles.inlineQuantityButtonText}>−</Text></Pressable><Text style={[styles.inlineQuantityValue, large && styles.inlineQuantityValueLarge]}>{quantity}</Text><Pressable onPress={(event) => { event.stopPropagation(); onIncrease(); }} style={[styles.inlineQuantityButton, large && styles.inlineQuantityButtonLarge]}><Text style={styles.inlineQuantityButtonText}>+</Text></Pressable></View>; }
function CartButton({ count, onPress, home = false }: { count: number; onPress: () => void; home?: boolean }) { return <Pressable accessibilityLabel={`Open cart with ${count} items`} onPress={onPress} style={({ pressed }) => [styles.floatingCart, home && styles.floatingCartAboveNav, pressed && styles.pressed]}><Text style={styles.floatingCartIcon}>🛒</Text>{count ? <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{count}</Text></View> : null}</Pressable>; }

type ConsultationType = 'Video Consultation' | 'Audio Consultation';
type DoctorTag = 'Acidity' | 'Digestion' | 'Sleep' | 'Stress' | 'Joint pain' | 'Skin' | 'Fatigue' | 'Immunity' | "Women's health" | 'Weight';
type DoctorAttachment = { id: string; mimeType: string; name: string; size: number | null; storagePath: string; type: 'report' | 'photo'; uri: string };
type Doctor = { name: string; initials: string; portrait?: number; qualification: string; experience: string; specialty: 'Ayurveda' | 'Panchakarma'; fee: number; rating: string; patients: string; about: string; focusAreas: string[]; tags: DoctorTag[] };
type DoctorReview = { author: string; initials: string; consultation: string; age: string; rating: number; review: string; highlight?: string };
const doctorRatingBreakdown = [
  { stars: 5, count: 168 },
  { stars: 4, count: 32 },
  { stars: 3, count: 9 },
  { stars: 2, count: 3 },
  { stars: 1, count: 2 },
] as const;
const doctorReviews: DoctorReview[] = [
  { author: 'R. Iyer', initials: 'RI', consultation: 'Video consult', age: '3 weeks ago', rating: 5, review: 'Took time to go through my blood report before the call, so nothing had to be repeated. The diet changes were specific rather than generic advice.', highlight: 'Explains clearly' },
  { author: 'S. Kulkarni', initials: 'SK', consultation: 'Video consult', age: '2 months ago', rating: 4, review: 'Acidity settled over about six weeks. Follow-up guidance was practical and easy to fit into my daily routine.' },
  { author: 'P. Sharma', initials: 'PS', consultation: 'Video consult', age: '4 months ago', rating: 5, review: 'The consultation felt unhurried and thoughtful. I left with clear next steps and a plan that was simple to follow.' },
];
const doctors: Doctor[] = [
  { name: 'Dr Anita Deshmukh', initials: 'AD', qualification: 'BAMS, MD (Kayachikitsa)', experience: '12 yrs experience', specialty: 'Ayurveda', fee: 800, rating: '4.9', patients: '1.8k', about: 'Ayurveda physician focused on digestive health, sleep concerns and personalised long-term wellness.', focusAreas: ['Digestive health', 'Sleep', 'Stress care', 'Women’s health'], tags: ['Acidity', 'Digestion', 'Sleep', 'Stress', 'Skin', 'Immunity', "Women's health"] },
  { name: 'Dr Nikhil Khatana', initials: 'NK', portrait: require('./doc-dp/nikhil-khatana.jpeg'), qualification: 'BAMS, MD (Ayu)', experience: '8 yrs experience', specialty: 'Ayurveda', fee: 600, rating: '4.8', patients: '1.2k', about: 'Expert in Ayurveda, lifestyle disorders, gut health and personalised wellness care.', focusAreas: ['Gut health', 'Lifestyle disorders', 'Stress', 'Diet planning'], tags: ['Acidity', 'Digestion', 'Sleep', 'Stress', 'Fatigue', "Women's health"] },
  { name: 'Dr Lalit Madawat', initials: 'LM', portrait: require('./doc-dp/lalit-madawat.jpeg'), qualification: 'BAMS, MD (Ayu)', experience: '10 yrs experience', specialty: 'Panchakarma', fee: 700, rating: '4.7', patients: '1.5k', about: 'Specialist in Panchakarma therapies, pain management and restorative Ayurvedic care.', focusAreas: ['Panchakarma', 'Pain management', 'Restorative care'], tags: ['Digestion', 'Sleep', 'Joint pain', 'Fatigue', 'Weight'] },
  { name: 'Dr Nirmal Kumavat', initials: 'NK', portrait: require('./doc-dp/nirmal-kumavat.jpeg'), qualification: 'BAMS', experience: '6 yrs experience', specialty: 'Ayurveda', fee: 500, rating: '4.6', patients: '900+', about: 'Ayurveda physician focused on nutrition and sustainable daily routines.', focusAreas: ['Nutrition', 'Daily routines', 'Preventive care'], tags: ['Acidity', 'Digestion', 'Joint pain', 'Skin', 'Immunity', 'Weight'] },
  { name: 'Dr Ravi Menon', initials: 'RM', qualification: 'BAMS, PhD', experience: '15 yrs experience', specialty: 'Panchakarma', fee: 900, rating: '4.5', patients: '2.1k', about: 'Senior Panchakarma practitioner supporting mobility, recovery and metabolic wellbeing.', focusAreas: ['Panchakarma', 'Joint health', 'Recovery', 'Weight care'], tags: ['Joint pain', 'Weight', 'Fatigue'] },
  { name: 'Dr Sunita Rao', initials: 'SR', qualification: 'BAMS, MD (Ayu)', experience: '9 yrs experience', specialty: 'Ayurveda', fee: 650, rating: '4.4', patients: '1.1k', about: 'Ayurveda physician with an interest in skin health, women’s wellness and stress support.', focusAreas: ['Skin health', 'Women’s wellness', 'Stress care'], tags: ['Skin', "Women's health", 'Stress', 'Immunity'] },
];

function DoctorFlow({ session, onExit, onOpenShop, onOpenProfile, onOpenAI }: { session: Session | null; onExit: () => void; onOpenShop: () => void; onOpenProfile: () => void; onOpenAI: () => void }) {
  const [stage, setStage] = useState<'intake' | 'matches' | 'profile' | 'schedule' | 'confirmed'>('intake');
  const [doctor, setDoctor] = useState(doctors[0]);
  const [appointmentDate, setAppointmentDate] = useState(() => localDateKey(new Date()));
  const [time, setTime] = useState('10:00 AM');
  const [consultationType, setConsultationType] = useState<ConsultationType>('Video Consultation');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState<'All' | 'Ayurveda' | 'Panchakarma'>('All');
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<DoctorTag[]>([]);
  const [attachments, setAttachments] = useState<DoctorAttachment[]>([]);
  const [showAllDoctors, setShowAllDoctors] = useState(false);
  const recommendedDoctors = selectedTags.length
    ? doctors.filter(item => selectedTags.some(tag => item.tags.includes(tag))).sort((left, right) => Number(right.rating) - Number(left.rating)).slice(0, 3)
    : [];
  function selectDoctor(nextDoctor: Doctor) { setDoctor(nextDoctor); setStage('profile'); }
  async function confirmAppointment(nextDate: string, nextTime: string, nextType: ConsultationType) {
    if (!session?.user.id) return setSaveError('Please sign in again before booking your appointment.');
    setSaving(true); setSaveError('');
    const { error } = await supabase.from('appointments').insert({ user_id: session.user.id, doctor_name: doctor.name, doctor_initials: doctor.initials, appointment_date: nextDate, appointment_time: nextTime, consultation_type: nextType, patient_notes: notes.trim() || null, symptom_tags: selectedTags, attachments: attachments.map(item => ({ name: item.name, size: item.size, storage_path: item.storagePath, type: item.type })) });
    setSaving(false);
    if (error) return setSaveError(error.message);
    setAppointmentDate(nextDate); setTime(nextTime); setConsultationType(nextType);
    setStage('confirmed');
  }
  if (stage === 'confirmed') return <AppointmentConfirmation doctor={doctor} date={appointmentDate} time={time} consultationType={consultationType} onAppointments={onExit} onHome={onExit} />;
  if (stage === 'schedule') return <AppointmentScheduler doctor={doctor} saving={saving} error={saveError} onBack={() => setStage('profile')} onConfirm={confirmAppointment} />;
  if (stage === 'profile') return <DoctorProfile doctor={doctor} onBack={() => setStage('matches')} onBook={() => setStage('schedule')} />;
  if (stage === 'matches') return <DoctorMatchesScreen selectedTags={selectedTags} attachments={attachments} recommended={recommendedDoctors} specialtyFilter={specialtyFilter} showAll={showAllDoctors || !selectedTags.length} onBack={() => setStage('intake')} onFilter={setSpecialtyFilter} onToggleAll={() => setShowAllDoctors(value => !value)} onSelectDoctor={selectDoctor} onExit={onExit} onOpenShop={onOpenShop} onOpenProfile={onOpenProfile} onOpenAI={onOpenAI} />;
  return <DoctorIntakeScreen session={session} notes={notes} selectedTags={selectedTags} attachments={attachments} onNotes={setNotes} onToggleTag={tag => setSelectedTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag])} onAddAttachment={attachment => setAttachments(current => [...current, attachment])} onRemoveAttachment={async item => { await supabase.storage.from('doctor-intake-files').remove([item.storagePath]); setAttachments(current => current.filter(attachment => attachment.id !== item.id)); }} onBack={onExit} onFind={() => { setShowAllDoctors(false); setStage('matches'); }} onSkip={() => { setSelectedTags([]); setShowAllDoctors(true); setStage('matches'); }} />;
}

const doctorTags: DoctorTag[] = ['Acidity', 'Digestion', 'Sleep', 'Stress', 'Joint pain', 'Skin', 'Fatigue', 'Immunity', "Women's health", 'Weight'];

function DoctorIntakeScreen({ session, notes, selectedTags, attachments, onNotes, onToggleTag, onAddAttachment, onRemoveAttachment, onBack, onFind, onSkip }: { session: Session | null; notes: string; selectedTags: DoctorTag[]; attachments: DoctorAttachment[]; onNotes: (value: string) => void; onToggleTag: (tag: DoctorTag) => void; onAddAttachment: (attachment: DoctorAttachment) => void; onRemoveAttachment: (item: DoctorAttachment) => void; onBack: () => void; onFind: () => void; onSkip: () => void }) {
  const [attachmentError, setAttachmentError] = useState('');
  const [uploadingType, setUploadingType] = useState<DoctorAttachment['type'] | null>(null);
  async function uploadAttachment(input: { mimeType: string; name: string; size: number | null; type: DoctorAttachment['type']; uri: string }) {
    if (!session?.user.id) return setAttachmentError('Please sign in again before adding a file.');
    if ((input.size ?? 0) > 10 * 1024 * 1024) return setAttachmentError('Files must be 10 MB or smaller.');
    setUploadingType(input.type); setAttachmentError('');
    try {
      const bytes = await (await fetch(input.uri)).arrayBuffer();
      const extension = input.type === 'report' ? 'pdf' : input.mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'jpg';
      const storagePath = `${session.user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const { error } = await supabase.storage.from('doctor-intake-files').upload(storagePath, bytes, { contentType: input.mimeType, upsert: false });
      if (error) return setAttachmentError(error.message);
      onAddAttachment({ ...input, id: storagePath, storagePath });
    } catch {
      setAttachmentError('This file could not be uploaded. Please try again.');
    } finally {
      setUploadingType(null);
    }
  }
  async function pickReport() {
    setAttachmentError('');
    try {
      const DocumentPicker = await import('expo-document-picker');
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const asset = result.assets[0];
      await uploadAttachment({ mimeType: asset.mimeType || 'application/pdf', name: asset.name, size: asset.size ?? null, type: 'report', uri: asset.uri });
    } catch {
      setAttachmentError('PDF selection is unavailable in this version of Expo Go. Please update Expo Go or use a development build.');
    }
  }
  async function pickPhoto() {
    setAttachmentError('');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: false, quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await uploadAttachment({ mimeType: asset.mimeType || 'image/jpeg', name: asset.fileName || 'Photo of symptoms.jpg', size: asset.fileSize ?? null, type: 'photo', uri: asset.uri });
  }
  return <SafeAreaView style={styles.doctorSafe}><StatusBar style="dark" /><KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.doctorIntakePage} showsVerticalScrollIndicator={false}><BackButton onPress={onBack} onboarding /><Text style={styles.doctorStep}>STEP 1 OF 2</Text><Text style={styles.doctorIntakeTitle}>What brings you in?</Text><Text style={styles.doctorIntakeIntro}>Your notes and reports go to the doctor before the consultation, so the first few minutes are not spent on history.</Text><View style={styles.doctorNotesCard}><TextInput accessibilityLabel="Describe your symptoms" value={notes} onChangeText={value => onNotes(value.slice(0, 600))} multiline placeholder="Describe your symptoms, when they began, and anything that makes them better or worse." placeholderTextColor="#97A19C" style={styles.doctorNotesInput} /><View style={styles.doctorNotesMeta}><Text style={styles.doctorNotesMetaText}>{notes.length} characters</Text><Text style={styles.doctorNotesMetaText}>Private to your doctor</Text></View></View><Text style={styles.doctorSectionLabel}>ADD THE AREAS THAT APPLY</Text><View style={styles.doctorTagRow}>{doctorTags.map(tag => <Pressable key={tag} accessibilityRole="checkbox" accessibilityState={{ checked: selectedTags.includes(tag) }} onPress={() => onToggleTag(tag)} style={[styles.doctorTag, selectedTags.includes(tag) && styles.doctorTagSelected]}><Text style={[styles.doctorTagText, selectedTags.includes(tag) && styles.doctorTagTextSelected]}>{tag}</Text></Pressable>)}</View><Text style={styles.doctorSectionLabel}>REPORTS AND PHOTOS</Text><View style={styles.doctorUploadRow}><DoctorUploadButton icon="↧" title="Blood report" subtitle="PDF up to 10 MB" loading={uploadingType === 'report'} onPress={pickReport} /><DoctorUploadButton icon="▧" title="Photo of symptoms" subtitle="JPG or PNG" loading={uploadingType === 'photo'} onPress={pickPhoto} /></View>{attachments.map(item => <View key={item.id} style={styles.doctorAttachmentRow}><View style={styles.doctorAttachmentIcon}><Text style={styles.doctorAttachmentIconText}>{item.type === 'report' ? 'PDF' : 'IMG'}</Text></View><View style={styles.doctorAttachmentCopy}><Text numberOfLines={1} style={styles.doctorAttachmentName}>{item.name}</Text><Text style={styles.doctorAttachmentSize}>{formatAttachmentSize(item.size)}</Text></View><Pressable accessibilityLabel={`Remove ${item.name}`} onPress={() => onRemoveAttachment(item)} style={styles.doctorAttachmentRemove}><Text style={styles.doctorAttachmentRemoveText}>×</Text></Pressable></View>)}{attachmentError ? <Text style={styles.doctorAttachmentError}>{attachmentError}</Text> : null}</ScrollView><View style={styles.doctorIntakeFooter}><Pressable disabled={Boolean(uploadingType)} onPress={onFind} style={[styles.doctorFindButton, uploadingType && styles.doctorUploadDisabled]}><Text style={styles.doctorFindButtonText}>Find matching doctors</Text></Pressable><Pressable onPress={onSkip} style={styles.doctorSkipButton}><Text style={styles.doctorSkipText}>Skip and browse all doctors</Text></Pressable></View></KeyboardAvoidingView></SafeAreaView>;
}

function DoctorUploadButton({ icon, title, subtitle, loading = false, onPress }: { icon: string; title: string; subtitle: string; loading?: boolean; onPress: () => void }) { return <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.doctorUploadButton, loading && styles.doctorUploadDisabled, pressed && styles.pressed]}>{loading ? <ActivityIndicator color="#164D39" /> : <View style={styles.doctorUploadIcon}><Text style={styles.doctorUploadIconText}>{icon}</Text></View>}<Text style={styles.doctorUploadTitle}>{loading ? 'Uploading…' : title}</Text><Text style={styles.doctorUploadSubtitle}>{subtitle}</Text></Pressable>; }
function formatAttachmentSize(size: number | null) { if (!size) return 'Ready to attach'; return size < 1024 * 1024 ? `${Math.max(1, Math.round(size / 1024))} KB` : `${(size / 1024 / 1024).toFixed(1)} MB`; }

function DoctorMatchesScreen({ selectedTags, attachments, recommended, specialtyFilter, showAll, onBack, onFilter, onToggleAll, onSelectDoctor, onExit, onOpenShop, onOpenProfile, onOpenAI }: { selectedTags: DoctorTag[]; attachments: DoctorAttachment[]; recommended: Doctor[]; specialtyFilter: 'All' | 'Ayurveda' | 'Panchakarma'; showAll: boolean; onBack: () => void; onFilter: (filter: 'All' | 'Ayurveda' | 'Panchakarma') => void; onToggleAll: () => void; onSelectDoctor: (doctor: Doctor) => void; onExit: () => void; onOpenShop: () => void; onOpenProfile: () => void; onOpenAI: () => void }) {
  const recommendedNames = new Set(recommended.map(item => item.name));
  const allDoctors = doctors.filter(item => !recommendedNames.has(item.name) && (specialtyFilter === 'All' || item.specialty === specialtyFilter));
  const matchText = selectedTags.length ? `Matched to ${selectedTags.slice(0, 2).map(tag => tag.toLowerCase()).join(', ')}${selectedTags.length > 2 ? ` +${selectedTags.length - 2}` : ''}${attachments.length ? ` · ${attachments.length} ${attachments.length === 1 ? 'report' : 'reports'} attached` : ''}` : 'Browse all available Ayurveda doctors.';
  return <SafeAreaView style={styles.doctorSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.doctorMatchesPage} showsVerticalScrollIndicator={false}><BackButton onPress={onBack} onboarding /><Text style={styles.doctorStep}>STEP 2 OF 2</Text><Text style={styles.doctorTitle}>Talk to a doctor</Text><Text style={styles.doctorMatchSubtitle}>{matchText}</Text>{recommended.length ? <View style={styles.doctorRecommendedPanel}><View style={styles.doctorRecommendedTop}><Text style={styles.doctorRecommendedEyebrow}>RECOMMENDED</Text><Text style={styles.doctorRecommendedAside}>Top rated</Text></View><Text style={styles.doctorRecommendedReason}>Best rated for {selectedTags.slice(0, 2).map(tag => tag.toLowerCase()).join(', ')}.</Text><View style={styles.doctorRecommendedCards}>{recommended.map((item, index) => <Pressable key={item.name} onPress={() => onSelectDoctor(item)} style={({ pressed }) => pressed && styles.pressed}><DoctorCard doctor={item} compact availability={index < 2 ? 'TODAY' : 'TOMORROW'} /></Pressable>)}</View></View> : null}{recommended.length ? <Pressable onPress={onToggleAll} style={styles.doctorViewAllButton}><Text style={styles.doctorViewAllText}>{showAll ? 'Hide all doctors' : 'View all doctors'} ⌄</Text></Pressable> : null}{showAll ? <View style={styles.doctorAllSection}><View style={styles.doctorAllHeading}><Text style={styles.doctorSectionLabel}>ALL DOCTORS</Text>{recommended.length ? <Pressable onPress={onToggleAll}><Text style={styles.doctorHideText}>Hide</Text></Pressable> : null}</View><View style={styles.doctorFilterRow}>{(['All', 'Ayurveda', 'Panchakarma'] as const).map(filter => <Pressable key={filter} onPress={() => onFilter(filter)} style={[styles.doctorFilter, specialtyFilter === filter && styles.doctorFilterSelected]}><Text style={[styles.doctorFilterText, specialtyFilter === filter && styles.doctorFilterTextSelected]}>{filter}</Text></Pressable>)}</View><View style={styles.doctorCards}>{allDoctors.map((item, index) => <Pressable key={item.name} onPress={() => onSelectDoctor(item)} style={({ pressed }) => pressed && styles.pressed}><DoctorCard doctor={item} compact availability={index === 0 ? 'MON' : index === 1 ? 'WED' : 'TOMORROW'} /></Pressable>)}</View></View> : null}</ScrollView><View style={[styles.bottomNav, styles.doctorBottomNav]}><NavItem icon="⌂" label="Home" onPress={onExit} /><NavItem icon="✚" label="Doctor" active /><NavItem icon="♧" label="AI" onPress={onOpenAI} /><NavItem icon="🛍" label="Shop" onPress={onOpenShop} /><NavItem icon="♙" label="Profile" onPress={onOpenProfile} /></View></SafeAreaView>;
}

function DoctorProfile({ doctor, onBack, onBook }: { doctor: Doctor; onBack: () => void; onBook: () => void }) {
  return <SafeAreaView style={styles.doctorProfileSafe}><StatusBar style="light" /><ScrollView style={styles.doctorProfileScroll} contentContainerStyle={styles.doctorProfilePage}><View style={styles.doctorPhotoHero}>{doctor.portrait ? <Image source={doctor.portrait} style={styles.doctorPhoto} resizeMode="cover" /> : <View style={styles.doctorPhotoPlaceholder}><Text style={styles.doctorPhotoPlaceholderText}>{doctor.initials}</Text></View>}<View style={styles.doctorPhotoShade} /><View style={styles.doctorPhotoBottomShade} /><Pressable accessibilityLabel="Go back" onPress={onBack} style={styles.doctorPhotoBack}><Text style={styles.doctorHeroBackText}>‹</Text></Pressable><View style={styles.doctorPhotoIdentity}><View style={styles.doctorAvailabilityPill}><Text style={styles.doctorAvailabilityText}>★ {doctor.rating}  ·  Today</Text></View><Text style={styles.doctorPhotoName}>{doctor.name}</Text><Text style={styles.doctorPhotoMeta}>{doctor.qualification} · {doctor.specialty}</Text></View></View><View style={styles.doctorStats}><DoctorStat value={doctor.rating} label="RATING" /><DoctorStat value={doctor.experience.replace(' experience', '')} label="EXPERIENCE" /><DoctorStat value={doctor.patients} label="PATIENTS" last /></View><View style={styles.doctorProfileBody}><Text style={styles.doctorLabel}>ABOUT</Text><Text style={styles.doctorAbout}>{doctor.about}</Text><Text style={styles.doctorLabel}>FOCUS AREAS</Text><View style={styles.focusAreaRow}>{doctor.focusAreas.map(area => <View key={area} style={styles.focusAreaPill}><Text style={styles.focusAreaText}>{area}</Text></View>)}</View><View style={styles.consultationCard}><View><Text style={styles.consultationLabel}>CONSULTATION FEE</Text><Text style={styles.consultationFee}>₹{doctor.fee}</Text></View><View style={styles.consultationDuration}><Text style={styles.consultationLabel}>DURATION</Text><Text style={styles.consultationDurationText}>30 minutes</Text></View></View><DoctorReviewsSection rating={doctor.rating} /></View></ScrollView><View style={styles.doctorProfileFooter}><PrimaryButton label="Book appointment" onPress={onBook} /></View></SafeAreaView>;
}

function DoctorStat({ value, label, last = false }: { value: string; label: string; last?: boolean }) { return <View style={[styles.doctorStat, last && styles.doctorStatLast]}><Text style={styles.doctorStatValue}>{value}</Text><Text style={styles.doctorStatLabel}>{label}</Text></View>; }

function DoctorReviewsSection({ rating }: { rating: string }) {
  const largestCount = doctorRatingBreakdown[0].count;
  return <View style={styles.doctorReviewsSection}><View style={styles.doctorReviewsHeading}><Text style={styles.doctorReviewsLabel}>REVIEWS</Text><Text style={styles.doctorReviewsCount}>214 from past consultations</Text></View><View style={styles.doctorRatingCard}><View style={styles.doctorRatingScore}><Text style={styles.doctorRatingNumber}>{rating}</Text><Text style={styles.doctorRatingStars}>★★★★★</Text></View><View style={styles.doctorRatingBars}>{doctorRatingBreakdown.map(item => <View key={item.stars} style={styles.doctorRatingBarRow}><Text style={styles.doctorRatingBarLabel}>{item.stars}★</Text><View style={styles.doctorRatingBarTrack}><View style={[styles.doctorRatingBarFill, { width: `${Math.max(2, Math.round(item.count / largestCount * 100))}%` }]} /></View><Text style={styles.doctorRatingBarCount}>{item.count}</Text></View>)}</View></View><View style={styles.doctorReviewList}>{doctorReviews.slice(0, 3).map(review => <DoctorReviewCard key={review.author} review={review} />)}</View></View>;
}

function DoctorReviewCard({ review }: { review: DoctorReview }) {
  const stars = `${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}`;
  return <View style={styles.doctorReviewCard}><View style={styles.doctorReviewTop}><View style={styles.doctorReviewerAvatar}><Text style={styles.doctorReviewerInitials}>{review.initials}</Text></View><View style={styles.doctorReviewerCopy}><Text style={styles.doctorReviewerName}>{review.author}</Text><Text style={styles.doctorReviewMeta}>{review.consultation}  ·  {review.age}</Text></View><Text accessibilityLabel={`${review.rating} out of 5 stars`} style={styles.doctorReviewStars}>{stars}</Text></View><Text style={styles.doctorReviewBody}>{review.review}</Text>{review.highlight ? <View style={styles.doctorReviewHighlight}><Text style={styles.doctorReviewHighlightText}>{review.highlight}</Text></View> : null}</View>;
}

function AppointmentScheduler({ doctor, saving, error, onBack, onConfirm }: { doctor: Doctor; saving: boolean; error: string; onBack: () => void; onConfirm: (date: string, time: string, type: ConsultationType) => void }) {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const lastDate = new Date(today); lastDate.setMonth(lastDate.getMonth() + 3);
  const firstMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastMonth = new Date(lastDate.getFullYear(), lastDate.getMonth(), 1);
  const [selectedDate, setSelectedDate] = useState(() => localDateKey(today));
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [selectedType, setSelectedType] = useState<ConsultationType>('Video Consultation');
  const [visibleMonth, setVisibleMonth] = useState(firstMonth);
  const daysInMonth = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0).getDate();
  const leadingBlanks = visibleMonth.getDay();
  const monthLabel = visibleMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  const canGoBack = visibleMonth.getTime() > firstMonth.getTime();
  const canGoForward = visibleMonth.getTime() < lastMonth.getTime();
  const moveMonth = (amount: number) => setVisibleMonth(current => new Date(current.getFullYear(), current.getMonth() + amount, 1));
  const slots = [{ value: '09:00 AM', available: false }, { value: '10:00 AM', available: true }, { value: '11:00 AM', available: true }, { value: '12:00 PM', available: false }, { value: '04:00 PM', available: true }, { value: '05:00 PM', available: true }];
  return <SafeAreaView style={styles.doctorSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.schedulerPage}><BackButton onPress={onBack} onboarding /><Text style={styles.doctorTitle}>Select date &amp; time</Text><Text style={styles.schedulerDoctor}>{doctor.name} · ₹{doctor.fee}</Text><View style={styles.calendarCard}><View style={styles.monthRow}><Pressable disabled={!canGoBack} onPress={() => moveMonth(-1)}><Text style={[styles.monthArrow, !canGoBack && styles.monthArrowDisabled]}>‹</Text></Pressable><Text style={styles.monthTitle}>{monthLabel}</Text><Pressable disabled={!canGoForward} onPress={() => moveMonth(1)}><Text style={[styles.monthArrow, !canGoForward && styles.monthArrowDisabled]}>›</Text></Pressable></View><View style={styles.calendarGrid}>{['SUN','MON','TUE','WED','THU','FRI','SAT'].map(label => <Text key={label} style={styles.weekday}>{label}</Text>)}{Array.from({ length: leadingBlanks }, (_, index) => <View key={`blank-${index}`} style={styles.calendarDay} />)}{Array.from({ length: daysInMonth }, (_, index) => index + 1).map(day => { const date = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), day); const dateKey = localDateKey(date); const disabled = date < today || date > lastDate; const selected = dateKey === selectedDate; return <Pressable key={dateKey} disabled={disabled} onPress={() => setSelectedDate(dateKey)} style={[styles.calendarDay, selected && styles.calendarDaySelected]}><Text style={[styles.calendarDayText, disabled && styles.calendarDayTextDisabled, selected && styles.calendarDayTextSelected]}>{day}</Text></Pressable>; })}</View></View><View style={styles.slotsHeading}><Text style={styles.doctorLabel}>AVAILABLE SLOTS</Text><Text style={styles.slotsDate}>{formatAppointmentDate(selectedDate)}</Text></View><View style={styles.slotGrid}>{slots.map(slot => <Pressable key={slot.value} disabled={!slot.available} onPress={() => setSelectedTime(slot.value)} style={[styles.slot, selectedTime === slot.value && styles.slotSelected, !slot.available && styles.slotDisabled]}><Text style={[styles.slotText, selectedTime === slot.value && styles.slotTextSelected, !slot.available && styles.slotTextDisabled]}>{slot.value}</Text></Pressable>)}</View><Text style={styles.doctorLabel}>CONSULTATION TYPE</Text><View style={styles.consultationTypeRow}>{(['Video Consultation', 'Audio Consultation'] as const).map(type => <Pressable key={type} onPress={() => setSelectedType(type)} style={[styles.consultationTypeCard, selectedType === type && styles.consultationTypeSelected]}><Text style={styles.consultationTypeTitle}>{type.replace(' Consultation', '')}</Text><Text style={styles.consultationTypeCopy}>{type === 'Video Consultation' ? 'Video call in the app' : 'Voice call in the app'}</Text></Pressable>)}</View>{error ? <Text style={styles.error}>{error}</Text> : null}</ScrollView><View style={styles.schedulerFooter}><PrimaryButton label="Confirm appointment" loading={saving} onPress={() => onConfirm(selectedDate, selectedTime, selectedType)} /></View></SafeAreaView>;
}

function AppointmentConfirmation({ doctor, date, time, consultationType, onAppointments, onHome }: { doctor: Doctor; date: string; time: string; consultationType: ConsultationType; onAppointments: () => void; onHome: () => void }) { const rows = [['DOCTOR', doctor.name], ['DATE', formatAppointmentDate(date)], ['TIME', time], ['TYPE', consultationType.replace(' Consultation', ' consultation')], ['FEE', `₹${doctor.fee} · paid`]]; return <SafeAreaView style={styles.confirmedSafe}><StatusBar style="light" /><View style={styles.confirmedDecor} /><View style={styles.confirmedPage}><View style={styles.appointmentCheck}><Text style={styles.appointmentCheckText}>✓</Text></View><Text style={styles.confirmedTitle}>Appointment confirmed</Text><Text style={styles.confirmedNote}>We have saved the details and will{`\n`}remind you an hour before.</Text><View style={styles.confirmedSummary}>{rows.map(([label, value], index) => <View key={label} style={[styles.confirmedRow, index === rows.length - 1 && styles.confirmedRowLast]}><Text style={styles.confirmedLabel}>{label}</Text><Text style={styles.confirmedValue}>{value}</Text></View>)}</View><View style={styles.confirmedActions}><Pressable onPress={onAppointments} style={styles.confirmedPrimary}><Text style={styles.confirmedPrimaryText}>Go to my appointments</Text></Pressable><Pressable onPress={onHome} style={styles.confirmedHome}><Text style={styles.confirmedHomeText}>Back to home</Text></Pressable></View></View></SafeAreaView>; }

function DoctorCard({ doctor, compact = false, availability = 'TODAY' }: { doctor: Doctor; compact?: boolean; availability?: string }) { return <View style={styles.doctorCard}><View style={styles.doctorAvatar}><Text style={styles.doctorAvatarText}>{doctor.initials}</Text></View><View style={styles.doctorInfo}><Text style={styles.doctorListName}>{doctor.name}</Text><Text style={styles.doctorMeta}>{doctor.qualification}</Text><Text style={styles.doctorMeta}>{doctor.experience} · {doctor.specialty}</Text><Text style={styles.doctorPrice}>₹{doctor.fee}</Text></View>{compact ? <View style={styles.doctorListRating}><Text style={styles.doctorListRatingText}><Text style={styles.doctorListRatingStar}>★ </Text>{doctor.rating}</Text><Text style={styles.doctorAvailability}>{availability}</Text></View> : null}</View>; }

function ScreenFrame({ children, scroll = false, alignTop = false }: { children: React.ReactNode; scroll?: boolean; alignTop?: boolean }) {
  const content = <View style={[styles.content, alignTop && styles.contentTop]}>{children}</View>;
  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</KeyboardAvoidingView></SafeAreaView>;
}
function OnboardingProgress({ step, onBack }: { step: 1 | 2; onBack: () => void }) { return <View style={styles.progressHeader}><BackButton onPress={onBack} onboarding /><View style={styles.stepTracks}><View style={[styles.stepTrack, styles.stepTrackActive]} /><View style={[styles.stepTrack, step === 2 && styles.stepTrackActive]} /></View><Text style={styles.stepCount}>{step} / 2</Text></View>; }
function BotanicalCorner() { return <View pointerEvents="none" style={styles.corner}><View style={styles.cornerStem} /><View style={[styles.cornerLeaf, styles.cornerLeaf1]} /><View style={[styles.cornerLeaf, styles.cornerLeaf2]} /><View style={[styles.cornerLeaf, styles.cornerLeaf3]} /></View>; }
function Field({ label, onboarding = false, ...props }: React.ComponentProps<typeof TextInput> & { label: string; onboarding?: boolean }) { return <View><Text style={onboarding ? styles.onboardingLabel : styles.label}>{label}</Text><TextInput placeholderTextColor="#9A9B92" style={styles.input} {...props} /></View>; }
function DateOfBirthCalendar({ visible, value, onClose, onSelect }: { visible: boolean; value: Date | null; onClose: () => void; onSelect: (value: Date) => void }) {
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(value ?? defaultDateOfBirth()));
  useEffect(() => { if (visible) setVisibleMonth(startOfMonth(value ?? defaultDateOfBirth())); }, [visible, value]);
  const today = new Date();
  const year = visibleMonth.getFullYear();
  const month = visibleMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = Array.from({ length: 42 }, (_, index) => { const day = index - firstWeekday + 1; return day > 0 && day <= daysInMonth ? day : null; });
  function moveMonth(amount: number) { setVisibleMonth(current => clampCalendarMonth(new Date(current.getFullYear(), current.getMonth() + amount, 1))); }
  function moveYear(amount: number) { setVisibleMonth(current => clampCalendarMonth(new Date(current.getFullYear() + amount, current.getMonth(), 1))); }
  return <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent transparent visible={visible}>
    <View style={styles.dobCalendarBackdrop}><View accessibilityViewIsModal style={styles.dobCalendarCard}>
      <View style={styles.dobCalendarTopRow}><View><Text style={styles.dobCalendarEyebrow}>DATE OF BIRTH</Text><Text style={styles.dobCalendarTitle}>Choose a date</Text></View><Pressable accessibilityLabel="Close calendar" onPress={onClose} style={styles.dobCalendarClose}><Text style={styles.dobCalendarCloseText}>×</Text></Pressable></View>
      <View style={styles.dobCalendarControls}><Pressable accessibilityLabel="Previous year" onPress={() => moveYear(-1)} style={styles.dobCalendarControl}><Text style={styles.dobCalendarControlText}>«</Text></Pressable><Pressable accessibilityLabel="Previous month" onPress={() => moveMonth(-1)} style={styles.dobCalendarControl}><Text style={styles.dobCalendarControlText}>‹</Text></Pressable><Text style={styles.dobCalendarMonth}>{visibleMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</Text><Pressable accessibilityLabel="Next month" onPress={() => moveMonth(1)} style={styles.dobCalendarControl}><Text style={styles.dobCalendarControlText}>›</Text></Pressable><Pressable accessibilityLabel="Next year" onPress={() => moveYear(1)} style={styles.dobCalendarControl}><Text style={styles.dobCalendarControlText}>»</Text></Pressable></View>
      <View style={styles.dobCalendarWeek}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((label, index) => <Text key={`${label}-${index}`} style={styles.dobCalendarWeekday}>{label}</Text>)}</View>
      <View style={styles.dobCalendarGrid}>{days.map((day, index) => {
        if (!day) return <View key={`empty-${index}`} style={styles.dobCalendarDaySlot} />;
        const date = new Date(year, month, day);
        const disabled = date > today;
        const selected = Boolean(value && localDateKey(date) === localDateKey(value));
        return <View key={day} style={styles.dobCalendarDaySlot}><Pressable accessibilityLabel={date.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} accessibilityRole="button" disabled={disabled} onPress={() => onSelect(date)} style={[styles.dobCalendarDay, selected && styles.dobCalendarDaySelected]}><Text style={[styles.dobCalendarDayText, disabled && styles.dobCalendarDayDisabled, selected && styles.dobCalendarDayTextSelected]}>{day}</Text></Pressable></View>;
      })}</View>
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.dobCalendarCancel}><Text style={styles.dobCalendarCancelText}>Cancel</Text></Pressable>
    </View></View>
  </Modal>;
}
function PrimaryButton({ label, loading, onboarding = false, onPress }: { label: string; loading?: boolean; onboarding?: boolean; onPress: () => void }) { return <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.primaryButton, onboarding && styles.onboardingPrimaryButton, pressed && styles.pressed]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}</Pressable>; }
function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryText}>{label}</Text></Pressable>; }
function SocialButton({ symbol, label, loading, onPress }: { symbol: string; label: string; loading?: boolean; onPress: () => void }) { return <Pressable accessibilityLabel={`Continue with ${label}`} disabled={loading} onPress={onPress} style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>{loading ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={[styles.socialSymbol, label === 'Google' && styles.google]}>{symbol}</Text>}<Text style={styles.socialLabel}>{label}</Text></Pressable>; }
function Divider({ label }: { label: string }) { return <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>{label}</Text><View style={styles.divider} /></View>; }
function BackButton({ onPress, light = false, onboarding = false }: { onPress: () => void; light?: boolean; onboarding?: boolean }) { return <Pressable accessibilityLabel="Go back" onPress={onPress} style={[styles.back, onboarding && styles.onboardingBack]}><Text style={[styles.backText, onboarding && styles.onboardingBackText, light && styles.backTextLight]}>‹</Text></Pressable>; }
function AssessmentItem({ number, title, copy, completed = false, onPress }: { number: string; title: string; copy: string; completed?: boolean; onPress?: () => void }) { const content = <><View style={[styles.numberBadge, completed && styles.completedBadge]}><Text style={styles.numberText}>{number}</Text></View><View style={styles.assessmentText}><Text style={styles.assessmentItemTitle}>{title}</Text><Text style={styles.assessmentCopy}>{copy}</Text></View></>; return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.assessmentItem, pressed && styles.pressed]}>{content}</Pressable> : <View style={styles.assessmentItem}>{content}</View>; }
function MiniDoshaDonut({ percentages }: { percentages: Record<Dosha, number> }) { const colors = ['#2879B9', '#EEA62A', '#5B9B54']; return <View style={styles.miniDonut}>{Array.from({ length: 100 }, (_, index) => { const color = index < percentages.vata ? colors[0] : index < percentages.vata + percentages.pitta ? colors[1] : colors[2]; return <View key={index} style={[styles.miniDonutSegment, { backgroundColor: color, transform: [{ rotate: `${index * 3.6}deg` }, { translateY: -44 }] }]} />; })}<View style={styles.miniDonutCenter}><Text style={styles.miniDonutLabel}>Prakriti</Text></View></View>; }
function MajorDoshaPercentages({ percentages }: { percentages: Record<Dosha, number> }) { const details: Record<Dosha, { label: string; color: string }> = { vata: { label: 'Vata', color: '#2879B9' }, pitta: { label: 'Pitta', color: '#EEA62A' }, kapha: { label: 'Kapha', color: '#5B9B54' } }; const majorDoshas = (Object.keys(percentages) as Dosha[]).sort((a, b) => percentages[b] - percentages[a]).slice(0, 2); return <View style={styles.homeDoshaPercentages}>{majorDoshas.map(dosha => <Text key={dosha} style={[styles.homeDoshaPercentage, { color: details[dosha].color }]}>{details[dosha].label} {percentages[dosha]}%</Text>)}</View>; }
function FeatureTile({ icon, label }: { icon: string; label: string }) { return <Pressable accessibilityLabel={label} onPress={() => {}} style={({ pressed }) => [styles.featureTile, pressed && styles.pressed]}><Text style={styles.featureIcon}>{icon}</Text><Text style={styles.featureLabel}>{label}</Text></Pressable>; }
function PlanTile({ icon, title, detail }: { icon: string; title: string; detail: string }) { return <View style={styles.planTile}><View style={styles.planTitleRow}><Text style={styles.planIcon}>{icon}</Text><Text style={styles.planTitle}>{title}</Text></View><Text style={styles.planDetail}>{detail}</Text></View>; }
function NavItem({ label, active = false, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) { return <BottomBarItem label={label} active={active} onPress={onPress} />; }
function localDateKey(value: Date) { return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`; }
function defaultDateOfBirth() { const value = new Date(); value.setFullYear(value.getFullYear() - 25); return value; }
function startOfMonth(value: Date) { return new Date(value.getFullYear(), value.getMonth(), 1); }
function clampCalendarMonth(value: Date) { const earliest = new Date(1900, 0, 1); const latest = startOfMonth(new Date()); return value < earliest ? earliest : value > latest ? latest : value; }
function formatDateOfBirth(value: Date) { return `${String(value.getDate()).padStart(2, '0')} / ${String(value.getMonth() + 1).padStart(2, '0')} / ${value.getFullYear()}`; }
function ageFromDateOfBirth(value: string) { const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/); if (!match) return null; const birthDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])); const today = new Date(); let age = today.getFullYear() - birthDate.getFullYear(); if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age -= 1; return age >= 0 && age <= 120 ? age : null; }
function normalizeDateOfBirth(value: string) { const clean = value.trim(); if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean; const match = clean.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/); if (!match) return null; const day = Number(match[1]); const month = Number(match[2]); const year = Number(match[3]); const date = new Date(year, month - 1, day); if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null; return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`; }
function formatAppointmentDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
function extractAuthParams(url: string) { const fragment = url.split('#')[1] ?? url.split('?')[1] ?? ''; return Object.fromEntries(new URLSearchParams(fragment)); }

const serif = Platform.select({ ios: 'Georgia', android: 'serif' });
const termsConsentStyles = StyleSheet.create({
  termsSafe: { backgroundColor: '#F8F5EC', flex: 1 },
  termsPage: { flex: 1, paddingBottom: 80, paddingHorizontal: 23, paddingTop: 17 },
  termsTitle: { color: '#273E35', fontFamily: serif, fontSize: 26, lineHeight: 32, marginTop: 17 },
  termsIntro: { color: '#7C8982', fontSize: 10, lineHeight: 16, marginTop: 6, maxWidth: 280 },
  termsDocumentCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, flex: 1, marginTop: 14, maxHeight: 390, minHeight: 260, overflow: 'hidden' },
  termsDocumentHeader: { alignItems: 'center', backgroundColor: '#F3F0E8', borderBottomColor: '#DED9CE', borderBottomWidth: 1, flexDirection: 'row', minHeight: 40, paddingHorizontal: 10 },
  termsPdfIcon: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 5, height: 23, justifyContent: 'center', width: 23 },
  termsPdfIconText: { color: '#FFF', fontSize: 6, fontWeight: '800' },
  termsDocumentHeaderCopy: { flex: 1, marginLeft: 9 },
  termsDocumentName: { color: '#294039', fontSize: 8, fontWeight: '700' },
  termsDocumentMeta: { color: '#8D9993', fontSize: 6, marginTop: 2 },
  termsScrollHint: { color: '#A58E62', fontSize: 6, letterSpacing: .5 },
  termsScrollHintRead: { color: '#3C7A5E' },
  termsDocumentScroll: { flex: 1 },
  termsDocumentPages: { backgroundColor: '#FFF', paddingBottom: 8 },
  termsDocumentPage: { alignSelf: 'center', aspectRatio: 320 / 520, borderBottomColor: '#EEEAE1', borderBottomWidth: 1, width: '100%' },
  termsDocumentEnd: { color: '#73877D', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, paddingVertical: 14, textAlign: 'center' },
  termsConsentRow: { alignItems: 'flex-start', flexDirection: 'row', marginTop: 12 },
  termsConsentRowDisabled: { opacity: .48 },
  termsCheckbox: { alignItems: 'center', borderColor: '#C9C4B9', borderRadius: 4, borderWidth: 1, height: 16, justifyContent: 'center', marginRight: 10, marginTop: 1, width: 16 },
  termsCheckboxChecked: { backgroundColor: '#164D39', borderColor: '#164D39' },
  termsCheckboxMark: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  termsConsentLabel: { color: '#78867F', flex: 1, fontSize: 9, lineHeight: 15 },
  termsLockedHint: { color: '#A29D92', fontSize: 7, marginLeft: 26, marginTop: 4 },
  termsError: { color: '#A24B3A', fontSize: 8, marginTop: 5 },
  termsFooter: { backgroundColor: '#F8F5EC', borderTopColor: '#DED9CE', borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: 23, paddingVertical: 12, position: 'absolute', right: 0 },
  termsContinue: { alignItems: 'center', backgroundColor: '#DDD9CE', borderRadius: 10, justifyContent: 'center', minHeight: 45 },
  termsContinueReady: { backgroundColor: '#43825F' },
  termsContinueText: { color: '#8D9B94', fontSize: 10, fontWeight: '700' },
  termsContinueTextReady: { color: '#FFF' },
});
const doctorReviewsStyles = StyleSheet.create({
  doctorReviewsSection: { marginTop: 19 },
  doctorReviewsHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 9 },
  doctorReviewsLabel: { color: '#799187', fontSize: 7, fontWeight: '600', letterSpacing: 1.8 },
  doctorReviewsCount: { color: '#A0AAA5', fontSize: 7, letterSpacing: .5 },
  doctorRatingCard: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 11, borderWidth: 1, flexDirection: 'row', minHeight: 88, paddingHorizontal: 14, paddingVertical: 10 },
  doctorRatingScore: { alignItems: 'center', justifyContent: 'center', paddingRight: 17, width: 74 },
  doctorRatingNumber: { color: '#294039', fontFamily: serif, fontSize: 27, lineHeight: 31 },
  doctorRatingStars: { color: '#C88F2D', fontSize: 8, letterSpacing: 2, marginTop: 4 },
  doctorRatingBars: { flex: 1, gap: 3 },
  doctorRatingBarRow: { alignItems: 'center', flexDirection: 'row' },
  doctorRatingBarLabel: { color: '#87948E', fontSize: 7, textAlign: 'right', width: 18 },
  doctorRatingBarTrack: { backgroundColor: '#E8E4DA', borderRadius: 2, flex: 1, height: 3, marginHorizontal: 5, overflow: 'hidden' },
  doctorRatingBarFill: { backgroundColor: '#C8902E', borderRadius: 2, height: '100%' },
  doctorRatingBarCount: { color: '#98A39D', fontSize: 7, textAlign: 'right', width: 18 },
  doctorReviewList: { gap: 9, marginTop: 10 },
  doctorReviewCard: { backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 11, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 13 },
  doctorReviewTop: { alignItems: 'center', flexDirection: 'row' },
  doctorReviewerAvatar: { alignItems: 'center', backgroundColor: '#EAF2EC', borderRadius: 15, height: 30, justifyContent: 'center', width: 30 },
  doctorReviewerInitials: { color: '#315D4B', fontFamily: serif, fontSize: 9 },
  doctorReviewerCopy: { flex: 1, marginLeft: 9 },
  doctorReviewerName: { color: '#31443B', fontSize: 9, fontWeight: '600' },
  doctorReviewMeta: { color: '#9AA49F', fontSize: 7, letterSpacing: .4, marginTop: 3 },
  doctorReviewStars: { color: '#C88F2D', fontSize: 8, letterSpacing: 1 },
  doctorReviewBody: { color: '#43534C', fontSize: 9, lineHeight: 16, marginTop: 10 },
  doctorReviewHighlight: { alignSelf: 'flex-start', backgroundColor: '#EAF3EC', borderRadius: 11, marginTop: 9, paddingHorizontal: 9, paddingVertical: 5 },
  doctorReviewHighlightText: { color: '#477660', fontSize: 7 },
});
const doctorEntryStyles = StyleSheet.create({
  doctorIntakePage: { flexGrow: 1, paddingBottom: 132, paddingHorizontal: 21, paddingTop: 17 },
  doctorStep: { color: '#B8832D', fontSize: 7, fontWeight: '700', letterSpacing: 1.6, marginTop: 16 },
  doctorIntakeTitle: { color: '#17382F', fontFamily: serif, fontSize: 27, lineHeight: 34, marginTop: 7 },
  doctorIntakeIntro: { color: '#78867F', fontSize: 10, lineHeight: 17, marginTop: 8 },
  doctorNotesCard: { backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 11, borderWidth: 1, height: 153, marginTop: 23, paddingHorizontal: 12, paddingTop: 10 },
  doctorNotesInput: { color: '#314139', flex: 1, fontSize: 10, lineHeight: 18, paddingHorizontal: 0, paddingTop: 2, textAlignVertical: 'top' },
  doctorNotesMeta: { alignItems: 'center', borderTopColor: '#E3DED4', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 28 },
  doctorNotesMetaText: { color: '#9AA49F', fontSize: 7, letterSpacing: .5 },
  doctorSectionLabel: { color: '#91A099', fontSize: 7, fontWeight: '700', letterSpacing: 1.7, marginTop: 20 },
  doctorTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  doctorTag: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 27, paddingHorizontal: 13 },
  doctorTagSelected: { backgroundColor: '#164D39', borderColor: '#164D39' },
  doctorTagText: { color: '#6F7D76', fontSize: 8 },
  doctorTagTextSelected: { color: '#FFF', fontWeight: '700' },
  doctorUploadRow: { flexDirection: 'row', gap: 8, marginTop: 9 },
  doctorUploadButton: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#D4CFC3', borderRadius: 11, borderStyle: 'dashed', borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 100 },
  doctorUploadDisabled: { opacity: .55 },
  doctorUploadIcon: { alignItems: 'center', backgroundColor: '#E9F2EC', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  doctorUploadIconText: { color: '#1D5A43', fontSize: 15 },
  doctorUploadTitle: { color: '#294039', fontSize: 9, fontWeight: '600', marginTop: 8 },
  doctorUploadSubtitle: { color: '#98A29D', fontSize: 7, marginTop: 6 },
  doctorAttachmentRow: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 10, borderWidth: 1, flexDirection: 'row', marginTop: 9, minHeight: 51, paddingHorizontal: 10 },
  doctorAttachmentIcon: { alignItems: 'center', backgroundColor: '#E9F2EC', borderRadius: 8, height: 30, justifyContent: 'center', width: 30 },
  doctorAttachmentIconText: { color: '#517564', fontSize: 6, fontWeight: '700' },
  doctorAttachmentCopy: { flex: 1, marginLeft: 10 },
  doctorAttachmentName: { color: '#30463D', fontSize: 9, fontWeight: '600' },
  doctorAttachmentSize: { color: '#95A09A', fontSize: 7, marginTop: 4 },
  doctorAttachmentRemove: { alignItems: 'center', borderColor: '#DED8CC', borderRadius: 11, borderWidth: 1, height: 23, justifyContent: 'center', width: 23 },
  doctorAttachmentRemoveText: { color: '#839089', fontSize: 14, lineHeight: 16 },
  doctorAttachmentError: { color: '#A24B3A', fontSize: 8, marginTop: 7 },
  doctorIntakeFooter: { backgroundColor: '#F8F5EC', borderTopColor: '#DED9CE', borderTopWidth: 1, bottom: 0, left: 0, paddingBottom: 11, paddingHorizontal: 21, paddingTop: 12, position: 'absolute', right: 0 },
  doctorFindButton: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 9, justifyContent: 'center', minHeight: 45 },
  doctorFindButtonText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  doctorSkipButton: { alignItems: 'center', justifyContent: 'center', minHeight: 29 },
  doctorSkipText: { color: '#829088', fontSize: 8, fontWeight: '600' },
  doctorMatchesPage: { flexGrow: 1, paddingBottom: 96, paddingHorizontal: 21, paddingTop: 17 },
  doctorMatchSubtitle: { color: '#7B8A82', fontSize: 10, marginTop: 3 },
  doctorRecommendedPanel: { backgroundColor: '#164D39', borderRadius: 13, marginTop: 19, padding: 14 },
  doctorRecommendedTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  doctorRecommendedEyebrow: { color: '#D2A13D', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  doctorRecommendedAside: { color: '#AFC7BB', fontSize: 7, letterSpacing: .5 },
  doctorRecommendedReason: { color: '#F7F2E5', fontSize: 8, fontWeight: '600', marginTop: 9 },
  doctorRecommendedCards: { gap: 8, marginTop: 10 },
  doctorViewAllButton: { alignItems: 'center', borderColor: '#164D39', borderRadius: 10, borderWidth: 1, justifyContent: 'center', marginTop: 12, minHeight: 44 },
  doctorViewAllText: { color: '#315B49', fontSize: 9, fontWeight: '600' },
  doctorAllSection: { marginTop: 22 },
  doctorAllHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  doctorHideText: { color: '#8A9790', fontSize: 8, marginBottom: 8 },
  doctorAvatarText: { color: '#426A58', fontFamily: serif, fontSize: 14 },
  doctorPhotoPlaceholder: { alignItems: 'center', backgroundColor: '#335F50', bottom: 0, justifyContent: 'center', left: 0, position: 'absolute', right: 0, top: 0 },
  doctorPhotoPlaceholderText: { color: '#EDF3EF', fontFamily: serif, fontSize: 66 },
});
const yogaStyles = StyleSheet.create({
  yogaSafe: { backgroundColor: '#164D39', flex: 1 },
  yogaHeader: { backgroundColor: '#164D39', height: 135, overflow: 'hidden', paddingHorizontal: 27, paddingTop: 15, position: 'relative' },
  yogaDecor: { backgroundColor: '#2F6249', borderRadius: 92, height: 184, opacity: .42, position: 'absolute', right: -82, top: 35, width: 184 },
  yogaHeadingRow: { alignItems: 'center', flexDirection: 'row', height: 43 },
  yogaBack: { alignItems: 'center', borderColor: '#668B79', borderRadius: 15, borderWidth: 1, height: 30, justifyContent: 'center', marginRight: 11, width: 30 },
  yogaBackText: { color: '#E8F0EB', fontSize: 24, fontWeight: '200', lineHeight: 25, marginTop: -2 },
  yogaEyebrow: { color: '#91AA9D', fontSize: 7, fontWeight: '700', letterSpacing: 1.6 },
  yogaTitle: { color: '#FFF7E8', fontFamily: serif, fontSize: 21, lineHeight: 24, marginTop: 1 },
  yogaStats: { alignItems: 'flex-start', flexDirection: 'row', gap: 31, marginTop: 9 },
  yogaStatValue: { color: '#FFF8EA', fontFamily: serif, fontSize: 18, lineHeight: 20 },
  yogaStatLabel: { color: '#91AA9D', fontSize: 6, fontWeight: '700', letterSpacing: 1.2, marginTop: 1 },
  yogaBody: { backgroundColor: '#F8F5EC', flex: 1 },
  yogaBodyContent: { paddingBottom: 148, paddingHorizontal: 27, paddingTop: 14 },
  yogaWeekHeading: { alignItems: 'center', flexDirection: 'row' },
  yogaSectionLabel: { color: '#94A19A', fontSize: 7, fontWeight: '700', letterSpacing: 1.7 },
  yogaWeekLine: { backgroundColor: '#DFDACE', flex: 1, height: 1, marginLeft: 12 },
  yogaWeekRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  yogaWeekDay: { alignItems: 'center', width: 37 },
  yogaWeekBox: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 6, borderWidth: 1, height: 29, justifyContent: 'center', width: 37 },
  yogaWeekBoxComplete: { backgroundColor: '#164D39', borderColor: '#164D39' },
  yogaWeekBoxCurrent: { backgroundColor: '#ECF3ED', borderColor: '#164D39' },
  yogaWeekMark: { color: '#164D39', fontSize: 11, fontWeight: '700' },
  yogaWeekMarkComplete: { color: '#FFF' },
  yogaWeekDayLabel: { color: '#97A39D', fontSize: 7, marginTop: 5 },
  yogaSequenceHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  yogaSequenceTitle: { color: '#34473E', fontFamily: serif, fontSize: 17 },
  yogaSequenceMeta: { color: '#8F9B95', fontSize: 7, letterSpacing: .7 },
  yogaPracticeList: { borderBottomColor: '#DED9CE', borderBottomWidth: 1, marginTop: 8 },
  yogaPracticeRow: { alignItems: 'center', borderTopColor: '#DED9CE', borderTopWidth: 1, flexDirection: 'row', minHeight: 57, paddingVertical: 7 },
  yogaPracticeNumber: { alignItems: 'center', backgroundColor: '#E8F2EB', borderRadius: 9, height: 30, justifyContent: 'center', marginRight: 11, width: 30 },
  yogaPracticeNumberText: { color: '#47745E', fontSize: 8, fontWeight: '600' },
  yogaPracticeCopy: { flex: 1, minWidth: 0 },
  yogaPracticeName: { color: '#31463C', fontSize: 10, fontWeight: '600' },
  yogaPracticeReason: { color: '#84918A', fontSize: 8, marginTop: 3 },
  yogaPracticeDuration: { color: '#778880', fontSize: 7, letterSpacing: .7, marginLeft: 9 },
  yogaNoteCard: { backgroundColor: '#FFF', borderColor: '#DDD8CC', borderLeftColor: '#C99231', borderLeftWidth: 2, borderRadius: 9, borderWidth: 1, marginTop: 16, minHeight: 78, paddingHorizontal: 13, paddingVertical: 13 },
  yogaNoteEyebrow: { color: '#A27A32', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  yogaNoteText: { color: '#66766E', fontSize: 8, lineHeight: 13, marginTop: 7 },
  yogaAction: { backgroundColor: '#F8F5EC', borderTopColor: '#E2DDD2', borderTopWidth: 1, bottom: 70, left: 0, paddingHorizontal: 27, paddingVertical: 12, position: 'absolute', right: 0 },
  yogaStart: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 9, justifyContent: 'center', minHeight: 44 },
  yogaStartText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  yogaBottomNav: { alignItems: 'center', backgroundColor: '#FBF9F3', borderTopColor: '#DED9CE', borderTopWidth: 1, bottom: 0, flexDirection: 'row', height: 70, justifyContent: 'space-around', left: 0, paddingBottom: 8, paddingTop: 5, position: 'absolute', right: 0 },
  yogaSessionLightSafe: { backgroundColor: '#F8F5EC', flex: 1 },
  yogaModePage: { flexGrow: 1, paddingBottom: 102, paddingHorizontal: 27, paddingTop: 18 },
  yogaSessionBack: { alignItems: 'center', borderColor: '#DDD8CD', borderRadius: 15, borderWidth: 1, height: 30, justifyContent: 'center', marginBottom: 16, width: 30 },
  yogaSessionBackText: { color: '#29443A', fontSize: 24, fontWeight: '200', lineHeight: 25, marginTop: -2 },
  yogaSessionEyebrow: { color: '#B17D2D', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  yogaModeTitle: { color: '#243B32', fontFamily: serif, fontSize: 25, lineHeight: 31, marginTop: 7 },
  yogaModeOptions: { gap: 10, marginTop: 24 },
  yogaModeCard: { backgroundColor: '#FFF', borderColor: '#DED8CD', borderRadius: 11, borderWidth: 1, minHeight: 98, paddingHorizontal: 14, paddingVertical: 13 },
  yogaModeCardSelected: { backgroundColor: '#EAF3ED', borderColor: '#164D39' },
  yogaModeHeading: { alignItems: 'center', flexDirection: 'row' },
  yogaRadio: { alignItems: 'center', borderColor: '#D0C9BC', borderRadius: 8, borderWidth: 1, height: 16, justifyContent: 'center', marginRight: 10, width: 16 },
  yogaRadioSelected: { backgroundColor: '#164D39', borderColor: '#164D39' },
  yogaRadioDot: { backgroundColor: '#FFF', borderRadius: 2, height: 4, width: 4 },
  yogaModeName: { color: '#2B4238', fontSize: 11, fontWeight: '600' },
  yogaModeCopy: { color: '#718079', fontSize: 9, lineHeight: 15, marginLeft: 26, marginTop: 6 },
  yogaModeMeta: { color: '#648275', fontSize: 7, fontWeight: '700', letterSpacing: 1.3, marginLeft: 26, marginTop: 8 },
  yogaEitherCard: { backgroundColor: '#FFF', borderColor: '#DDD8CD', borderLeftColor: '#C99536', borderLeftWidth: 2, borderRadius: 10, borderWidth: 1, marginTop: 16, minHeight: 102, paddingHorizontal: 14, paddingVertical: 16 },
  yogaEitherLabel: { color: '#A17B36', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  yogaEitherCopy: { color: '#43564D', fontSize: 9, lineHeight: 16, marginTop: 9 },
  yogaSessionFooter: { backgroundColor: '#F8F5EC', borderTopColor: '#E1DCD1', borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: 27, paddingVertical: 12, position: 'absolute', right: 0 },
  yogaSessionPrimary: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 10, justifyContent: 'center', minHeight: 46 },
  yogaSessionPrimaryText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  yogaPoseHeader: { alignItems: 'center', flexDirection: 'row', minHeight: 62, paddingHorizontal: 28, paddingTop: 10 },
  yogaClose: { alignItems: 'center', borderColor: '#DED8CD', borderRadius: 14, borderWidth: 1, height: 28, justifyContent: 'center', marginRight: 11, width: 28 },
  yogaCloseText: { color: '#29433A', fontSize: 17, fontWeight: '300', lineHeight: 19 },
  yogaPoseEyebrow: { color: '#8D9993', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  yogaPoseTitle: { color: '#31443B', fontFamily: serif, fontSize: 18, lineHeight: 22, maxWidth: 245, marginTop: 1 },
  yogaSegmentRow: { flexDirection: 'row', gap: 5, paddingHorizontal: 28, paddingBottom: 14 },
  yogaSegmentTrack: { backgroundColor: '#E4DED2', borderRadius: 2, flex: 1, height: 3, overflow: 'hidden' },
  yogaSegmentFill: { backgroundColor: '#164D39', borderRadius: 2, height: 3 },
  yogaPoseScroll: { paddingBottom: 185, paddingHorizontal: 28 },
  yogaPoseVisual: { alignItems: 'center', backgroundColor: '#F1EFE8', borderColor: '#DDD8CC', borderRadius: 11, borderWidth: 1, height: 250, justifyContent: 'center', overflow: 'hidden' },
  yogaPoseImage: { height: '100%', width: '100%' },
  yogaPoseVisualIcon: { alignItems: 'center', borderColor: '#83978D', borderRadius: 6, borderWidth: 1, height: 25, justifyContent: 'center', width: 25 },
  yogaPoseVisualIconText: { color: '#738A7E', fontSize: 17 },
  yogaPoseVisualTitle: { color: '#334D42', fontFamily: serif, fontSize: 17, marginTop: 13 },
  yogaPoseVisualCopy: { color: '#72817A', fontSize: 9, lineHeight: 14, marginTop: 4, textAlign: 'center' },
  yogaInstructionCard: { backgroundColor: '#FFF', borderColor: '#DDD8CD', borderRadius: 11, borderWidth: 1, marginTop: 16, minHeight: 168, paddingHorizontal: 14, paddingVertical: 17 },
  yogaInstructionLabel: { color: '#8D9993', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginBottom: 8 },
  yogaInstructionRow: { alignItems: 'flex-start', flexDirection: 'row', marginTop: 8 },
  yogaInstructionBullet: { color: '#C89030', fontSize: 12, fontWeight: '800', lineHeight: 15, marginRight: 9 },
  yogaInstructionText: { color: '#344A40', flex: 1, fontSize: 9, lineHeight: 15 },
  yogaTimerPanel: { backgroundColor: '#164D39', borderTopLeftRadius: 12, borderTopRightRadius: 12, bottom: 0, left: 28, minHeight: 168, overflow: 'hidden', paddingHorizontal: 17, paddingTop: 14, position: 'absolute', right: 28 },
  yogaTimerDecor: { backgroundColor: '#2E6248', borderRadius: 85, height: 170, opacity: .48, position: 'absolute', right: -55, top: -34, width: 170 },
  yogaTimerLabel: { color: '#8DAA9C', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, textAlign: 'center' },
  yogaTimerValue: { color: '#FFF8E9', fontFamily: serif, fontSize: 46, lineHeight: 53, marginTop: 3, textAlign: 'center' },
  yogaTimerTrack: { backgroundColor: '#527562', height: 2, marginTop: 8, overflow: 'hidden' },
  yogaTimerFill: { backgroundColor: '#D2A03A', height: 2 },
  yogaTimerActions: { flexDirection: 'row', gap: 8, marginTop: 15 },
  yogaTimerSecondary: { alignItems: 'center', borderColor: '#638473', borderRadius: 9, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 40 },
  yogaTimerSecondaryText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  yogaTimerDone: { alignItems: 'center', backgroundColor: '#F8F5EC', borderRadius: 9, flex: 1, justifyContent: 'center', minHeight: 40 },
  yogaTimerDoneText: { color: '#28503F', fontSize: 10, fontWeight: '600' },
  yogaButtonDisabled: { opacity: .45 },
  yogaTransitionSafe: { backgroundColor: '#164D39', flex: 1 },
  yogaTransitionPage: { flex: 1, overflow: 'hidden', paddingHorizontal: 31, paddingTop: 115 },
  yogaTransitionCheck: { alignItems: 'center', borderColor: '#6E8E7D', borderRadius: 31, borderWidth: 1, height: 62, justifyContent: 'center', marginBottom: 25, width: 62 },
  yogaTransitionCheckText: { color: '#D2A03A', fontSize: 23 },
  yogaTransitionEyebrow: { color: '#8BA89A', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  yogaTransitionTitle: { color: '#FFF8E8', fontFamily: serif, fontSize: 28, lineHeight: 34, marginTop: 8 },
  yogaTransitionCopy: { color: '#B7CEC2', fontSize: 10, lineHeight: 17, marginTop: 10, maxWidth: 285 },
  yogaTransitionStats: { flexDirection: 'row', gap: 23, marginTop: 25 },
  yogaTransitionStatValue: { color: '#FFF8E8', fontFamily: serif, fontSize: 18 },
  yogaTransitionStatLabel: { color: '#83A091', fontSize: 6, fontWeight: '700', letterSpacing: 1.2, marginTop: 2 },
  yogaTransitionBottom: { bottom: 22, left: 31, position: 'absolute', right: 31 },
  yogaUpNext: { alignItems: 'center', borderTopColor: '#416C59', borderTopWidth: 1, flexDirection: 'row', minHeight: 61, paddingTop: 9 },
  yogaUpNextNumber: { alignItems: 'center', backgroundColor: '#35624F', borderRadius: 8, height: 33, justifyContent: 'center', marginRight: 11, width: 33 },
  yogaUpNextNumberText: { color: '#D5E3DC', fontSize: 8, fontWeight: '700' },
  yogaUpNextCopy: { flex: 1 },
  yogaUpNextLabel: { color: '#82A091', fontSize: 6, fontWeight: '700', letterSpacing: 1.2 },
  yogaUpNextName: { color: '#FFF7E7', fontSize: 10, fontWeight: '600', marginTop: 4 },
  yogaUpNextDuration: { color: '#BFD1C7', fontSize: 7, letterSpacing: .8 },
  yogaTransitionPrimary: { alignItems: 'center', backgroundColor: '#F8F5EC', borderRadius: 9, justifyContent: 'center', minHeight: 45 },
  yogaTransitionPrimaryWaiting: { opacity: .82 },
  yogaTransitionPrimaryText: { color: '#28503F', fontSize: 10, fontWeight: '600' },
  yogaEndSession: { alignItems: 'center', borderColor: '#4D7563', borderRadius: 9, borderWidth: 1, justifyContent: 'center', marginTop: 8, minHeight: 39 },
  yogaEndSessionText: { color: '#FFF', fontSize: 9, fontWeight: '600' },
  yogaCompleteSafe: { backgroundColor: '#0E2E24', flex: 1, overflow: 'hidden' },
  yogaCompleteDecorTop: { backgroundColor: '#343F25', borderRadius: 100, height: 200, opacity: .45, position: 'absolute', right: -53, top: -48, width: 200 },
  yogaCompleteDecorBottom: { backgroundColor: '#1D513B', borderRadius: 110, bottom: -83, height: 220, left: -49, opacity: .65, position: 'absolute', width: 220 },
  yogaCompletePage: { alignItems: 'center', flex: 1, paddingHorizontal: 31, paddingTop: 115 },
  yogaCompleteCheckOuter: { alignItems: 'center', borderColor: '#4A6D5F', borderRadius: 43, borderWidth: 1, height: 86, justifyContent: 'center', width: 86 },
  yogaCompleteCheckInner: { alignItems: 'center', backgroundColor: '#3D4227', borderRadius: 31, height: 62, justifyContent: 'center', width: 62 },
  yogaCompleteCheckText: { color: '#D2A03A', fontSize: 27 },
  yogaCompleteEyebrow: { color: '#88A397', fontSize: 7, fontWeight: '700', letterSpacing: 1.5, marginTop: 38 },
  yogaCompleteTitle: { color: '#FFF8E8', fontFamily: serif, fontSize: 29, lineHeight: 35, marginTop: 8 },
  yogaCompleteCopy: { color: '#B9CCC3', fontSize: 10, lineHeight: 17, marginTop: 10, maxWidth: 260, textAlign: 'center' },
  yogaCompleteStats: { borderBottomColor: '#385548', borderBottomWidth: 1, borderTopColor: '#385548', borderTopWidth: 1, flexDirection: 'row', marginTop: 32, paddingVertical: 13, width: '100%' },
  yogaCompleteStat: { alignItems: 'center', flex: 1 },
  yogaCompleteStatValue: { color: '#FFF8E8', fontFamily: serif, fontSize: 18 },
  yogaCompleteStatLabel: { color: '#779185', fontSize: 6, fontWeight: '700', letterSpacing: 1.1, marginTop: 3 },
  yogaReturning: { color: '#718B80', fontSize: 9, marginTop: 27 },
  yogaCompleteBottom: { bottom: 24, left: 31, position: 'absolute', right: 31 },
  yogaCompleteProgress: { backgroundColor: '#466358', height: 2, marginBottom: 17, overflow: 'hidden' },
  yogaCompleteProgressFill: { backgroundColor: '#D0A038', height: 2 },
  yogaCompleteButton: { alignItems: 'center', borderColor: '#516F62', borderRadius: 9, borderWidth: 1, justifyContent: 'center', minHeight: 43 },
  yogaCompleteButtonText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
});

const foodStyles = StyleSheet.create({
  foodSafe: { backgroundColor: '#164D39', flex: 1 },
  foodHeader: { backgroundColor: '#164D39', height: Platform.OS === 'android' ? 144 : 121, paddingHorizontal: 29, paddingTop: Platform.OS === 'android' ? 40 : 17 },
  foodTitleRow: { alignItems: 'center', flexDirection: 'row', height: 40 },
  foodBack: { alignItems: 'center', borderColor: '#6B8E7E', borderRadius: 15, borderWidth: 1, height: 30, justifyContent: 'center', marginRight: 11, width: 30 },
  foodBackText: { color: '#E8F0EB', fontSize: 24, fontWeight: '200', lineHeight: 25, marginTop: -2 },
  foodEyebrow: { color: '#93AC9F', fontSize: 7, fontWeight: '700', letterSpacing: 1.6 },
  foodTitle: { color: '#FFF7E8', fontFamily: serif, fontSize: 21, lineHeight: 24, marginTop: 1 },
  foodTabs: { backgroundColor: '#32664F', borderRadius: 9, flexDirection: 'row', height: 39, marginTop: 10, padding: 4 },
  foodTab: { alignItems: 'center', borderRadius: 7, flex: 1, justifyContent: 'center' },
  foodTabActive: { backgroundColor: '#F8F5EC' },
  foodTabText: { color: '#AFC4B8', fontSize: 9, fontWeight: '700' },
  foodTabTextActive: { color: '#335B49' },
  foodBody: { backgroundColor: '#F8F5EC', flex: 1 },
  foodBodyContent: { paddingBottom: 92, paddingHorizontal: 30, paddingTop: 15 },
  foodTrackingContent: { paddingBottom: 92, paddingHorizontal: 26, paddingTop: 13 },
  foodWhyCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderLeftColor: '#C99435', borderLeftWidth: 2, borderRadius: 9, borderWidth: 1, minHeight: 88, paddingHorizontal: 13, paddingVertical: 16 },
  foodWhyCardAfterMeals: { marginTop: 18 },
  foodWhyEyebrow: { color: '#A07A35', fontSize: 7, fontWeight: '700', letterSpacing: 1.4 },
  foodWhyCopy: { color: '#43554C', fontSize: 10, lineHeight: 16, marginTop: 9 },
  foodSectionLabel: { color: '#93A099', fontSize: 7, fontWeight: '700', letterSpacing: 1.7, marginBottom: 10, marginTop: 20 },
  foodMealList: { gap: 9 },
  foodMealCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, minHeight: 101, paddingHorizontal: 12, paddingVertical: 12 },
  foodMealCardComplete: { backgroundColor: '#EAF3ED', borderColor: '#164D39' },
  foodMealHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  foodMealHeadingLeft: { alignItems: 'center', flexDirection: 'row' },
  foodMealCheck: { alignItems: 'center', borderColor: '#D5CFC3', borderRadius: 10, borderWidth: 1, height: 20, justifyContent: 'center', marginRight: 10, width: 20 },
  foodMealCheckComplete: { backgroundColor: '#164D39', borderColor: '#164D39' },
  foodMealCheckText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  foodMealTitle: { color: '#34473E', fontFamily: serif, fontSize: 15 },
  foodMealTime: { color: '#A1AAA5', fontSize: 7, fontWeight: '600', letterSpacing: 1.1 },
  foodMealCopy: { color: '#3D5047', fontSize: 10, lineHeight: 15, marginTop: 9 },
  foodMealTags: { flexDirection: 'row', gap: 6, marginTop: 9 },
  foodMealTag: { backgroundColor: '#E8F2EB', borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 },
  foodMealTagText: { color: '#3F715A', fontSize: 7, fontWeight: '600' },
  foodGuidanceRow: { flexDirection: 'row', gap: 9, marginTop: 18 },
  foodGuidanceCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, flex: 1, minHeight: 160, padding: 13 },
  foodGuidanceEyebrow: { color: '#4C846A', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  foodLimitEyebrow: { color: '#AD7A2D' },
  foodGuidanceTitle: { color: '#33473E', fontFamily: serif, fontSize: 14, marginTop: 7 },
  foodGuidanceCopy: { color: '#7B8881', fontSize: 8, lineHeight: 13, marginTop: 7 },
  foodGuidanceBulletRow: { alignItems: 'flex-start', flexDirection: 'row', marginTop: 7 },
  foodGuidanceBullet: { color: '#4C846A', fontSize: 10, lineHeight: 13, marginRight: 5 },
  foodLimitBullet: { color: '#AD7A2D' },
  foodGuidanceItemText: { color: '#66766E', flex: 1, fontSize: 8, lineHeight: 12 },
  foodProgressCard: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, flexDirection: 'row', minHeight: 112, paddingHorizontal: 16, paddingVertical: 14 },
  foodProgressCopy: { flex: 1, marginLeft: 15 },
  foodProgressTitle: { color: '#34473E', fontFamily: serif, fontSize: 15 },
  foodProgressBody: { color: '#7D8983', fontSize: 9, lineHeight: 14, marginTop: 7 },
  foodRing: { height: 82, position: 'relative', width: 82 },
  foodRingSegment: { borderRadius: 2, height: 10, left: 39, position: 'absolute', top: 36, width: 4 },
  foodRingCenter: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 26, height: 52, justifyContent: 'center', left: 15, position: 'absolute', top: 15, width: 52 },
  foodRingValue: { color: '#35473F', fontFamily: serif, fontSize: 21, lineHeight: 23 },
  foodRingToday: { color: '#94A19A', fontSize: 6, letterSpacing: 1.2 },
  foodMacroRow: { flexDirection: 'row', gap: 8 },
  foodMacroCard: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, flex: 1, minHeight: 112, paddingBottom: 10, paddingTop: 15 },
  foodMacroRing: { height: 58, position: 'relative', width: 58 },
  foodMacroSegment: { borderRadius: 2, height: 7, left: 27, position: 'absolute', top: 25, width: 3 },
  foodMacroCenter: { alignItems: 'center', backgroundColor: '#FFF', borderRadius: 18, height: 36, justifyContent: 'center', left: 11, position: 'absolute', top: 11, width: 36 },
  foodMacroValue: { color: '#31483E', fontFamily: serif, fontSize: 12 },
  foodMacroLabel: { color: '#91A099', fontSize: 6, fontWeight: '700', letterSpacing: 1.1, marginTop: 5 },
  foodMacroGoal: { color: '#A4ADA8', fontSize: 7, marginTop: 5 },
  foodSectionHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  foodItemCount: { color: '#98A49E', fontSize: 7, letterSpacing: .8, marginBottom: 10 },
  foodLogList: { gap: 8 },
  foodTrackedRow: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 10, borderWidth: 1, flexDirection: 'row', minHeight: 57, paddingHorizontal: 11, paddingVertical: 8 },
  foodTrackedBadge: { alignItems: 'center', backgroundColor: '#E8F2EB', borderRadius: 8, height: 33, justifyContent: 'center', marginRight: 10, width: 33 },
  foodTrackedBadgeText: { color: '#4F7B66', fontSize: 7, fontWeight: '700' },
  foodTrackedName: { color: '#334A3F', fontSize: 10, fontWeight: '600' },
  foodTrackedMeta: { color: '#798A81', fontSize: 7, letterSpacing: .4, marginTop: 4 },
  foodRemoveButton: { alignItems: 'center', borderColor: '#DED8CC', borderRadius: 11, borderWidth: 1, height: 23, justifyContent: 'center', marginLeft: 8, width: 23 },
  foodRemoveText: { color: '#7C8982', fontSize: 14, lineHeight: 17 },
  foodAddItemButton: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 9, flexDirection: 'row', justifyContent: 'center', marginTop: 10, minHeight: 43 },
  foodAddItemPlus: { color: '#FFF', fontSize: 16, marginRight: 7 },
  foodAddItemText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  foodLogRow: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 10, borderWidth: 1, flexDirection: 'row', minHeight: 54, paddingHorizontal: 12, paddingVertical: 8 },
  foodLogRowComplete: { backgroundColor: '#EAF3ED', borderColor: '#164D39' },
  foodLogCheck: { alignItems: 'center', borderColor: '#D3CDBF', borderRadius: 10, borderWidth: 1, height: 20, justifyContent: 'center', marginRight: 10, width: 20 },
  foodLogCheckComplete: { backgroundColor: '#164D39', borderColor: '#164D39' },
  foodLogCheckText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  foodLogCopy: { flex: 1 },
  foodLogTitle: { color: '#34473E', fontSize: 10, fontWeight: '600' },
  foodLogDetail: { color: '#89948E', fontSize: 8, marginTop: 3 },
  foodLogTime: { color: '#A5ADA8', fontSize: 7, letterSpacing: .7, marginLeft: 8 },
  foodWeekCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, minHeight: 147, paddingHorizontal: 14, paddingTop: 13 },
  foodBars: { alignItems: 'flex-end', flexDirection: 'row', height: 87, justifyContent: 'space-between' },
  foodBarColumn: { alignItems: 'center', justifyContent: 'flex-end', width: 32 },
  foodBar: { borderRadius: 3, width: 31 },
  foodBarLabel: { color: '#85928B', fontSize: 6, fontWeight: '600', marginTop: 6 },
  foodWeekDivider: { backgroundColor: '#E2DDD3', height: 1, marginTop: 10 },
  foodWeekSummary: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 37 },
  foodWeekLabel: { color: '#7D8983', fontSize: 9 },
  foodWeekValue: { color: '#263E34', fontSize: 10, fontWeight: '700' },
  foodLogOther: { alignItems: 'center', borderColor: '#164D39', borderRadius: 10, borderWidth: 1, justifyContent: 'center', marginTop: 17, minHeight: 42 },
  foodLogOtherText: { color: '#315B48', fontSize: 9, fontWeight: '600' },
  foodBottomNav: { alignItems: 'center', backgroundColor: '#FBF9F3', borderTopColor: '#DED9CE', borderTopWidth: 1, bottom: 0, flexDirection: 'row', height: 70, justifyContent: 'space-around', left: 0, paddingBottom: 8, paddingTop: 5, position: 'absolute', right: 0 },
  foodAddSafe: { backgroundColor: '#F8F5EC', flex: 1 },
  foodAddScreen: { flex: 1 },
  foodAddContent: { paddingBottom: 104, paddingHorizontal: 24, paddingTop: 17 },
  foodAddBack: { alignItems: 'center', borderColor: '#DED9CE', borderRadius: 15, borderWidth: 1, height: 30, justifyContent: 'center', width: 30 },
  foodAddBackText: { color: '#365046', fontSize: 24, fontWeight: '200', lineHeight: 25, marginTop: -2 },
  foodAddTitle: { color: '#30443B', fontFamily: serif, fontSize: 25, lineHeight: 31, marginTop: 17 },
  foodAddSubtitle: { color: '#7B8981', fontSize: 10, marginTop: 4 },
  foodAddLabel: { color: '#92A099', fontSize: 7, fontWeight: '700', letterSpacing: 1.6, marginTop: 20 },
  foodMealSelector: { flexDirection: 'row', gap: 6, marginTop: 9 },
  foodMealOption: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 8, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 32 },
  foodMealOptionActive: { backgroundColor: '#164D39', borderColor: '#164D39' },
  foodMealOptionText: { color: '#66776E', fontSize: 8 },
  foodMealOptionTextActive: { color: '#FFF', fontWeight: '700' },
  foodSearchRow: { flexDirection: 'row', gap: 7, marginTop: 9 },
  foodSearchInputWrap: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#164D39', borderRadius: 9, borderWidth: 1, flex: 1, flexDirection: 'row', minHeight: 39, paddingHorizontal: 10 },
  foodSearchIcon: { color: '#71827A', fontSize: 16, marginRight: 7 },
  foodSearchInput: { color: '#31463C', flex: 1, fontSize: 10, paddingVertical: 0 },
  foodSearchClear: { alignItems: 'center', backgroundColor: '#EFEEE9', borderRadius: 9, height: 18, justifyContent: 'center', width: 18 },
  foodSearchClearText: { color: '#89958F', fontSize: 13, lineHeight: 15 },
  foodSearchButton: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 9, justifyContent: 'center', minHeight: 39, width: 66 },
  foodSearchButtonText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  foodSearchResultCount: { color: '#99A49F', fontSize: 7, letterSpacing: .5, marginTop: 8 },
  foodSearchResult: { alignItems: 'center', backgroundColor: '#EAF3ED', borderColor: '#164D39', borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 9, minHeight: 53, paddingHorizontal: 13 },
  foodSearchResultName: { color: '#31473D', fontSize: 10, fontWeight: '600' },
  foodSearchResultServing: { color: '#809087', fontSize: 8, marginTop: 4 },
  foodSearchResultMeta: { color: '#71827A', fontSize: 7 },
  foodDetailsHeading: { alignItems: 'flex-end', flexDirection: 'row', justifyContent: 'space-between' },
  foodDetailsAside: { color: '#ABB3AF', fontSize: 7, letterSpacing: .5 },
  foodDetailsCard: { backgroundColor: '#FFF', borderColor: '#E0DBD0', borderRadius: 10, borderWidth: 1, marginTop: 9, padding: 14 },
  foodFieldLabel: { color: '#74837B', fontSize: 8, marginBottom: 6 },
  foodDetailInput: { backgroundColor: '#F5F2EA', borderColor: '#DED8CC', borderRadius: 8, borderWidth: 1, color: '#34483E', fontSize: 10, height: 38, paddingHorizontal: 11 },
  foodDetailInputWide: { width: '100%' },
  foodNutrientInputs: { flexDirection: 'row', gap: 8, marginTop: 11 },
  foodNumberField: { flex: 1 },
  foodServingRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 15 },
  foodServingControls: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  foodServingButton: { alignItems: 'center', borderColor: '#DED8CC', borderRadius: 12, borderWidth: 1, height: 25, justifyContent: 'center', width: 25 },
  foodServingButtonText: { color: '#315044', fontSize: 14 },
  foodServingValue: { color: '#33483E', fontSize: 11 },
  foodAddsSummary: { alignItems: 'center', backgroundColor: '#E8F3EC', borderColor: '#CAE2D3', borderRadius: 10, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, minHeight: 41, paddingHorizontal: 13 },
  foodAddsSummaryLabel: { color: '#4C725F', fontSize: 8 },
  foodAddsSummaryValue: { color: '#1F5540', fontSize: 8, letterSpacing: .5 },
  foodAddFooter: { backgroundColor: '#F8F5EC', borderTopColor: '#DED9CE', borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: 24, paddingVertical: 13, position: 'absolute', right: 0 },
  foodSaveButton: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 9, justifyContent: 'center', minHeight: 45 },
  foodSaveButtonText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  foodButtonDisabled: { opacity: .45 },
});

const homeV2Styles = StyleSheet.create({
  homeV2Safe: { backgroundColor: '#164D39', flex: 1 },
  homeV2Scroll: { backgroundColor: '#F8F5EC', flexGrow: 1, paddingBottom: 92 },
  homeV2Header: { backgroundColor: '#164D39', height: 190, overflow: 'hidden', paddingHorizontal: 27, paddingTop: 31, position: 'relative' },
  homeV2Decor: { backgroundColor: '#2E6248', borderRadius: 88, height: 176, opacity: .42, position: 'absolute', right: -45, top: -70, width: 176 },
  homeV2Eyebrow: { color: '#9BB5A7', fontSize: 8, fontWeight: '700', letterSpacing: 2.2, marginTop: 3 },
  homeV2Name: { color: '#FFF7E8', fontFamily: serif, fontSize: 42, lineHeight: 49, marginTop: 6 },
  homeV2Body: { paddingHorizontal: 19 },
  homeBalanceCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 12, borderWidth: 1, elevation: 3, flexDirection: 'row', marginTop: -48, minHeight: 153, paddingHorizontal: 13, paddingVertical: 14, shadowColor: '#17352E', shadowOffset: { width: 0, height: 5 }, shadowOpacity: .07, shadowRadius: 10 },
  homeBalanceChart: { alignItems: 'center', width: 104 },
  homeBalanceLegend: { alignSelf: 'stretch', gap: 4, marginTop: 3, paddingHorizontal: 2 },
  homeBalanceLegendRow: { alignItems: 'center', flexDirection: 'row' },
  homeBalanceDot: { borderRadius: 3, height: 6, marginRight: 6, width: 6 },
  homeBalanceLegendName: { color: '#61736A', flex: 1, fontSize: 8 },
  homeBalanceLegendValue: { color: '#314A3E', fontSize: 8, fontWeight: '700' },
  homeBalanceCopy: { flex: 1, paddingLeft: 12, paddingTop: 1 },
  homeBalanceEyebrow: { color: '#B18439', fontSize: 7, fontWeight: '700', letterSpacing: 1.6 },
  homeBalanceTitle: { color: '#294038', fontFamily: serif, fontSize: 17, lineHeight: 21, marginTop: 7 },
  homeBalanceBody: { color: '#7D8A83', fontSize: 9, lineHeight: 14, marginTop: 7 },
  homeBalanceActions: { flexDirection: 'row', gap: 16, marginTop: 5 },
  homeBalanceLink: { color: '#36775E', fontSize: 8, textDecorationLine: 'underline' },
  homeAppointmentStrip: { alignItems: 'center', backgroundColor: '#EAF4EE', borderColor: '#C9DDD1', borderRadius: 11, borderWidth: 1, flexDirection: 'row', marginTop: 12, minHeight: 61, paddingHorizontal: 14 },
  homeAppointmentIcon: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#D7E5DC', borderRadius: 18, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  homeAppointmentIconText: { color: '#16513B', fontSize: 17 },
  homeAppointmentCopy: { flex: 1, marginLeft: 12 },
  homeAppointmentEyebrow: { color: '#8A9C93', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 },
  homeAppointmentText: { color: '#314A40', fontSize: 10, marginTop: 4 },
  homeSectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10, marginTop: 21 },
  homeSectionTitle: { color: '#314038', fontFamily: serif, fontSize: 18 },
  homeSectionAction: { color: '#3F785F', fontSize: 8, fontWeight: '600' },
  homePlanGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  homePlanCard: { backgroundColor: '#FFF', borderColor: '#E0DBD0', borderRadius: 11, borderWidth: 1, minHeight: 101, padding: 12, width: '48.4%' },
  homePlanTop: { alignItems: 'center', flexDirection: 'row' },
  homePlanIcon: { alignItems: 'center', backgroundColor: '#EAF3EC', borderRadius: 12, height: 24, justifyContent: 'center', width: 24 },
  homePlanIconText: { color: '#4B826A', fontSize: 12 },
  homePlanTitle: { color: '#31473D', fontSize: 10, fontWeight: '600', marginLeft: 7 },
  homePlanTiming: { color: '#A2ACA6', fontSize: 7, marginLeft: 'auto' },
  homePlanDetail: { color: '#7D8982', flex: 1, fontSize: 9, lineHeight: 14, marginTop: 9 },
  homePlanTrack: { backgroundColor: '#E9E3D7', borderRadius: 2, height: 2, marginTop: 8, overflow: 'hidden' },
  homePlanProgress: { borderRadius: 2, height: 2 },
  homeProductRow: { gap: 9, paddingRight: 19 },
  homeProductCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, minHeight: 159, padding: 9, width: 118 },
  homeProductVisual: { alignItems: 'center', backgroundColor: '#E7F0E8', borderRadius: 8, height: 69, justifyContent: 'center', position: 'relative' },
  homeProductBrand: { color: '#458168', fontSize: 5, fontWeight: '700', left: 7, letterSpacing: 1, position: 'absolute', top: 7 },
  homeProductGlyph: { color: '#17553E', fontFamily: serif, fontSize: 25 },
  homeProductName: { color: '#294138', fontSize: 10, fontWeight: '600', marginTop: 8 },
  homeProductBenefit: { color: '#8A9690', fontSize: 7, marginTop: 4 },
  homeProductFooter: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 7 },
  homeProductPrice: { color: '#16513B', fontSize: 10, fontWeight: '600' },
  homeProductAdd: { alignItems: 'center', borderColor: '#16513B', borderRadius: 10, borderWidth: 1, height: 20, justifyContent: 'center', width: 20 },
  homeProductAddText: { color: '#16513B', fontSize: 13, lineHeight: 15 },
  homeExploreEyebrow: { color: '#8D9A93', fontSize: 7, fontWeight: '700', letterSpacing: 1.6, marginTop: 26 },
  homeExploreWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 9 },
  homeExplorePill: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 15, borderWidth: 1, paddingHorizontal: 13, paddingVertical: 8 },
  homeExploreText: { color: '#35604E', fontSize: 9 },
  homePreSafe: { backgroundColor: '#164D39', flex: 1 },
  homePreScroll: { backgroundColor: '#F8F5EC', flexGrow: 1, paddingBottom: 88 },
  homePreHeader: { alignItems: 'center', backgroundColor: '#164D39', flexDirection: 'row', height: Platform.OS === 'android' ? 89 : 66, justifyContent: 'space-between', paddingHorizontal: 26, paddingTop: 12 },
  homePreEyebrow: { color: '#A6BFB2', fontSize: 7, fontWeight: '700', letterSpacing: 1.8 },
  homePreName: { color: '#FFF7E8', fontFamily: serif, fontSize: 27, lineHeight: 32, marginTop: 2 },
  homePreAvatar: { alignItems: 'center', borderColor: '#6B8D7D', borderRadius: 16, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  homePreAvatarText: { color: '#FFF7E8', fontFamily: serif, fontSize: 13 },
  homePreBody: { paddingHorizontal: 26, paddingTop: 16 },
  homeSetupCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, minHeight: 227, paddingHorizontal: 15, paddingVertical: 14 },
  homeSetupEyebrow: { color: '#8D9993', fontSize: 7, fontWeight: '600', letterSpacing: 1.6 },
  homeSetupTitle: { color: '#32433B', fontFamily: serif, fontSize: 17, lineHeight: 22, marginTop: 6 },
  homeSetupSteps: { gap: 10, marginTop: 14 },
  homeSetupStep: { alignItems: 'flex-start', flexDirection: 'row', minHeight: 30 },
  homeSetupNumber: { alignItems: 'center', backgroundColor: '#F0EEE7', borderRadius: 10, height: 20, justifyContent: 'center', marginRight: 10, width: 20 },
  homeSetupNumberActive: { backgroundColor: '#164D39' },
  homeSetupNumberText: { color: '#919A95', fontSize: 8, fontWeight: '700' },
  homeSetupNumberTextActive: { color: '#FFF' },
  homeSetupStepCopy: { flex: 1 },
  homeSetupStepTitle: { color: '#31453C', fontSize: 10, fontWeight: '600' },
  homeSetupStepBody: { color: '#8B9690', fontSize: 8, marginTop: 3 },
  homeSetupButton: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 8, justifyContent: 'center', marginTop: 12, minHeight: 40 },
  homeSetupButtonText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  homePreExploreLabel: { color: '#74867D', fontSize: 8, fontWeight: '600', letterSpacing: 1.5, marginBottom: 9, marginTop: 20 },
  homePreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  homePreTile: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 10, borderWidth: 1, height: 72, justifyContent: 'center', width: '31.5%' },
  homePreTileIcon: { alignItems: 'center', backgroundColor: '#E8F2EB', borderRadius: 14, height: 28, justifyContent: 'center', width: 28 },
  homePreTileIconText: { color: '#3E795F', fontSize: 14 },
  homePreTileLabel: { color: '#31473D', fontSize: 8, marginTop: 7 },
  homePreBottomNav: { alignItems: 'center', backgroundColor: '#FBF9F3', borderTopColor: '#DED9CE', borderTopWidth: 1, bottom: 0, flexDirection: 'row', height: 70, justifyContent: 'space-around', left: 0, paddingBottom: 8, paddingTop: 5, position: 'absolute', right: 0 },
});

const styles = StyleSheet.create({
  ...yogaStyles,
  ...foodStyles,
  ...homeV2Styles,
  ...doctorEntryStyles,
  ...termsConsentStyles,
  ...doctorReviewsStyles,
  appViewport: { flex: 1, paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0 }, appViewportDark: { backgroundColor: '#104F39' }, appViewportLight: { backgroundColor: '#F7F4EB' },
  flex: { flex: 1 }, safe: { backgroundColor: '#F7F4EB', flex: 1 }, scroll: { flexGrow: 1 }, content: { flex: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 27 }, contentTop: { justifyContent: 'flex-start', paddingTop: 18 },
  splash: { alignItems: 'center', backgroundColor: '#104F39', flex: 1, justifyContent: 'center', overflow: 'hidden' }, splashContent: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 28, width: '100%' }, splashLogoPanel: { alignItems: 'center', backgroundColor: '#FBFAF5', borderRadius: 113, height: 226, justifyContent: 'center', marginBottom: 26, width: 226 }, splashLogo: { height: 126, width: 195 }, splashSubtitle: { color: '#F5EAC7', fontSize: 14, fontWeight: '500', lineHeight: 21, textAlign: 'center' }, splashTap: { bottom: 18, color: '#93AA9F', fontSize: 11, position: 'absolute' }, splashCircleTop: { backgroundColor: '#326146', borderRadius: 92, height: 184, opacity: .38, position: 'absolute', right: -72, top: 66, width: 184 }, splashCircleBottom: { backgroundColor: '#326146', borderRadius: 92, bottom: -42, height: 184, left: -54, opacity: .38, position: 'absolute', width: 184 },
  corner: { bottom: -12, height: 185, left: -20, opacity: .6, position: 'absolute', width: 150 }, cornerStem: { backgroundColor: '#B59D54', bottom: 0, height: 170, left: 48, position: 'absolute', transform: [{ rotate: '35deg' }], width: 3 }, cornerLeaf: { backgroundColor: '#C1A95E', borderBottomLeftRadius: 20, borderTopRightRadius: 20, height: 44, position: 'absolute', width: 24 }, cornerLeaf1: { bottom: 36, left: 30, transform: [{ rotate: '-30deg' }] }, cornerLeaf2: { bottom: 76, left: 62, transform: [{ rotate: '48deg' }] }, cornerLeaf3: { bottom: 112, left: 73, transform: [{ rotate: '70deg' }] },
  introTop: { alignItems: 'center', paddingBottom: 52 }, introKicker: { color: '#8C7E64', fontSize: 10, fontWeight: '700', letterSpacing: 4.2, marginTop: 28 }, introTitle: { color: '#064B36', fontFamily: serif, fontSize: 36, fontWeight: '400', marginTop: 8 }, introCopy: { color: '#6E746F', fontSize: 13, lineHeight: 20, marginTop: 14, textAlign: 'center' }, introActions: { bottom: 22, gap: 4, left: 22, position: 'absolute', right: 22 }, loginLink: { alignItems: 'center', paddingVertical: 8 }, welcomeEmblem: { alignItems: 'center', backgroundColor: '#E7F0E9', borderRadius: 68, height: 136, justifyContent: 'center', position: 'relative', width: 136 }, welcomeStem: { backgroundColor: '#0D513A', height: 39, left: 68, position: 'absolute', top: 52, width: 3 }, welcomeLeaf: { backgroundColor: '#2F7B54', height: 17, position: 'absolute', width: 28 }, welcomeLeafLeft: { borderBottomLeftRadius: 18, borderTopRightRadius: 18, left: 47, top: 50, transform: [{ rotate: '36deg' }] }, welcomeLeafRight: { backgroundColor: '#0D513A', borderBottomRightRadius: 18, borderTopLeftRadius: 18, left: 66, top: 60, transform: [{ rotate: '-35deg' }] }, welcomeGround: { backgroundColor: '#C69A3A', height: 2, left: 57, position: 'absolute', top: 91, width: 27 },
  herbArt: { alignSelf: 'center', height: 230, marginVertical: 22, width: 260 }, sunDisc: { backgroundColor: '#EFE4C4', borderRadius: 65, height: 130, left: 65, opacity: .7, position: 'absolute', top: 42, width: 130 }, bowl: { backgroundColor: '#D8C49A', borderBottomLeftRadius: 45, borderBottomRightRadius: 45, bottom: 20, height: 68, left: 73, position: 'absolute', shadowColor: '#3B4B43', shadowOffset: { width: 0, height: 8 }, shadowOpacity: .18, shadowRadius: 8, width: 116 }, bowlRim: { backgroundColor: '#BDA777', borderRadius: 20, height: 13, left: -5, position: 'absolute', top: -4, width: 126 }, stem: { backgroundColor: '#4F7447', bottom: 80, height: 120, left: 120, position: 'absolute', width: 4 }, stemRight: { height: 105, left: 140 }, leaf: { backgroundColor: '#6E914F', borderBottomLeftRadius: 22, borderTopRightRadius: 22, height: 44, position: 'absolute', width: 23 }, leaf1: { left: 91, top: 65, transform: [{ rotate: '-50deg' }] }, leaf2: { left: 132, top: 46, transform: [{ rotate: '25deg' }] }, leaf3: { left: 151, top: 82, transform: [{ rotate: '60deg' }] }, leaf4: { left: 105, top: 105, transform: [{ rotate: '-70deg' }] },
  pageTitle: { color: '#0B3529', fontFamily: serif, fontSize: 29, fontWeight: '400', lineHeight: 36, marginTop: 8, textAlign: 'left' }, pageSubtitle: { color: '#6B756E', fontSize: 13, lineHeight: 20, marginBottom: 27, marginTop: 3, textAlign: 'left' }, step: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 9, textAlign: 'center' }, form: { gap: 17 }, label: { color: '#333B35', fontSize: 12, fontWeight: '700', marginBottom: 7 }, onboardingLabel: { color: '#6F766F', fontSize: 9, fontWeight: '600', letterSpacing: 2.1, marginBottom: 7 }, input: { backgroundColor: '#FFFEFC', borderColor: '#D8D5CB', borderRadius: 11, borderWidth: 1, color: '#202921', fontSize: 15, minHeight: 51, paddingHorizontal: 14 }, phoneInputWrap: { alignItems: 'center', backgroundColor: '#FFFEFC', borderColor: '#D8D5CB', borderRadius: 11, borderWidth: 1, flexDirection: 'row', minHeight: 51 }, phonePrefix: { color: '#1E2C26', fontSize: 14, paddingHorizontal: 13 }, phoneDivider: { backgroundColor: '#DEDCD2', height: 24, width: 1 }, phoneInput: { color: '#1E2C26', flex: 1, fontSize: 14, minHeight: 51, paddingHorizontal: 13 },
  primaryButton: { alignItems: 'center', backgroundColor: '#005A3F', borderRadius: 11, elevation: 2, justifyContent: 'center', minHeight: 51, paddingHorizontal: 18, shadowColor: '#003C2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: .14, shadowRadius: 8 }, onboardingPrimaryButton: { backgroundColor: '#10563F', borderRadius: 10, elevation: 0, shadowOpacity: 0 }, primaryText: { color: '#FFF', fontSize: 14, fontWeight: '700' }, secondaryButton: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#0A6048', borderRadius: 11, borderWidth: 1.3, justifyContent: 'center', minHeight: 51, paddingHorizontal: 18 }, secondaryText: { color: '#07533F', fontSize: 15, fontWeight: '700' }, pressed: { opacity: .74 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginVertical: 24 }, divider: { backgroundColor: '#DDD8CC', flex: 1, height: 1 }, dividerText: { color: '#8D938D', fontSize: 10 }, socialRow: { flexDirection: 'row', gap: 12, justifyContent: 'space-between' }, socialButton: { alignItems: 'center', backgroundColor: '#FFFEFC', borderColor: '#DDD8CE', borderRadius: 10, borderWidth: 1, flex: 1, height: 58, justifyContent: 'center' }, socialSymbol: { color: '#0E4C38', fontSize: 14, fontWeight: '700' }, google: { color: '#0E4C38' }, socialLabel: { color: '#53615A', fontSize: 9, marginTop: 2 },
  notice: { color: '#7A6429', fontSize: 11, lineHeight: 17, marginTop: 16, textAlign: 'center' }, error: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: 'center' }, policy: { color: '#858D87', fontSize: 9, lineHeight: 14, marginTop: 'auto', paddingTop: 48, textAlign: 'center' }, muted: { color: '#6D756F', fontSize: 12 }, link: { color: '#075A43', fontWeight: '500' }, back: { alignItems: 'center', height: 38, justifyContent: 'center', marginBottom: 8, marginLeft: -10, width: 38 }, backText: { color: '#26352F', fontSize: 31, fontWeight: '300', lineHeight: 32 }, onboardingBack: { borderColor: '#DDD8CC', borderRadius: 15, borderWidth: 1, height: 30, marginBottom: 6, marginLeft: 0, width: 30 }, onboardingBackText: { fontSize: 24, lineHeight: 25 }, progressHeader: { alignItems: 'center', flexDirection: 'row', marginBottom: 15 }, stepTracks: { flex: 1, flexDirection: 'row', gap: 5, marginLeft: 14 }, stepTrack: { backgroundColor: '#D9D6CC', flex: 1, height: 2 }, stepTrackActive: { backgroundColor: '#0C523C' }, stepCount: { color: '#7D847E', fontSize: 9, marginLeft: 12 },
  checkRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 11, marginTop: 3 }, checkbox: { alignItems: 'center', borderColor: '#B9BDB5', borderRadius: 5, borderWidth: 1.3, height: 22, justifyContent: 'center', marginTop: 1, width: 22 }, checkboxSelected: { backgroundColor: '#005A3F', borderColor: '#005A3F' }, checkmark: { color: '#FFF', fontSize: 14, fontWeight: '800' }, terms: { color: '#6D756F', flex: 1, fontSize: 12, lineHeight: 19 },
  dobInput: { alignItems: 'center', backgroundColor: '#FFFEFC', borderColor: '#D8D5CB', borderRadius: 11, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 51, paddingHorizontal: 14 }, dobInputText: { color: '#202921', fontSize: 15 }, dobPlaceholder: { color: '#9A9B92' }, dobCalendarIcon: { color: '#10563F', fontSize: 21 },
  dobCalendarBackdrop: { alignItems: 'center', backgroundColor: 'rgba(8, 28, 22, .48)', flex: 1, justifyContent: 'center', paddingHorizontal: 20 }, dobCalendarCard: { backgroundColor: '#FFFDF7', borderColor: '#DDD7CA', borderRadius: 18, borderWidth: 1, maxWidth: 390, padding: 18, width: '100%' }, dobCalendarTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, dobCalendarEyebrow: { color: '#A77A2F', fontSize: 8, fontWeight: '700', letterSpacing: 1.7 }, dobCalendarTitle: { color: '#17372D', fontFamily: serif, fontSize: 23, marginTop: 3 }, dobCalendarClose: { alignItems: 'center', borderColor: '#D8D5CB', borderRadius: 16, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 }, dobCalendarCloseText: { color: '#385047', fontSize: 24, fontWeight: '300', lineHeight: 26 }, dobCalendarControls: { alignItems: 'center', flexDirection: 'row', marginTop: 20 }, dobCalendarControl: { alignItems: 'center', height: 36, justifyContent: 'center', width: 36 }, dobCalendarControlText: { color: '#15513E', fontSize: 22 }, dobCalendarMonth: { color: '#293D35', flex: 1, fontSize: 14, fontWeight: '700', textAlign: 'center' }, dobCalendarWeek: { flexDirection: 'row', marginTop: 12 }, dobCalendarWeekday: { color: '#8B958F', fontSize: 9, fontWeight: '700', textAlign: 'center', width: '14.2857%' }, dobCalendarGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }, dobCalendarDaySlot: { alignItems: 'center', aspectRatio: 1, justifyContent: 'center', width: '14.2857%' }, dobCalendarDay: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 }, dobCalendarDaySelected: { backgroundColor: '#15513E' }, dobCalendarDayText: { color: '#34463E', fontSize: 13 }, dobCalendarDayDisabled: { color: '#C8CBC6' }, dobCalendarDayTextSelected: { color: '#FFF', fontWeight: '700' }, dobCalendarCancel: { alignItems: 'center', borderColor: '#B9C6BF', borderRadius: 10, borderWidth: 1, justifyContent: 'center', marginTop: 14, minHeight: 44 }, dobCalendarCancelText: { color: '#15513E', fontSize: 13, fontWeight: '700' },
  choiceRow: { flexDirection: 'row', gap: 9 }, choice: { alignItems: 'center', backgroundColor: '#FFFEFC', borderColor: '#D8D5CB', borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 48 }, choiceSelected: { backgroundColor: '#10563F', borderColor: '#10563F' }, choiceText: { color: '#1D2923', fontSize: 13, fontWeight: '600' }, choiceTextSelected: { color: '#FFF' }, measureRow: { flexDirection: 'row', gap: 11 }, measureField: { flex: 1 }, privacy: { color: '#89908A', fontSize: 9, lineHeight: 15, textAlign: 'center' },
  welcomeSafe: { backgroundColor: '#104F39', flex: 1 }, confirmationContent: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 46, paddingHorizontal: 28 }, successCircle: { alignItems: 'center', borderColor: '#6E8D7F', borderRadius: 38, borderWidth: 1, height: 76, justifyContent: 'center', marginBottom: 26, width: 76 }, successCheck: { color: '#D2A33D', fontSize: 28, fontWeight: '400', lineHeight: 34 }, confirmationTitle: { color: '#FFFDF4', fontFamily: serif, fontSize: 29, fontWeight: '400', textAlign: 'center' }, confirmationCopy: { color: '#D7DFD9', fontSize: 12, lineHeight: 20, marginTop: 14, textAlign: 'center' }, confirmationAction: { bottom: 28, left: 20, position: 'absolute', right: 20 }, homeButton: { alignItems: 'center', backgroundColor: '#FBF8EF', borderRadius: 10, justifyContent: 'center', minHeight: 50 }, homeButtonText: { color: '#0D503B', fontSize: 13, fontWeight: '500' },
  assessmentSafe: { backgroundColor: '#F7F4EB', flex: 1 }, assessmentIntroPage: { flex: 1, paddingBottom: 25, paddingHorizontal: 21, paddingTop: 17 }, assessmentIntroContent: { flex: 1, justifyContent: 'center', paddingBottom: 8, paddingTop: 70 }, assessmentIntroEyebrow: { color: '#BB8736', fontSize: 8, fontWeight: '500', letterSpacing: 2.1, marginBottom: 10 }, assessmentIntroTitle: { color: '#092E25', fontFamily: serif, fontSize: 29, fontWeight: '400', lineHeight: 35, textAlign: 'left' }, assessmentIntroCopy: { color: '#628078', fontSize: 12, lineHeight: 19, marginTop: 15, textAlign: 'left' }, assessmentFacts: { borderTopColor: '#DCD7CB', borderTopWidth: 1, marginTop: 27 }, assessmentFact: { alignItems: 'center', borderBottomColor: '#DCD7CB', borderBottomWidth: 1, flexDirection: 'row', minHeight: 43 }, factIcon: { alignItems: 'flex-start', justifyContent: 'center', width: 29 }, factIconText: { color: '#6B9A87', fontSize: 8, fontWeight: '500', letterSpacing: .6 }, factTextWrap: { flex: 1 }, factText: { color: '#173A31', fontSize: 12, fontWeight: '500' }, factDetail: { color: '#8A8F8B', fontSize: 11, marginTop: 2 }, assessmentEmblem: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#E9F0E7', borderRadius: 34, height: 68, justifyContent: 'center', marginBottom: 24, width: 68 }, assessmentEmblemText: { color: '#075A3F', fontSize: 36 },
  questionPage: { flex: 1, paddingBottom: 24, paddingHorizontal: 18, paddingTop: 14 }, assessmentPageTitle: { color: '#202921', fontFamily: serif, fontSize: 23, fontWeight: '700' }, questionCount: { color: '#6D756F', fontSize: 12, fontWeight: '600', marginTop: 15 }, progressTrack: { backgroundColor: '#E2E3DB', borderRadius: 4, height: 6, marginTop: 8, overflow: 'hidden' }, progressFill: { backgroundColor: '#075A3F', borderRadius: 4, height: '100%' }, questionPrompt: { color: '#26312B', fontFamily: serif, fontSize: 22, fontWeight: '700', lineHeight: 28, marginBottom: 15, marginTop: 18 }, answerList: { flex: 1, gap: 12 }, answerOption: { alignItems: 'center', backgroundColor: '#FFFEFA', borderColor: '#DEDED4', borderRadius: 14, borderWidth: 1, flex: 1, flexDirection: 'row', justifyContent: 'space-between', maxHeight: 165, minHeight: 110, overflow: 'hidden', paddingRight: 12 }, answerOptionSelected: { backgroundColor: '#F3F8F4', borderColor: '#075A3F', borderWidth: 1.5 }, answerImage: { alignSelf: 'stretch', backgroundColor: '#E8EDE7', height: '100%', marginRight: 12, width: 145 }, answerImageContained: { backgroundColor: '#F5F1E8' }, answerTextWrap: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 7, paddingVertical: 11 }, answerLetter: { color: '#075A3F', fontSize: 12, fontWeight: '800' }, answerLabel: { color: '#38423C', flex: 1, fontSize: 12, fontWeight: '600', lineHeight: 17 }, radio: { alignItems: 'center', borderColor: '#C8CBC5', borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: 'center', marginLeft: 6, width: 20 }, radioSelected: { borderColor: '#075A3F' }, radioDot: { backgroundColor: '#075A3F', borderRadius: 5, height: 10, width: 10 }, questionActions: { flexDirection: 'row', gap: 12, paddingTop: 14 }, continueHalf: { flex: 1 }, answerHint: { color: '#8A6D2F', fontSize: 11, marginTop: 7, textAlign: 'right' },
  resultPage: { flexGrow: 1, paddingBottom: 30, paddingHorizontal: 25, paddingTop: 40 }, resultEyebrow: { color: '#B08A3D', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' }, resultTitle: { color: '#075A3F', fontFamily: serif, fontSize: 33, fontWeight: '700', marginTop: 8, textAlign: 'center' }, resultDominant: { color: '#34443C', fontSize: 16, fontWeight: '700', marginTop: 7, textAlign: 'center' }, prakritiResultSafe: { backgroundColor: '#124E38', flex: 1 }, prakritiResultScroll: { backgroundColor: '#F7F4EB' }, resultHeader: { alignItems: 'center', backgroundColor: '#124E38', justifyContent: 'center', minHeight: 99, paddingBottom: 20, paddingTop: 14 }, prakritiResultEyebrow: { color: '#A8C5B5', fontSize: 8, fontWeight: '600', letterSpacing: 2.2, textAlign: 'center' }, prakritiResultTitle: { color: '#FFF8E8', fontFamily: serif, fontSize: 27, fontWeight: '400', lineHeight: 33, marginTop: 4, textAlign: 'center' }, prakritiResultPage: { flexGrow: 1, paddingBottom: 28, paddingHorizontal: 21, paddingTop: 19 }, chartRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 }, doshaChart: { height: 112, position: 'relative', width: 112 }, chartSegment: { borderRadius: 2, height: 14, left: 53.5, position: 'absolute', top: 49, width: 5 }, chartCenter: { alignItems: 'center', backgroundColor: '#F7F4EB', borderRadius: 34, height: 68, justifyContent: 'center', left: 22, position: 'absolute', top: 22, width: 68 }, chartCenterLabel: { color: '#71827A', fontSize: 9 }, chartCenterValue: { color: '#102D25', fontFamily: serif, fontSize: 24, fontWeight: '400', lineHeight: 28, marginTop: 1 }, legend: { gap: 6, marginLeft: 17 }, legendItem: { alignItems: 'center', flexDirection: 'row', minWidth: 151 }, legendDot: { borderRadius: 4, height: 7, marginRight: 8, width: 7 }, legendName: { color: '#314B42', flex: 1, fontSize: 11, fontWeight: '500' }, legendValue: { color: '#142B24', fontSize: 11, fontWeight: '600', marginLeft: 20 }, resultMeaning: { backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 12, borderWidth: 1, marginBottom: 18, paddingHorizontal: 16, paddingVertical: 15 }, resultSectionLabel: { color: '#69887C', fontSize: 8, fontWeight: '600', letterSpacing: 2.1, marginBottom: 10 }, prakritiResultBody: { color: '#234137', fontSize: 11, lineHeight: 18 }, resultDivider: { backgroundColor: '#DCD5C7', height: 1, marginBottom: 12, marginTop: 14 }, tendencyRow: { alignItems: 'flex-start', flexDirection: 'row', marginBottom: 7 }, tendencyDot: { backgroundColor: '#C9902F', borderRadius: 2, height: 4, marginRight: 8, marginTop: 7, width: 4 }, tendency: { color: '#687A73', flex: 1, fontSize: 11, lineHeight: 17 }, resultHomeLink: { alignItems: 'center', justifyContent: 'center', minHeight: 34 }, resultHomeLinkText: { color: '#31735D', fontSize: 11, fontWeight: '500' }, resultSectionTitle: { color: '#29352F', fontFamily: serif, fontSize: 17, fontWeight: '700', marginBottom: 8, marginTop: 7 }, resultBody: { color: '#606963', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  reviewCard: { backgroundColor: '#FFFDF7', borderColor: '#D8D1BF', borderRadius: 17, borderWidth: 1, marginBottom: 22, padding: 19 }, reviewTitle: { color: '#29352F', fontFamily: serif, fontSize: 20, fontWeight: '700', lineHeight: 27, textAlign: 'center' }, starRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 17, marginTop: 14 }, star: { color: '#D5D0C5', fontSize: 38, marginHorizontal: 3 }, starSelected: { color: '#E5A92F' }, feedbackInput: { backgroundColor: '#FFFFFF', borderColor: '#D8D8CE', borderRadius: 12, borderWidth: 1, color: '#2F3933', fontSize: 14, minHeight: 118, padding: 14, textAlignVertical: 'top', marginBottom: 14 }, reviewThanks: { color: '#075A3F', fontSize: 14, fontWeight: '700', paddingVertical: 10, textAlign: 'center' }, validationFoodPage: { paddingBottom: 42, paddingTop: 30 }, validationFoodSubtitle: { color: '#648074', fontSize: 9, fontWeight: '700', letterSpacing: 1.5, marginTop: 9, textAlign: 'center' }, validationFoodWhyCard: { marginTop: 18 }, validationFoodReviewCard: { marginTop: 22 }, validationYogaPage: { paddingBottom: 42, paddingTop: 30 }, validationYogaSubtitle: { color: '#648074', fontSize: 11, marginTop: 8, textAlign: 'center' }, validationYogaReviewCard: { marginTop: 24 },
  validationSupplementPage: { paddingBottom: 42, paddingTop: 30 }, validationSupplementSubtitle: { color: '#648074', fontSize: 11, lineHeight: 17, marginTop: 8, textAlign: 'center' }, supplementHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 25 }, supplementList: { gap: 13, marginTop: 10 }, supplementCard: { backgroundColor: '#FFFDF8', borderColor: '#DED9CE', borderRadius: 13, borderWidth: 1, padding: 13 }, supplementTitleRow: { alignItems: 'center', flexDirection: 'row' }, supplementTitleCopy: { flex: 1 }, supplementEyebrow: { color: '#8A9A92', fontSize: 7, fontWeight: '700', letterSpacing: 1.4 }, supplementName: { color: '#31463C', fontFamily: serif, fontSize: 17, fontWeight: '700', marginTop: 3 }, supplementReasonCard: { backgroundColor: '#F8F5EC', borderColor: '#E1DCD0', borderLeftColor: '#C99231', borderLeftWidth: 2, borderRadius: 9, borderWidth: 1, marginTop: 12, paddingHorizontal: 12, paddingVertical: 11 }, supplementReasonText: { color: '#66766E', fontSize: 11, lineHeight: 17, marginTop: 6 }, validationSupplementReviewCard: { marginTop: 24 },
  vikritiResultCard: { backgroundColor: '#FFFDF7', borderColor: '#E7E0CE', borderRadius: 17, borderWidth: 1, marginBottom: 24, marginTop: 25, padding: 20 }, vikritiConclusion: { color: '#075A3F', fontFamily: serif, fontSize: 24, fontWeight: '700', lineHeight: 32, marginBottom: 20, textAlign: 'center' }, vikritiLabel: { color: '#9B7835', fontSize: 10, fontWeight: '800', letterSpacing: 1.2, marginBottom: 6, marginTop: 4 },
  patientContextPage: { flexGrow: 1, gap: 16, paddingBottom: 34, paddingHorizontal: 22, paddingTop: 28 }, patientContextCopy: { color: '#667069', fontSize: 14, lineHeight: 21, marginBottom: 8 }, patientSectionLabel: { color: '#9B7835', fontSize: 10, fontWeight: '800', letterSpacing: 1.1, marginTop: 8 }, percentageRow: { flexDirection: 'row', gap: 9 }, percentageField: { flex: 1 }, patientGenderRow: { flexDirection: 'row', gap: 9, marginBottom: 2 },
  healthIntroPage: { flex: 1, paddingBottom: 28, paddingHorizontal: 24, paddingTop: 18 }, healthIntroContent: { flex: 1, justifyContent: 'center', paddingBottom: 22 }, meditationArt: { alignSelf: 'center', height: 190, marginTop: 25, position: 'relative', width: 250 }, meditationHalo: { backgroundColor: '#EDF2DD', borderRadius: 70, height: 140, left: 55, position: 'absolute', top: 24, width: 140 }, meditationHead: { backgroundColor: '#B87544', borderRadius: 16, height: 31, left: 109, position: 'absolute', top: 28, width: 31 }, meditationBody: { backgroundColor: '#52704B', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: 75, left: 91, position: 'absolute', top: 56, width: 67 }, meditationArms: { backgroundColor: '#B87544', borderRadius: 8, height: 13, left: 57, position: 'absolute', top: 92, transform: [{ rotate: '-4deg' }], width: 137 }, meditationLegs: { backgroundColor: '#465D3F', borderRadius: 30, height: 37, left: 43, position: 'absolute', top: 125, width: 164 }, meditationLeaf: { backgroundColor: '#83A86B', borderBottomLeftRadius: 24, borderTopRightRadius: 24, height: 74, position: 'absolute', top: 82, width: 35 }, meditationLeafLeft: { left: 25, transform: [{ rotate: '-35deg' }] }, meditationLeafRight: { right: 25, transform: [{ rotate: '35deg' }] }, healthQuestion: { color: '#26312B', fontFamily: serif, fontSize: 23, fontWeight: '700', lineHeight: 31, marginTop: 30 }, selectAllHint: { color: '#68716C', fontSize: 12, marginBottom: 18, marginTop: 6 }, symptomList: { gap: 10 }, symptomOption: { alignItems: 'center', backgroundColor: '#FFFEFA', borderColor: '#DEDED4', borderRadius: 10, borderWidth: 1, flexDirection: 'row', minHeight: 49, paddingHorizontal: 13 }, symptomOptionSelected: { backgroundColor: '#F3F8F4', borderColor: '#A9C4B6' }, symptomCheckbox: { alignItems: 'center', borderColor: '#C5C8C2', borderRadius: 4, borderWidth: 1.2, height: 21, justifyContent: 'center', marginRight: 12, width: 21 }, symptomCheckboxSelected: { backgroundColor: '#075A3F', borderColor: '#075A3F' }, symptomCheck: { color: '#FFF', fontSize: 13, fontWeight: '800' }, symptomLabel: { color: '#3E4742', fontSize: 14, fontWeight: '500' },
  healthSummaryPage: { flex: 1, paddingBottom: 28, paddingHorizontal: 24, paddingTop: 24 }, summaryContent: { flex: 1, justifyContent: 'center', paddingBottom: 45 }, healthSummaryTitle: { color: '#26312B', fontFamily: serif, fontSize: 28, fontWeight: '700', lineHeight: 36, textAlign: 'center' }, summaryCard: { backgroundColor: '#FFFDF7', borderColor: '#E3DED0', borderRadius: 16, borderWidth: 1, marginTop: 34, overflow: 'hidden' }, summaryRow: { borderBottomColor: '#E7E3D9', borderBottomWidth: 1, paddingHorizontal: 18, paddingVertical: 16 }, summaryRowLast: { borderBottomWidth: 0 }, summaryLabel: { color: '#747B76', fontSize: 11, fontWeight: '700', marginBottom: 5, textTransform: 'uppercase' }, summaryValue: { color: '#303A34', fontSize: 14, fontWeight: '600', lineHeight: 20 }, healthReadyPage: { flex: 1, paddingBottom: 28, paddingHorizontal: 24, paddingTop: 24 }, healthReadyContent: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 40 }, readyIcon: { alignItems: 'center', backgroundColor: '#E5F2E7', borderRadius: 30, height: 60, justifyContent: 'center', marginBottom: 23, width: 60 }, readyIconCheck: { color: '#3E9A50', fontSize: 30, fontWeight: '800' }, readyCopy: { color: '#68716C', fontSize: 14, lineHeight: 21, marginTop: 16, maxWidth: 275, textAlign: 'center' }, readyChecklist: { alignSelf: 'stretch', gap: 18, marginHorizontal: 28, marginTop: 38 }, readyItem: { alignItems: 'center', flexDirection: 'row', gap: 13 }, readyCheck: { alignItems: 'center', backgroundColor: '#4CA65A', borderRadius: 11, height: 22, justifyContent: 'center', width: 22 }, readyCheckText: { color: '#FFF', fontSize: 13, fontWeight: '800' }, readyLabel: { color: '#35413A', fontSize: 14, fontWeight: '600' }, readyFooter: { color: '#5F6963', fontSize: 13, lineHeight: 20, marginTop: 42, textAlign: 'center' },
  homeSafe: { backgroundColor: '#004735', flex: 1 }, homeScroll: { backgroundColor: '#FBF8EF', flexGrow: 1, paddingBottom: 112 }, homeHeader: { alignItems: 'center', backgroundColor: '#004735', flexDirection: 'row', justifyContent: 'space-between', minHeight: 198, paddingBottom: 60, paddingHorizontal: 25, paddingTop: 29 }, greeting: { color: '#D9E7DF', fontSize: 19, fontWeight: '500', lineHeight: 25 }, greetingName: { color: '#FFF', fontFamily: serif, fontSize: 40, fontWeight: '700', lineHeight: 47, marginTop: 2 }, bell: { alignItems: 'center', borderColor: '#C7DED3', borderRadius: 22, borderWidth: 1.2, height: 44, justifyContent: 'center', width: 44 }, bellIcon: { color: '#FFF', fontSize: 26, transform: [{ rotate: '180deg' }] }, notificationDot: { backgroundColor: '#E5B54D', borderRadius: 4, height: 8, position: 'absolute', right: 4, top: 3, width: 8 }, dashboardBody: { paddingHorizontal: 18 }, assessmentCard: { backgroundColor: '#FFFDF7', borderColor: '#E7E0CE', borderRadius: 21, borderWidth: 1, elevation: 4, gap: 22, marginTop: -44, padding: 23, shadowColor: '#17352E', shadowOffset: { width: 0, height: 7 }, shadowOpacity: .1, shadowRadius: 14 }, assessmentTitle: { color: '#28332D', fontFamily: serif, fontSize: 21, fontWeight: '700', lineHeight: 29 }, assessmentItem: { alignItems: 'flex-start', flexDirection: 'row', gap: 15 }, numberBadge: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 16, height: 32, justifyContent: 'center', marginTop: 2, width: 32 }, completedBadge: { backgroundColor: '#3E8A52' }, numberText: { color: '#FFF', fontSize: 15, fontWeight: '800' }, assessmentText: { flex: 1 }, assessmentItemTitle: { color: '#303A34', fontSize: 16, fontWeight: '700' }, assessmentCopy: { color: '#737B75', fontSize: 14, lineHeight: 20, marginTop: 4 }, startButton: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 11, justifyContent: 'center', minHeight: 51 }, startButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'center' }, exploreTitle: { color: '#28332D', fontFamily: serif, fontSize: 22, fontWeight: '700', marginBottom: 17, marginTop: 29 }, featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, featureTile: { alignItems: 'center', backgroundColor: '#FFF6E6', borderColor: '#F3E7D1', borderRadius: 16, borderWidth: 1, height: 108, justifyContent: 'center', width: '30.5%' }, featureIcon: { fontSize: 31 }, featureLabel: { color: '#3D4640', fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' }, bottomNav: { alignItems: 'center', backgroundColor: '#FBF9F3', borderTopColor: '#DED9CE', borderTopWidth: 1, bottom: 0, flexDirection: 'row', height: 70, justifyContent: 'space-around', left: 0, paddingBottom: 8, paddingTop: 5, position: 'absolute', right: 0 }, navItem: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'center' }, navItemPressed: { opacity: .62 }, navIconPill: { alignItems: 'center', borderRadius: 13, height: 24, justifyContent: 'center', minWidth: 38, paddingHorizontal: 10 }, navIconPillActive: { backgroundColor: '#164D39' }, navIconGlyph: { color: '#8E9A94', fontSize: 16, fontWeight: '500', lineHeight: 18 }, navIconGlyphActive: { color: '#FFF', fontWeight: '700' }, navLabel: { color: '#8E9A94', fontSize: 8, lineHeight: 10, marginTop: 3 }, navLabelActive: { color: '#263E34', fontWeight: '600' },
  insightCard: { alignItems: 'center', backgroundColor: '#FFFDF7', borderColor: '#E7E0CE', borderRadius: 21, borderWidth: 1, elevation: 4, flexDirection: 'row', marginTop: -44, minHeight: 210, paddingHorizontal: 18, paddingVertical: 22, shadowColor: '#17352E', shadowOffset: { width: 0, height: 7 }, shadowOpacity: .1, shadowRadius: 14 }, miniDonut: { height: 118, marginRight: 17, position: 'relative', width: 118 }, miniDonutSegment: { borderRadius: 2, height: 14, left: 57, position: 'absolute', top: 52, width: 4 }, miniDonutCenter: { alignItems: 'center', backgroundColor: '#FFFDF7', borderColor: '#EEE5D5', borderRadius: 35, borderWidth: 1, height: 70, justifyContent: 'center', left: 24, position: 'absolute', top: 24, width: 70 }, miniDonutLabel: { color: '#435149', fontFamily: serif, fontSize: 12, fontWeight: '700' }, insightContent: { flex: 1 }, insightEyebrow: { color: '#B08A3D', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }, insightTitle: { color: '#26342D', fontFamily: serif, fontSize: 18, fontWeight: '700', lineHeight: 24, marginTop: 6 }, insightCopy: { color: '#727A74', fontSize: 11, lineHeight: 16, marginTop: 7 }, insightActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }, insightLink: { color: '#075A3F', fontSize: 11, fontWeight: '800' },
  planHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, viewAll: { color: '#7C837E', fontSize: 13, fontWeight: '600', marginTop: 12 }, planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, planTile: { backgroundColor: '#FFFDF7', borderColor: '#E6E0D3', borderRadius: 15, borderWidth: 1, minHeight: 116, padding: 15, width: '48%' }, planTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 9 }, planIcon: { fontSize: 22 }, planTitle: { color: '#303A34', fontFamily: serif, fontSize: 17, fontWeight: '700' }, planDetail: { color: '#626B65', fontSize: 13, lineHeight: 19, marginTop: 12 },
  shopSafe: { backgroundColor: '#FBF8EF', flex: 1 }, shopPage: { flex: 1, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 30 }, shopHomeScroll: { paddingBottom: 190, paddingHorizontal: 18, paddingTop: 32 }, shopTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, shopBackText: { color: '#26352F', fontSize: 32, lineHeight: 36, width: 36 }, shopTopSpacer: { width: 36 }, shopTitle: { color: '#26312B', fontFamily: serif, fontSize: 27, fontWeight: '700' }, shopSearch: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#D8DCD5', borderRadius: 24, borderWidth: 1, flexDirection: 'row', marginTop: 22, minHeight: 49, paddingHorizontal: 14 }, shopSearchIcon: { color: '#59635D', fontSize: 22, marginRight: 8 }, shopSearchInput: { color: '#303A34', flex: 1, fontSize: 14, minHeight: 47, paddingVertical: 0 }, deliveryBar: { alignItems: 'center', backgroundColor: '#EEF1EC', borderColor: '#DDE2DC', borderRadius: 13, borderWidth: 1, flexDirection: 'row', marginTop: 13, minHeight: 57, paddingHorizontal: 13 }, deliveryPin: { color: '#075A3F', fontSize: 25, marginRight: 10 }, deliveryCopy: { flex: 1 }, deliveryLabel: { color: '#7B827E', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }, deliveryAddress: { color: '#303A34', fontSize: 14, fontWeight: '700', marginTop: 2 }, deliveryArrow: { color: '#52605A', fontSize: 25 }, shopSectionTitle: { color: '#303A34', fontFamily: serif, fontSize: 19, fontWeight: '700', marginBottom: 13, marginTop: 25 }, categoryRow: { gap: 16, paddingRight: 12 }, categoryItem: { alignItems: 'center', width: 61 }, categoryIcon: { alignItems: 'center', backgroundColor: '#F6EEDC', borderColor: 'transparent', borderRadius: 11, borderWidth: 1, height: 43, justifyContent: 'center', width: 43 }, categoryIconSelected: { backgroundColor: '#E5EFE7', borderColor: '#72A083' }, categoryEmoji: { fontSize: 20 }, categoryLabel: { color: '#646D67', fontSize: 9, fontWeight: '600', lineHeight: 12, marginTop: 5, textAlign: 'center' }, categoryLabelSelected: { color: '#075A3F', fontWeight: '800' }, horizontalProducts: { gap: 12, paddingRight: 18 }, productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, productCard: { backgroundColor: '#FFFDF8', borderColor: '#E6E1D6', borderRadius: 16, borderWidth: 1, padding: 13, width: '48%' }, horizontalProductCard: { width: 168 }, productVisual: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#E9EFE5', borderColor: '#CAD8C6', borderRadius: 15, borderWidth: 1, height: 125, justifyContent: 'center', marginBottom: 13, position: 'relative', width: 125 }, productVisualSmall: { borderRadius: 10, height: 64, marginBottom: 0, marginRight: 12, width: 64 }, productVisualIcon: { fontSize: 58 }, productVisualIconSmall: { fontSize: 31 }, productBottleLabel: { backgroundColor: '#FFFDF4', borderColor: '#B5C5B0', borderRadius: 3, borderWidth: 1, bottom: 13, paddingHorizontal: 6, paddingVertical: 2, position: 'absolute' }, productBottleText: { color: '#356247', fontSize: 7, fontWeight: '900', letterSpacing: .7 }, productName: { color: '#2D3731', fontFamily: serif, fontSize: 16, fontWeight: '700' }, productWeight: { color: '#7A817D', fontSize: 11, marginTop: 4 }, productPrice: { color: '#075A3F', fontSize: 16, fontWeight: '800', marginTop: 10 }, quickAdd: { alignItems: 'center', borderColor: '#075A3F', borderRadius: 8, borderWidth: 1, marginTop: 11, paddingVertical: 7 }, quickAddText: { color: '#075A3F', fontSize: 12, fontWeight: '800' }, inlineQuantity: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', marginTop: 11, minHeight: 32, paddingHorizontal: 6 }, inlineQuantityLarge: { borderRadius: 11, minHeight: 51, paddingHorizontal: 12 }, inlineQuantityButton: { alignItems: 'center', height: 28, justifyContent: 'center', width: 28 }, inlineQuantityButtonLarge: { height: 44, width: 44 }, inlineQuantityButtonText: { color: '#FFF', fontSize: 21, fontWeight: '800' }, inlineQuantityValue: { color: '#FFF', fontSize: 13, fontWeight: '900' }, inlineQuantityValueLarge: { fontSize: 17 }, noProducts: { color: '#737B76', fontSize: 13, paddingVertical: 24, textAlign: 'center' }, floatingCart: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 30, bottom: 24, elevation: 7, height: 60, justifyContent: 'center', position: 'absolute', right: 22, shadowColor: '#002E21', shadowOffset: { width: 0, height: 5 }, shadowOpacity: .24, shadowRadius: 9, width: 60 }, floatingCartAboveNav: { bottom: 101 }, floatingCartIcon: { fontSize: 27 }, cartBadge: { alignItems: 'center', backgroundColor: '#DCA83C', borderColor: '#FFF', borderRadius: 10, borderWidth: 1.5, height: 21, justifyContent: 'center', position: 'absolute', right: -2, top: -3, minWidth: 21 }, cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' }, productDetailPage: { flexGrow: 1, paddingBottom: 105, paddingHorizontal: 22, paddingTop: 30 }, productDetailHero: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 }, productDetailCopy: { flex: 1, paddingRight: 12 }, productDetailName: { color: '#26312B', fontFamily: serif, fontSize: 25, fontWeight: '700' }, productDetailPrice: { color: '#26312B', fontSize: 27, fontWeight: '800', marginTop: 17 }, productMrp: { color: '#CE5252', fontSize: 12, fontWeight: '700', marginTop: 5, textDecorationLine: 'line-through' }, ratingLine: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 16 }, productDescription: { color: '#5E6862', fontSize: 14, lineHeight: 22, marginTop: 25 }, productAction: { marginTop: 'auto', paddingTop: 40 }, cartList: { gap: 13, paddingBottom: 20, paddingTop: 24 }, cartItem: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#E6E1D6', borderRadius: 15, borderWidth: 1, flexDirection: 'row', padding: 12 }, cartItemInfo: { flex: 1 }, cartItemName: { color: '#2E3832', fontFamily: serif, fontSize: 16, fontWeight: '700' }, cartItemPrice: { color: '#075A3F', fontSize: 14, fontWeight: '800', marginTop: 7 }, quantityControl: { alignItems: 'center', flexDirection: 'row', gap: 9 }, quantityButton: { alignItems: 'center', backgroundColor: '#EDF3EC', borderColor: '#CFDCCF', borderRadius: 14, borderWidth: 1, height: 29, justifyContent: 'center', width: 29 }, quantityButtonText: { color: '#075A3F', fontSize: 19, fontWeight: '700', lineHeight: 21 }, quantityValue: { color: '#303A34', fontSize: 14, fontWeight: '800', minWidth: 18, textAlign: 'center' }, cartFooter: { borderTopColor: '#E4E0D7', borderTopWidth: 1, paddingTop: 18 }, cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 17 }, cartTotalLabel: { color: '#505A54', fontSize: 16, fontWeight: '700' }, cartTotalValue: { color: '#26312B', fontSize: 19, fontWeight: '800' }, emptyCart: { flex: 1, gap: 10, justifyContent: 'center' }, emptyCartIcon: { fontSize: 55, textAlign: 'center' }, emptyCartTitle: { color: '#26312B', fontFamily: serif, fontSize: 24, fontWeight: '700', textAlign: 'center' }, emptyCartCopy: { color: '#737B76', fontSize: 14, marginBottom: 22, textAlign: 'center' }, orderSuccessPage: { alignItems: 'center', backgroundColor: '#FBF8EF', flex: 1, justifyContent: 'center', paddingHorizontal: 30, paddingTop: 24 }, orderSuccessCheck: { alignItems: 'center', backgroundColor: '#4FAA5B', borderRadius: 42, height: 84, justifyContent: 'center', marginBottom: 27, width: 84 }, orderSuccessCheckText: { color: '#FFF', fontSize: 45, fontWeight: '800' }, orderSuccessTitle: { color: '#26312B', fontFamily: serif, fontSize: 28, fontWeight: '700', lineHeight: 36, textAlign: 'center' }, orderSuccessCopy: { color: '#67716B', fontSize: 14, lineHeight: 22, marginTop: 17, maxWidth: 310, textAlign: 'center' }, orderSuccessTap: { color: '#075A3F', fontSize: 12, fontWeight: '700', marginTop: 42 },
  appointmentCard: { alignItems: 'center', backgroundColor: '#EFF6F0', borderColor: '#CFE0D3', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginTop: 17, padding: 15 }, appointmentPortrait: { alignItems: 'center', backgroundColor: '#D9EADB', borderColor: '#B9D2BE', borderRadius: 34, borderWidth: 1, height: 68, justifyContent: 'center', marginRight: 14, overflow: 'hidden', width: 68 }, appointmentPortraitIcon: { fontSize: 39 }, appointmentHomeContent: { flex: 1 }, appointmentEyebrow: { color: '#3C795A', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 6 }, appointmentHomeText: { color: '#2D3A33', fontSize: 14, fontWeight: '600', lineHeight: 21 },
  doctorSafe: { backgroundColor: '#F7F4EB', flex: 1 }, doctorListPage: { flexGrow: 1, paddingBottom: 116, paddingHorizontal: 21, paddingTop: 17 }, doctorTitle: { color: '#092F25', fontFamily: serif, fontSize: 29, fontWeight: '400', lineHeight: 36, marginTop: 8 }, doctorSubtitle: { color: '#668078', fontSize: 12, lineHeight: 19, marginBottom: 18, marginTop: 3 }, doctorFilterRow: { flexDirection: 'row', gap: 7, marginBottom: 14 }, doctorFilter: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DCD7CC', borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 26, paddingHorizontal: 14 }, doctorFilterSelected: { backgroundColor: '#124E38', borderColor: '#124E38' }, doctorFilterText: { color: '#214037', fontSize: 10, fontWeight: '500' }, doctorFilterTextSelected: { color: '#FFF' }, doctorCards: { gap: 10, marginBottom: 14 }, doctorCard: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 12, borderWidth: 1, flexDirection: 'row', minHeight: 97, paddingHorizontal: 12, paddingVertical: 11 }, doctorAvatar: { alignItems: 'center', backgroundColor: '#E9F1EA', borderRadius: 23, height: 46, justifyContent: 'center', marginRight: 12, overflow: 'hidden', width: 46 }, doctorPortrait: { height: '100%', width: '100%' }, doctorInfo: { flex: 1 }, doctorListName: { color: '#16392F', fontFamily: serif, fontSize: 16, fontWeight: '400', marginBottom: 2 }, doctorName: { color: '#26312B', fontFamily: serif, fontSize: 17, fontWeight: '700', marginBottom: 5 }, doctorMeta: { color: '#668078', fontSize: 10, lineHeight: 16 }, doctorPrice: { color: '#102F27', fontSize: 12, fontWeight: '700', marginTop: 3 }, doctorListRating: { alignItems: 'flex-end', alignSelf: 'flex-start', marginLeft: 6 }, doctorListRatingText: { color: '#16362D', fontSize: 10, fontWeight: '700' }, doctorListRatingStar: { color: '#C58C2D' }, doctorAvailability: { color: '#83A092', fontSize: 7, letterSpacing: 1.2, marginTop: 2 }, ratingStar: { color: '#D69E22', fontSize: 15 }, ratingText: { color: '#505954', fontSize: 12, fontWeight: '700' },
  doctorProfileSafe: { backgroundColor: '#124E38', flex: 1, marginTop: Platform.OS === 'android' ? -(NativeStatusBar.currentHeight ?? 0) : 0, paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0 }, doctorProfileScroll: { backgroundColor: '#F7F4EB' }, doctorProfilePage: { flexGrow: 1, paddingBottom: 104 }, doctorProfileHero: { backgroundColor: '#124E38', paddingBottom: 20, paddingHorizontal: 21, paddingTop: 16 }, doctorHeroBack: { alignItems: 'center', borderColor: '#5C7E70', borderRadius: 16, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 }, doctorHeroBackText: { color: '#FFF', fontSize: 25, fontWeight: '300', lineHeight: 27 }, doctorHeroIdentity: { alignItems: 'center', flexDirection: 'row', marginTop: 14 }, doctorHeroAvatar: { backgroundColor: '#335F50', borderColor: '#6D8A7E', borderRadius: 28, borderWidth: 1, height: 56, marginRight: 13, overflow: 'hidden', width: 56 }, doctorHeroCopy: { flex: 1 }, doctorHeroName: { color: '#FFF9E8', fontFamily: serif, fontSize: 20, fontWeight: '400' }, doctorHeroMeta: { color: '#BDD2C7', fontSize: 10, marginTop: 5 }, doctorStats: { backgroundColor: '#F7F4EB', borderBottomColor: '#DED9CD', borderBottomWidth: 1, flexDirection: 'row' }, doctorStat: { alignItems: 'center', borderRightColor: '#DED9CD', borderRightWidth: 1, flex: 1, justifyContent: 'center', minHeight: 54 }, doctorStatLast: { borderRightWidth: 0 }, doctorStatValue: { color: '#14372E', fontFamily: serif, fontSize: 15, fontWeight: '600' }, doctorStatLabel: { color: '#8B9B94', fontSize: 7, letterSpacing: 1.4, marginTop: 2 }, doctorProfileBody: { paddingHorizontal: 21, paddingTop: 17 }, doctorLabel: { color: '#799187', fontSize: 8, fontWeight: '600', letterSpacing: 2, marginBottom: 8, marginTop: 1 }, doctorAbout: { color: '#18382F', fontSize: 12, lineHeight: 19, marginBottom: 17 }, focusAreaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 17 }, focusAreaPill: { backgroundColor: '#E8F1EB', borderRadius: 13, paddingHorizontal: 12, paddingVertical: 6 }, focusAreaText: { color: '#1A5A45', fontSize: 9 }, consultationCard: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 13 }, consultationLabel: { color: '#789086', fontSize: 7, letterSpacing: 1.7 }, consultationFee: { color: '#124E38', fontFamily: serif, fontSize: 20, marginTop: 2 }, consultationDuration: { alignItems: 'flex-end' }, consultationDurationText: { color: '#183A30', fontSize: 12, marginTop: 3 }, doctorProfileFooter: { backgroundColor: '#F7F4EB', borderTopColor: '#DED9CD', borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: 21, paddingVertical: 12, position: 'absolute', right: 0 }, doctorBottomNav: { height: 70, paddingBottom: 8, paddingTop: 5 },
  schedulerPage: { flexGrow: 1, paddingBottom: 104, paddingHorizontal: 21, paddingTop: 17 }, schedulerDoctor: { color: '#668078', fontSize: 11, marginBottom: 24, marginTop: 2 }, calendarCard: { backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 12, borderWidth: 1, marginBottom: 18, paddingHorizontal: 13, paddingVertical: 10 }, monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 3 }, monthTitle: { color: '#17372F', fontSize: 11, fontWeight: '600' }, monthArrow: { color: '#5E786D', fontSize: 21, padding: 4 }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { color: '#8A9C95', fontSize: 7, fontWeight: '500', letterSpacing: .6, marginBottom: 3, textAlign: 'center', width: '14.285%' }, calendarDay: { alignItems: 'center', height: 34, justifyContent: 'center', width: '14.285%' }, calendarDaySelected: { alignSelf: 'center', backgroundColor: '#124E38', borderRadius: 9 }, calendarDayText: { color: '#18382F', fontSize: 10 }, calendarDayTextSelected: { color: '#FFF', fontWeight: '800' }, slotsHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, slotsDate: { color: '#27463C', fontSize: 10, marginBottom: 8 }, slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 17 }, slot: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 9, borderWidth: 1, justifyContent: 'center', minHeight: 39, width: '31.7%' }, slotSelected: { backgroundColor: '#EAF3EC', borderColor: '#124E38' }, slotDisabled: { backgroundColor: '#F8F5EE' }, slotText: { color: '#29473E', fontSize: 10, fontWeight: '500' }, slotTextSelected: { color: '#124E38', fontWeight: '700' }, slotTextDisabled: { color: '#C8C5BD', textDecorationLine: 'line-through' }, consultationTypeRow: { flexDirection: 'row', gap: 8 }, consultationTypeCard: { backgroundColor: '#FFF', borderColor: '#DDD8CC', borderRadius: 10, borderWidth: 1, flex: 1, minHeight: 55, paddingHorizontal: 12, paddingVertical: 9 }, consultationTypeSelected: { backgroundColor: '#EAF3EC', borderColor: '#124E38' }, consultationTypeTitle: { color: '#173A30', fontSize: 11, fontWeight: '600' }, consultationTypeCopy: { color: '#85968F', fontSize: 8, marginTop: 4 }, schedulerFooter: { backgroundColor: '#F7F4EB', borderTopColor: '#DED9CD', borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: 21, paddingVertical: 12, position: 'absolute', right: 0 },
  confirmedSafe: { backgroundColor: '#124E38', flex: 1, marginTop: Platform.OS === 'android' ? -(NativeStatusBar.currentHeight ?? 0) : 0, paddingTop: Platform.OS === 'android' ? NativeStatusBar.currentHeight ?? 0 : 0 }, confirmedDecor: { backgroundColor: '#315F48', borderRadius: 92, height: 184, opacity: .42, position: 'absolute', right: -68, top: 50, width: 184 }, confirmedPage: { alignItems: 'center', flex: 1, paddingHorizontal: 21, paddingTop: 74 }, appointmentCheck: { alignItems: 'center', borderColor: '#719080', borderRadius: 31, borderWidth: 1, height: 62, justifyContent: 'center', marginBottom: 20, width: 62 }, appointmentCheckText: { color: '#D6A130', fontSize: 25, fontWeight: '400' }, confirmedTitle: { color: '#FFF8E8', fontFamily: serif, fontSize: 27, fontWeight: '400', textAlign: 'center' }, confirmedNote: { color: '#BFD2C8', fontSize: 11, lineHeight: 18, marginTop: 9, textAlign: 'center' }, confirmedSummary: { alignSelf: 'stretch', borderColor: '#4E7565', borderRadius: 10, borderWidth: 1, marginTop: 27, overflow: 'hidden' }, confirmedRow: { alignItems: 'center', borderBottomColor: '#416B59', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 39, paddingHorizontal: 13 }, confirmedRowLast: { borderBottomWidth: 0 }, confirmedLabel: { color: '#8FB1A2', fontSize: 7, letterSpacing: 1.5 }, confirmedValue: { color: '#FFF', fontSize: 10, fontWeight: '600' }, confirmedActions: { bottom: 17, left: 21, position: 'absolute', right: 21 }, confirmedPrimary: { alignItems: 'center', backgroundColor: '#FBF8EF', borderRadius: 10, justifyContent: 'center', minHeight: 47 }, confirmedPrimaryText: { color: '#124E38', fontSize: 12, fontWeight: '600' }, confirmedHome: { alignItems: 'center', minHeight: 35, paddingTop: 10 }, confirmedHomeText: { color: '#BCD0C6', fontSize: 11 },
  profileHubSafe: { backgroundColor: '#FBF8EF', flex: 1 }, profileHubScroll: { paddingBottom: 125, paddingHorizontal: 20, paddingTop: 28 }, profileHubTitle: { color: '#252F29', fontFamily: serif, fontSize: 30, fontWeight: '700', marginBottom: 22 }, profileIdentity: { alignItems: 'center', flexDirection: 'row', paddingVertical: 8 }, profileIdentityCopy: { flex: 1 }, profileAvatar: { alignItems: 'center', backgroundColor: '#E8F2E9', borderColor: '#C8DCCB', borderRadius: 40, borderWidth: 1, height: 80, justifyContent: 'center', marginRight: 17, overflow: 'hidden', width: 80 }, profileAvatarIcon: { color: '#075A3F', fontSize: 38, fontWeight: '700' }, profileName: { color: '#29332D', fontFamily: serif, fontSize: 23, fontWeight: '700' }, profileEdit: { color: '#747C77', fontSize: 13, marginTop: 5 }, healthProfileCards: { gap: 13, marginTop: 24 }, healthProfileCard: { alignItems: 'stretch', backgroundColor: '#EAF3EA', borderColor: '#C9DDCD', borderRadius: 19, borderWidth: 1, flexDirection: 'row', minHeight: 174, overflow: 'hidden' }, healthCardLabelWrap: { backgroundColor: '#075A3F', justifyContent: 'center', paddingHorizontal: 12, width: 128 }, healthCardEyebrow: { color: '#BFD8C8', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 }, healthCardLabel: { color: '#FFF', fontFamily: serif, fontSize: 20, fontWeight: '700', marginTop: 4, width: '100%' }, healthCardContent: { flex: 1, justifyContent: 'center', padding: 17 }, healthCardTitle: { color: '#153F30', fontFamily: serif, fontSize: 16, fontWeight: '700', lineHeight: 21 }, healthCardDescription: { color: '#53675D', fontSize: 11, lineHeight: 17, marginTop: 9 }, vikritiProfileCard: { backgroundColor: '#FFF5DF', borderColor: '#E8D6AC' }, vikritiLabelWrap: { alignItems: 'stretch', backgroundColor: '#B58428', width: 128 }, vikritiLabelText: { textAlign: 'right' }, healthSymptomsLabel: { color: '#9B7226', fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 14 }, vulnerabilityCard: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 22, paddingHorizontal: 22, paddingVertical: 21 }, vulnerabilityEyebrow: { color: '#BED7C6', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 }, vulnerabilityText: { color: '#FFF', fontFamily: serif, fontSize: 18, fontWeight: '700', lineHeight: 25, marginTop: 8, textAlign: 'center' }, vulnerabilityNote: { color: '#C8DDD0', fontSize: 9, lineHeight: 14, marginTop: 9, textAlign: 'center' }, profileDivider: { backgroundColor: '#E4E1D9', height: 1, marginBottom: 12, marginTop: 25 }, profileOptionsTitle: { color: '#334139', fontFamily: serif, fontSize: 18, fontWeight: '700', marginBottom: 7 }, profileMenu: { gap: 2 }, profileMenuRow: { alignItems: 'center', flexDirection: 'row', minHeight: 57 }, profileMenuIcon: { alignItems: 'center', height: 34, justifyContent: 'center', marginRight: 11, width: 34 }, profileMenuIconText: { color: '#6C7570', fontSize: 20, fontWeight: '700' }, profileMenuLabel: { color: '#39433D', flex: 1, fontSize: 16, fontWeight: '600' }, profileChevron: { color: '#9AA09C', fontSize: 28, fontWeight: '300' }, logoutRow: { alignItems: 'center', flexDirection: 'row', marginTop: 26, minHeight: 57 }, logoutLabel: { color: '#7B3939', fontSize: 16, fontWeight: '700' },
  ordersPage: { flex: 1, paddingHorizontal: 22, paddingTop: 30 }, ordersLoader: { marginTop: 80 }, ordersList: { gap: 12, paddingBottom: 30, paddingTop: 8 }, orderCard: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#E4E0D5', borderRadius: 15, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 105, padding: 16 }, orderNumber: { color: '#2B3630', fontFamily: serif, fontSize: 16, fontWeight: '700' }, orderDate: { color: '#737B76', fontSize: 12, marginTop: 6 }, orderItemCount: { color: '#4F5B54', fontSize: 12, fontWeight: '600', marginTop: 7 }, orderCardRight: { alignItems: 'flex-end' }, orderAmount: { color: '#075A3F', fontSize: 17, fontWeight: '800' }, noOrders: { flex: 1, justifyContent: 'center', paddingBottom: 50 }, noOrdersIcon: { color: '#7B8E83', fontSize: 54, marginBottom: 18, textAlign: 'center' }, orderDetailScroll: { paddingBottom: 36, paddingHorizontal: 22, paddingTop: 30 }, orderDetailNumber: { color: '#2D3731', fontFamily: serif, fontSize: 19, fontWeight: '700', marginTop: 8 }, orderItemsCard: { backgroundColor: '#FFFDF8', borderColor: '#E4E0D5', borderRadius: 16, borderWidth: 1, marginTop: 22, overflow: 'hidden' }, orderDetailItem: { alignItems: 'center', borderBottomColor: '#E9E5DC', borderBottomWidth: 1, flexDirection: 'row', padding: 14 }, orderItemVisual: { alignItems: 'center', backgroundColor: '#EAF0E6', borderRadius: 10, height: 58, justifyContent: 'center', marginRight: 12, width: 58 }, orderItemIcon: { fontSize: 29 }, orderItemCopy: { flex: 1 }, orderQuantity: { color: '#536059', fontSize: 12, fontWeight: '600', marginTop: 5 }, orderLineTotal: { color: '#2E3933', fontSize: 14, fontWeight: '800' }, orderTotalRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 22 }, orderDetailTotal: { color: '#075A3F', fontSize: 21, fontWeight: '800' }, trackingTitle: { color: '#29352F', fontFamily: serif, fontSize: 23, fontWeight: '700', marginBottom: 18, marginTop: 10 }, trackingCard: { backgroundColor: '#FFFDF8', borderColor: '#E4E0D5', borderRadius: 17, borderWidth: 1, marginBottom: 24, padding: 20 }, trackingStep: { flexDirection: 'row', minHeight: 67 }, trackingMarkerColumn: { alignItems: 'center', marginRight: 15, width: 29 }, trackingMarker: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#8A9B92', borderRadius: 14, borderWidth: 2, height: 28, justifyContent: 'center', width: 28 }, trackingMarkerDone: { backgroundColor: '#075A3F', borderColor: '#075A3F' }, trackingMarkerText: { color: '#718078', fontSize: 14, fontWeight: '800' }, trackingMarkerTextDone: { color: '#FFF' }, trackingLine: { backgroundColor: '#B9C7C0', flex: 1, width: 3 }, trackingLineDone: { backgroundColor: '#075A3F' }, trackingLabel: { color: '#77807B', fontSize: 15, fontWeight: '600', paddingTop: 5 }, trackingLabelDone: { color: '#303B35', fontWeight: '800' },
  appointmentListCard: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#E4E0D5', borderRadius: 15, borderWidth: 1, flexDirection: 'row', minHeight: 105, padding: 14 }, appointmentListPortrait: { alignItems: 'center', backgroundColor: '#E4EFE5', borderRadius: 31, height: 62, justifyContent: 'center', marginRight: 13, overflow: 'hidden', width: 62 }, appointmentListPortraitIcon: { fontSize: 37 }, appointmentListCopy: { flex: 1 }, appointmentType: { color: '#52705F', fontSize: 11, fontWeight: '700', marginTop: 6 }, appointmentDetailScroll: { paddingBottom: 40, paddingHorizontal: 22, paddingTop: 30 }, appointmentDoctorCard: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#E4E0D5', borderRadius: 18, borderWidth: 1, marginBottom: 18, padding: 24 }, appointmentDoctorPortrait: { alignItems: 'center', backgroundColor: '#E4EFE5', borderRadius: 44, height: 88, justifyContent: 'center', marginBottom: 15, overflow: 'hidden', width: 88 }, appointmentDoctorPortraitIcon: { fontSize: 53 }, appointmentDoctorName: { color: '#26312B', fontFamily: serif, fontSize: 22, fontWeight: '700' }, appointmentDoctorMeta: { color: '#69736D', fontSize: 13, marginTop: 7 }, clinicalCard: { backgroundColor: '#FFFDF8', borderColor: '#E4E0D5', borderRadius: 17, borderWidth: 1, marginTop: 14, padding: 18 }, clinicalTitleRow: { alignItems: 'center', flexDirection: 'row' }, clinicalIcon: { alignItems: 'center', backgroundColor: '#E8F1E8', borderRadius: 18, height: 36, justifyContent: 'center', marginRight: 11, width: 36 }, clinicalIconText: { color: '#075A3F', fontSize: 15, fontWeight: '900' }, clinicalTitle: { color: '#2C3731', fontFamily: serif, fontSize: 18, fontWeight: '700' }, clinicalContent: { color: '#4F5B54', fontSize: 14, lineHeight: 22, marginTop: 16 }, clinicalEmpty: { color: '#8A918D', fontStyle: 'italic' },
  aiSafe: { backgroundColor: '#FBF8EF', flex: 1, paddingBottom: 86 }, aiHeader: { backgroundColor: '#075A3F', paddingBottom: 20, paddingHorizontal: 22, paddingTop: 31 }, aiTitle: { color: '#FFF', fontFamily: serif, fontSize: 25, fontWeight: '700' }, aiSubtitle: { color: '#D5E6DD', fontSize: 12, marginTop: 4 }, chatMessages: { gap: 12, padding: 18 }, chatMessageGroup: { alignSelf: 'flex-start', maxWidth: '88%' }, userMessageGroup: { alignSelf: 'flex-end' }, chatBubble: { borderRadius: 17, maxWidth: '82%', paddingHorizontal: 15, paddingVertical: 12 }, assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderColor: '#E1DED5', borderWidth: 1, borderTopLeftRadius: 5 }, userBubble: { alignSelf: 'flex-end', backgroundColor: '#075A3F', borderTopRightRadius: 5 }, chatText: { color: '#37413B', fontSize: 14, lineHeight: 20 }, userChatText: { color: '#FFF' }, chatComposer: { alignItems: 'flex-end', backgroundColor: '#FFF', borderTopColor: '#E4E0D7', borderTopWidth: 1, flexDirection: 'row', gap: 10, padding: 12 }, chatInput: { backgroundColor: '#F4F4EF', borderColor: '#DEDFD8', borderRadius: 22, borderWidth: 1, color: '#2E3832', flex: 1, minHeight: 44, paddingHorizontal: 15 }, chatSend: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 22, height: 44, justifyContent: 'center', width: 44 }, chatSendText: { color: '#FFF', fontSize: 20 },
  currentHealthChatSafe: { backgroundColor: '#FBF8EF', flex: 1 }, currentHealthChatHeader: { alignItems: 'center', backgroundColor: '#075A3F', flexDirection: 'row', paddingBottom: 18, paddingHorizontal: 14, paddingTop: 20 }, currentHealthChatHeading: { flex: 1, paddingRight: 42 }, backTextLight: { color: '#FFF' }, currentHealthMessageBubble: { maxWidth: '100%' }, answerSuggestionList: { gap: 8, marginTop: 8 }, answerSuggestion: { backgroundColor: '#EDF5EF', borderColor: '#BFD4C5', borderRadius: 14, borderWidth: 1, minHeight: 42, paddingHorizontal: 14, paddingVertical: 10 }, answerSuggestionDisabled: { opacity: .58 }, answerSuggestionText: { color: '#075A3F', fontSize: 13, fontWeight: '700', lineHeight: 19 }, currentHealthChatInput: { lineHeight: 20, maxHeight: 120, paddingBottom: 11, paddingTop: 11, textAlignVertical: 'top' }, chatErrorCard: { alignSelf: 'center', backgroundColor: '#FFF2F2', borderColor: '#E8CACA', borderRadius: 12, borderWidth: 1, padding: 12, width: '92%' }, chatRetry: { color: '#075A3F', fontSize: 13, fontWeight: '800', marginTop: 8, textAlign: 'center' }, chatSendDisabled: { opacity: .45 },
  editProfileScroll: { flexGrow: 1, paddingBottom: 40, paddingHorizontal: 23, paddingTop: 30 },
  monthArrowDisabled: { color: '#B9BFBB' }, calendarDayTextDisabled: { color: '#C3C6C3' },
  miniDonutColumn: { alignItems: 'center' }, homeDoshaPercentages: { flexDirection: 'row', gap: 6, marginRight: 17, marginTop: 6 }, homeDoshaPercentage: { color: '#68736D', fontSize: 9, fontWeight: '700', lineHeight: 13 },
  profileAvatarImage: { height: '100%', width: '100%' }, editAvatarWrap: { alignItems: 'center', marginBottom: 4 }, editAvatarPlaceholder: { alignItems: 'center', backgroundColor: '#E8F2E9', borderRadius: 48, height: 96, justifyContent: 'center', overflow: 'hidden', width: 96 }, editAvatarImage: { borderRadius: 48, height: 96, width: 96 }, changePhoto: { color: '#075A3F', fontSize: 13, fontWeight: '700', marginTop: 10 }, settingsScroll: { paddingBottom: 42, paddingHorizontal: 22, paddingTop: 30 }, settingsSectionTitle: { color: '#27332C', fontFamily: serif, fontSize: 20, fontWeight: '700', marginBottom: 8, marginTop: 20 }, settingRow: { alignItems: 'center', borderBottomColor: '#E5E1D8', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 76, paddingVertical: 12 }, settingCopy: { flex: 1, paddingRight: 18 }, settingTitle: { color: '#303A34', fontSize: 15, fontWeight: '700' }, settingDescription: { color: '#747C77', fontSize: 11, lineHeight: 17, marginTop: 5, maxWidth: 260 }, toggle: { backgroundColor: '#C9CEC9', borderRadius: 15, height: 30, justifyContent: 'center', paddingHorizontal: 3, width: 52 }, toggleOn: { backgroundColor: '#075A3F' }, toggleKnob: { backgroundColor: '#FFF', borderRadius: 12, height: 24, width: 24 }, toggleKnobOn: { alignSelf: 'flex-end' }, dietSelect: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#D8DAD4', borderRadius: 9, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 10, paddingVertical: 9 }, dietSelectText: { color: '#435049', fontSize: 12, fontWeight: '600' }, dietOptions: { backgroundColor: '#FFF', borderColor: '#DDDCD5', borderRadius: 11, borderWidth: 1, marginTop: 7, overflow: 'hidden' }, dietOption: { borderBottomColor: '#ECE9E1', borderBottomWidth: 1, paddingHorizontal: 14, paddingVertical: 12 }, dietOptionText: { color: '#59635D', fontSize: 13 }, dietOptionSelected: { color: '#075A3F', fontWeight: '800' }, settingsSave: { marginTop: 30 },
  addressPage: { flexGrow: 1, paddingBottom: 40, paddingHorizontal: 22, paddingTop: 30 }, addressHint: { color: '#707873', fontSize: 13, lineHeight: 20, marginBottom: 20, marginTop: 8 }, addressCard: { alignItems: 'flex-start', backgroundColor: '#FFFDF8', borderColor: '#E1DED5', borderRadius: 14, borderWidth: 1, flexDirection: 'row', marginBottom: 11, padding: 15 }, addressCardSelected: { backgroundColor: '#F0F7F1', borderColor: '#075A3F', borderWidth: 1.5 }, addressRadio: { alignItems: 'center', borderColor: '#7B8A82', borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: 'center', marginRight: 12, marginTop: 2, width: 20 }, addressRadioDot: { backgroundColor: '#075A3F', borderRadius: 5, height: 10, width: 10 }, addressCardCopy: { flex: 1 }, addressCardTitle: { color: '#2E3933', fontSize: 14, fontWeight: '800' }, addressCardText: { color: '#68716C', fontSize: 12, lineHeight: 18, marginTop: 6 }, addAddressButton: { alignItems: 'center', borderColor: '#075A3F', borderRadius: 11, borderStyle: 'dashed', borderWidth: 1.2, marginTop: 7, paddingVertical: 13 }, addAddressButtonText: { color: '#075A3F', fontSize: 13, fontWeight: '800' }, addressForm: { gap: 14, marginTop: 18 }, addressConfirm: { marginTop: 28 },
  personalDetailsContent: { paddingBottom: 112, paddingHorizontal: 20, paddingTop: 18 }, personalAvatarRow: { alignItems: 'center', flexDirection: 'row', marginBottom: 18, marginTop: 18 }, personalAvatar: { alignItems: 'center', backgroundColor: '#E7F0E8', borderColor: '#C9D8CC', borderRadius: 25, borderWidth: 1, height: 50, justifyContent: 'center', marginRight: 12, overflow: 'hidden', width: 50 }, personalAvatarText: { color: '#17513C', fontFamily: serif, fontSize: 18 }, personalPhotoAction: { color: '#175B43', fontSize: 10, fontWeight: '600' }, personalPhotoRemove: { color: '#B55D4C', fontSize: 8, marginTop: 5 }, personalTwoColumn: { flexDirection: 'row', gap: 9 }, personalColumn: { flex: 1 }, personalLabel: { color: '#82938A', fontSize: 7, fontWeight: '700', letterSpacing: 1.4, marginBottom: 7, marginTop: 3 }, personalChoiceRow: { flexDirection: 'row', gap: 8, marginBottom: 13 }, personalChoice: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD9CF', borderRadius: 9, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 38 }, personalChoiceSelected: { backgroundColor: '#164D39', borderColor: '#164D39' }, personalChoiceText: { color: '#294138', fontSize: 9 }, personalChoiceTextSelected: { color: '#FFF', fontWeight: '600' }, personalDietRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, personalDietChoice: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD9CF', borderRadius: 9, borderWidth: 1, justifyContent: 'center', minHeight: 38, paddingHorizontal: 13 },
  profileSubSafe: { backgroundColor: '#F8F5EC', flex: 1 }, profileSubScreen: { flex: 1 }, profileSubContent: { paddingBottom: 105, paddingHorizontal: 20, paddingTop: 18 }, profileSubTitle: { color: '#253C32', fontFamily: serif, fontSize: 26, marginTop: 12 }, profileSubIntro: { color: '#7D8A83', fontSize: 10, lineHeight: 16, marginTop: 7 }, profileSubFooter: { backgroundColor: '#F8F5EC', borderTopColor: '#E1DDD3', borderTopWidth: 1, bottom: 0, left: 0, paddingHorizontal: 20, paddingVertical: 12, position: 'absolute', right: 0 }, privacyRows: { marginTop: 25 }, privacyRow: { alignItems: 'center', borderBottomColor: '#E0DCD2', borderBottomWidth: 1, flexDirection: 'row', minHeight: 61 }, privacyRowCopy: { flex: 1 }, privacyRowTitle: { color: '#294138', fontSize: 10 }, privacyRowDescription: { color: '#9AA49F', fontSize: 8, marginTop: 4 }, privacyToggle: { backgroundColor: '#C8CEC9', borderRadius: 12, height: 22, padding: 2, width: 39 }, privacyToggleOn: { backgroundColor: '#164D39' }, privacyToggleKnob: { backgroundColor: '#FFF', borderRadius: 9, height: 18, width: 18 }, privacyToggleKnobOn: { alignSelf: 'flex-end' }, privacyFootnote: { color: '#A0AAA5', fontSize: 8, lineHeight: 14, marginTop: 17 }, privacyLink: { color: '#34735B' }, profileListScreen: { flexGrow: 1, paddingBottom: 35, paddingHorizontal: 20, paddingTop: 18 }, profileListIntro: { color: '#72847B', fontSize: 10, marginTop: 5 }, profileOrderList: { gap: 9, paddingBottom: 25, paddingTop: 22 }, profileOrderCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, minHeight: 100, paddingHorizontal: 14, paddingVertical: 12 }, profileOrderTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, profileOrderNumber: { color: '#214036', fontSize: 10, fontWeight: '700' }, profileOrderAmount: { color: '#166043', fontFamily: serif, fontSize: 15 }, profileOrderDate: { color: '#89968F', fontSize: 8, marginTop: 5 }, profileOrderBottom: { alignItems: 'center', borderTopColor: '#E5E0D5', borderTopWidth: 1, flexDirection: 'row', marginTop: 11, paddingTop: 10 }, profileOrderStatus: { backgroundColor: '#FFF3D5', borderRadius: 9, paddingHorizontal: 9, paddingVertical: 4 }, profileOrderDelivered: { backgroundColor: '#E6F2E9' }, profileOrderStatusText: { color: '#856522', fontSize: 6, fontWeight: '700', letterSpacing: 1.2 }, profileOrderCount: { color: '#76857D', fontSize: 8, marginLeft: 8 }, profileOrderChevron: { color: '#A7B1AC', fontSize: 18, marginLeft: 'auto' }, profileListSection: { color: '#8A9991', fontSize: 7, fontWeight: '700', letterSpacing: 1.7, marginBottom: 9, marginTop: 22 }, profileAppointmentCard: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, flexDirection: 'row', marginBottom: 9, minHeight: 66, paddingHorizontal: 13, paddingVertical: 10 }, profileAppointmentAvatar: { alignItems: 'center', backgroundColor: '#E6F1E9', borderRadius: 20, height: 40, justifyContent: 'center', width: 40 }, profileAppointmentAvatarPast: { backgroundColor: '#F0EEE7' }, profileAppointmentInitials: { color: '#3D6655', fontFamily: serif, fontSize: 13 }, profileAppointmentCopy: { flex: 1, marginLeft: 11 }, profileAppointmentName: { color: '#294137', fontFamily: serif, fontSize: 13 }, profileAppointmentDate: { color: '#86938D', fontSize: 8, marginTop: 4 }, profileAppointmentType: { color: '#277258', fontSize: 6, fontWeight: '800', letterSpacing: 1.3, marginTop: 5 }, profileAppointmentCompleted: { color: '#A4AEA9', fontSize: 6, fontWeight: '700', letterSpacing: 1.3 }, profileEmptyList: { color: '#919C96', fontSize: 9, marginBottom: 9 }, profileBookAnother: { alignItems: 'center', borderColor: '#164D39', borderRadius: 9, borderWidth: 1, justifyContent: 'center', marginTop: 9, minHeight: 42 }, profileBookAnotherText: { color: '#164D39', fontSize: 10 }, profileOrderDetails: { paddingBottom: 35, paddingHorizontal: 20, paddingTop: 18 }, profileOrderMetaLine: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 3 }, profileOrderItemsCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, marginTop: 22, overflow: 'hidden' }, profileOrderItem: { alignItems: 'center', flexDirection: 'row', minHeight: 64, padding: 11 }, profileOrderItemVisual: { alignItems: 'center', backgroundColor: '#E7F0E8', borderRadius: 8, height: 42, justifyContent: 'center', width: 42 }, profileOrderItemGlyph: { color: '#15533C', fontFamily: serif, fontSize: 18 }, profileOrderItemCopy: { flex: 1, marginLeft: 11 }, profileOrderItemName: { color: '#2D4339', fontSize: 10, fontWeight: '600' }, profileOrderItemWeight: { color: '#85938C', fontSize: 8, marginTop: 2 }, profileOrderItemQuantity: { color: '#76877E', fontSize: 8, marginTop: 3 }, profileOrderItemPrice: { color: '#203E33', fontSize: 10, fontWeight: '600' }, profileOrderTotal: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 16 }, profileOrderTotalLabel: { color: '#75867D', fontSize: 10 }, profileOrderTotalValue: { color: '#216046', fontFamily: serif, fontSize: 16 }, profileTrackingCard: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, padding: 14 }, profileTrackingStep: { flexDirection: 'row', minHeight: 53 }, profileTrackingMarkerColumn: { alignItems: 'center', marginRight: 12, width: 21 }, profileTrackingMarker: { backgroundColor: '#FFF', borderColor: '#D4CDBF', borderRadius: 10, borderWidth: 1, height: 20, width: 20 }, profileTrackingMarkerDone: { alignItems: 'center', backgroundColor: '#16513B', borderColor: '#16513B', justifyContent: 'center' }, profileTrackingCheck: { color: '#FFF', fontSize: 10 }, profileTrackingLine: { backgroundColor: '#D9D3C7', flex: 1, width: 1 }, profileTrackingLineDone: { backgroundColor: '#4F846E' }, profileTrackingCopy: { paddingTop: 1 }, profileTrackingLabel: { color: '#9AA49F', fontSize: 10 }, profileTrackingLabelDone: { color: '#294138' }, profileTrackingDate: { color: '#A2ACA6', fontSize: 7, marginTop: 4 }, appointmentV2Safe: { backgroundColor: '#164D39', flex: 1 }, appointmentV2Header: { backgroundColor: '#164D39', minHeight: 146, paddingHorizontal: 20, paddingTop: 18 }, appointmentV2Identity: { alignItems: 'center', flexDirection: 'row', marginTop: 14 }, appointmentV2Avatar: { alignItems: 'center', backgroundColor: '#3B6957', borderColor: '#779789', borderRadius: 23, borderWidth: 1, height: 46, justifyContent: 'center', width: 46 }, appointmentV2Initials: { color: '#FFF6E7', fontFamily: serif, fontSize: 15 }, appointmentV2Copy: { flex: 1, marginLeft: 12 }, appointmentV2Name: { color: '#FFF7E8', fontFamily: serif, fontSize: 17 }, appointmentV2Meta: { color: '#B9CEC3', fontSize: 8, marginTop: 5 }, appointmentV2Body: { backgroundColor: '#F8F5EC', flex: 1, paddingHorizontal: 20, paddingTop: 17 }, clinicalV2Card: { backgroundColor: '#FFF', borderColor: '#DED9CE', borderRadius: 11, borderWidth: 1, marginBottom: 9, padding: 14 }, clinicalV2TitleRow: { alignItems: 'center', flexDirection: 'row' }, clinicalV2Icon: { alignItems: 'center', backgroundColor: '#E6F1E9', borderRadius: 8, height: 27, justifyContent: 'center', width: 27 }, clinicalV2IconText: { color: '#176047', fontSize: 8, fontWeight: '700' }, clinicalV2Title: { color: '#354A40', fontFamily: serif, fontSize: 14, marginLeft: 9 }, clinicalV2Content: { color: '#687A71', fontSize: 10, lineHeight: 16, marginTop: 11 }, clinicalV2Empty: { color: '#9CA6A0' }, appointmentV2Actions: { flexDirection: 'row', gap: 8, marginTop: 8 }, appointmentReschedule: { alignItems: 'center', borderColor: '#DFD9CD', borderRadius: 9, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 42 }, appointmentRescheduleText: { color: '#31473D', fontSize: 10 }, appointmentJoin: { alignItems: 'center', backgroundColor: '#164D39', borderRadius: 9, flex: 1, justifyContent: 'center', minHeight: 42 }, appointmentJoinText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  profileMenuButton: { alignItems: 'center', borderColor: '#6D907F', borderRadius: 15, borderWidth: 1, gap: 3, height: 30, justifyContent: 'center', width: 30, zIndex: 2 }, profileMenuBar: { backgroundColor: '#F6F1E4', borderRadius: 1, height: 1.5, width: 12 }, profileDrawerLayer: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0, zIndex: 100 }, profileDrawerScrim: { backgroundColor: '#0B251C', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, profileDrawerScrimPress: { flex: 1 }, profileDrawerPanel: { backgroundColor: '#F8F5EC', bottom: 0, elevation: 18, paddingBottom: 20, position: 'absolute', right: 0, top: 0 }, profileDrawerHeader: { alignItems: 'center', borderBottomColor: '#DED9CE', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 92, paddingHorizontal: 20, paddingTop: 11 }, profileDrawerEyebrow: { color: '#86958E', fontSize: 7, fontWeight: '700', letterSpacing: 1.7 }, profileDrawerName: { color: '#294036', fontFamily: serif, fontSize: 16, marginTop: 5 }, profileDrawerClose: { alignItems: 'center', borderColor: '#DAD6CB', borderRadius: 14, borderWidth: 1, height: 28, justifyContent: 'center', width: 28 }, profileDrawerCloseText: { color: '#294036', fontSize: 18, lineHeight: 20 }, profileDrawerMenu: { paddingHorizontal: 20 }, profileDrawerRow: { alignItems: 'center', borderBottomColor: '#DEDAD0', borderBottomWidth: 1, flexDirection: 'row', minHeight: 54 }, profileDrawerRowCopy: { flex: 1 }, profileDrawerRowLabel: { color: '#243C32', fontSize: 10 }, profileDrawerRowDetail: { color: '#9AA59F', fontSize: 8, marginTop: 4 }, profileDrawerChevron: { color: '#A8B1AC', fontSize: 19 }, profileDrawerFooter: { borderTopColor: '#DEDAD0', borderTopWidth: 1, bottom: 0, left: 0, padding: 20, position: 'absolute', right: 0 }, profileDrawerLogout: { alignItems: 'center', borderColor: '#C86B57', borderRadius: 9, borderWidth: 1, justifyContent: 'center', minHeight: 42 }, profileDrawerLogoutText: { color: '#B85A47', fontSize: 10 },
  profileV2Safe: { backgroundColor: '#164D39', flex: 1 }, profileV2Scroll: { backgroundColor: '#F8F5EC' }, profileV2Content: { paddingBottom: 100 }, profileV2Header: { backgroundColor: '#164D39', minHeight: 145, overflow: 'hidden', paddingBottom: 19, paddingHorizontal: 20, paddingTop: 18, position: 'relative' }, profileV2HeaderTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', zIndex: 1 }, profileV2EyebrowLight: { color: '#91AE9F', fontSize: 8, fontWeight: '700', letterSpacing: 2.1 }, profileEditPill: { alignItems: 'center', borderColor: '#6D907F', borderRadius: 14, borderWidth: 1, justifyContent: 'center', minHeight: 27, paddingHorizontal: 13 }, profileEditPillText: { color: '#F8F4E8', fontSize: 10, fontWeight: '600' }, profileV2Identity: { alignItems: 'center', flexDirection: 'row', marginTop: 17, zIndex: 1 }, profileV2Avatar: { alignItems: 'center', backgroundColor: '#3D6A59', borderColor: '#759586', borderRadius: 26, borderWidth: 1, height: 52, justifyContent: 'center', overflow: 'hidden', width: 52 }, profileV2AvatarText: { color: '#FFF5E6', fontFamily: serif, fontSize: 17 }, profileV2IdentityCopy: { flex: 1, marginLeft: 12 }, profileV2Name: { color: '#FFF7E8', fontFamily: serif, fontSize: 22 }, profileV2Member: { color: '#B9CDC2', fontSize: 8, fontWeight: '600', letterSpacing: 1.3, marginTop: 4 }, profileV2Decor: { backgroundColor: '#2B6045', borderRadius: 80, height: 160, opacity: .45, position: 'absolute', right: -58, top: -58, width: 160 }, profileV2Body: { paddingHorizontal: 20, paddingTop: 19 }, profileSectionMeta: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, profileSectionEyebrow: { color: '#82958B', fontSize: 7, fontWeight: '700', letterSpacing: 1.8 }, profileSectionAside: { color: '#A7B1AB', fontSize: 7, letterSpacing: .7 }, profilePrakritiPanel: { flexDirection: 'row', gap: 14, marginTop: 10 }, profileDonutColumn: { width: 103 }, profileDonut: { height: 103, position: 'relative', width: 103 }, profileDonutSegment: { borderRadius: 2, height: 13, left: 50, position: 'absolute', top: 45, width: 4 }, profileDonutCenter: { alignItems: 'center', backgroundColor: '#F8F5EC', borderRadius: 31, height: 62, justifyContent: 'center', left: 21, position: 'absolute', top: 21, width: 62 }, profileDonutDosha: { color: '#75847C', fontSize: 8 }, profileDonutValue: { color: '#173A2F', fontFamily: serif, fontSize: 20, marginTop: 1 }, profileDoshaLegend: { gap: 4, marginTop: 5 }, profileDoshaLegendRow: { alignItems: 'center', flexDirection: 'row' }, profileDoshaDot: { borderRadius: 3, height: 6, marginRight: 6, width: 6 }, profileDoshaLabel: { color: '#61736A', flex: 1, fontSize: 8 }, profileDoshaPercent: { color: '#314A3E', fontSize: 8, fontWeight: '700' }, profilePrakritiCopy: { flex: 1, paddingTop: 1 }, profilePrakritiName: { color: '#214B39', fontFamily: serif, fontSize: 29 }, profilePrakritiDominant: { color: '#788980', fontSize: 11, marginTop: -2 }, profilePrakritiDescription: { color: '#66766E', fontSize: 10, lineHeight: 15, marginTop: 11 }, profileEmptyCopy: { color: '#718078', fontSize: 11, lineHeight: 17, marginTop: 15 }, profileV2Divider: { backgroundColor: '#E0DCD1', height: 1, marginVertical: 20 }, profileVikritiCard: { backgroundColor: '#FFF', borderColor: '#DED8CA', borderLeftColor: '#C99435', borderLeftWidth: 2, borderRadius: 11, borderWidth: 1, marginTop: 10, padding: 16 }, profileVikritiTitle: { color: '#263E33', fontFamily: serif, fontSize: 17, lineHeight: 23 }, profileVikritiExplanation: { color: '#77847D', fontSize: 10, lineHeight: 16, marginTop: 9 }, profileVikritiDivider: { backgroundColor: '#E1DBCF', height: 1, marginVertical: 14 }, profileSymptomsLabel: { color: '#8C988F', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 }, profileSymptomChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 9 }, profileSymptomChip: { backgroundColor: '#FFF6E3', borderColor: '#E8D1A3', borderRadius: 12, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 5 }, profileSymptomText: { color: '#9A6C20', fontSize: 8 }, profileEmptySymptoms: { color: '#909A94', fontSize: 9, marginTop: 8 }, profileVulnerabilityCard: { backgroundColor: '#164D39', borderRadius: 12, marginTop: 20, padding: 18 }, profileVulnerabilityEyebrow: { color: '#81B09A', fontSize: 7, fontWeight: '700', letterSpacing: 1.5 }, profileVulnerabilityTitle: { color: '#FFF8E8', fontFamily: serif, fontSize: 17, lineHeight: 25, marginTop: 12 }, profileVulnerabilityDivider: { backgroundColor: '#42705E', height: 1, marginVertical: 15 }, profileVulnerabilityNote: { color: '#AFC9BC', fontSize: 8, lineHeight: 13 }, profileDoctorCta: { alignItems: 'center', backgroundColor: '#FBF8EF', borderRadius: 9, justifyContent: 'center', marginTop: 17, minHeight: 41 }, profileDoctorCtaText: { color: '#164D39', fontSize: 10, fontWeight: '600' }, profileV2Menu: { marginTop: 11 }, profileV2MenuRow: { alignItems: 'center', borderBottomColor: '#E2DED4', borderBottomWidth: 1, flexDirection: 'row', minHeight: 41 }, profileV2MenuLabel: { color: '#193B30', flex: 1, fontSize: 10 }, profileV2MenuDetail: { color: '#99A59F', fontSize: 8, maxWidth: 125, textAlign: 'right' }, profileV2MenuChevron: { color: '#AAB3AE', fontSize: 18, marginLeft: 8 }, profileLogoutButton: { alignItems: 'center', borderColor: '#C66B56', borderRadius: 9, borderWidth: 1, justifyContent: 'center', marginTop: 18, minHeight: 43 }, profileLogoutText: { color: '#B45345', fontSize: 10 },
  doctorPhotoHero: { backgroundColor: '#173E32', height: Dimensions.get('window').height * 0.48, minHeight: 350, overflow: 'hidden', position: 'relative' }, doctorPhoto: { height: '100%', left: 0, position: 'absolute', top: 0, width: '100%' }, doctorPhotoShade: { backgroundColor: 'rgba(5, 35, 27, 0.14)', bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 }, doctorPhotoBottomShade: { backgroundColor: 'rgba(4, 31, 24, 0.48)', bottom: 0, height: 108, left: 0, position: 'absolute', right: 0 }, doctorPhotoBack: { alignItems: 'center', backgroundColor: 'rgba(24, 61, 50, 0.62)', borderColor: 'rgba(255,255,255,.18)', borderRadius: 16, borderWidth: 1, height: 32, justifyContent: 'center', left: 21, position: 'absolute', top: 17, width: 32 }, doctorPhotoIdentity: { bottom: 16, left: 21, position: 'absolute', right: 18 }, doctorAvailabilityPill: { alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(251,248,239,.20)', borderColor: 'rgba(255,255,255,.25)', borderRadius: 11, borderWidth: 1, minHeight: 21, paddingHorizontal: 9, paddingVertical: 4 }, doctorAvailabilityText: { color: '#FFF8E7', fontSize: 8, fontWeight: '700' }, doctorPhotoName: { color: '#FFF8E7', fontFamily: serif, fontSize: 22, marginTop: 8 }, doctorPhotoMeta: { color: '#E4EEE8', fontSize: 9, fontWeight: '600', marginTop: 5 }, shopV2TopRow: { alignItems: 'center', flexDirection: 'row', gap: 10 }, shopV2SectionTitle: { color: '#18372F', fontFamily: serif, fontSize: 19, marginBottom: 10 }, shopBottomNav: { height: 70, paddingBottom: 8, paddingTop: 5 }, shopCategoryHeading: { color: '#74887E', fontSize: 8, fontWeight: '700', letterSpacing: 1.8, marginBottom: 8, marginTop: 18 }, categoryPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, categoryPill: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#DDD9CE', borderRadius: 16, borderWidth: 1, justifyContent: 'center', minHeight: 29, paddingHorizontal: 12 }, categoryPillSelected: { backgroundColor: '#124E38', borderColor: '#124E38' }, categoryPillText: { color: '#183B30', fontSize: 9, fontWeight: '600' }, categoryPillTextSelected: { color: '#FFF', fontWeight: '800' }, categoryMorePill: { alignItems: 'center', borderColor: '#124E38', borderRadius: 16, borderStyle: 'dashed', borderWidth: 1, justifyContent: 'center', minHeight: 29, paddingHorizontal: 12 }, categoryMoreText: { color: '#124E38', fontSize: 9, fontWeight: '600' }, shopSection: { marginTop: 18 }, shopSectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, shopSectionCount: { color: '#6F847A', fontSize: 8, letterSpacing: 1.2 }, cartSubtitle: { color: '#6B7D74', fontSize: 11, marginTop: 4 }, quantityButtonAdd: { backgroundColor: '#124E38', borderColor: '#124E38' }, quantityButtonTextAdd: { color: '#FFF' }, cartFooterTotal: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }, shopSummaryLabel: { color: '#789086', fontSize: 7, letterSpacing: 1.6 }, cartFooterAmount: { color: '#124E38', fontFamily: serif, fontSize: 20 }, addressScreen: { flex: 1 }, addressFooter: { backgroundColor: '#FBF8EF', borderTopColor: '#E2DED4', borderTopWidth: 1, paddingHorizontal: 22, paddingVertical: 12 }, summaryEyebrow: { color: '#789086', fontSize: 8, letterSpacing: 1.7, marginBottom: 8, marginTop: 20 }, orderSummaryCard: { backgroundColor: '#FFF', borderColor: '#DFDBD0', borderRadius: 12, borderWidth: 1, marginTop: 14, paddingHorizontal: 14, paddingVertical: 10 }, orderSummaryRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 25 }, orderSummaryText: { color: '#6E7E76', fontSize: 11 }, orderSummaryTotal: { color: '#17382F', fontSize: 11, fontWeight: '800' }, shopOrderSuccessPage: { alignItems: 'center', backgroundColor: '#124E38', flex: 1, paddingHorizontal: 22, paddingTop: 132 }, shopOrderSuccessDecor: { backgroundColor: '#315F48', borderRadius: 100, bottom: -30, height: 200, left: -65, opacity: .38, position: 'absolute', width: 200 }, shopOrderSuccessCheck: { alignItems: 'center', borderColor: '#729181', borderRadius: 35, borderWidth: 1, height: 70, justifyContent: 'center', width: 70 }, shopOrderSuccessCheckText: { color: '#D6A130', fontSize: 27 }, shopOrderSuccessTitle: { color: '#FFF7E6', fontFamily: serif, fontSize: 29, marginTop: 22 }, shopOrderSuccessCopy: { color: '#BFD2C8', fontSize: 11, lineHeight: 18, marginTop: 10, maxWidth: 250, textAlign: 'center' }, shopOrderSuccessSummary: { alignSelf: 'stretch', borderColor: '#4E7565', borderRadius: 10, borderWidth: 1, marginTop: 27, overflow: 'hidden' }, shopOrderSuccessRow: { alignItems: 'center', borderBottomColor: '#416B59', borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 39, paddingHorizontal: 13 }, shopOrderSuccessRowLast: { borderBottomWidth: 0 }, shopOrderSuccessLabel: { color: '#8FB1A2', fontSize: 7, letterSpacing: 1.5 }, shopOrderSuccessValue: { color: '#FFF', fontSize: 10, fontWeight: '700' }, shopOrderSuccessTap: { bottom: 30, color: '#BFD2C8', fontSize: 10, position: 'absolute' },
});
