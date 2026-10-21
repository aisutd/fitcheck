import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import {
  createBlankAnswers,
  hasAnyAnswer,
  QUIZ_SCHEMA_VERSION,
} from './src/features/quiz/quizModel';
import {
  loadQuizState,
  removeQuizDraft,
  saveQuizDraft,
  saveStyleProfile,
} from './src/features/quiz/quizStorage';
import {
  loadAvatarCustomization,
  saveAvatarCustomization,
} from './src/features/avatar/avatarStorage';
import { DEFAULT_AVATAR_CUSTOMIZATION } from './src/features/avatar/avatarModel';
import {
  createEmptyWardrobeState,
} from './src/features/wardrobe/wardrobeModel';
import {
  loadWardrobeState,
  saveWardrobeState,
} from './src/features/wardrobe/wardrobeStorage';
import KnowYouQuizScreen from './src/screens/KnowYouQuizScreen';
import AvatarStudioScreen from './src/screens/AvatarStudioScreen';
import SuggestScreen from './src/screens/SuggestScreen';
import WardrobeScreen from './src/screens/WardrobeScreen';

function AppLoadingScreen() {
  return (
    <SafeAreaView style={loadingStyles.safeArea}>
      <View style={loadingStyles.content}>
        <ActivityIndicator color="#27483C" />
        <Text style={loadingStyles.label}>Opening your style space…</Text>
      </View>
    </SafeAreaView>
  );
}

const loadingStyles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F1F4EF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  label: { color: '#6C7771', fontSize: 13 },
});

export default function App() {
  const [screen, setScreen] = useState('suggest');
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
    setLoading(true);
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

  if (screen === 'quiz') {
    const initialDraft = draft || {
      schemaVersion: QUIZ_SCHEMA_VERSION,
      answers: profile?.answers || createBlankAnswers(),
      currentQuestion: 0,
      updatedAt: new Date().toISOString(),
    };
    return (
      <KnowYouQuizScreen
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
      onRetryStorage={() => setLoadAttempt((attempt) => attempt + 1)}
    />
  );
}
