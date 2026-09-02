import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Image, KeyboardAvoidingView, Platform, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';

WebBrowser.maybeCompleteAuthSession();
type Screen = 'splash' | 'intro' | 'auth' | 'account' | 'profile' | 'confirmation' | 'home' | 'prakriti' | 'currentHealth' | 'doctor' | 'shop';
type Dosha = 'vata' | 'pitta' | 'kapha';
type AssessmentAnswer = 'A' | 'B' | 'C';
type AssessmentQuestion = { prompt: string; options: Record<AssessmentAnswer, string> };
const logo = require('./assets/ayurnidaan-logo.png');
const assessmentQuestions: AssessmentQuestion[] = [
  { prompt: 'Which description best matches your lifelong body frame?', options: { A: 'Slender, light, with prominent joints', B: 'Proportionate and medium-built', C: 'Broad, solid, or naturally muscular' } },
  { prompt: 'How does your skin tend to feel naturally?', options: { A: 'Thin, dry, or rough', B: 'Warm, soft, and easily irritated', C: 'Cool, smooth, thick, or oily' } },
  { prompt: 'What pattern best describes your usual hunger?', options: { A: 'Unpredictable and variable', B: 'Strong; delays make me irritable', C: 'Gradual and steady; missing a meal is easy' } },
  { prompt: 'Which type of weather feels most uncomfortable?', options: { A: 'Windy, cold, and dry', B: 'Hot or humid', C: 'Chilly and damp' } },
  { prompt: 'How would you describe your normal perspiration?', options: { A: 'Minimal', B: 'Heavy and sometimes strong-smelling', C: 'Moderate and consistent' } },
  { prompt: 'Which description fits your natural hair?', options: { A: 'Fine, dry, frizzy, or fragile', B: 'Soft and fine, with early greying', C: 'Dense, thick, wavy, or oily' } },
  { prompt: 'What are your eyes generally like?', options: { A: 'Small, dry, or frequently moving', B: 'Medium, penetrating, and light-sensitive', C: 'Large, moist, and composed' } },
  { prompt: 'How does your energy usually last?', options: { A: 'Comes in bursts and fades quickly', B: 'Moderate, directed, and purposeful', C: 'Builds slowly but endures for a long time' } },
  { prompt: 'How does your body generally respond to illness?', options: { A: 'Recovery varies and minor ailments recur', B: 'Responds quickly, often with heat or inflammation', C: 'Falls ill slowly and is usually resilient' } },
  { prompt: 'Which statement best describes your usual sleep?', options: { A: 'Light and easily interrupted', B: 'Restful but relatively brief', C: 'Long, deep, and difficult to wake from' } },
  { prompt: 'How do learning and memory typically work for you?', options: { A: 'I grasp things fast but may forget soon', B: 'I retain facts with clarity and logic', C: 'I learn gradually and remember for years' } },
  { prompt: 'What is your normal decision-making style?', options: { A: 'Quick to choose, but likely to reconsider', B: 'Fast, definite, and confident', C: 'Deliberate, then firmly committed' } },
  { prompt: 'What is your instinctive response to pressure?', options: { A: 'Restlessness, worry, or nervousness', B: 'Impatience, irritation, or intensity', C: 'Calmness and emotional steadiness' } },
  { prompt: 'How would you characterize your natural speech?', options: { A: 'Rapid, expressive, and changeable', B: 'Precise, direct, and assertive', C: 'Measured, deep, and gentle' } },
  { prompt: 'Which description best fits your bones and joints?', options: { A: 'Fine bones and clearly visible joints', B: 'Moderate bone structure', C: 'Large, dense, and strong structure' } },
  { prompt: 'Which description is closest to your natural complexion?', options: { A: 'Brown or dusky', B: 'Warm with reddish, copper, or yellow tones', C: 'Pale, fair, and even-toned' } },
  { prompt: 'What are your nails usually like?', options: { A: 'Brittle, coarse, or dry', B: 'Pink, flexible, and fast-growing', C: 'Strong, glossy, thick, and slow-growing' } },
  { prompt: 'Which description fits your teeth and gums?', options: { A: 'Irregular or spaced teeth', B: 'Medium teeth with sensitive or bleeding gums', C: 'Large, sturdy teeth and firm gums' } },
  { prompt: 'What is your characteristic walking style?', options: { A: 'Light, rapid, and occasionally uneven', B: 'Purposeful, brisk, and assured', C: 'Unhurried, stable, and grounded' } },
  { prompt: 'How does your weight usually behave?', options: { A: 'Gaining weight is difficult', B: 'It remains fairly stable', C: 'It rises easily and falls slowly' } },
  { prompt: 'Which description sounds most like you in childhood?', options: { A: 'Lean, active, and a light eater', B: 'Medium-built, hungry, and competitive', C: 'Strong-built, relaxed, with a healthy appetite' } },
  { prompt: 'Which pattern is most common in your family?', options: { A: 'Lean frames, quick temperaments, shifting moods', B: 'Driven personalities and early greying', C: 'Solid frames, calm temperaments, easy weight gain' } },
  { prompt: 'What is your typical bowel pattern?', options: { A: 'Dry, hard, irregular, or prone to constipation', B: 'Loose, soft, or relatively frequent', C: 'Regular and well-formed' } },
  { prompt: 'How would you describe your natural thirst?', options: { A: 'It varies from day to day', B: 'Strong and frequent', C: 'Low; I can comfortably wait for water' } },
  { prompt: 'Which flavor group do you naturally enjoy most?', options: { A: 'Sweet, sour, and salty', B: 'Sweet and bitter, with fewer hot or sour foods', C: 'Pungent, bitter, and drying flavors' } },
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
  if (screen === 'prakriti') return <PrakritiAssessment session={session} onExit={() => setScreen('home')} />;
  if (screen === 'currentHealth') return <CurrentHealthAssessment session={session} onExit={() => setScreen('home')} />;
  if (screen === 'doctor') return <DoctorFlow session={session} onExit={() => setScreen('home')} />;
  if (screen === 'shop') return <ShopFlow onExit={() => setScreen('home')} />;
  return <HomeScreen session={session} onStartPrakriti={() => setScreen('prakriti')} onStartCurrentHealth={() => setScreen('currentHealth')} onOpenDoctor={() => setScreen('doctor')} onOpenShop={() => setScreen('shop')} />;
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

function PrakritiAssessment({ session, onExit }: { session: Session | null; onExit: () => void }) {
  const [stage, setStage] = useState<'intro' | 'questions' | 'result'>('intro');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(AssessmentAnswer | null)[]>(assessmentQuestions.map(() => null));
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
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
    const { error } = await supabase.from('prakriti_assessments').insert({
      user_id: session.user.id,
      vata_percentage: percentages.vata,
      pitta_percentage: percentages.pitta,
      kapha_percentage: percentages.kapha,
      answers: answers.map((answer, index) => ({ question_number: index + 1, answer })),
      question_count: answers.length,
    });
    setSaving(false);
    if (error) return setSaveError(error.message);
    setStage('result');
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
        <View style={styles.continueHalf}><PrimaryButton label={questionIndex === assessmentQuestions.length - 1 ? 'See Results' : 'Continue'} loading={saving} onPress={continueQuestion} /></View>
      </View>
      {!currentAnswer ? <Text style={styles.answerHint}>Select one option to continue</Text> : null}
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
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
          <AssessmentFact icon="▣" text="25 Questions" />
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
          {Array.from({ length: 100 }, (_, index) => {
            const color = index < percentages.vata
              ? entries[0].color
              : index < percentages.vata + percentages.pitta
                ? entries[1].color
                : entries[2].color;
            return <View key={index} style={[styles.chartSegment, { backgroundColor: color, transform: [{ rotate: `${index * 3.6}deg` }, { translateY: -62 }] }]} />;
          })}
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

function CurrentHealthAssessment({ session, onExit }: { session: Session | null; onExit: () => void }) {
  const [stage, setStage] = useState<'intro' | 'question' | 'summary' | 'ready'>('intro');
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const symptoms = ['Bloating / Gas', 'Acidity / Heartburn', 'Constipation', 'Fatigue / Tiredness', 'Poor Sleep'];
  function toggleSymptom(symptom: string) {
    setSaveError('');
    setSelected((values) => values.includes(symptom) ? values.filter((value) => value !== symptom) : [...values, symptom]);
  }
  async function completeCurrentHealth() {
    if (!session?.user.id) return setSaveError('Please sign in again before saving your assessment.');
    setSaving(true); setSaveError('');
    const sleepSummary = selected.includes('Poor Sleep') ? 'Irregular / Needs attention' : '6–7 hrs / Regular';
    const { error } = await supabase.from('current_health_assessments').insert({
      user_id: session.user.id,
      symptoms: selected,
      lifestyle_summary: 'Moderate Activity',
      sleep_summary: sleepSummary,
      stress_summary: 'Moderate',
    });
    setSaving(false);
    if (error) return setSaveError(error.message);
    setStage('summary');
  }
  if (stage === 'intro') return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <View style={styles.healthIntroPage}>
      <BackButton onPress={onExit} />
      <View style={styles.healthIntroContent}>
        <Text style={styles.assessmentIntroTitle}>How Are You{`\n`}Feeling Right Now?</Text>
        <Text style={styles.assessmentIntroCopy}>Help us understand your current health so we can give you better guidance.</Text>
        <MeditationArt />
        <View style={styles.assessmentFacts}>
          <AssessmentFact icon="♙" text="Share your symptoms" />
          <AssessmentFact icon="◷" text="Lifestyle & health habits" />
          <AssessmentFact icon="▣" text="Medications & conditions" />
        </View>
      </View>
      <PrimaryButton label="Start Assessment" onPress={() => setStage('question')} />
    </View>
  </SafeAreaView>;
  if (stage === 'summary') return <CurrentHealthSummary symptoms={selected} onContinue={() => setStage('ready')} />;
  if (stage === 'ready') return <HealthProfileReady onContinue={onExit} />;
  return <SafeAreaView style={styles.assessmentSafe}>
    <StatusBar style="dark" />
    <View style={styles.questionPage}>
      <BackButton onPress={() => setStage('intro')} /><Text style={styles.assessmentPageTitle}>Current Health Assessment</Text>
      <Text style={styles.questionCount}>Step 1 of 6</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: '16.67%' }]} /></View>
      <Text style={styles.healthQuestion}>Do you experience any of the following?</Text><Text style={styles.selectAllHint}>(Select all that apply)</Text>
      <View style={styles.symptomList}>{symptoms.map((symptom) => { const checked = selected.includes(symptom); return <Pressable key={symptom} accessibilityRole="checkbox" accessibilityState={{ checked }} onPress={() => toggleSymptom(symptom)} style={[styles.symptomOption, checked && styles.symptomOptionSelected]}><View style={[styles.symptomCheckbox, checked && styles.symptomCheckboxSelected]}>{checked ? <Text style={styles.symptomCheck}>✓</Text> : null}</View><Text style={styles.symptomLabel}>{symptom}</Text></Pressable>; })}</View>
      <View style={styles.questionActions}><SecondaryButton label="Back" onPress={() => setStage('intro')} /><View style={styles.continueHalf}><PrimaryButton label="Continue" loading={saving} onPress={completeCurrentHealth} /></View></View>
      {saveError ? <Text style={styles.error}>{saveError}</Text> : null}
    </View>
  </SafeAreaView>;
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

function HomeScreen({ session, onStartPrakriti, onStartCurrentHealth, onOpenDoctor, onOpenShop }: { session: Session | null; onStartPrakriti: () => void; onStartCurrentHealth: () => void; onOpenDoctor: () => void; onOpenShop: () => void }) {
  const fullName = session?.user.user_metadata.full_name?.trim();
  const firstName = fullName?.split(/\s+/)[0] || 'there';
  const [latestPrakriti, setLatestPrakriti] = useState<Record<Dosha, number> | null>(null);
  const [hasCurrentHealth, setHasCurrentHealth] = useState(false);
  const [appointment, setAppointment] = useState<{ doctor_name: string; doctor_initials: string; appointment_date: string; appointment_time: string } | null>(null);
  useEffect(() => {
    if (!session?.user.id) return;
    let active = true;
    Promise.all([
      supabase.from('prakriti_assessments').select('vata_percentage, pitta_percentage, kapha_percentage').eq('user_id', session.user.id).order('completed_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('current_health_assessments').select('id').eq('user_id', session.user.id).order('completed_at', { ascending: false }).limit(1),
      supabase.from('appointments').select('doctor_name, doctor_initials, appointment_date, appointment_time').eq('user_id', session.user.id).eq('status', 'booked').order('created_at', { ascending: false }).limit(1).maybeSingle(),
    ]).then(([prakritiResult, healthResult, appointmentResult]) => {
      if (!active) return;
      const result = prakritiResult.data;
      setLatestPrakriti(result ? { vata: result.vata_percentage, pitta: result.pitta_percentage, kapha: result.kapha_percentage } : null);
      setHasCurrentHealth(Boolean(healthResult.data?.length));
      setAppointment(appointmentResult.data ?? null);
    });
    return () => { active = false; };
  }, [session?.user.id]);
  const hasPrakriti = Boolean(latestPrakriti);
  const assessmentsComplete = hasPrakriti && hasCurrentHealth;
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
  return <SafeAreaView style={styles.homeSafe}>
    <StatusBar style="light" />
    <ScrollView contentContainerStyle={styles.homeScroll} showsVerticalScrollIndicator={false}>
      <View style={styles.homeHeader}>
        <View><Text style={styles.greeting}>Good Morning,</Text><Text style={styles.greetingName}>{firstName} 👋</Text></View>
        <View style={styles.bell}><Text style={styles.bellIcon}>♧</Text><View style={styles.notificationDot} /></View>
      </View>
      <View style={styles.dashboardBody}>
        {assessmentsComplete && latestPrakriti ? <View style={styles.insightCard}>
          <MiniDoshaDonut percentages={latestPrakriti} />
          <View style={styles.insightContent}><Text style={styles.insightEyebrow}>YOUR CURRENT BALANCE</Text><Text style={styles.insightTitle}>Your Vatt-pitha dosha is imbalanced</Text><Text style={styles.insightCopy}>Your latest assessments are ready for personalized guidance.</Text>
            <View style={styles.insightActions}><Pressable onPress={onStartPrakriti}><Text style={styles.insightLink}>Retake Prakriti</Text></Pressable><Pressable onPress={onStartCurrentHealth}><Text style={styles.insightLink}>Update Health</Text></Pressable></View>
          </View>
        </View> : <View style={styles.assessmentCard}>
          <Text style={styles.assessmentTitle}>Complete Your Assessments{`\n`}for Personalized Guidance</Text>
          <AssessmentItem number={hasPrakriti ? '✓' : '1'} title="Prakriti Assessment" copy={hasPrakriti ? 'Completed · Tap to retake' : 'Understand your natural constitution'} completed={hasPrakriti} onPress={hasPrakriti ? onStartPrakriti : undefined} />
          <AssessmentItem number="2" title="Current Health Assessment" copy="Tell us how you feel right now" />
          <Pressable onPress={hasPrakriti ? onStartCurrentHealth : onStartPrakriti} style={({ pressed }) => [styles.startButton, pressed && styles.pressed]}><Text style={styles.startButtonText}>{hasPrakriti ? 'Start Current Health Assessment' : 'Start Now'}</Text></Pressable>
        </View>}
        {appointment ? <View style={styles.appointmentCard}><View style={styles.appointmentPortrait}><Text style={styles.appointmentPortraitIcon}>👩‍⚕️</Text></View><View style={styles.appointmentHomeContent}><Text style={styles.appointmentEyebrow}>UPCOMING APPOINTMENT</Text><Text style={styles.appointmentHomeText}>You have an appointment booked with {appointment.doctor_name} on {formatAppointmentDate(appointment.appointment_date)} at {appointment.appointment_time}.</Text></View></View> : null}
        {assessmentsComplete ? <>
          <View style={styles.planHeading}><Text style={styles.exploreTitle}>Today's Plan</Text><Pressable><Text style={styles.viewAll}>View All</Text></Pressable></View>
          <View style={styles.planGrid}>{plans.map((plan) => <PlanTile key={plan.title} {...plan} />)}</View>
        </> : <><Text style={styles.exploreTitle}>Explore Ayurnidaan</Text><View style={styles.featureGrid}>{features.map((feature) => <FeatureTile key={feature.label} {...feature} />)}</View></>}
      </View>
    </ScrollView>
    <View style={styles.bottomNav}>
      <NavItem icon="⌂" label="Home" active /><NavItem icon="🛍" label="Shop" onPress={onOpenShop} />
      <NavItem icon="✚" label="Doctor" onPress={onOpenDoctor} /><NavItem icon="♧" label="AI" /><NavItem icon="♙" label="Profile" />
    </View>
  </SafeAreaView>;
}

type Product = { id: string; name: string; weight: string; price: number; mrp: number; icon: string; category: string; description: string; rating: string };
const products: Product[] = [
  { id: 'ashwagandha', name: 'Ashwagandha', weight: '500 mg · 60 tablets', price: 599, mrp: 785, icon: '🌿', category: 'Herbal Products', description: 'Supports stress relief, sustained energy, restful sleep, and overall wellness.', rating: '4.7 (920)' },
  { id: 'triphala', name: 'Triphala', weight: '500 mg · 60 tablets', price: 499, mrp: 650, icon: '🍃', category: 'Supplements', description: 'A traditional Ayurvedic blend formulated to support digestion and daily wellbeing.', rating: '4.6 (540)' },
  { id: 'chyawanprash', name: 'Chyawanprash', weight: '500 g', price: 449, mrp: 575, icon: '🍯', category: 'Health Food', description: 'A nourishing herbal formulation to support immunity, strength, and vitality.', rating: '4.8 (760)' },
  { id: 'massage-oil', name: 'Abhyanga Oil', weight: '200 ml', price: 349, mrp: 425, icon: '🧴', category: 'Personal Care', description: 'A warming herbal massage oil for a calming and restorative self-care ritual.', rating: '4.5 (310)' },
];

function ShopFlow({ onExit }: { onExit: () => void }) {
  const [stage, setStage] = useState<'home' | 'details' | 'cart' | 'success'>('home');
  const [selected, setSelected] = useState(products[0]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const cartCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
  const cartItems = products.filter(product => cart[product.id]).map(product => ({ product, quantity: cart[product.id] }));
  const cartTotal = cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  function addToCart(product: Product) { setCart(current => ({ ...current, [product.id]: (current[product.id] ?? 0) + 1 })); }
  function changeQuantity(id: string, amount: number) { setCart(current => { const next = Math.max(0, (current[id] ?? 0) + amount); const updated = { ...current }; if (next) updated[id] = next; else delete updated[id]; return updated; }); }
  function openProduct(product: Product) { setSelected(product); setStage('details'); }
  if (stage === 'success') return <Pressable accessibilityRole="button" accessibilityLabel="Return to shop" onPress={() => { setCart({}); setStage('home'); }} style={styles.orderSuccessPage}><StatusBar style="dark" /><View style={styles.orderSuccessCheck}><Text style={styles.orderSuccessCheckText}>✓</Text></View><Text style={styles.orderSuccessTitle}>Order Successfully Placed!</Text><Text style={styles.orderSuccessCopy}>Your Ayurvedic wellness products are being prepared. We’ll keep you updated on your order.</Text><Text style={styles.orderSuccessTap}>Tap anywhere to return to the shop</Text></Pressable>;
  if (stage === 'cart') return <SafeAreaView style={styles.shopSafe}><StatusBar style="dark" /><View style={styles.shopPage}><BackButton onPress={() => setStage('home')} /><Text style={styles.shopTitle}>My Cart</Text>{cartItems.length ? <><ScrollView contentContainerStyle={styles.cartList}>{cartItems.map(({ product, quantity }) => <View key={product.id} style={styles.cartItem}><ProductVisual product={product} small /><View style={styles.cartItemInfo}><Text style={styles.cartItemName}>{product.name}</Text><Text style={styles.cartItemPrice}>₹{product.price}</Text></View><View style={styles.quantityControl}><Pressable onPress={() => changeQuantity(product.id, -1)} style={styles.quantityButton}><Text style={styles.quantityButtonText}>−</Text></Pressable><Text style={styles.quantityValue}>{quantity}</Text><Pressable onPress={() => changeQuantity(product.id, 1)} style={styles.quantityButton}><Text style={styles.quantityButtonText}>+</Text></Pressable></View></View>)}</ScrollView><View style={styles.cartFooter}><View style={styles.cartTotalRow}><Text style={styles.cartTotalLabel}>Total</Text><Text style={styles.cartTotalValue}>₹{cartTotal}</Text></View><PrimaryButton label="Checkout" onPress={() => setStage('success')} /></View></> : <View style={styles.emptyCart}><Text style={styles.emptyCartIcon}>🛒</Text><Text style={styles.emptyCartTitle}>Your cart is empty</Text><Text style={styles.emptyCartCopy}>Add something from the shop to begin.</Text><PrimaryButton label="Continue Shopping" onPress={() => setStage('home')} /></View>}</View></SafeAreaView>;
  if (stage === 'details') return <SafeAreaView style={styles.shopSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.productDetailPage}><BackButton onPress={() => setStage('home')} /><Text style={styles.shopTitle}>Product Details</Text><View style={styles.productDetailHero}><View style={styles.productDetailCopy}><Text style={styles.productDetailName}>{selected.name}</Text><Text style={styles.productWeight}>{selected.weight}</Text></View><ProductVisual product={selected} /></View><Text style={styles.productDetailPrice}>₹{selected.price}</Text><Text style={styles.productMrp}>MRP ₹{selected.mrp}</Text><View style={styles.ratingLine}><Text style={styles.ratingStar}>★</Text><Text style={styles.ratingText}>{selected.rating}</Text></View><Text style={styles.productDescription}>{selected.description}</Text><View style={styles.productAction}><PrimaryButton label="Add to Cart" onPress={() => addToCart(selected)} /></View></ScrollView><CartButton count={cartCount} onPress={() => setStage('cart')} /></SafeAreaView>;
  return <SafeAreaView style={styles.shopSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.shopHomeScroll}><View style={styles.shopTopRow}><Pressable onPress={onExit}><Text style={styles.shopBackText}>‹</Text></Pressable><Text style={styles.shopTitle}>Shop</Text><View style={styles.shopTopSpacer} /></View><View style={styles.shopSearch}><Text style={styles.shopSearchIcon}>⌕</Text><Text style={styles.shopSearchText}>Search products...</Text></View><Text style={styles.shopSectionTitle}>Categories</Text><View style={styles.categoryRow}>{[{ icon: '💊', label: 'Supplements' }, { icon: '🌿', label: 'Herbal Products' }, { icon: '🍊', label: 'Health Food' }, { icon: '🧴', label: 'Personal Care' }].map(item => <View key={item.label} style={styles.categoryItem}><View style={styles.categoryIcon}><Text style={styles.categoryEmoji}>{item.icon}</Text></View><Text style={styles.categoryLabel}>{item.label}</Text></View>)}</View><Text style={styles.shopSectionTitle}>Best Sellers</Text><View style={styles.productGrid}>{products.map(product => <Pressable key={product.id} onPress={() => openProduct(product)} style={({ pressed }) => [styles.productCard, pressed && styles.pressed]}><ProductVisual product={product} /><Text style={styles.productName}>{product.name}</Text><Text style={styles.productWeight}>{product.weight}</Text><Text style={styles.productPrice}>₹{product.price}</Text><Pressable onPress={() => addToCart(product)} style={styles.quickAdd}><Text style={styles.quickAddText}>+ Add</Text></Pressable></Pressable>)}</View></ScrollView><CartButton count={cartCount} onPress={() => setStage('cart')} /></SafeAreaView>;
}

function ProductVisual({ product, small = false }: { product: Product; small?: boolean }) { return <View style={[styles.productVisual, small && styles.productVisualSmall]}><Text style={[styles.productVisualIcon, small && styles.productVisualIconSmall]}>{product.icon}</Text><View style={styles.productBottleLabel}><Text style={styles.productBottleText}>AYUR</Text></View></View>; }
function CartButton({ count, onPress }: { count: number; onPress: () => void }) { return <Pressable accessibilityLabel={`Open cart with ${count} items`} onPress={onPress} style={({ pressed }) => [styles.floatingCart, pressed && styles.pressed]}><Text style={styles.floatingCartIcon}>🛒</Text>{count ? <View style={styles.cartBadge}><Text style={styles.cartBadgeText}>{count}</Text></View> : null}</Pressable>; }

type Doctor = { name: string; initials: string; portrait: string; qualification: string; experience: string; specialty: string; fee: number; rating: string; about: string };
const doctors: Doctor[] = [
  { name: 'Dr. Ananya Sharma', initials: 'AS', portrait: '👩‍⚕️', qualification: 'BAMS, MD (Ayu)', experience: '8 yrs experience', specialty: 'Ayurveda', fee: 600, rating: '4.8', about: 'Expert in Ayurveda, lifestyle disorders, PCOS, gut health, and personalized wellness care.' },
  { name: 'Dr. Rahul Verma', initials: 'RV', portrait: '👨‍⚕️', qualification: 'BAMS, MD (Ayu)', experience: '10 yrs experience', specialty: 'Panchakarma', fee: 700, rating: '4.7', about: 'Specialist in Panchakarma therapies, pain management, and restorative Ayurvedic care.' },
  { name: 'Dr. Meera Nair', initials: 'MN', portrait: '👩‍⚕️', qualification: 'BAMS', experience: '6 yrs experience', specialty: 'Ayurveda', fee: 500, rating: '4.6', about: 'Ayurveda physician focused on nutrition, women’s wellness, and sustainable daily routines.' },
];

function DoctorFlow({ session, onExit }: { session: Session | null; onExit: () => void }) {
  const [stage, setStage] = useState<'list' | 'profile' | 'schedule' | 'confirmed'>('list');
  const [doctor, setDoctor] = useState(doctors[0]);
  const [day, setDay] = useState(12);
  const [time, setTime] = useState('10:00 AM');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  function selectDoctor(nextDoctor: Doctor) { setDoctor(nextDoctor); setStage('profile'); }
  async function confirmAppointment() {
    if (!session?.user.id) return setSaveError('Please sign in again before booking your appointment.');
    setSaving(true); setSaveError('');
    const appointmentDate = `2026-06-${String(day).padStart(2, '0')}`;
    const { error } = await supabase.from('appointments').insert({ user_id: session.user.id, doctor_name: doctor.name, doctor_initials: doctor.initials, appointment_date: appointmentDate, appointment_time: time, consultation_type: 'Video Consultation' });
    setSaving(false);
    if (error) return setSaveError(error.message);
    setStage('confirmed');
  }
  if (stage === 'confirmed') return <SafeAreaView style={styles.doctorSafe}><StatusBar style="dark" /><View style={styles.confirmedPage}><View style={styles.appointmentCheck}><Text style={styles.appointmentCheckText}>✓</Text></View><Text style={[styles.doctorTitle, styles.confirmedTitle]}>Appointment Confirmed!</Text><Text style={styles.confirmedDoctor}>{doctor.name}</Text><Text style={styles.confirmedDetail}>◷  {day} Jun 2026 · {time}</Text><Text style={styles.confirmedDetail}>◉  Video Consultation</Text><Text style={styles.confirmedNote}>We have saved your appointment details.</Text><View style={styles.confirmedButton}><PrimaryButton label="Go to My Appointments" onPress={onExit} /></View></View></SafeAreaView>;
  if (stage === 'schedule') return <SafeAreaView style={styles.doctorSafe}><StatusBar style="dark" /><View style={styles.doctorPage}><BackButton onPress={() => setStage('profile')} /><Text style={styles.doctorTitle}>Select Date & Time</Text><View style={styles.monthRow}><Text style={styles.monthArrow}>‹</Text><Text style={styles.monthTitle}>June 2026</Text><Text style={styles.monthArrow}>›</Text></View><View style={styles.calendarGrid}>{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(label => <Text key={label} style={styles.weekday}>{label}</Text>)}{Array.from({ length: 30 }, (_, i) => i + 1).map(value => <Pressable key={value} onPress={() => setDay(value)} style={[styles.calendarDay, day === value && styles.calendarDaySelected]}><Text style={[styles.calendarDayText, day === value && styles.calendarDayTextSelected]}>{value}</Text></Pressable>)}</View><Text style={styles.slotsTitle}>Available Slots · {day} Jun</Text><View style={styles.slotGrid}>{['10:00 AM','11:00 AM','04:00 PM','05:00 PM'].map(value => <Pressable key={value} onPress={() => setTime(value)} style={[styles.slot, time === value && styles.slotSelected]}><Text style={[styles.slotText, time === value && styles.slotTextSelected]}>{value}</Text></Pressable>)}</View>{saveError ? <Text style={styles.error}>{saveError}</Text> : null}<View style={styles.doctorBottomButton}><PrimaryButton label="Confirm Appointment" loading={saving} onPress={confirmAppointment} /></View></View></SafeAreaView>;
  if (stage === 'profile') return <SafeAreaView style={styles.doctorSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.doctorPage}><BackButton onPress={() => setStage('list')} /><DoctorCard doctor={doctor} /><Text style={styles.doctorSectionTitle}>About</Text><Text style={styles.doctorAbout}>{doctor.about}</Text><Text style={styles.doctorSectionTitle}>Consultation Fee</Text><Text style={styles.doctorFee}>₹{doctor.fee}</Text><View style={styles.doctorBottomButton}><PrimaryButton label="Book Appointment" onPress={() => setStage('schedule')} /></View></ScrollView></SafeAreaView>;
  return <SafeAreaView style={styles.doctorSafe}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.doctorListPage}><BackButton onPress={onExit} /><Text style={styles.doctorTitle}>Talk to a Doctor</Text><Text style={styles.doctorSubtitle}>Connect with experienced Ayurveda doctors</Text><View style={styles.doctorCards}>{doctors.map(item => <Pressable key={item.name} onPress={() => selectDoctor(item)} style={({ pressed }) => pressed && styles.pressed}><DoctorCard doctor={item} compact /></Pressable>)}</View><PrimaryButton label="View All Doctors" onPress={() => selectDoctor(doctors[0])} /></ScrollView></SafeAreaView>;
}

function DoctorCard({ doctor, compact = false }: { doctor: Doctor; compact?: boolean }) { return <View style={[styles.doctorCard, !compact && styles.doctorCardLarge]}><View style={styles.doctorAvatar}><Text style={styles.doctorPortrait}>{doctor.portrait}</Text></View><View style={styles.doctorInfo}><Text style={styles.doctorName}>{doctor.name}</Text><Text style={styles.doctorMeta}>{doctor.qualification}</Text><Text style={styles.doctorMeta}>{doctor.experience} · {doctor.specialty}</Text>{compact ? <Text style={styles.doctorPrice}>₹{doctor.fee}</Text> : <Text style={styles.doctorMeta}>Ayurveda Specialist</Text>}</View>{compact ? <View style={styles.rating}><Text style={styles.ratingStar}>★</Text><Text style={styles.ratingText}>{doctor.rating}</Text></View> : null}</View>; }

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
function AssessmentItem({ number, title, copy, completed = false, onPress }: { number: string; title: string; copy: string; completed?: boolean; onPress?: () => void }) { const content = <><View style={[styles.numberBadge, completed && styles.completedBadge]}><Text style={styles.numberText}>{number}</Text></View><View style={styles.assessmentText}><Text style={styles.assessmentItemTitle}>{title}</Text><Text style={styles.assessmentCopy}>{copy}</Text></View></>; return onPress ? <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.assessmentItem, pressed && styles.pressed]}>{content}</Pressable> : <View style={styles.assessmentItem}>{content}</View>; }
function MiniDoshaDonut({ percentages }: { percentages: Record<Dosha, number> }) { const colors = ['#2879B9', '#EEA62A', '#5B9B54']; return <View style={styles.miniDonut}>{Array.from({ length: 100 }, (_, index) => { const color = index < percentages.vata ? colors[0] : index < percentages.vata + percentages.pitta ? colors[1] : colors[2]; return <View key={index} style={[styles.miniDonutSegment, { backgroundColor: color, transform: [{ rotate: `${index * 3.6}deg` }, { translateY: -44 }] }]} />; })}<View style={styles.miniDonutCenter}><Text style={styles.miniDonutLabel}>Prakriti</Text></View></View>; }
function FeatureTile({ icon, label }: { icon: string; label: string }) { return <Pressable accessibilityLabel={label} onPress={() => {}} style={({ pressed }) => [styles.featureTile, pressed && styles.pressed]}><Text style={styles.featureIcon}>{icon}</Text><Text style={styles.featureLabel}>{label}</Text></Pressable>; }
function PlanTile({ icon, title, detail }: { icon: string; title: string; detail: string }) { return <View style={styles.planTile}><View style={styles.planTitleRow}><Text style={styles.planIcon}>{icon}</Text><Text style={styles.planTitle}>{title}</Text></View><Text style={styles.planDetail}>{detail}</Text></View>; }
function NavItem({ icon, label, active = false, onPress }: { icon: string; label: string; active?: boolean; onPress?: () => void }) { return <Pressable accessibilityLabel={label} onPress={onPress} style={styles.navItem}><Text style={[styles.navIcon, active && styles.navActive]}>{icon}</Text><Text style={[styles.navLabel, active && styles.navActive]}>{label}</Text>{active ? <View style={styles.navIndicator} /> : null}</Pressable>; }
function formatAppointmentDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Date(year, month - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
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
  resultPage: { flexGrow: 1, paddingBottom: 30, paddingHorizontal: 25, paddingTop: 40 }, resultEyebrow: { color: '#B08A3D', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, textAlign: 'center' }, resultTitle: { color: '#075A3F', fontFamily: serif, fontSize: 33, fontWeight: '700', marginTop: 8, textAlign: 'center' }, resultDominant: { color: '#34443C', fontSize: 16, fontWeight: '700', marginTop: 7, textAlign: 'center' }, chartRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'center', marginVertical: 35 }, doshaChart: { height: 160, position: 'relative', width: 160 }, chartSegment: { borderRadius: 3, height: 18, left: 77.5, position: 'absolute', top: 71, width: 5 }, chartCenter: { alignItems: 'center', backgroundColor: '#FBF8EF', borderColor: '#EEE7D8', borderRadius: 49, borderWidth: 1, height: 98, justifyContent: 'center', left: 31, position: 'absolute', top: 31, width: 98 }, chartCenterLabel: { color: '#59645E', fontSize: 12 }, chartCenterValue: { color: '#24312B', fontFamily: serif, fontSize: 24, fontWeight: '700', marginTop: 2 }, legend: { gap: 14, marginLeft: 26 }, legendItem: { alignItems: 'center', flexDirection: 'row', minWidth: 100 }, legendDot: { borderRadius: 5, height: 10, marginRight: 8, width: 10 }, legendName: { color: '#3E4943', flex: 1, fontSize: 13, fontWeight: '600' }, legendValue: { color: '#252E29', fontSize: 13, fontWeight: '800', marginLeft: 8 }, resultMeaning: { backgroundColor: '#FFFDF7', borderColor: '#E7E0CE', borderRadius: 17, borderWidth: 1, marginBottom: 28, padding: 19 }, resultSectionTitle: { color: '#29352F', fontFamily: serif, fontSize: 17, fontWeight: '700', marginBottom: 8, marginTop: 7 }, resultBody: { color: '#606963', fontSize: 13, lineHeight: 20, marginBottom: 16 }, tendency: { color: '#606963', fontSize: 13, lineHeight: 20, marginBottom: 5 },
  healthIntroPage: { flex: 1, paddingBottom: 28, paddingHorizontal: 24, paddingTop: 18 }, healthIntroContent: { flex: 1, justifyContent: 'center', paddingBottom: 22 }, meditationArt: { alignSelf: 'center', height: 190, marginTop: 25, position: 'relative', width: 250 }, meditationHalo: { backgroundColor: '#EDF2DD', borderRadius: 70, height: 140, left: 55, position: 'absolute', top: 24, width: 140 }, meditationHead: { backgroundColor: '#B87544', borderRadius: 16, height: 31, left: 109, position: 'absolute', top: 28, width: 31 }, meditationBody: { backgroundColor: '#52704B', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: 75, left: 91, position: 'absolute', top: 56, width: 67 }, meditationArms: { backgroundColor: '#B87544', borderRadius: 8, height: 13, left: 57, position: 'absolute', top: 92, transform: [{ rotate: '-4deg' }], width: 137 }, meditationLegs: { backgroundColor: '#465D3F', borderRadius: 30, height: 37, left: 43, position: 'absolute', top: 125, width: 164 }, meditationLeaf: { backgroundColor: '#83A86B', borderBottomLeftRadius: 24, borderTopRightRadius: 24, height: 74, position: 'absolute', top: 82, width: 35 }, meditationLeafLeft: { left: 25, transform: [{ rotate: '-35deg' }] }, meditationLeafRight: { right: 25, transform: [{ rotate: '35deg' }] }, healthQuestion: { color: '#26312B', fontFamily: serif, fontSize: 23, fontWeight: '700', lineHeight: 31, marginTop: 30 }, selectAllHint: { color: '#68716C', fontSize: 12, marginBottom: 18, marginTop: 6 }, symptomList: { gap: 10 }, symptomOption: { alignItems: 'center', backgroundColor: '#FFFEFA', borderColor: '#DEDED4', borderRadius: 10, borderWidth: 1, flexDirection: 'row', minHeight: 49, paddingHorizontal: 13 }, symptomOptionSelected: { backgroundColor: '#F3F8F4', borderColor: '#A9C4B6' }, symptomCheckbox: { alignItems: 'center', borderColor: '#C5C8C2', borderRadius: 4, borderWidth: 1.2, height: 21, justifyContent: 'center', marginRight: 12, width: 21 }, symptomCheckboxSelected: { backgroundColor: '#075A3F', borderColor: '#075A3F' }, symptomCheck: { color: '#FFF', fontSize: 13, fontWeight: '800' }, symptomLabel: { color: '#3E4742', fontSize: 14, fontWeight: '500' },
  healthSummaryPage: { flex: 1, paddingBottom: 28, paddingHorizontal: 24, paddingTop: 24 }, summaryContent: { flex: 1, justifyContent: 'center', paddingBottom: 45 }, healthSummaryTitle: { color: '#26312B', fontFamily: serif, fontSize: 28, fontWeight: '700', lineHeight: 36, textAlign: 'center' }, summaryCard: { backgroundColor: '#FFFDF7', borderColor: '#E3DED0', borderRadius: 16, borderWidth: 1, marginTop: 34, overflow: 'hidden' }, summaryRow: { borderBottomColor: '#E7E3D9', borderBottomWidth: 1, paddingHorizontal: 18, paddingVertical: 16 }, summaryRowLast: { borderBottomWidth: 0 }, summaryLabel: { color: '#747B76', fontSize: 11, fontWeight: '700', marginBottom: 5, textTransform: 'uppercase' }, summaryValue: { color: '#303A34', fontSize: 14, fontWeight: '600', lineHeight: 20 }, healthReadyPage: { flex: 1, paddingBottom: 28, paddingHorizontal: 24, paddingTop: 24 }, healthReadyContent: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingBottom: 40 }, readyIcon: { alignItems: 'center', backgroundColor: '#E5F2E7', borderRadius: 30, height: 60, justifyContent: 'center', marginBottom: 23, width: 60 }, readyIconCheck: { color: '#3E9A50', fontSize: 30, fontWeight: '800' }, readyCopy: { color: '#68716C', fontSize: 14, lineHeight: 21, marginTop: 16, maxWidth: 275, textAlign: 'center' }, readyChecklist: { alignSelf: 'stretch', gap: 18, marginHorizontal: 28, marginTop: 38 }, readyItem: { alignItems: 'center', flexDirection: 'row', gap: 13 }, readyCheck: { alignItems: 'center', backgroundColor: '#4CA65A', borderRadius: 11, height: 22, justifyContent: 'center', width: 22 }, readyCheckText: { color: '#FFF', fontSize: 13, fontWeight: '800' }, readyLabel: { color: '#35413A', fontSize: 14, fontWeight: '600' }, readyFooter: { color: '#5F6963', fontSize: 13, lineHeight: 20, marginTop: 42, textAlign: 'center' },
  homeSafe: { backgroundColor: '#004735', flex: 1 }, homeScroll: { backgroundColor: '#FBF8EF', flexGrow: 1, paddingBottom: 112 }, homeHeader: { alignItems: 'center', backgroundColor: '#004735', flexDirection: 'row', justifyContent: 'space-between', minHeight: 198, paddingBottom: 60, paddingHorizontal: 25, paddingTop: 29 }, greeting: { color: '#D9E7DF', fontSize: 19, fontWeight: '500', lineHeight: 25 }, greetingName: { color: '#FFF', fontFamily: serif, fontSize: 40, fontWeight: '700', lineHeight: 47, marginTop: 2 }, bell: { alignItems: 'center', borderColor: '#C7DED3', borderRadius: 22, borderWidth: 1.2, height: 44, justifyContent: 'center', width: 44 }, bellIcon: { color: '#FFF', fontSize: 26, transform: [{ rotate: '180deg' }] }, notificationDot: { backgroundColor: '#E5B54D', borderRadius: 4, height: 8, position: 'absolute', right: 4, top: 3, width: 8 }, dashboardBody: { paddingHorizontal: 18 }, assessmentCard: { backgroundColor: '#FFFDF7', borderColor: '#E7E0CE', borderRadius: 21, borderWidth: 1, elevation: 4, gap: 22, marginTop: -44, padding: 23, shadowColor: '#17352E', shadowOffset: { width: 0, height: 7 }, shadowOpacity: .1, shadowRadius: 14 }, assessmentTitle: { color: '#28332D', fontFamily: serif, fontSize: 21, fontWeight: '700', lineHeight: 29 }, assessmentItem: { alignItems: 'flex-start', flexDirection: 'row', gap: 15 }, numberBadge: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 16, height: 32, justifyContent: 'center', marginTop: 2, width: 32 }, completedBadge: { backgroundColor: '#3E8A52' }, numberText: { color: '#FFF', fontSize: 15, fontWeight: '800' }, assessmentText: { flex: 1 }, assessmentItemTitle: { color: '#303A34', fontSize: 16, fontWeight: '700' }, assessmentCopy: { color: '#737B75', fontSize: 14, lineHeight: 20, marginTop: 4 }, startButton: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 11, justifyContent: 'center', minHeight: 51 }, startButtonText: { color: '#FFF', fontSize: 15, fontWeight: '700', textAlign: 'center' }, exploreTitle: { color: '#28332D', fontFamily: serif, fontSize: 22, fontWeight: '700', marginBottom: 17, marginTop: 29 }, featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, featureTile: { alignItems: 'center', backgroundColor: '#FFF6E6', borderColor: '#F3E7D1', borderRadius: 16, borderWidth: 1, height: 108, justifyContent: 'center', width: '30.5%' }, featureIcon: { fontSize: 31 }, featureLabel: { color: '#3D4640', fontSize: 12, fontWeight: '700', marginTop: 10, textAlign: 'center' }, bottomNav: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#E8E3D8', borderTopWidth: 1, bottom: 0, flexDirection: 'row', height: 86, justifyContent: 'space-around', left: 0, paddingBottom: 8, position: 'absolute', right: 0 }, navItem: { alignItems: 'center', flex: 1, justifyContent: 'center' }, navIcon: { color: '#818A84', fontSize: 27, fontWeight: '700' }, navLabel: { color: '#818A84', fontSize: 11, marginTop: 4 }, navActive: { color: '#075A3F', fontWeight: '800' }, navIndicator: { backgroundColor: '#075A3F', borderRadius: 2, height: 3, marginTop: 5, width: 20 },
  insightCard: { alignItems: 'center', backgroundColor: '#FFFDF7', borderColor: '#E7E0CE', borderRadius: 21, borderWidth: 1, elevation: 4, flexDirection: 'row', marginTop: -44, minHeight: 210, paddingHorizontal: 18, paddingVertical: 22, shadowColor: '#17352E', shadowOffset: { width: 0, height: 7 }, shadowOpacity: .1, shadowRadius: 14 }, miniDonut: { height: 118, marginRight: 17, position: 'relative', width: 118 }, miniDonutSegment: { borderRadius: 2, height: 14, left: 57, position: 'absolute', top: 52, width: 4 }, miniDonutCenter: { alignItems: 'center', backgroundColor: '#FFFDF7', borderColor: '#EEE5D5', borderRadius: 35, borderWidth: 1, height: 70, justifyContent: 'center', left: 24, position: 'absolute', top: 24, width: 70 }, miniDonutLabel: { color: '#435149', fontFamily: serif, fontSize: 12, fontWeight: '700' }, insightContent: { flex: 1 }, insightEyebrow: { color: '#B08A3D', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 }, insightTitle: { color: '#26342D', fontFamily: serif, fontSize: 18, fontWeight: '700', lineHeight: 24, marginTop: 6 }, insightCopy: { color: '#727A74', fontSize: 11, lineHeight: 16, marginTop: 7 }, insightActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 14 }, insightLink: { color: '#075A3F', fontSize: 11, fontWeight: '800' },
  planHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, viewAll: { color: '#7C837E', fontSize: 13, fontWeight: '600', marginTop: 12 }, planGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, planTile: { backgroundColor: '#FFFDF7', borderColor: '#E6E0D3', borderRadius: 15, borderWidth: 1, minHeight: 116, padding: 15, width: '48%' }, planTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 9 }, planIcon: { fontSize: 22 }, planTitle: { color: '#303A34', fontFamily: serif, fontSize: 17, fontWeight: '700' }, planDetail: { color: '#626B65', fontSize: 13, lineHeight: 19, marginTop: 12 },
  shopSafe: { backgroundColor: '#FBF8EF', flex: 1 }, shopPage: { flex: 1, paddingBottom: 24, paddingHorizontal: 20, paddingTop: 16 }, shopHomeScroll: { paddingBottom: 110, paddingHorizontal: 18, paddingTop: 18 }, shopTopRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, shopBackText: { color: '#26352F', fontSize: 32, lineHeight: 36, width: 36 }, shopTopSpacer: { width: 36 }, shopTitle: { color: '#26312B', fontFamily: serif, fontSize: 27, fontWeight: '700' }, shopSearch: { alignItems: 'center', backgroundColor: '#FFF', borderColor: '#E5E1D8', borderRadius: 12, borderWidth: 1, flexDirection: 'row', marginTop: 24, minHeight: 50, paddingHorizontal: 14 }, shopSearchIcon: { color: '#7B837E', fontSize: 22, marginRight: 9 }, shopSearchText: { color: '#969C98', fontSize: 14 }, shopSectionTitle: { color: '#303A34', fontFamily: serif, fontSize: 19, fontWeight: '700', marginBottom: 15, marginTop: 27 }, categoryRow: { flexDirection: 'row', justifyContent: 'space-between' }, categoryItem: { alignItems: 'center', width: '24%' }, categoryIcon: { alignItems: 'center', backgroundColor: '#F6EEDC', borderRadius: 15, height: 58, justifyContent: 'center', width: 58 }, categoryEmoji: { fontSize: 28 }, categoryLabel: { color: '#56605A', fontSize: 10, fontWeight: '600', lineHeight: 14, marginTop: 7, textAlign: 'center' }, productGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 }, productCard: { backgroundColor: '#FFFDF8', borderColor: '#E6E1D6', borderRadius: 16, borderWidth: 1, padding: 13, width: '48%' }, productVisual: { alignItems: 'center', alignSelf: 'center', backgroundColor: '#E9EFE5', borderColor: '#CAD8C6', borderRadius: 15, borderWidth: 1, height: 125, justifyContent: 'center', marginBottom: 13, position: 'relative', width: 125 }, productVisualSmall: { borderRadius: 10, height: 64, marginBottom: 0, marginRight: 12, width: 64 }, productVisualIcon: { fontSize: 58 }, productVisualIconSmall: { fontSize: 31 }, productBottleLabel: { backgroundColor: '#FFFDF4', borderColor: '#B5C5B0', borderRadius: 3, borderWidth: 1, bottom: 13, paddingHorizontal: 6, paddingVertical: 2, position: 'absolute' }, productBottleText: { color: '#356247', fontSize: 7, fontWeight: '900', letterSpacing: .7 }, productName: { color: '#2D3731', fontFamily: serif, fontSize: 16, fontWeight: '700' }, productWeight: { color: '#7A817D', fontSize: 11, marginTop: 4 }, productPrice: { color: '#075A3F', fontSize: 16, fontWeight: '800', marginTop: 10 }, quickAdd: { alignItems: 'center', borderColor: '#075A3F', borderRadius: 8, borderWidth: 1, marginTop: 11, paddingVertical: 7 }, quickAddText: { color: '#075A3F', fontSize: 12, fontWeight: '800' }, floatingCart: { alignItems: 'center', backgroundColor: '#075A3F', borderRadius: 30, bottom: 24, elevation: 7, height: 60, justifyContent: 'center', position: 'absolute', right: 22, shadowColor: '#002E21', shadowOffset: { width: 0, height: 5 }, shadowOpacity: .24, shadowRadius: 9, width: 60 }, floatingCartIcon: { fontSize: 27 }, cartBadge: { alignItems: 'center', backgroundColor: '#DCA83C', borderColor: '#FFF', borderRadius: 10, borderWidth: 1.5, height: 21, justifyContent: 'center', position: 'absolute', right: -2, top: -3, minWidth: 21 }, cartBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '900' }, productDetailPage: { flexGrow: 1, paddingBottom: 105, paddingHorizontal: 22, paddingTop: 16 }, productDetailHero: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 }, productDetailCopy: { flex: 1, paddingRight: 12 }, productDetailName: { color: '#26312B', fontFamily: serif, fontSize: 25, fontWeight: '700' }, productDetailPrice: { color: '#26312B', fontSize: 27, fontWeight: '800', marginTop: 17 }, productMrp: { color: '#CE5252', fontSize: 12, fontWeight: '700', marginTop: 5, textDecorationLine: 'line-through' }, ratingLine: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 16 }, productDescription: { color: '#5E6862', fontSize: 14, lineHeight: 22, marginTop: 25 }, productAction: { marginTop: 'auto', paddingTop: 40 }, cartList: { gap: 13, paddingBottom: 20, paddingTop: 24 }, cartItem: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#E6E1D6', borderRadius: 15, borderWidth: 1, flexDirection: 'row', padding: 12 }, cartItemInfo: { flex: 1 }, cartItemName: { color: '#2E3832', fontFamily: serif, fontSize: 16, fontWeight: '700' }, cartItemPrice: { color: '#075A3F', fontSize: 14, fontWeight: '800', marginTop: 7 }, quantityControl: { alignItems: 'center', flexDirection: 'row', gap: 9 }, quantityButton: { alignItems: 'center', backgroundColor: '#EDF3EC', borderColor: '#CFDCCF', borderRadius: 14, borderWidth: 1, height: 29, justifyContent: 'center', width: 29 }, quantityButtonText: { color: '#075A3F', fontSize: 19, fontWeight: '700', lineHeight: 21 }, quantityValue: { color: '#303A34', fontSize: 14, fontWeight: '800', minWidth: 18, textAlign: 'center' }, cartFooter: { borderTopColor: '#E4E0D7', borderTopWidth: 1, paddingTop: 18 }, cartTotalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 17 }, cartTotalLabel: { color: '#505A54', fontSize: 16, fontWeight: '700' }, cartTotalValue: { color: '#26312B', fontSize: 19, fontWeight: '800' }, emptyCart: { flex: 1, gap: 10, justifyContent: 'center' }, emptyCartIcon: { fontSize: 55, textAlign: 'center' }, emptyCartTitle: { color: '#26312B', fontFamily: serif, fontSize: 24, fontWeight: '700', textAlign: 'center' }, emptyCartCopy: { color: '#737B76', fontSize: 14, marginBottom: 22, textAlign: 'center' }, orderSuccessPage: { alignItems: 'center', backgroundColor: '#FBF8EF', flex: 1, justifyContent: 'center', paddingHorizontal: 30 }, orderSuccessCheck: { alignItems: 'center', backgroundColor: '#4FAA5B', borderRadius: 42, height: 84, justifyContent: 'center', marginBottom: 27, width: 84 }, orderSuccessCheckText: { color: '#FFF', fontSize: 45, fontWeight: '800' }, orderSuccessTitle: { color: '#26312B', fontFamily: serif, fontSize: 28, fontWeight: '700', lineHeight: 36, textAlign: 'center' }, orderSuccessCopy: { color: '#67716B', fontSize: 14, lineHeight: 22, marginTop: 17, maxWidth: 310, textAlign: 'center' }, orderSuccessTap: { color: '#075A3F', fontSize: 12, fontWeight: '700', marginTop: 42 },
  appointmentCard: { alignItems: 'center', backgroundColor: '#EFF6F0', borderColor: '#CFE0D3', borderRadius: 18, borderWidth: 1, flexDirection: 'row', marginTop: 17, padding: 15 }, appointmentPortrait: { alignItems: 'center', backgroundColor: '#D9EADB', borderColor: '#B9D2BE', borderRadius: 34, borderWidth: 1, height: 68, justifyContent: 'center', marginRight: 14, overflow: 'hidden', width: 68 }, appointmentPortraitIcon: { fontSize: 39 }, appointmentHomeContent: { flex: 1 }, appointmentEyebrow: { color: '#3C795A', fontSize: 9, fontWeight: '800', letterSpacing: 1.1, marginBottom: 6 }, appointmentHomeText: { color: '#2D3A33', fontSize: 14, fontWeight: '600', lineHeight: 21 },
  doctorSafe: { backgroundColor: '#FBF8EF', flex: 1 }, doctorListPage: { flexGrow: 1, paddingBottom: 30, paddingHorizontal: 22, paddingTop: 16 }, doctorPage: { flexGrow: 1, paddingBottom: 28, paddingHorizontal: 22, paddingTop: 16 }, doctorTitle: { color: '#202A24', fontFamily: serif, fontSize: 29, fontWeight: '700', lineHeight: 36 }, doctorSubtitle: { color: '#6B736E', fontSize: 16, lineHeight: 23, marginBottom: 25, marginTop: 7 }, doctorCards: { gap: 13, marginBottom: 22 }, doctorCard: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#E5E0D5', borderRadius: 16, borderWidth: 1, elevation: 1, flexDirection: 'row', minHeight: 125, padding: 14, shadowColor: '#34453E', shadowOffset: { width: 0, height: 3 }, shadowOpacity: .06, shadowRadius: 8 }, doctorCardLarge: { marginBottom: 34, marginTop: 18, minHeight: 150 }, doctorAvatar: { alignItems: 'center', backgroundColor: '#DFEADF', borderColor: '#C5D5C7', borderRadius: 32, borderWidth: 1, height: 64, justifyContent: 'center', marginRight: 13, overflow: 'hidden', width: 64 }, doctorPortrait: { fontSize: 39 }, doctorInfo: { flex: 1 }, doctorName: { color: '#26312B', fontFamily: serif, fontSize: 17, fontWeight: '700', marginBottom: 5 }, doctorMeta: { color: '#6F7771', fontSize: 12, lineHeight: 18 }, doctorPrice: { color: '#303A34', fontSize: 14, fontWeight: '700', marginTop: 4 }, rating: { alignItems: 'center', alignSelf: 'flex-start', flexDirection: 'row', gap: 3, marginLeft: 5 }, ratingStar: { color: '#D69E22', fontSize: 15 }, ratingText: { color: '#505954', fontSize: 12, fontWeight: '700' }, doctorSectionTitle: { color: '#303A34', fontFamily: serif, fontSize: 18, fontWeight: '700', marginBottom: 9, marginTop: 9 }, doctorAbout: { color: '#66706A', fontSize: 14, lineHeight: 22, marginBottom: 20 }, doctorFee: { color: '#075A3F', fontSize: 25, fontWeight: '800' }, doctorBottomButton: { marginTop: 'auto', paddingTop: 35 }, monthRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18, marginTop: 26, paddingHorizontal: 7 }, monthTitle: { color: '#303A34', fontSize: 16, fontWeight: '700' }, monthArrow: { color: '#075A3F', fontSize: 27 }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, weekday: { color: '#777E79', fontSize: 11, fontWeight: '700', marginBottom: 9, textAlign: 'center', width: '14.285%' }, calendarDay: { alignItems: 'center', height: 43, justifyContent: 'center', width: '14.285%' }, calendarDaySelected: { alignSelf: 'center', backgroundColor: '#075A3F', borderRadius: 19 }, calendarDayText: { color: '#3E4742', fontSize: 13 }, calendarDayTextSelected: { color: '#FFF', fontWeight: '800' }, slotsTitle: { color: '#3A443E', fontSize: 14, fontWeight: '700', marginBottom: 14, marginTop: 28 }, slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, slot: { alignItems: 'center', backgroundColor: '#FFFDF8', borderColor: '#DADCD5', borderRadius: 9, borderWidth: 1, minWidth: '30%', paddingHorizontal: 14, paddingVertical: 11 }, slotSelected: { backgroundColor: '#E8F2EA', borderColor: '#075A3F' }, slotText: { color: '#505954', fontSize: 12, fontWeight: '600' }, slotTextSelected: { color: '#075A3F', fontWeight: '800' }, confirmedPage: { alignItems: 'center', flex: 1, justifyContent: 'center', paddingHorizontal: 24 }, confirmedTitle: { textAlign: 'center' }, appointmentCheck: { alignItems: 'center', backgroundColor: '#4FAA5B', borderRadius: 37, height: 74, justifyContent: 'center', marginBottom: 28, width: 74 }, appointmentCheckText: { color: '#FFF', fontSize: 39, fontWeight: '800' }, confirmedDoctor: { color: '#303A34', fontFamily: serif, fontSize: 18, fontWeight: '700', marginBottom: 15, marginTop: 27 }, confirmedDetail: { color: '#59635D', fontSize: 14, marginTop: 9 }, confirmedNote: { color: '#777F7A', fontSize: 13, lineHeight: 20, marginTop: 30, textAlign: 'center' }, confirmedButton: { marginTop: 34, width: '100%' },
});
