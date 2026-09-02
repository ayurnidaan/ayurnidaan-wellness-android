import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';

WebBrowser.maybeCompleteAuthSession();
type Screen = 'splash' | 'intro' | 'auth' | 'account' | 'profile' | 'confirmation' | 'home' | 'prakriti';
type Dosha = 'vata' | 'pitta' | 'kapha';
type AssessmentAnswer = 'A' | 'B' | 'C';
type AssessmentQuestion = { prompt: string; options: Record<AssessmentAnswer, string> };
const logo = require('./assets/ayurnidaan-logo.png');
const assessmentQuestions: AssessmentQuestion[] = [
  { prompt: 'How would you describe your natural body frame?', options: { A: 'Light and slender', B: 'Medium and athletic', C: 'Broad and sturdy' } },
  { prompt: 'What is your skin naturally like?', options: { A: 'Dry and cool', B: 'Warm or sensitive', C: 'Smooth or oily' } },
  { prompt: 'What best describes your usual pace?', options: { A: 'Quick and changeable', B: 'Focused and intense', C: 'Calm and steady' } },
];

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [session, setSession] = useState<Session | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => data.subscription.unsubscribe();
  }, []);
  async function routeUser(currentSession: Session) {
    const { data } = await supabase.from('profiles').select('profile_completed_at').eq('user_id', currentSession.user.id).maybeSingle();
    setScreen(data?.profile_completed_at ? 'home' : 'account');
  }
  async function finishSplash() { if (session) await routeUser(session); else setScreen('intro'); }
  async function authenticated(nextSession: Session) { setSession(nextSession); await routeUser(nextSession); }
  if (screen === 'splash') return <BrandSplash onFinish={finishSplash} />;
  if (screen === 'intro') return <IntroScreen onContinue={() => setScreen('auth')} />;
  if (screen === 'auth') return <AuthScreen onBack={() => setScreen('intro')} onAuthenticated={authenticated} />;
  if (screen === 'account') return <AccountScreen session={session} onComplete={() => setScreen('profile')} />;
  if (screen === 'profile') return <ProfileScreen session={session} onComplete={() => setScreen('confirmation')} />;
  if (screen === 'confirmation') return <ConfirmationScreen session={session} onContinue={() => setScreen('home')} />;
  if (screen === 'prakriti') return <PrakritiAssessment onExit={() => setScreen('home')} />;
  return <HomeScreen session={session} onStartAssessment={() => setScreen('prakriti')} />;
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
    <StatusBar style="light" /><BotanicalCorner />
    <Animated.View style={[styles.splashContent, { opacity }]}>
      <View style={styles.splashLogoPanel}><Image source={logo} style={styles.splashLogo} resizeMode="contain" /></View>
      <Text style={styles.splashSubtitle}>AI-Powered Ayurveda{`\n`}for Personalized Health</Text>
      {ready ? <Text style={styles.splashTap}>Tap anywhere to continue</Text> : null}
    </Animated.View>
  </Pressable>;
}

function IntroScreen({ onContinue }: { onContinue: () => void }) {
  return <ScreenFrame>
    <View style={styles.introTop}>
      <Text style={styles.introKicker}>Welcome to</Text><Text style={styles.introTitle}>Ayurnidaan</Text>
      <Text style={styles.introCopy}>Your personalized health journey begins here.</Text>
    </View>
    <View style={styles.herbArt}>
      <View style={styles.sunDisc} /><View style={styles.bowl}><View style={styles.bowlRim} /></View>
      <View style={[styles.stem, { transform: [{ rotate: '-20deg' }] }]} /><View style={[styles.stem, styles.stemRight, { transform: [{ rotate: '22deg' }] }]} />
      <View style={[styles.leaf, styles.leaf1]} /><View style={[styles.leaf, styles.leaf2]} /><View style={[styles.leaf, styles.leaf3]} /><View style={[styles.leaf, styles.leaf4]} />
    </View>
    <View style={styles.introActions}><PrimaryButton label="Get Started" onPress={onContinue} />
      <Pressable onPress={onContinue} style={styles.loginLink}><Text style={styles.muted}>Already have an account? <Text style={styles.link}>Log in</Text></Text></Pressable>
    </View>
  </ScreenFrame>;
}

function AuthScreen({ onBack, onAuthenticated }: { onBack: () => void; onAuthenticated: (session: Session) => Promise<void> }) {
  const [mobile, setMobile] = useState(''); const [loading, setLoading] = useState(false);
  const [error, setError] = useState(''); const [notice, setNotice] = useState('');
  function comingSoon(method: string) { setError(''); setNotice(`${method} sign-in is coming soon. Please continue with Google for now.`); }
  async function signInWithGoogle() {
    setLoading(true); setError(''); setNotice('');
    const redirectTo = AuthSession.makeRedirectUri({ path: 'auth/callback' });
    const { data, error: startError } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo, skipBrowserRedirect: true } });
    if (startError || !data.url) { setLoading(false); return setError(startError?.message ?? 'Could not start Google sign-in.'); }
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
    <BackButton onPress={onBack} /><Text style={styles.pageTitle}>Login / Sign up</Text>
    <Text style={styles.pageSubtitle}>Enter your mobile number to continue</Text>
    <View style={styles.form}><Field label="Mobile Number" value={mobile} onChangeText={setMobile} placeholder="+91 98765 43210" keyboardType="phone-pad" />
      <PrimaryButton label="Continue" onPress={() => comingSoon('Mobile number')} />
    </View>
    <Divider label="or continue with" />
    <View style={styles.socialRow}>
      <SocialButton symbol="G" label="Google" loading={loading} onPress={signInWithGoogle} />
      <SocialButton symbol="●" label="Apple" onPress={() => comingSoon('Apple')} />
      <SocialButton symbol="✉" label="Email" onPress={() => comingSoon('Email')} />
    </View>
    {notice ? <Text style={styles.notice}>{notice}</Text> : null}{error ? <Text style={styles.error}>{error}</Text> : null}
    <Text style={styles.policy}>By continuing, you agree to Ayurnidaan's <Text style={styles.link}>Terms of Use</Text> and <Text style={styles.link}>Privacy Policy</Text>.</Text>
  </ScreenFrame>;
}

function AccountScreen({ session, onComplete }: { session: Session | null; onComplete: () => void }) {
  const [name, setName] = useState(''); const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function save() {
    if (!session?.user.id) return setError('Please sign in again.');
    if (!name.trim() || !accepted) return setError('Enter your name and accept the policies.');
    setLoading(true); setError(''); const acceptedAt = new Date().toISOString();
    const { error: authError } = await supabase.auth.updateUser({ data: { full_name: name.trim(), terms_accepted_at: acceptedAt } });
    const { error: profileError } = await supabase.from('profiles').upsert({ user_id: session.user.id, full_name: name.trim(), terms_accepted_at: acceptedAt });
    setLoading(false); if (authError) return setError(authError.message); if (profileError) return setError(profileError.message); onComplete();
  }
  return <ScreenFrame scroll alignTop>
    <Text style={styles.step}>STEP 1 OF 2</Text><Text style={styles.pageTitle}>Tell us about you</Text><Text style={styles.pageSubtitle}>Let's start with your name</Text>
    <View style={styles.form}><Field label="Full Name" value={name} onChangeText={setName} placeholder="Your name" autoCapitalize="words" autoComplete="name" />
      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: accepted }} style={styles.checkRow} onPress={() => setAccepted(!accepted)}>
        <View style={[styles.checkbox, accepted && styles.checkboxSelected]}>{accepted ? <Text style={styles.checkmark}>✓</Text> : null}</View>
        <Text style={styles.terms}>I accept the <Text style={styles.link}>Terms of Use</Text> and <Text style={styles.link}>Privacy Policy</Text>.</Text>
      </Pressable>
      <PrimaryButton label="Continue" loading={loading} onPress={save} />{error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  </ScreenFrame>;
}

function ProfileScreen({ session, onComplete }: { session: Session | null; onComplete: () => void }) {
  const [dob, setDob] = useState(''); const [sex, setSex] = useState<'male' | 'female' | null>(null);
  const [height, setHeight] = useState(''); const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false); const [error, setError] = useState('');
  async function save() {
    if (!session?.user.id) return setError('Please sign in again.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || !sex || !Number(height) || !Number(weight)) return setError('Complete every field. Use YYYY-MM-DD for date of birth.');
    setLoading(true); setError('');
    const { error: saveError } = await supabase.from('profiles').upsert({ user_id: session.user.id, full_name: session.user.user_metadata.full_name ?? null, date_of_birth: dob, sex, height_cm: Number(height), weight_kg: Number(weight), profile_completed_at: new Date().toISOString() });
    setLoading(false); if (saveError) return setError(saveError.message); onComplete();
  }
  return <ScreenFrame scroll alignTop>
    <Text style={styles.step}>STEP 2 OF 2</Text><Text style={styles.pageTitle}>Basic Profile</Text><Text style={styles.pageSubtitle}>Tell us a few basic details</Text>
    <View style={styles.form}><Field label="Date of Birth" value={dob} onChangeText={setDob} placeholder="YYYY-MM-DD" />
      <Text style={styles.label}>Sex</Text><View style={styles.choiceRow}>{(['male', 'female'] as const).map(value => <Pressable key={value} onPress={() => setSex(value)} style={[styles.choice, sex === value && styles.choiceSelected]}><Text style={[styles.choiceText, sex === value && styles.choiceTextSelected]}>{value === 'male' ? 'Male' : 'Female'}</Text></Pressable>)}</View>
      <View style={styles.measureRow}><View style={styles.measureField}><Field label="Height (cm)" value={height} onChangeText={setHeight} placeholder="175" keyboardType="decimal-pad" /></View><View style={styles.measureField}><Field label="Weight (kg)" value={weight} onChangeText={setWeight} placeholder="70" keyboardType="decimal-pad" /></View></View>
      <PrimaryButton label="Continue" loading={loading} onPress={save} /><Text style={styles.privacy}>Your health information is private and protected.</Text>{error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  </ScreenFrame>;
}

function ConfirmationScreen({ session, onContinue }: { session: Session | null; onContinue: () => void }) {
  const fullName = session?.user.user_metadata.full_name?.trim();
  const firstName = fullName?.split(/\s+/)[0] || 'there';
  return <ScreenFrame>
    <View style={styles.confirmationContent}>
      <View style={styles.successCircle}><Text style={styles.successCheck}>✓</Text></View>
      <Text style={styles.confirmationTitle}>Welcome {firstName}! 👋</Text>
      <Text style={styles.confirmationCopy}>Explore Ayurnidaan and unlock personalized guidance for your health & lifestyle.</Text>
    </View>
    <View style={styles.confirmationAction}><PrimaryButton label="Go to Home" onPress={onContinue} /></View>
  </ScreenFrame>;
}

function PrakritiAssessment({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState<'intro' | 'questions' | 'result'>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(AssessmentAnswer | null)[]>(assessmentQuestions.map(() => null));
  const currentAnswer = answers[questionIndex];

  function chooseAnswer(answer: AssessmentAnswer) {
    setAnswers((values) => values.map((value, index) => index === questionIndex ? answer : value));
  }
  function continueQuestion() {
    if (!currentAnswer) return;
    if (questionIndex === assessmentQuestions.length - 1) setStage('result');
    else setQuestionIndex((value) => value + 1);
  }
  function goBack() {
    if (questionIndex === 0) setStage('intro');
    else setQuestionIndex((value) => value - 1);
  }

  if (stage === 'intro') return <AssessmentIntro onBack={onExit} onStart={() => setStage('questions')} />;
  if (stage === 'result') return <AssessmentResult answers={answers} onContinue={onExit} />;
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
            <View style={styles.answerTextWrap}><Text style={styles.answerLetter}>{key}</Text><Text style={styles.answerLabel}>{label}</Text></View>
            <View style={[styles.radio, selected && styles.radioSelected]}>{selected ? <View style={styles.radioDot} /> : null}</View>
          </Pressable>;
        })}
      </View>
      <View style={styles.questionActions}>
        <SecondaryButton label="Back" onPress={goBack} />
        <View style={styles.continueHalf}><PrimaryButton label={questionIndex === assessmentQuestions.length - 1 ? 'See Results' : 'Continue'} onPress={continueQuestion} /></View>
      </View>
      {!currentAnswer ? <Text style={styles.answerHint}>Select one option to continue</Text> : null}
    </View>
  </SafeAreaView>;
}

function AssessmentIntro({ onBack, onStart }: { onBack: () => void; onStart: () => void }) {
  return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <View style={styles.assessmentIntroPage}>
      <BackButton onPress={onBack} />
      <View style={styles.assessmentIntroContent}>
        <View style={styles.assessmentEmblem}><Text style={styles.assessmentEmblemText}>❧</Text></View>
        <Text style={styles.assessmentIntroTitle}>Understand Your{`\n`}Natural Health Pattern</Text>
        <Text style={styles.assessmentIntroCopy}>Prakriti is your unique mind-body constitution. It helps us personalize your health, diet, yoga and lifestyle.</Text>
        <View style={styles.assessmentFacts}>
          <AssessmentFact icon="▣" text="25 Questions" detail="3-question preview in this build" />
          <AssessmentFact icon="◷" text="Takes a few minutes" />
          <AssessmentFact icon="⌁" text="Answers based on your natural tendencies" />
        </View>
      </View>
      <PrimaryButton label="Start Assessment" onPress={onStart} />
    </View>
  </SafeAreaView>;
}

function AssessmentFact({ icon, text, detail }: { icon: string; text: string; detail?: string }) {
  return <View style={styles.assessmentFact}><View style={styles.factIcon}><Text style={styles.factIconText}>{icon}</Text></View><View style={styles.factTextWrap}><Text style={styles.factText}>{text}</Text>{detail ? <Text style={styles.factDetail}>{detail}</Text> : null}</View></View>;
}

function AssessmentResult({ answers, onContinue }: { answers: (AssessmentAnswer | null)[]; onContinue: () => void }) {
  const percentages = calculateDoshaPercentages(answers);
  const entries: { key: Dosha; label: string; color: string; value: number }[] = [
    { key: 'vata', label: 'Vata', color: '#2879B9', value: percentages.vata },
    { key: 'pitta', label: 'Pitta', color: '#EEA62A', value: percentages.pitta },
    { key: 'kapha', label: 'Kapha', color: '#5B9B54', value: percentages.kapha },
  ];
  const maxValue = Math.max(...entries.map((entry) => entry.value));
  const dominant = entries.filter((entry) => entry.value === maxValue).map((entry) => entry.label);
  const dominantLabel = `${dominant.join(' – ')} Dominant`;
  return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <ScrollView contentContainerStyle={styles.resultPage}>
      <Text style={styles.resultEyebrow}>YOUR RESULT</Text><Text style={styles.resultTitle}>Your Prakriti</Text><Text style={styles.resultDominant}>{dominantLabel}</Text>
      <View style={styles.chartRow}>
        <View style={styles.doshaChart}>
          {entries.map((entry) => <View key={entry.key} style={[styles.chartBand, { backgroundColor: entry.color, flex: Math.max(entry.value, 1) }]} />)}
          <View style={styles.chartCenter}><Text style={styles.chartCenterLabel}>{dominant[0]}</Text><Text style={styles.chartCenterValue}>{maxValue}%</Text></View>
        </View>
        <View style={styles.legend}>{entries.map((entry) => <View key={entry.key} style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: entry.color }]} /><Text style={styles.legendName}>{entry.label}</Text><Text style={styles.legendValue}>{entry.value}%</Text></View>)}</View>
      </View>
      <View style={styles.resultMeaning}><Text style={styles.resultSectionTitle}>What this means</Text><Text style={styles.resultBody}>{getResultMeaning(dominant)}</Text><Text style={styles.resultSectionTitle}>Your natural tendencies</Text><Text style={styles.tendency}>• Your strongest qualities reflect your dominant dosha balance</Text><Text style={styles.tendency}>• Personalized recommendations will build on this foundation</Text></View>
      <PrimaryButton label="Continue to Home" onPress={onContinue} />
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
    Vata: 'Your constitution reflects movement, creativity and adaptability. Steady routines and grounding habits may help you thrive.',
    Pitta: 'Your constitution reflects focus, drive and transformation. Cooling, calming habits may help maintain balance.',
    Kapha: 'Your constitution reflects stability, strength and calm. Energizing variety and regular movement may help you thrive.',
  };
  return meanings[dominant[0]];
}

function HomeScreen({ session, onStartAssessment }: { session: Session | null; onStartAssessment: () => void }) {
  const fullName = session?.user.user_metadata.full_name?.trim();
  const firstName = fullName?.split(/\s+/)[0] || 'there';
  const features = [
    { icon: '🥗', label: 'Food' }, { icon: '🧘', label: 'Yoga' },
    { icon: '◉', label: 'Pranayama' }, { icon: '◎', label: 'Panchakarma' },
    { icon: '♙', label: 'AI Assistant' }, { icon: '▣', label: 'Doctor' },
  ];
  return <SafeAreaView style={styles.homeSafe}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.homeHeader}>
        <View><Text style={styles.greeting}>Good Morning,</Text><Text style={styles.greetingName}>{firstName} 👋</Text></View>
        <View style={styles.bell}><Text style={styles.bellIcon}>♧</Text><View style={styles.notificationDot} /></View>
      </View>
      <View style={styles.dashboardBody}>
        <View style={styles.assessmentCard}>
          <Text style={styles.assessmentTitle}>Complete Your Assessments{`\n`}for Personalized Guidance</Text>
          <AssessmentItem number="1" title="Prakriti Assessment" copy="Understand your natural constitution" />
          <AssessmentItem number="2" title="Current Health Assessment" copy="Tell us how you feel right now" />
          <Pressable onPress={onStartAssessment} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}><Text style={styles.startButtonText}>Start Now</Text></Pressable>
        </View>
        <Text style={styles.exploreTitle}>Explore Ayurnidaan</Text>
        <View style={styles.featureGrid}>{features.map((feature) => <FeatureTile key={feature.label} {...feature} />)}</View>
      </View>
    </ScrollView>
    <View style={styles.bottomNav}>
      <NavItem icon="⌂" label="Home" active /><NavItem icon="♡" label="My Health" />
      <NavItem icon="▦" label="Feed" /><NavItem icon="♧" label="AI" /><NavItem icon="♙" label="Profile" />
    </View>
  </SafeAreaView>;
}

function ScreenFrame({ children, scroll = false, alignTop = false }: { children: React.ReactNode; scroll?: boolean; alignTop?: boolean }) {
  const content = <View style={[styles.content, alignTop && styles.contentTop]}>{children}</View>;
  return <SafeAreaView style={styles.safe}><StatusBar style="dark" /><KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>{scroll ? <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">{content}</ScrollView> : content}</KeyboardAvoidingView></SafeAreaView>;
}
function BotanicalCorner() { return <View pointerEvents="none" style={styles.corner}><View style={styles.cornerStem} /><View style={[styles.cornerLeaf, styles.cornerLeaf1]} /><View style={[styles.cornerLeaf, styles.cornerLeaf2]} /><View style={[styles.cornerLeaf, styles.cornerLeaf3]} /></View>; }
function Field({ label, ...props }: React.ComponentProps<typeof TextInput> & { label: string }) { return <View><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#9A9B92" style={styles.input} {...props} /></View>; }
function PrimaryButton({ label, loading, onPress }: { label: string; loading?: boolean; onPress: () => void }) { return <Pressable disabled={loading} onPress={onPress} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{label}</Text>}</Pressable>; }
function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) { return <Pressable onPress={onPress} style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}><Text style={styles.secondaryText}>{label}</Text></Pressable>; }
function SocialButton({ symbol, label, loading, onPress }: { symbol: string; label: string; loading?: boolean; onPress: () => void }) { return <Pressable accessibilityLabel={`Continue with ${label}`} disabled={loading} onPress={onPress} style={({ pressed }) => [styles.socialButton, pressed && styles.pressed]}>{loading ? <ActivityIndicator color={colors.primaryDark} /> : <Text style={[styles.socialSymbol, label === 'Google' && styles.google]}>{symbol}</Text>}<Text style={styles.socialLabel}>{label}</Text></Pressable>; }
function Divider({ label }: { label: string }) { return <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.dividerText}>{label}</Text><View style={styles.divider} /></View>; }
function BackButton({ onPress }: { onPress: () => void }) { return <Pressable accessibilityLabel="Go back" onPress={onPress} style={styles.back}><Text style={styles.backText}>‹</Text></Pressable>; }
function AssessmentItem({ number, title, copy }: { number: string; title: string; copy: string }) { return <View style={styles.assessmentItem}><View style={styles.numberBadge}><Text style={styles.numberText}>{number}</Text></View><View style={styles.assessmentText}><Text style={styles.assessmentItemTitle}>{title}</Text><Text style={styles.assessmentCopy}>{copy}</Text></View></View>; }
function FeatureTile({ icon, label }: { icon: string; label: string }) { return <Pressable accessibilityLabel={label} onPress={() => {}} style={({ pressed }) => [styles.featureTile, pressed && styles.pressed]}><Text style={styles.featureIcon}>{icon}</Text><Text style={styles.featureLabel}>{label}</Text></Pressable>; }
function NavItem({ icon, label, active = false }: { icon: string; label: string; active?: boolean }) { return <Pressable accessibilityLabel={label} onPress={() => {}} style={styles.navItem}><Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>{active ? <View style={styles.navIndicator} /> : null}</Pressable>; }
function extractAuthParams(url: string) { const fragment = url.split('#')[1] ?? url.split('?')[1] ?? ''; return Object.fromEntries(new URLSearchParams(fragment)); }

const serif = Platform.select({ ios: 'Georgia', android: 'serif' });
const styles = StyleSheet.create({
  flex: { flex: 1 }, safe: { backgroundColor: '#FBF8EF', flex: 1 }, scroll: { flexGrow: 1 }, content: { flex: 1, justifyContent: 'center', paddingHorizontal: 26, paddingVertical: 30 }, contentTop: { justifyContent: 'flex-start', paddingTop: 24 },
  splash: { alignItems: 'center', backgroundColor: '#003C2E', flex: 1, justifyContent: 'center', overflow: 'hidden' }, splashContent: { alignItems: 'center', paddingHorizontal: 28, width: '100%' }, splashLogoPanel: { backgroundColor: '#FBF8EF', borderColor: '#BFA55D', borderRadius: 24, borderWidth: 1, marginBottom: 18, paddingHorizontal: 12, shadowColor: '#001B14', shadowOffset: { width: 0, height: 10 }, shadowOpacity: .2, shadowRadius: 16 }, splashLogo: { height: 170, width: 280 }, splashSubtitle: { color: '#F7EED2', fontSize: 14, fontWeight: '600', letterSpacing: .4, lineHeight: 21, textAlign: 'center' }, splashTap: { bottom: -110, color: '#D9C99C', fontSize: 12, position: 'absolute' },
  corner: { bottom: -12, height: 185, left: -20, opacity: .6, position: 'absolute', width: 150 }, cornerStem: { backgroundColor: '#B59D54', bottom: 0, height: 170, left: 48, position: 'absolute', transform: [{ rotate: '35deg' }], width: 3 }, cornerLeaf: { backgroundColor: '#C1A95E', borderBottomLeftRadius: 20, borderTopRightRadius: 20, height: 44, position: 'absolute', width: 24 }, cornerLeaf1: { bottom: 36, left: 30, transform: [{ rotate: '-30deg' }] }, cornerLeaf2: { bottom: 76, left: 62, transform: [{ rotate: '48deg' }] }, cornerLeaf3: { bottom: 112, left: 73, transform: [{ rotate: '70deg' }] },
  introTop: { alignItems: 'center', marginTop: 12 }, introKicker: { color: '#30443D', fontFamily: serif, fontSize: 17, fontWeight: '600' }, introTitle: { color: '#07533F', fontFamily: serif, fontSize: 34, fontWeight: '700', marginTop: 2 }, introCopy: { color: '#555F59', fontSize: 14, lineHeight: 21, marginTop: 13, maxWidth: 250, textAlign: 'center' }, introActions: { gap: 12 }, loginLink: { alignItems: 'center', paddingVertical: 8 },
  herbArt: { alignSelf: 'center', height: 230, marginVertical: 22, width: 260 }, sunDisc: { backgroundColor: '#EFE4C4', borderRadius: 65, height: 130, left: 65, opacity: .7, position: 'absolute', top: 42, width: 130 }, bowl: { backgroundColor: '#D8C49A', borderBottomLeftRadius: 45, borderBottomRightRadius: 45, bottom: 20, height: 68, left: 73, position: 'absolute', shadowColor: '#3B4B43', shadowOffset: { width: 0, height: 8 }, shadowOpacity: .18, shadowRadius: 8, width: 116 }, bowlRim: { backgroundColor: '#BDA777', borderRadius: 20, height: 13, left: -5, position: 'absolute', top: -4, width: 126 }, stem: { backgroundColor: '#4F7447', bottom: 80, height: 120, left: 120, position: 'absolute', width: 4 }, stemRight: { height: 105, left: 140 }, leaf: { backgroundColor: '#6E914F', borderBottomLeftRadius: 22, borderTopRightRadius: 22, height: 44, position: 'absolute', width: 23 }, leaf1: { left: 91, top: 65, transform: [{ rotate: '-50deg' }] }, leaf2: { left: 132, top: 46, transform: [{ rotate: '25deg' }] }, leaf3: { left: 151, top: 82, transform: [{ rotate: '60deg' }] }, leaf4: { left: 105, top: 105, transform: [{ rotate: '-70deg' }] },
  pageTitle: { color: '#202921', fontFamily: serif, fontSize: 30, fontWeight: '700', textAlign: 'center' }, pageSubtitle: { color: '#70756F', fontSize: 14, lineHeight: 21, marginBottom: 28, marginTop: 8, textAlign: 'center' }, step: { color: colors.gold, fontSize: 11, fontWeight: '800', letterSpacing: 1.6, marginBottom: 9, textAlign: 'center' }, form: { gap: 17 }, label: { color: '#333B35', fontSize: 12, fontWeight: '700', marginBottom: 7 }, input: { backgroundColor: '#FFFEFA', borderColor: '#DDDCCF', borderRadius: 11, borderWidth: 1, color: '#202921', fontSize: 15, minHeight: 51, paddingHorizontal: 14 },
  primaryButton: { alignItems: 'center', backgroundColor: '#005A3F', borderRadius: 11, elevation: 2, justifyContent: 'center', minHeight: 51, paddingHorizontal: 18, shadowColor: '#003C2E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: .14, shadowRadius: 8 }, primaryText: { color: '#FFF', fontSize: 15, fontWeight: '700' }, secondaryButton: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#0A6048', borderRadius: 11, borderWidth: 1.3, justifyContent: 'center', minHeight: 51, paddingHorizontal: 18 }, secondaryText: { color: '#07533F', fontSize: 15, fontWeight: '700' }, pressed: { opacity: .74 },
  dividerRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginVertical: 27 }, divider: { backgroundColor: '#DDDCCF', flex: 1, height: 1 }, dividerText: { color: '#85877F', fontSize: 11 }, socialRow: { flexDirection: 'row', gap: 14, justifyContent: 'center' }, socialButton: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#E1E0D5', borderRadius: 13, borderWidth: 1, height: 74, justifyContent: 'center', width: 76 }, socialSymbol: { color: '#161A17', fontSize: 21, fontWeight: '800' }, google: { color: '#4285F4' }, socialLabel: { color: '#5F655F', fontSize: 10, marginTop: 5 },
  notice: { color: '#7A6429', fontSize: 12, lineHeight: 18, marginTop: 20, textAlign: 'center' }, error: { color: colors.error, fontSize: 12, lineHeight: 18, marginTop: 14, textAlign: 'center' }, policy: { color: '#85877F', fontSize: 11, lineHeight: 17, marginTop: 28, textAlign: 'center' }, muted: { color: '#6D756F', fontSize: 13 }, link: { color: '#075A43', fontWeight: '700' }, back: { alignItems: 'center', height: 38, justifyContent: 'center', marginBottom: 8, marginLeft: -10, width: 38 }, backText: { color: '#26352F', fontSize: 31, fontWeight: '300', lineHeight: 32 },
  checkRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 11, marginTop: 3 }, checkbox: { alignItems: 'center', borderColor: '#B9BDB5', borderRadius: 5, borderWidth: 1.3, height: 22, justifyContent: 'center', marginTop: 1, width: 22 }, checkboxSelected: { backgroundColor: '#005A3F', borderColor: '#005A3F' }, checkmark: { color: '#FFF', fontSize: 14, fontWeight: '800' }, terms: { color: '#6D756F', flex: 1, fontSize: 12, lineHeight: 19 },
  choiceRow: { flexDirection: 'row', gap: 8 }, choice: { alignItems: 'center', backgroundColor: '#FFFEFA', borderColor: '#DDDCCF', borderRadius: 10, borderWidth: 1, flex: 1, justifyContent: 'center', minHeight: 47 }, choiceSelected: { backgroundColor: '#075A43', borderColor: '#075A43' }, choiceText: { color: '#4A514C', fontSize: 14, fontWeight: '600' }, choiceTextSelected: { color: '#FFF' }, measureRow: { flexDirection: 'row', gap: 12 }, measureField: { flex: 1 }, privacy: { color: '#85877F', fontSize: 11, lineHeight: 17, textAlign: 'center' },
  confirmationContent: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 80 }, successCircle: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 38, elevation: 3, height: 76, justifyContent: 'center', marginBottom: 28, shadowColor: '#003C2E', shadowOffset: { width: 0, height: 6 }, shadowOpacity: .2, shadowRadius: 12, width: 76 }, successCheck: { color: '#FFF', fontSize: 40, fontWeight: '700', lineHeight: 46 }, confirmationTitle: { color: '#202921', fontFamily: serif, fontSize: 24, fontWeight: '700', textAlign: 'center' }, confirmationCopy: { color: '#5F6861', fontSize: 14, lineHeight: 21, marginTop: 13, maxWidth: 280, textAlign: 'center' }, confirmationAction: { bottom: 30, left: 26, position: 'absolute', right: 26 },
  assessmentSafe: { backgroundColor: '#FBF8EF', flex: 1 }, assessmentIntroPage: { flex: 1, paddingBottom: 28, paddingHorizontal: 24, paddingTop: 18 }, assessmentIntroContent: { flex: 1, justifyContent: 'center', paddingBottom: 35 }, assessmentEmblem: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#E9F0E7', borderRadius: 34, height: 68, justifyContent: 'center', marginBottom: 24, width: 68 }, assessmentEmblemText: { color: '#075A3F', fontSize: 36 }, assessmentIntroTitle: { color: '#202921', fontFamily: serif, fontSize: 29, fontWeight: '700', lineHeight: 37, textAlign: 'center' }, assessmentIntroCopy: { color: '#606963', fontSize: 14, lineHeight: 22, marginTop: 18, textAlign: 'center' }, assessmentFacts: { gap: 19, marginTop: 38 }, assessmentFact: { alignItems: 'center', flexDirection: 'row', gap: 13 }, factIcon: { alignItems: 'center', borderColor: '#7A9589', borderRadius: 14, borderWidth: 1, height: 28, justifyContent: 'center', width: 28 }, factIconText: { color: '#075A3F', fontSize: 14, fontWeight: '700' }, factTextWrap: { flex: 1 }, factText: { color: '#303A34', fontSize: 14, fontWeight: '600' }, factDetail: { color: '#8A8F8B', fontSize: 11, marginTop: 2 },
  questionPage: { flex: 1, paddingBottom: 28, paddingHorizontal: 24, paddingTop: 18 }, assessmentPageTitle: { color: '#202921', fontFamily: serif, fontSize: 24, fontWeight: '700' }, questionCount: { color: '#6D756F', fontSize: 13, fontWeight: '600', marginTop: 23 }, progressTrack: { backgroundColor: '#E2E3DB', borderRadius: 4, height: 6, marginTop: 10, overflow: 'hidden' }, progressFill: { backgroundColor: '#075A3F', borderRadius: 4, height: '100%' }, questionPrompt: { color: '#26312B', fontFamily: serif, fontSize: 25, fontWeight: '700', lineHeight: 33, marginBottom: 27, marginTop: 38 }, answerList: { gap: 13 }, answerOption: { alignItems: 'center', backgroundColor: '#FFFEFA', borderColor: '#DEDED4', borderRadius: 12, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', minHeight: 66, paddingHorizontal: 15, paddingVertical: 10 }, answerOptionSelected: { backgroundColor: '#F3F8F4', borderColor: '#075A3F', borderWidth: 1.5 }, answerTextWrap: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: 12 }, answerLetter: { color: '#075A3F', fontSize: 14, fontWeight: '800' }, answerLabel: { color: '#38423C', flex: 1, fontSize: 15, fontWeight: '600' }, radio: { alignItems: 'center', borderColor: '#C8CBC5', borderRadius: 10, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 }, radioSelected: { borderColor: '#075A3F' }, radioDot: { backgroundColor: '#075A3F', borderRadius: 5, height: 10, width: 10 }, questionActions: { flexDirection: 'row', gap: 12, marginTop: 'auto', paddingTop: 25 }, continueHalf: { flex: 1 }, answerHint: { color: '#8A6D2F', fontSize: 11, marginTop: 9, textAlign: 'right' },
  resultPage: { flexGrow: 1, paddingBottom: 30, paddingHorizontal: 25, paddingTop: 40 }, resultEyebrow: { color: '#B08A3D', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' }, resultTitle: { color: '#075A3F', fontFamily: serif, fontSize: 33, fontWeight: '700', marginTop: 8, textAlign: 'center' }, resultDominant: { color: '#34443C', fontSize: 16, fontWeight: '700', marginTop: 7, textAlign: 'center' }, chartRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginVertical: 35 }, doshaChart: { borderRadius: 80, height: 160, overflow: 'hidden', position: 'relative', width: 160 }, chartBand: { width: '100%' }, chartCenter: { alignItems: 'center', backgroundColor: '#FBF8EF', borderRadius: 49, height: 98, justifyContent: 'center', left: 31, position: 'absolute', top: 31, width: 98 }, chartCenterLabel: { color: '#59645E', fontSize: 12 }, chartCenterValue: { color: '#24312B', fontFamily: serif, fontSize: 24, fontWeight: '700', marginTop: 2 }, legend: { gap: 14, marginLeft: 26 }, legendItem: { alignItems: 'center', flexDirection: 'row', minWidth: 100 }, legendDot: { borderRadius: 5, height: 10, marginRight: 8, width: 10 }, legendName: { color: '#3E4943', flex: 1, fontSize: 13, fontWeight: '600' }, legendValue: { color: '#252E29', fontSize: 13, fontWeight: '800', marginLeft: 8 }, resultMeaning: { backgroundColor: '#FFFDF7', borderColor: '#E7E0CE', borderRadius: 17, borderWidth: 1, marginBottom: 28, padding: 19 }, resultSectionTitle: { color: '#29352F', fontFamily: serif, fontSize: 17, fontWeight: '700', marginBottom: 8, marginTop: 7 }, resultBody: { color: '#606963', fontSize: 13, lineHeight: 20, marginBottom: 16 }, tendency: { color: '#606963', fontSize: 13, lineHeight: 20, marginBottom: 5 },
  homeSafe: { backgroundColor: '#004735', flex: 1 }, homeScroll: { backgroundColor: '#FBF8EF', flexGrow: 1, paddingBottom: 112 }, homeHeader: { alignItems: 'center', backgroundColor: '#004735', flexDirection: 'row', justifyContent: 'space-between', minHeight: 198, paddingBottom: 60, paddingHorizontal: 25, paddingTop: 29 }, greeting: { color: '#D9E7DF', fontSize: 19, fontWeight: '500', lineHeight: 25 }, greetingName: { color: '#FFF', fontFamily: serif, fontSize: 40, fontWeight: '700', lineHeight: 47, marginTop: 2 }, bell: { alignItems: 'center', borderColor: '#C7DED3', borderRadius: 22, borderWidth: 1.2, height: 44, justifyContent: 'center', width: 44 }, bellIcon: { color: '#FFF', fontSize: 26, transform: [{ rotate: '180deg' }] }, notificationDot: { backgroundColor: '#E5B54D', borderRadius: 4, height: 8, position: 'absolute', right: 4, top: 3, width: 8 }, dashboardBody: { paddingHorizontal: 18 }, assessmentCard: { backgroundColor: '#FFFDF7', borderColor: '#E7E0CE', borderRadius: 21, borderWidth: 1, elevation: 4, gap: 22, marginTop: -44, padding: 23, shadowColor: '#17352E', shadowOffset: { width: 0, height: 7 }, shadowOpacity: .1, shadowRadius: 14 }, assessmentTitle: { color: '#28332D', fontFamily: serif, fontSize: 21, fontWeight: '700', lineHeight: 29 }, assessmentItem: { alignItems: 'flex-start', flexDirection: 'row', gap: 15 }, numberBadge: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 16, height: 32, justifyContent: 'center', marginTop: 2, width: 32 }, numberText: { color: '#FFF', fontSize: 15, fontWeight: '800' }, assessmentText: { flex: 1 }, assessmentItemTitle: { color: '#303A34', fontSize: 16, fontWeight: '700' }, assessmentCopy: { color: '#737B75', fontSize: 14, lineHeight: 20, marginTop: 4 }, startButton: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 11, justifyContent: 'center', minHeight: 51 }, startButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' }, exploreTitle: { color: '#28332D', fontFamily: serif, fontSize: 22, fontWeight: '700', marginBottom: 17, marginTop: 29 }, featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, featureTile: { alignItems: 'center', backgroundColor: '#FFF6E6', borderColor: '#F3E7D1', borderRadius: 16, borderWidth: 1, height: 108, justifyContent: 'center', width: '30.5%' }, featureIcon: { fontSize: 31 }, featureLabel: { color: '#3D4640', fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' }, bottomNav: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#E8E3D8', borderTopWidth: 1, bottom: 0, flexDirection: 'row', height: 86, justifyContent: 'space-around', left: 0, paddingBottom: 8, position: 'absolute', right: 0 }, navItem: { alignItems: 'center', flex: 1, justifyContent: 'center' }, navIcon: { color: '#818A84', fontSize: 27, fontWeight: '700' }, navLabel: { color: '#818A84', fontSize: 11, marginTop: 4 }, navActive: { color: '#075A3F', fontWeight: '800' }, navIndicator: { backgroundColor: '#075A3F', borderRadius: 2, height: 3, marginTop: 5, width: 20 },
});
