import { createContext, useContext, useEffect, useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {
  createBlankAnswers,
  hasAnyAnswer,
  QUIZ_SCHEMA_VERSION,
} from '../features/quiz/quizModel';
import {
  loadQuizState,
  removeQuizDraft,
  saveQuizDraft,
  saveStyleProfile,
} from '../features/quiz/quizStorage';
import {
  loadAvatarCustomization,
  saveAvatarCustomization,
} from '../features/avatar/avatarStorage';
import { DEFAULT_AVATAR_CUSTOMIZATION } from '../features/avatar/avatarModel';
import {
  createEmptyWardrobeState,
} from '../features/wardrobe/wardrobeModel';
import {
  loadWardrobeState,
  saveWardrobeState,
} from '../features/wardrobe/wardrobeStorage';
import KnowYouQuizScreen from '../screens/KnowYouQuizScreen';
import AvatarStudioScreen from '../screens/AvatarStudioScreen';
import SuggestScreen from '../screens/SuggestScreen';
import WardrobeScreen from '../screens/WardrobeScreen';

function AppLoadingScreen() {
  return (
    <SafeAreaView style={loadingStyles.safeArea}>
      <View style={loadingStyles.content}>
        <ActivityIndicator color="#7040B8" />
        <Text style={loadingStyles.label}>Opening your style space…</Text>
      </View>
    </SafeAreaView>
  );
}

const loadingStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FCFBF9' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  label: { color: '#666666', fontSize: 13 },
});

const FitCheckContext = createContext(null);
export const useFitCheck = () => useContext(FitCheckContext);
const setScreen = (screen) => router.navigate(screen === 'suggest' ? '/' : `/${screen}`);

export function FitCheckProvider({ children }) {
  const [quizSession, setQuizSession] = useState(0);
  const [draft, setDraft] = useState(null);
  const [profile, setProfile] = useState(null);
  const [storageError, setStorageError] = useState('');
  const [storageReady, setStorageReady] = useState(false);
  const [wardrobeState, setWardrobeState] = useState(createEmptyWardrobeState);
  const [wardrobeError, setWardrobeError] = useState('');
  const [wardrobeReady, setWardrobeReady] = useState(false);
  const [avatarCustomization, setAvatarCustomization] = useState(DEFAULT_AVATAR_CUSTOMIZATION);
  const [avatarError, setAvatarError] = useState('');
  const [avatarReady, setAvatarReady] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadAttempt, setLoadAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    Promise.allSettled([loadQuizState(), loadWardrobeState(), loadAvatarCustomization()])
      .then(([quizResult, wardrobeResult, avatarResult]) => {
        if (!active) return;
        if (quizResult.status === 'fulfilled') {
          setDraft(quizResult.value.draft);
          setProfile(quizResult.value.profile);
          setStorageError('');
          setStorageReady(true);
        } else {
          setStorageError(`Saved quiz data could not be loaded: ${quizResult.reason.message}`);
          setStorageReady(false);
        }
        if (wardrobeResult.status === 'fulfilled') {
          setWardrobeState(wardrobeResult.value.state);
          setWardrobeError(wardrobeResult.value.cleanupWarning);
          setWardrobeReady(true);
        } else {
          setWardrobeError(`Saved wardrobe data could not be loaded: ${wardrobeResult.reason.message}`);
          setWardrobeReady(false);
        }
        if (avatarResult.status === 'fulfilled') {
          setAvatarCustomization(avatarResult.value);
          setAvatarError('');
          setAvatarReady(true);
        } else {
          setAvatarError(`Saved avatar settings could not be loaded: ${avatarResult.reason.message}`);
          setAvatarReady(false);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadAttempt]);

  async function persistDraft(nextDraft) {
    setDraft(nextDraft);
    try {
      await saveQuizDraft(nextDraft);
      setStorageError('');
    } catch (error) {
      setStorageError(`Quiz progress could not be saved: ${error.message}`);
    }
  }

  function openQuiz() {
    if (!storageReady) return;
    const nextDraft = draft || {
      schemaVersion: QUIZ_SCHEMA_VERSION,
      answers: profile
        ? JSON.parse(JSON.stringify(profile.answers))
        : createBlankAnswers(),
      currentQuestion: 0,
      updatedAt: new Date().toISOString(),
    };
    setDraft(nextDraft);
    setQuizSession((value) => value + 1);
    setScreen('quiz');
    persistDraft(nextDraft);
  }

  async function exitQuiz(nextDraft) {
    if (hasAnyAnswer(nextDraft.answers)) {
      await persistDraft(nextDraft);
    } else {
      try {
        await removeQuizDraft();
        setDraft(null);
        setStorageError('');
      } catch (error) {
        setStorageError(`The empty quiz draft could not be cleared: ${error.message}`);
      }
    }
    setScreen('suggest');
  }

  async function commitProfile(nextProfile) {
    try {
      await saveStyleProfile(nextProfile);
      await removeQuizDraft();
      setProfile(nextProfile);
      setDraft(null);
      setQuizSession((value) => value + 1);
      setStorageError('');
      setScreen('suggest');
    } catch (error) {
      setStorageError(`Your style profile could not be saved: ${error.message}`);
      throw error;
    }
  }

  async function cancelProfileEdit() {
    try {
      await removeQuizDraft();
      setDraft(null);
      setQuizSession((value) => value + 1);
      setStorageError('');
      setScreen('suggest');
    } catch (error) {
      setStorageError(`Profile changes could not be discarded: ${error.message}`);
    }
  }

  async function persistWardrobe(nextState) {
    try {
      await saveWardrobeState(nextState);
      setWardrobeState(nextState);
      setWardrobeError('');
    } catch (error) {
      setWardrobeError(`Wardrobe changes could not be saved: ${error.message}`);
      throw error;
    }
  }

  async function persistAvatarCustomization(nextCustomization) {
    try {
      await saveAvatarCustomization(nextCustomization);
      setAvatarCustomization(nextCustomization);
      setAvatarError('');
    } catch (error) {
      setAvatarError(`Avatar changes could not be saved: ${error.message}`);
      throw error;
    }
  }

  return <FitCheckContext.Provider value={{ draft, profile, storageError, storageReady, wardrobeState, wardrobeError, wardrobeReady, avatarCustomization, avatarError, avatarReady, loading, quizSession, persistDraft, openQuiz, exitQuiz, commitProfile, cancelProfileEdit, persistWardrobe, persistAvatarCustomization, setLoading, setLoadAttempt }}>{children}</FitCheckContext.Provider>;
}

export function MainScreen({ screen }) {
  const { draft, profile, storageError, storageReady, wardrobeState, wardrobeError, wardrobeReady, avatarCustomization, avatarError, avatarReady, loading, quizSession, persistDraft, openQuiz, exitQuiz, commitProfile, cancelProfileEdit, persistWardrobe, persistAvatarCustomization, setLoading, setLoadAttempt } = useFitCheck();
  if (loading) {
    return <AppLoadingScreen />;
  }

  if (screen === 'wardrobe' && wardrobeReady) {
    return (
      <WardrobeScreen
        wardrobeState={wardrobeState}
        storageError={wardrobeError}
        onWardrobeChange={persistWardrobe}
        onClose={() => setScreen('suggest')}
      />
    );
  }

  if (screen === 'avatar' && avatarReady) {
    return (
      <AvatarStudioScreen
        customization={avatarCustomization}
        storageError={avatarError}
        onCustomizationChange={persistAvatarCustomization}
        onClose={() => setScreen('suggest')}
      />
    );
  }

  if (screen === 'quiz' && storageReady) {
    const initialDraft = draft || {
      schemaVersion: QUIZ_SCHEMA_VERSION,
      answers: profile?.answers || createBlankAnswers(),
      currentQuestion: 0,
      updatedAt: new Date().toISOString(),
    };
    return (
      <KnowYouQuizScreen
        key={quizSession}
        initialDraft={initialDraft}
        originalProfile={profile}
        storageError={storageError}
        onSaveDraft={persistDraft}
        onCommit={commitProfile}
        onExit={exitQuiz}
        onCancelEdit={cancelProfileEdit}
      />
    );
  }

  return (
    <SuggestScreen
      profile={profile}
      draft={draft}
      storageError={storageError || wardrobeError || avatarError}
      storageReady={storageReady}
      wardrobeReady={wardrobeReady}
      wardrobeState={wardrobeState}
      onOpenQuiz={openQuiz}
      onOpenWardrobe={() => {
        if (wardrobeReady) setScreen('wardrobe');
      }}
      avatarReady={avatarReady}
      avatarError={avatarError}
      onOpenAvatarStudio={() => {
        if (avatarReady) setScreen('avatar');
      }}
      onRetryStorage={() => { setLoading(true); setLoadAttempt((attempt) => attempt + 1); }}
    />
  );
}
