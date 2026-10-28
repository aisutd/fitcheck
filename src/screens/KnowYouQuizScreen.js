import QuizAvatarPreview from '../features/avatar/QuizAvatarPreview';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  QUIZ_QUESTIONS,
  QUIZ_SCHEMA_VERSION,
  isOptionSelected,
  movePriority,
  toggleMultipleChoice,
  updateGroupAnswer,
  validateAnswers,
} from '../features/quiz/quizModel';

const COLORS = {
  background: '#F1F4EF',
  ink: '#202B27',
  muted: '#6C7771',
  green: '#27483C',
  lime: '#D4EF87',
  line: '#DCE3DC',
  white: '#FFFFFF',
  accent: '#D8755D',
  error: '#9B3F35',
  errorBackground: '#F9E8E4',
};

function createDraft(answers, currentQuestion) {
  return {
    schemaVersion: QUIZ_SCHEMA_VERSION,
    answers,
    currentQuestion,
    updatedAt: new Date().toISOString(),
  };
}

function getQuestionError(question, answers) {
  for (const group of question.groups) {
    if (!group.required) continue;
    const value = answers[question.id][group.id];
    if (group.selection === 'ranked' && value.length !== 3) {
      return 'Choose exactly three priorities to continue.';
    }
    if (group.selection === 'multiple' && value.length === 0) {
      return 'Choose at least one option to continue.';
    }
    if (group.selection === 'single' && !value) {
      return 'Choose an option to continue.';
    }
  }
  return '';
}

function describeAnswers(question, answers) {
  const questionAnswers = answers[question.id];
  const descriptions = [];
  for (const group of question.groups) {
    const value = questionAnswers[group.id];
    const selectedIds = Array.isArray(value) ? value : value ? [value] : [];
    if (!selectedIds.length) continue;
    const labels = selectedIds
      .map((id) => group.options.find((item) => item.id === id)?.label)
      .filter(Boolean);
    if (group.selection === 'ranked') {
      descriptions.push(...labels.map((label, index) => `${index + 1}. ${label}`));
    } else {
      descriptions.push(`${group.label ? `${group.label}: ` : ''}${labels.join(', ')}`);
    }
  }
  return descriptions.length ? descriptions.join('\n') : 'Skipped';
}

function isAnswerChanged(question, answers, originalAnswers) {
  if (!originalAnswers) return false;
  return question.groups.some(
    (group) =>
      JSON.stringify(answers[question.id][group.id]) !==
      JSON.stringify(originalAnswers[question.id]?.[group.id] ?? (group.selection === 'single' ? null : [])),
  );
}

function QuizOption({ item, selected, selection, onPress, rank }) {
  const role = selection === 'single' ? 'radio' : 'checkbox';
  const description = [item.label, item.detail, selected ? 'Selected' : null, rank ? `Priority ${rank}` : null]
    .filter(Boolean)
    .join('. ');
  return (
    <Pressable
      accessibilityRole={role}
      accessibilityLabel={description}
      accessibilityState={{ checked: selected, selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        selected && styles.optionSelected,
        pressed && styles.optionPressed,
      ]}
    >
      <View style={[styles.optionVisual, selected && styles.optionVisualSelected]}>
        {Array.isArray(item.swatches) ? (
          <View accessibilityElementsHidden style={styles.swatches}>
            {item.swatches.map((color) => (
              <View key={color} style={[styles.swatch, { backgroundColor: color }]} />
            ))}
          </View>
        ) : (
          <Text style={[styles.optionVisualText, selected && styles.optionVisualTextSelected]}>
            {rank || item.visual}
          </Text>
        )}
      </View>
      <View style={styles.optionCopy}>
        <Text style={[styles.optionTitle, selected && styles.optionTitleSelected]}>
          {item.label}
        </Text>
        <Text style={styles.optionDetail}>{item.detail}</Text>
      </View>
      <View style={[styles.selectionMark, selected && styles.selectionMarkSelected]}>
        {selected ? <Text style={styles.selectionMarkText}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

export default function KnowYouQuizScreen({
  avatarCustomization,
  initialDraft,
  originalProfile,
  storageError,
  onSaveDraft,
  onCommit,
  onExit,
  onCancelEdit,
}) {
  const [answers, setAnswers] = useState(initialDraft.answers);
  const [currentQuestion, setCurrentQuestion] = useState(initialDraft.currentQuestion);
  const [showReview, setShowReview] = useState(initialDraft.currentQuestion >= QUIZ_QUESTIONS.length);
  const [returnToReview, setReturnToReview] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [saving, setSaving] = useState(false);

  const question = QUIZ_QUESTIONS[currentQuestion];

  function persist(nextAnswers, nextQuestion) {
    onSaveDraft(createDraft(nextAnswers, nextQuestion));
  }

  function updateAnswers(nextAnswers) {
    setAnswers(nextAnswers);
    setValidationError('');
    persist(nextAnswers, currentQuestion);
  }

  function chooseOption(group, item) {
    let nextAnswers;
    if (group.selection === 'single') {
      nextAnswers = updateGroupAnswer(answers, question.id, group.id, item.id);
    } else if (group.selection === 'ranked') {
      const selected = answers[question.id][group.id];
      if (selected.includes(item.id)) {
        nextAnswers = updateGroupAnswer(
          answers,
          question.id,
          group.id,
          selected.filter((id) => id !== item.id),
        );
      } else if (selected.length < group.max) {
        nextAnswers = updateGroupAnswer(answers, question.id, group.id, [...selected, item.id]);
      } else {
        setValidationError('You can rank exactly three priorities. Remove one before adding another.');
        return;
      }
    } else {
      nextAnswers = toggleMultipleChoice(answers, question, group, item.id);
      if (nextAnswers === answers) {
        setValidationError(`Choose up to ${group.max} options.`);
        return;
      }
    }
    updateAnswers(nextAnswers);
  }

  function goBack() {
    setValidationError('');
    if (showReview) {
      setShowReview(false);
      setCurrentQuestion(QUIZ_QUESTIONS.length - 1);
      persist(answers, QUIZ_QUESTIONS.length - 1);
      return;
    }
    if (returnToReview) {
      setShowReview(true);
      setReturnToReview(false);
      setCurrentQuestion(QUIZ_QUESTIONS.length);
      persist(answers, QUIZ_QUESTIONS.length);
      return;
    }
    if (currentQuestion === 0) {
      onExit(createDraft(answers, currentQuestion));
      return;
    }
    const previousQuestion = currentQuestion - 1;
    setCurrentQuestion(previousQuestion);
    persist(answers, previousQuestion);
  }

  function continueQuiz() {
    const error = getQuestionError(question, answers);
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    if (currentQuestion === QUIZ_QUESTIONS.length - 1 || returnToReview) {
      setCurrentQuestion(QUIZ_QUESTIONS.length);
      setShowReview(true);
      setReturnToReview(false);
      persist(answers, QUIZ_QUESTIONS.length);
      return;
    }
    const nextQuestion = currentQuestion + 1;
    setCurrentQuestion(nextQuestion);
    persist(answers, nextQuestion);
  }

  async function commitProfile() {
    const errors = validateAnswers(answers, true);
    if (errors.length) {
      setValidationError(errors[0]);
      return;
    }
    setSaving(true);
    setValidationError('');
    try {
      await onCommit({
        schemaVersion: QUIZ_SCHEMA_VERSION,
        answers,
        updatedAt: new Date().toISOString(),
      });
    } catch {
      setValidationError('Your profile could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  function editQuestion(index) {
    setCurrentQuestion(index);
    setShowReview(false);
    setReturnToReview(true);
    setValidationError('');
    persist(answers, index);
  }

  function skipQuestion() {
    if (!question.groups.some((group) => group.required)) {
      const nextAnswers = question.groups.reduce(
        (currentAnswers, group) =>
          updateGroupAnswer(
            currentAnswers,
            question.id,
            group.id,
            group.selection === 'single' ? null : [],
          ),
        answers,
      );
      setAnswers(nextAnswers);
      setValidationError('');
      if (currentQuestion === QUIZ_QUESTIONS.length - 1 || returnToReview) {
        setCurrentQuestion(QUIZ_QUESTIONS.length);
        setShowReview(true);
        setReturnToReview(false);
        persist(nextAnswers, QUIZ_QUESTIONS.length);
      } else {
        const nextQuestion = currentQuestion + 1;
        setCurrentQuestion(nextQuestion);
        persist(nextAnswers, nextQuestion);
      }
    }
  }

  const progressValue = showReview ? 10 : currentQuestion + 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.topBar}>
            <View style={styles.brandGroup}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>FC</Text></View>
              <View>
                <Text style={styles.brandName}>FITCHECK</Text>
                <Text style={styles.brandCaption}>KNOW YOU</Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Save your progress and return to the outfit screen"
              onPress={() => onExit(createDraft(answers, currentQuestion))}
              style={styles.saveExitButton}
            >
              <Text style={styles.saveExitText}>Save & exit</Text>
            </Pressable>
          </View>

          <View
            accessibilityRole="progressbar"
            accessibilityLabel={`Quiz progress, ${progressValue} of 10`}
            accessibilityValue={{ min: 1, max: 10, now: progressValue }}
            style={styles.progressWrap}
          >
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressValue * 10}%` }]} />
            </View>
            <Text style={styles.progressLabel}>
              {showReview ? 'REVIEW YOUR ANSWERS' : `QUESTION ${String(progressValue).padStart(2, '0')} / 10`}
            </Text>
          </View>

          {storageError ? (
            <View accessibilityRole="alert" style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>{storageError}</Text>
            </View>
          ) : null}

          {!showReview && question ? (
            <>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>{question.section.toUpperCase()}</Text>
                <Text accessibilityRole="header" style={styles.title}>{question.title}</Text>
                <Text style={styles.subtitle}>{question.description}</Text>
              </View>

              {['q5', 'q6', 'q7'].includes(question.id) ? (
                <QuizAvatarPreview answers={answers} questionId={question.id} customization={avatarCustomization} />
              ) : null}

              {question.groups.map((group) => {
                const groupAnswer = answers[question.id][group.id];
                const selected = group.selection === 'single'
                  ? groupAnswer
                  : Array.isArray(groupAnswer) ? groupAnswer : [];
                const ranked = group.selection === 'ranked';
                return (
                  <View key={group.id} style={styles.group}>
                    {group.label ? <Text style={styles.groupLabel}>{group.label}</Text> : null}
                    {ranked && selected.length > 0 ? (
                      <View style={styles.rankedList}>
                        <Text style={styles.rankedHeading}>YOUR ORDER</Text>
                        {selected.map((id, index) => {
                          const item = group.options.find((optionItem) => optionItem.id === id);
                          if (!item) return null;
                          return (
                            <View key={id} style={styles.rankedRow}>
                              <View style={styles.rankBadge}>
                                <Text style={styles.rankBadgeText}>{index + 1}</Text>
                              </View>
                              <Text style={styles.rankedName}>{item.label}</Text>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Move ${item.label} up`}
                                accessibilityHint="Raises this priority by one position"
                                accessibilityState={{ disabled: index === 0 }}
                                disabled={index === 0}
                                onPress={() => updateAnswers(movePriority(answers, index, index - 1))}
                                style={[styles.reorderButton, index === 0 && styles.reorderDisabled]}
                              >
                                <Text style={styles.reorderText}>↑</Text>
                              </Pressable>
                              <Pressable
                                accessibilityRole="button"
                                accessibilityLabel={`Move ${item.label} down`}
                                accessibilityHint="Lowers this priority by one position"
                                accessibilityState={{ disabled: index === selected.length - 1 }}
                                disabled={index === selected.length - 1}
                                onPress={() => updateAnswers(movePriority(answers, index, index + 1))}
                                style={[styles.reorderButton, index === selected.length - 1 && styles.reorderDisabled]}
                              >
                                <Text style={styles.reorderText}>↓</Text>
                              </Pressable>
                            </View>
                          );
                        })}
                      </View>
                    ) : null}
                    <View style={styles.optionGrid}>
                      {group.options.map((item) => {
                        const isSelected = isOptionSelected(group, groupAnswer, item.id);
                        const rank = ranked && isSelected ? selected.indexOf(item.id) + 1 : null;
                        return (
                          <QuizOption
                            key={item.id}
                            item={item}
                            selected={isSelected}
                            selection={group.selection}
                            rank={rank}
                            onPress={() => chooseOption(group, item)}
                          />
                        );
                      })}
                    </View>
                  </View>
                );
              })}
              {validationError ? (
                <Text accessibilityRole="alert" style={styles.validationError}>{validationError}</Text>
              ) : null}
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={goBack}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>
                    {returnToReview ? 'Back to review' : currentQuestion === 0 ? 'Exit quiz' : 'Back'}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={continueQuiz}
                  style={styles.primaryButton}
                >
                  <Text style={styles.primaryButtonText}>
                    {currentQuestion === QUIZ_QUESTIONS.length - 1 || returnToReview
                      ? 'Review answers'
                      : 'Continue'}
                  </Text>
                  <Text style={styles.primaryButtonArrow}>→</Text>
                </Pressable>
              </View>
              {!question.groups.some((group) => group.required) ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={skipQuestion}
                  style={styles.skipQuestionButton}
                >
                  <Text style={styles.skipQuestionText}>Skip this question</Text>
                </Pressable>
              ) : null}
              <Text style={styles.privacyNote}>Your preferences stay on this device.</Text>
            </>
          ) : (
            <View style={styles.review}>
              <View style={styles.hero}>
                <Text style={styles.eyebrow}>A LITTLE MORE YOU</Text>
                <Text accessibilityRole="header" style={styles.title}>Review your style profile.</Text>
                <Text style={styles.subtitle}>
                  Your profile won’t change until you choose Save preferences.
                </Text>
              </View>
              {QUIZ_QUESTIONS.map((reviewQuestion, index) => {
                const changed = isAnswerChanged(reviewQuestion, answers, originalProfile?.answers);
                return (
                  <View key={reviewQuestion.id} style={styles.reviewRow}>
                    <View style={styles.reviewCopy}>
                      <View style={styles.reviewTitleLine}>
                        <Text style={styles.reviewQuestionNumber}>{String(index + 1).padStart(2, '0')}</Text>
                        <Text style={styles.reviewTitle}>{reviewQuestion.title}</Text>
                        {changed ? <Text style={styles.changedBadge}>CHANGED</Text> : null}
                      </View>
                      <Text style={styles.reviewAnswer}>
                        {describeAnswers(reviewQuestion, answers)}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Edit answer to question ${index + 1}: ${reviewQuestion.title}`}
                      onPress={() => editQuestion(index)}
                      style={styles.editButton}
                    >
                      <Text style={styles.editButtonText}>Edit</Text>
                    </Pressable>
                  </View>
                );
              })}
              {validationError ? (
                <Text accessibilityRole="alert" style={styles.validationError}>{validationError}</Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: saving }}
                disabled={saving}
                onPress={commitProfile}
                style={[styles.primaryButton, styles.commitButton, saving && styles.buttonDisabled]}
              >
                <Text style={styles.primaryButtonText}>
                  {saving ? 'Saving preferences…' : 'Save preferences'}
                </Text>
                {!saving ? <Text style={styles.primaryButtonArrow}>✓</Text> : null}
              </Pressable>
              <View style={styles.reviewSecondaryActions}>
                <Pressable accessibilityRole="button" onPress={goBack} style={styles.secondaryButton}>
                  <Text style={styles.secondaryButtonText}>Keep editing</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => onExit(createDraft(answers, currentQuestion))}
                  style={styles.secondaryButton}
                >
                  <Text style={styles.secondaryButtonText}>Save draft & exit</Text>
                </Pressable>
              </View>
              {originalProfile ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={onCancelEdit}
                  style={styles.cancelEditButton}
                >
                  <Text style={styles.cancelEditText}>Cancel profile changes</Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  content: { width: '100%', maxWidth: 580, alignSelf: 'center', paddingHorizontal: 22 },
  topBar: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  brandMark: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.green,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandMarkText: { color: COLORS.lime, fontSize: 12, fontWeight: '800' },
  brandName: { color: COLORS.ink, fontSize: 12, fontWeight: '800', letterSpacing: 1.1 },
  brandCaption: { marginTop: 3, color: COLORS.muted, fontSize: 9, fontWeight: '600', letterSpacing: 1.1 },
  saveExitButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 8 },
  saveExitText: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  progressWrap: { marginTop: 20 },
  progressTrack: { height: 4, overflow: 'hidden', borderRadius: 3, backgroundColor: '#DCE3DC' },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.green },
  progressLabel: { marginTop: 8, color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  hero: { paddingTop: 25, paddingBottom: 21 },
  eyebrow: { color: '#627A68', fontSize: 10, fontWeight: '800', letterSpacing: 1.5 },
  title: { marginTop: 9, color: COLORS.ink, fontFamily: 'serif', fontSize: 32, lineHeight: 38, fontWeight: '600' },
  subtitle: { marginTop: 9, color: COLORS.muted, fontSize: 14, lineHeight: 21 },
  group: { marginBottom: 21 },
  groupLabel: { marginBottom: 9, color: COLORS.ink, fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 9 },
  option: {
    width: '48%',
    minHeight: 74,
    flexGrow: 1,
    flexBasis: '46%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    padding: 10,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 9,
    backgroundColor: COLORS.white,
  },
  optionSelected: { borderColor: COLORS.green, backgroundColor: '#E7EEE4' },
  optionPressed: { opacity: 0.76 },
  optionVisual: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F1F4EF',
  },
  optionVisualSelected: { backgroundColor: COLORS.green },
  optionVisualText: { color: COLORS.green, fontSize: 16, fontWeight: '700' },
  optionVisualTextSelected: { color: COLORS.white },
  swatches: { flexDirection: 'row', gap: 2 },
  swatch: { width: 7, height: 20, borderRadius: 4 },
  optionCopy: { flex: 1, minWidth: 0 },
  optionTitle: { color: COLORS.ink, fontSize: 12, lineHeight: 16, fontWeight: '700' },
  optionTitleSelected: { color: COLORS.green },
  optionDetail: { marginTop: 3, color: COLORS.muted, fontSize: 10, lineHeight: 14 },
  selectionMark: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCD5CC',
    borderRadius: 10,
  },
  selectionMarkSelected: { borderColor: COLORS.green, backgroundColor: COLORS.green },
  selectionMarkText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  rankedList: {
    marginBottom: 11,
    padding: 11,
    borderRadius: 9,
    backgroundColor: COLORS.white,
  },
  rankedHeading: { marginBottom: 5, color: COLORS.muted, fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  rankedRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9 },
  rankBadge: { width: 25, height: 25, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: COLORS.green },
  rankBadgeText: { color: COLORS.white, fontSize: 11, fontWeight: '800' },
  rankedName: { flex: 1, color: COLORS.ink, fontSize: 13, fontWeight: '700' },
  reorderButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
  },
  reorderDisabled: { opacity: 0.35 },
  reorderText: { color: COLORS.green, fontSize: 19, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 5 },
  primaryButton: {
    minHeight: 54,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: COLORS.lime,
  },
  primaryButtonText: { color: COLORS.ink, fontSize: 13, fontWeight: '800' },
  primaryButtonArrow: { color: COLORS.green, fontSize: 20, fontWeight: '600' },
  secondaryButton: {
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: COLORS.line,
    borderRadius: 8,
    backgroundColor: COLORS.white,
  },
  secondaryButtonText: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  skipQuestionButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  skipQuestionText: { color: COLORS.muted, fontSize: 12, fontWeight: '700', textDecorationLine: 'underline' },
  privacyNote: { marginTop: 12, color: COLORS.muted, fontSize: 10, textAlign: 'center' },
  validationError: { marginTop: 8, color: COLORS.error, fontSize: 12, lineHeight: 18, fontWeight: '600' },
  errorBanner: { marginTop: 14, padding: 12, borderRadius: 8, backgroundColor: COLORS.errorBackground },
  errorBannerText: { color: COLORS.error, fontSize: 12, lineHeight: 17 },
  review: { paddingBottom: 12 },
  reviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: COLORS.line,
  },
  reviewCopy: { flex: 1 },
  reviewTitleLine: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 7 },
  reviewQuestionNumber: { color: COLORS.muted, fontSize: 10, fontWeight: '800' },
  reviewTitle: { flexShrink: 1, color: COLORS.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  changedBadge: { color: COLORS.accent, fontSize: 8, fontWeight: '800', letterSpacing: 0.6 },
  reviewAnswer: { marginTop: 6, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  editButton: { minWidth: 48, minHeight: 42, alignItems: 'center', justifyContent: 'center' },
  editButtonText: { color: COLORS.green, fontSize: 12, fontWeight: '800' },
  commitButton: { marginTop: 16 },
  buttonDisabled: { opacity: 0.6 },
  reviewSecondaryActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 9, marginTop: 10 },
  cancelEditButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  cancelEditText: { color: COLORS.error, fontSize: 12, fontWeight: '700' },
});
