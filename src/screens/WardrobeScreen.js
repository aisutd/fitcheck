import { StatusBar } from 'expo-status-bar';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { WARDROBE as DEMO_ITEMS } from '../features/suggest/outfitRecommendations';
import {
  OCCASIONS,
  WARDROBE_CATEGORIES,
  addPersonalItem,
  filterWardrobeItems,
  moveToRecentlyDeleted,
  permanentlyDeleteItem,
  restoreDeletedItem,
  setItemAvailability,
  setWardrobeMode,
  updatePersonalItem,
} from '../features/wardrobe/wardrobeModel';
import {
  deleteWardrobePhoto,
  saveWardrobePhoto,
  wardrobePhotoExists,
} from '../features/wardrobe/wardrobeStorage';

const CATEGORY_LABELS = {
  all: 'All pieces',
  top: 'Tops',
  bottom: 'Bottoms',
  shoes: 'Shoes',
  layer: 'Layers',
  accessory: 'Accessories',
};
const COLOR_FAMILIES = ['Neutrals', 'Earth Tones', 'Pastels', 'Brights', 'Darks', 'Monochrome'];
const FITS = ['Slim/Fitted', 'Regular', 'Relaxed', 'Oversized'];
const SEASONS = ['Spring', 'Summer', 'Fall', 'Winter'];
const WEATHER_TAGS = [
  { id: 'cold', label: 'Cold' },
  { id: 'mild', label: 'Mild' },
  { id: 'hot', label: 'Hot' },
  { id: 'rainy', label: 'Rainy' },
];
const COLORS = {
  background: '#F1F4EF',
  ink: '#202B27',
  muted: '#6C7771',
  green: '#27483C',
  lime: '#D4EF87',
  line: '#DCE3DC',
  white: '#FFFFFF',
  error: '#9B3F35',
};

function createItemId() {
  return `item-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function toggleValue(values, value) {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
}

function ActionButton({ title, onPress, secondary = false, disabled = false, accessibilityLabel }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        secondary && styles.actionButtonSecondary,
        disabled && styles.disabled,
        pressed && !disabled && styles.pressed,
      ]}
    >
      <Text style={[styles.actionButtonText, secondary && styles.actionButtonTextSecondary]}>
        {title}
      </Text>
    </Pressable>
  );
}

function ChoiceRow({ label, values, selected, onSelect, multi = false }) {
  return (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label}</Text>
      <View style={styles.choiceRow}>
        {values.map((value) => {
          const active = Array.isArray(selected) ? selected.includes(value) : selected === value;
          return (
            <Pressable
              key={value}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityLabel={value}
              accessibilityState={{ checked: active, selected: active }}
              onPress={() => onSelect(value)}
              style={[styles.choiceChip, active && styles.choiceChipSelected]}
            >
              <Text style={[styles.choiceChipText, active && styles.choiceChipTextSelected]}>
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function WardrobeCard({ item, mode, onEdit, onToggleAvailability, onDelete, photoMissing }) {
  return (
    <View style={styles.itemCard}>
      <View style={styles.itemImageWrap}>
        {item.photoUri && !photoMissing ? (
          <Image
            accessibilityLabel={`${item.name} clothing photo`}
            source={{ uri: item.photoUri }}
            style={styles.itemImage}
            resizeMode="cover"
            onError={onEdit.markPhotoMissing}
          />
        ) : (
          <View style={[styles.itemPlaceholder, item.colorHex && { backgroundColor: item.colorHex }]}>
            <Text style={styles.itemPlaceholderText}>
              {photoMissing ? 'PHOTO\nMISSING' : item.category.toUpperCase()}
            </Text>
          </View>
        )}
      </View>
      <View style={styles.itemDetails}>
        <View style={styles.itemTitleRow}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={[styles.availabilityTag, item.available ? styles.availableTag : styles.unavailableTag]}>
            {item.available ? 'AVAILABLE' : 'UNAVAILABLE'}
          </Text>
        </View>
        <Text style={styles.itemMeta}>
          {[CATEGORY_LABELS[item.category], item.clothingType, item.color, item.fit]
            .filter(Boolean)
            .join(' · ')}
        </Text>
        {item.size ? <Text style={styles.itemMeta}>Size {item.size}{item.sizeSystem ? ` · ${item.sizeSystem}` : ''}</Text> : null}
        {mode === 'demo' ? <Text style={styles.demoLabel}>DEMO EXAMPLE</Text> : null}
        <View style={styles.itemActions}>
          <ActionButton
            title={item.available ? 'Mark unavailable' : 'Mark available'}
            secondary
            onPress={() => onToggleAvailability(!item.available)}
          />
          {mode === 'personal' ? (
            <>
              <ActionButton title="Edit" secondary onPress={onEdit.open} />
              <ActionButton title="Delete" secondary onPress={onDelete} />
            </>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export default function WardrobeScreen({
  wardrobeState,
  storageError = '',
  onWardrobeChange,
  onClose,
}) {
  const { mode } = wardrobeState;
  const demoItems = DEMO_ITEMS.map((item) => ({
    ...item,
    available: wardrobeState.demoAvailability[item.id] ?? true,
  }));
  const allItems = mode === 'demo' ? demoItems : wardrobeState.personalItems;
  const [view, setView] = useState('active');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [colorFilter, setColorFilter] = useState('');
  const [fitFilter, setFitFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState(null);
  const [sort, setSort] = useState('recent');
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState(null);
  const [photoDraftUri, setPhotoDraftUri] = useState('');
  const [photoChanged, setPhotoChanged] = useState(false);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [missingPhotos, setMissingPhotos] = useState([]);
  const [notice, setNotice] = useState('');

  const visibleItems = view === 'deleted'
    ? wardrobeState.recentlyDeleted
    : filterWardrobeItems(allItems, {
      search,
      category,
      colorFamily: colorFilter,
      fit: fitFilter,
      clothingType: typeFilter,
      availability: availabilityFilter,
      sort,
    });

  function openNewItem() {
    setEditingItem(null);
    setForm({
      id: createItemId(),
      name: '',
      category: 'top',
      clothingType: '',
      color: '',
      colorFamily: '',
      colorHex: '',
      fit: '',
      size: '',
      sizeSystem: '',
      styleTags: [],
      seasons: [],
      weatherTags: [],
      weatherNotes: '',
      waterproof: false,
      occasions: [],
      available: true,
      photoUri: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setPhotoDraftUri('');
    setPhotoChanged(false);
    setFormError('');
    setView('edit');
  }

  function openEditItem(item) {
    setEditingItem(item);
    setForm({
      ...item,
      styleTags: item.styleTags || [],
      seasons: item.seasons || [],
      weatherTags: item.weatherTags || [],
      occasions: item.occasions || [],
      waterproof: item.waterproof === true,
    });
    setPhotoDraftUri(item.photoUri || '');
    setPhotoChanged(false);
    setFormError('');
    setView('edit');
  }

  function closeForm() {
    setForm(null);
    setEditingItem(null);
    setPhotoDraftUri('');
    setPhotoChanged(false);
    setFormError('');
    setView('active');
  }

  async function choosePhoto(fromCamera) {
    setFormError('');
    try {
      if (fromCamera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          setFormError('Camera access was not granted. You can still choose a photo from your library.');
          return;
        }
      }
      const result = fromCamera
        ? await ImagePicker.launchCameraAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 5],
          quality: 0.9,
        })
        : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          allowsEditing: true,
          aspect: [4, 5],
          quality: 0.9,
        });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset?.uri || (asset.type && asset.type !== 'image')) {
        setFormError('The selected file is not a supported clothing image.');
        return;
      }
      setPhotoDraftUri(asset.uri);
      setPhotoChanged(true);
    } catch (error) {
      setFormError(`The clothing photo could not be opened: ${error.message}`);
    }
  }

  async function rotatePhoto(degrees) {
    if (!photoDraftUri) return;
    setBusy(true);
    setFormError('');
    try {
      const context = ImageManipulator.ImageManipulator.manipulate(photoDraftUri);
      context.rotate(degrees);
      const image = await context.renderAsync();
      const result = await image.saveAsync({
        format: ImageManipulator.SaveFormat.JPEG,
        compress: 0.9,
      });
      setPhotoDraftUri(result.uri);
      setPhotoChanged(true);
    } catch (error) {
      setFormError(`The photo could not be rotated: ${error.message}`);
    } finally {
      setBusy(false);
    }
  }

  async function saveItem() {
    if (!form?.name.trim()) {
      setFormError('Add a name for this clothing item.');
      return;
    }
    setBusy(true);
    setFormError('');
    let newPhotoUri = null;
    try {
      let photoUri = form.photoUri || null;
      if (photoChanged) {
        photoUri = photoDraftUri
          ? await saveWardrobePhoto(photoDraftUri, form.id)
          : null;
        if (photoUri) newPhotoUri = photoUri;
      }
      const item = {
        ...form,
        name: form.name.trim(),
        color: form.color.trim(),
        clothingType: form.clothingType.trim(),
        styleTags: form.styleTags.filter(Boolean),
        weatherNotes: form.weatherNotes.trim(),
        photoUri,
        updatedAt: new Date().toISOString(),
      };
      const nextState = editingItem
        ? updatePersonalItem(wardrobeState, item)
        : addPersonalItem(wardrobeState, item);
      await onWardrobeChange(nextState);
      if (editingItem?.photoUri && editingItem.photoUri !== photoUri) {
        try {
          await deleteWardrobePhoto(editingItem.photoUri);
        } catch (error) {
          setNotice(`Item saved, but its replaced photo could not be removed: ${error.message}`);
        }
      }
      setMissingPhotos((current) => current.filter((id) => id !== item.id));
      closeForm();
    } catch (error) {
      if (newPhotoUri) {
        try {
          await deleteWardrobePhoto(newPhotoUri);
        } catch (cleanupError) {
          setFormError(`${error.message} The unused photo file also could not be cleaned up: ${cleanupError.message}`);
          setBusy(false);
          return;
        }
      }
      setFormError(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function toggleAvailability(item, available) {
    setNotice('');
    try {
      await onWardrobeChange(setItemAvailability(wardrobeState, mode, item.id, available));
    } catch (error) {
      setNotice(`Availability could not be updated: ${error.message}`);
    }
  }

  function deleteItem(item) {
    Alert.alert(
      'Move to Recently Deleted?',
      `${item.name} will be kept for 30 days and can be restored.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Move to Recently Deleted',
          style: 'destructive',
          onPress: async () => {
            try {
              await onWardrobeChange(moveToRecentlyDeleted(wardrobeState, item.id));
              setNotice('');
            } catch (error) {
              setNotice(`The clothing item could not be deleted: ${error.message}`);
            }
          },
        },
      ],
    );
  }

  async function restoreItem(item) {
    try {
      await onWardrobeChange(restoreDeletedItem(wardrobeState, item.id));
      setNotice('');
    } catch (error) {
      setNotice(`The clothing item could not be restored: ${error.message}`);
    }
  }

  function permanentlyDelete(item) {
    Alert.alert(
      'Delete permanently?',
      `${item.name} and its saved clothing photo will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete permanently',
          style: 'destructive',
          onPress: async () => {
            try {
              await onWardrobeChange(permanentlyDeleteItem(wardrobeState, item.id));
              if (item.photoUri) await deleteWardrobePhoto(item.photoUri);
              setNotice('');
            } catch (error) {
              setNotice(`The item was removed, but cleanup did not finish: ${error.message}`);
            }
          },
        },
      ],
    );
  }

  async function switchMode(nextMode) {
    setNotice('');
    try {
      await onWardrobeChange(setWardrobeMode(wardrobeState, nextMode));
      setView('active');
      setCategory('');
    } catch (error) {
      setNotice(`Wardrobe mode could not be changed: ${error.message}`);
    }
  }

  function toggleFormList(key, value) {
    setForm((current) => ({ ...current, [key]: toggleValue(current[key] || [], value) }));
  }

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function reportPhotoMissing(itemId) {
    setMissingPhotos((current) => current.includes(itemId) ? current : [...current, itemId]);
  }

  const dynamicColors = [...new Set(allItems.map((item) => item.colorFamily).filter(Boolean))];
  const dynamicFits = [...new Set(allItems.map((item) => item.fit).filter(Boolean))];
  const dynamicTypes = [...new Set(allItems.map((item) => item.clothingType).filter(Boolean))];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>
          <View style={styles.topBar}>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.backButton}>
              <Text style={styles.backText}>‹ Suggest</Text>
            </Pressable>
            <View style={styles.brandGroup}>
              <View style={styles.brandMark}><Text style={styles.brandMarkText}>FC</Text></View>
              <View>
                <Text style={styles.brandName}>FITCHECK</Text>
                <Text style={styles.brandCaption}>WARDROBE</Text>
              </View>
            </View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>{mode === 'demo' ? 'EXPLORE THE SAMPLE CLOSET' : 'YOUR PERSONAL CLOSET'}</Text>
            <Text accessibilityRole="header" style={styles.title}>
              {view === 'deleted' ? 'Recently Deleted.' : view === 'edit' ? (editingItem ? 'Edit a piece.' : 'Add a piece.') : 'Wear what you own.'}
            </Text>
            <Text style={styles.subtitle}>
              {mode === 'demo'
                ? 'Demo pieces are examples only. They are kept separate from your personal clothes.'
                : 'Add the pieces you own. Optional details help organize your closet without making assumptions.'}
            </Text>
          </View>

          <View style={styles.modeRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: mode === 'personal' }}
              onPress={() => switchMode('personal')}
              style={[styles.modeChip, mode === 'personal' && styles.modeChipSelected]}
            >
              <Text style={[styles.modeChipText, mode === 'personal' && styles.modeChipTextSelected]}>Personal</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityHint="Switches to the separate sample wardrobe"
              accessibilityState={{ selected: mode === 'demo' }}
              onPress={() => switchMode('demo')}
              style={[styles.modeChip, mode === 'demo' && styles.modeChipSelected]}
            >
              <Text style={[styles.modeChipText, mode === 'demo' && styles.modeChipTextSelected]}>Demo Mode</Text>
            </Pressable>
          </View>

          <View style={styles.tabRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: view !== 'deleted' }}
              onPress={() => setView('active')}
              style={[styles.tab, view !== 'deleted' && styles.tabSelected]}
            >
              <Text style={[styles.tabText, view !== 'deleted' && styles.tabTextSelected]}>
                {mode === 'demo' ? 'Demo pieces' : `My pieces (${wardrobeState.personalItems.length})`}
              </Text>
            </Pressable>
            {mode === 'personal' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: view === 'deleted' }}
                onPress={() => setView('deleted')}
                style={[styles.tab, view === 'deleted' && styles.tabSelected]}
              >
                <Text style={[styles.tabText, view === 'deleted' && styles.tabTextSelected]}>
                  Recently Deleted ({wardrobeState.recentlyDeleted.length})
                </Text>
              </Pressable>
            ) : null}
          </View>

          {storageError ? <Text accessibilityRole="alert" style={styles.errorBanner}>{storageError}</Text> : null}
          {notice ? <Text accessibilityRole="alert" style={styles.notice}>{notice}</Text> : null}

          {view === 'edit' && form ? (
            <View style={styles.form}>
              <Text style={styles.formIntro}>
                Name and category are required. Every other detail is optional.
              </Text>
              <Text style={styles.formLabel}>Item name *</Text>
              <TextInput
                accessibilityLabel="Item name, required"
                autoCapitalize="words"
                onChangeText={(value) => updateForm('name', value)}
                placeholder="e.g. Linen camp shirt"
                placeholderTextColor="#88928B"
                style={styles.textInput}
                value={form.name}
              />

              <ChoiceRow
                label="Category *"
                values={WARDROBE_CATEGORIES.map((value) => CATEGORY_LABELS[value])}
                selected={CATEGORY_LABELS[form.category]}
                onSelect={(label) => updateForm(
                  'category',
                  WARDROBE_CATEGORIES.find((value) => CATEGORY_LABELS[value] === label),
                )}
              />

              <Text style={styles.formLabel}>Clothing type</Text>
              <TextInput
                accessibilityLabel="Clothing type, optional"
                onChangeText={(value) => updateForm('clothingType', value)}
                placeholder="e.g. Button-down shirt"
                placeholderTextColor="#88928B"
                style={styles.textInput}
                value={form.clothingType}
              />
              <Text style={styles.formLabel}>Color</Text>
              <TextInput
                accessibilityLabel="Color, optional"
                onChangeText={(value) => updateForm('color', value)}
                placeholder="e.g. Sage"
                placeholderTextColor="#88928B"
                style={styles.textInput}
                value={form.color}
              />
              <ChoiceRow
                label="Color family"
                values={COLOR_FAMILIES}
                selected={form.colorFamily}
                onSelect={(value) => updateForm('colorFamily', form.colorFamily === value ? '' : value)}
              />
              {['top', 'bottom', 'layer'].includes(form.category) ? (
                <ChoiceRow
                  label="Fit"
                  values={FITS}
                  selected={form.fit}
                  onSelect={(value) => updateForm('fit', form.fit === value ? '' : value)}
                />
              ) : null}
              <Text style={styles.formLabel}>
                {form.category === 'shoes' ? 'Shoe size (optional)' : 'Size (optional)'}
              </Text>
              <TextInput
                accessibilityLabel={form.category === 'shoes' ? 'Shoe size, optional' : 'Garment size, optional'}
                onChangeText={(value) => updateForm('size', value)}
                placeholder={form.category === 'shoes' ? 'e.g. 8' : 'e.g. M or 30 × 32'}
                placeholderTextColor="#88928B"
                style={styles.textInput}
                value={form.size}
              />
              {form.category === 'shoes' ? (
                <ChoiceRow
                  label="Shoe size system"
                  values={['US', 'UK', 'EU']}
                  selected={form.sizeSystem}
                  onSelect={(value) => updateForm('sizeSystem', form.sizeSystem === value ? '' : value)}
                />
              ) : null}
              <Text style={styles.formLabel}>Style tags · comma separated</Text>
              <TextInput
                accessibilityLabel="Style tags, optional"
                onChangeText={(value) => updateForm('styleTags', value.split(',').map((tag) => tag.trim()).filter(Boolean))}
                placeholder="e.g. classic, workwear"
                placeholderTextColor="#88928B"
                style={styles.textInput}
                value={form.styleTags.join(', ')}
              />
              <ChoiceRow
                label="Season"
                values={SEASONS}
                selected={form.seasons}
                multi
                onSelect={(value) => toggleFormList('seasons', value)}
              />
              <ChoiceRow
                label="Suitable occasions · optional"
                values={OCCASIONS}
                selected={form.occasions}
                multi
                onSelect={(value) => toggleFormList('occasions', value)}
              />
              <ChoiceRow
                label="Conditions · only when known"
                values={WEATHER_TAGS.map((tag) => tag.label)}
                selected={(form.weatherTags || []).map(
                  (id) => WEATHER_TAGS.find((tag) => tag.id === id)?.label,
                ).filter(Boolean)}
                multi
                onSelect={(label) => {
                  const id = WEATHER_TAGS.find((tag) => tag.label === label)?.id;
                  if (id) toggleFormList('weatherTags', id);
                }}
              />
              <Text style={styles.formLabel}>Weather notes · only what you know</Text>
              <TextInput
                accessibilityLabel="Weather notes, optional"
                onChangeText={(value) => updateForm('weatherNotes', value)}
                placeholder="e.g. Lightweight; suitable for layering"
                placeholderTextColor="#88928B"
                style={styles.textInput}
                value={form.weatherNotes}
              />
              <Pressable
                accessibilityRole="checkbox"
                accessibilityLabel="This garment is waterproof"
                accessibilityHint="Select only if the garment is labeled or verified as waterproof"
                accessibilityState={{ checked: form.waterproof }}
                onPress={() => updateForm('waterproof', !form.waterproof)}
                style={styles.checkRow}
              >
                <View style={[styles.checkbox, form.waterproof && styles.checkboxSelected]}>
                  {form.waterproof ? <Text style={styles.checkboxMark}>✓</Text> : null}
                </View>
                <Text style={styles.checkLabel}>Waterproof (only if verified)</Text>
              </Pressable>

              <Text style={styles.formLabel}>Clothing photo · optional</Text>
              {photoDraftUri ? (
                <Image
                  accessibilityLabel="Preview of the clothing photo"
                  source={{ uri: photoDraftUri }}
                  style={styles.photoPreview}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noPhotoPreview}>
                  <Text style={styles.itemPlaceholderText}>CLOTHING ONLY</Text>
                </View>
              )}
              <View style={styles.formActionRow}>
                <ActionButton title="Choose photo" secondary onPress={() => choosePhoto(false)} disabled={busy} />
                <ActionButton title="Take photo" secondary onPress={() => choosePhoto(true)} disabled={busy} />
              </View>
              <View style={styles.formActionRow}>
                <ActionButton title="Rotate left" secondary onPress={() => rotatePhoto(-90)} disabled={!photoDraftUri || busy} />
                <ActionButton title="Rotate right" secondary onPress={() => rotatePhoto(90)} disabled={!photoDraftUri || busy} />
                {photoDraftUri ? (
                  <ActionButton
                    title="Remove photo"
                    secondary
                    disabled={busy}
                    onPress={() => {
                      setPhotoDraftUri('');
                      setPhotoChanged(true);
                    }}
                  />
                ) : null}
              </View>

              <Pressable
                accessibilityRole="switch"
                accessibilityLabel="Clothing item availability"
                accessibilityValue={{ text: form.available ? 'Available' : 'Unavailable' }}
                accessibilityState={{ checked: form.available }}
                onPress={() => updateForm('available', !form.available)}
                style={styles.availabilitySwitch}
              >
                <Text style={styles.formLabel}>Availability</Text>
                <Text style={styles.availabilityValue}>{form.available ? 'Available' : 'Unavailable'} · tap to change</Text>
              </Pressable>

              {formError ? <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text> : null}
              <View style={styles.formActionRow}>
                <ActionButton title="Cancel" secondary onPress={closeForm} disabled={busy} />
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: busy }}
                  disabled={busy}
                  onPress={saveItem}
                  style={[styles.saveButton, busy && styles.disabled]}
                >
                  {busy ? <ActivityIndicator color={COLORS.ink} /> : <Text style={styles.saveButtonText}>Save clothing</Text>}
                </Pressable>
              </View>
              <Text style={styles.privacyNote}>Only garment photos are supported. FitCheck does not request body photos.</Text>
            </View>
          ) : view === 'deleted' ? (
            <View style={styles.list}>
              {visibleItems.length ? visibleItems.map((item) => (
                <View key={item.id} style={styles.deletedCard}>
                  <View style={styles.deletedCopy}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemMeta}>
                      {CATEGORY_LABELS[item.category]} · {item.color || 'Color not provided'}
                    </Text>
                    <Text style={styles.retentionText}>
                      {Number.isFinite(Date.parse(item.deletedAt))
                        ? `Deleted ${new Date(item.deletedAt).toLocaleDateString()} · kept for up to 30 days`
                        : 'Deletion date unavailable · restore or delete permanently'}
                    </Text>
                    {item.photoUri && !wardrobePhotoExists(item.photoUri) ? (
                      <Text style={styles.missingPhotoText}>Saved clothing photo is missing.</Text>
                    ) : null}
                  </View>
                  <View style={styles.deletedActions}>
                    <ActionButton title="Restore" onPress={() => restoreItem(item)} />
                    <ActionButton title="Delete permanently" secondary onPress={() => permanentlyDelete(item)} />
                  </View>
                </View>
              )) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyTitle}>Nothing to recover.</Text>
                  <Text style={styles.emptyText}>Deleted personal clothing appears here for up to 30 days.</Text>
                </View>
              )}
            </View>
          ) : (
            <>
              {mode === 'personal' ? (
                <View style={styles.toolbar}>
                  <TextInput
                    accessibilityLabel="Search wardrobe"
                    onChangeText={setSearch}
                    placeholder="Search name, color, type, tags"
                    placeholderTextColor="#88928B"
                    style={styles.searchInput}
                    value={search}
                  />
                  <ActionButton title="+ Add" onPress={openNewItem} />
                </View>
              ) : null}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
                {['', ...WARDROBE_CATEGORIES].map((value) => (
                  <Pressable
                    key={value || 'all'}
                    accessibilityRole="button"
                    accessibilityState={{ selected: category === value }}
                    onPress={() => setCategory(value)}
                    style={[styles.categoryChip, category === value && styles.categoryChipSelected]}
                  >
                    <Text style={[styles.categoryChipText, category === value && styles.categoryChipTextSelected]}>
                      {CATEGORY_LABELS[value || 'all']}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              {mode === 'personal' ? (
                <>
                  <ChoiceRow
                    label="Availability filter"
                    values={['All', 'Available', 'Unavailable']}
                    selected={availabilityFilter === true ? 'Available' : availabilityFilter === false ? 'Unavailable' : 'All'}
                    onSelect={(value) => setAvailabilityFilter(
                      value === 'Available' ? true : value === 'Unavailable' ? false : null,
                    )}
                  />
                  {dynamicColors.length ? (
                    <ChoiceRow
                      label="Color filter"
                      values={['Any color', ...dynamicColors]}
                      selected={colorFilter || 'Any color'}
                      onSelect={(value) => setColorFilter(value === 'Any color' ? '' : value)}
                    />
                  ) : null}
                  {dynamicFits.length ? (
                    <ChoiceRow
                      label="Fit filter"
                      values={['Any fit', ...dynamicFits]}
                      selected={fitFilter || 'Any fit'}
                      onSelect={(value) => setFitFilter(value === 'Any fit' ? '' : value)}
                    />
                  ) : null}
                  {dynamicTypes.length ? (
                    <ChoiceRow
                      label="Type filter"
                      values={['Any type', ...dynamicTypes]}
                      selected={typeFilter || 'Any type'}
                      onSelect={(value) => setTypeFilter(value === 'Any type' ? '' : value)}
                    />
                  ) : null}
                </>
              ) : null}
              <View style={styles.sortRow}>
                <Text style={styles.resultCount}>{visibleItems.length} {visibleItems.length === 1 ? 'piece' : 'pieces'}</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Sort by ${sort === 'recent' ? 'name' : 'recently added'}`}
                  onPress={() => setSort((current) => current === 'recent' ? 'name' : 'recent')}
                  style={styles.sortButton}
                >
                  <Text style={styles.sortText}>Sort: {sort === 'recent' ? 'Recently added' : 'Name A–Z'}</Text>
                </Pressable>
              </View>
              <View style={styles.list}>
                {visibleItems.length ? visibleItems.map((item) => (
                  <WardrobeCard
                    key={item.id}
                    item={item}
                    mode={mode}
                    onEdit={{
                      open: () => openEditItem(item),
                      markPhotoMissing: () => reportPhotoMissing(item.id),
                    }}
                    photoMissing={missingPhotos.includes(item.id)}
                    onToggleAvailability={(available) => toggleAvailability(item, available)}
                    onDelete={() => deleteItem(item)}
                  />
                )) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>
                      {mode === 'demo' ? 'No demo pieces match.' : 'A closet, made yours.'}
                    </Text>
                    <Text style={styles.emptyText}>
                      {mode === 'demo'
                        ? 'Try another category or reset your search.'
                        : 'Add a top, a favorite pair of shoes, or anything you reach for often.'}
                    </Text>
                    {mode === 'personal' ? <ActionButton title="Add your first piece" onPress={openNewItem} /> : null}
                  </View>
                )}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { flexGrow: 1, paddingBottom: 30 },
  content: { width: '100%', maxWidth: 680, alignSelf: 'center', paddingHorizontal: 20 },
  topBar: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.line,
  },
  backButton: { minHeight: 44, justifyContent: 'center', paddingRight: 8 },
  backText: { color: COLORS.green, fontSize: 12, fontWeight: '700' },
  brandGroup: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: COLORS.green },
  brandMarkText: { color: COLORS.lime, fontSize: 11, fontWeight: '800' },
  brandName: { color: COLORS.ink, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  brandCaption: { marginTop: 3, color: COLORS.muted, fontSize: 8, fontWeight: '700', letterSpacing: 1 },
  hero: { paddingTop: 23, paddingBottom: 17 },
  eyebrow: { color: '#627A68', fontSize: 9, fontWeight: '800', letterSpacing: 1.4 },
  title: { marginTop: 8, color: COLORS.ink, fontFamily: 'serif', fontSize: 32, lineHeight: 38, fontWeight: '600' },
  subtitle: { marginTop: 7, color: COLORS.muted, fontSize: 12, lineHeight: 18 },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 15 },
  modeChip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 15, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, backgroundColor: COLORS.white },
  modeChipSelected: { borderColor: COLORS.green, backgroundColor: COLORS.green },
  modeChipText: { color: COLORS.ink, fontSize: 12, fontWeight: '700' },
  modeChipTextSelected: { color: COLORS.white },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 13 },
  tab: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabSelected: { borderBottomColor: COLORS.green },
  tabText: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  tabTextSelected: { color: COLORS.green },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  searchInput: { minHeight: 46, flex: 1, paddingHorizontal: 13, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, backgroundColor: COLORS.white, color: COLORS.ink, fontSize: 12 },
  categoryRow: { gap: 7, paddingVertical: 5, paddingBottom: 12 },
  categoryChip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, backgroundColor: COLORS.white },
  categoryChipSelected: { borderColor: COLORS.green, backgroundColor: COLORS.green },
  categoryChipText: { color: COLORS.ink, fontSize: 10, fontWeight: '700' },
  categoryChipTextSelected: { color: COLORS.white },
  formGroup: { marginBottom: 12 },
  formLabel: { marginBottom: 6, color: COLORS.ink, fontSize: 11, fontWeight: '800' },
  choiceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  choiceChip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 11, borderWidth: 1, borderColor: COLORS.line, borderRadius: 20, backgroundColor: COLORS.white },
  choiceChipSelected: { borderColor: COLORS.green, backgroundColor: '#E7EEE4' },
  choiceChipText: { color: COLORS.ink, fontSize: 10, fontWeight: '600' },
  choiceChipTextSelected: { color: COLORS.green, fontWeight: '800' },
  sortRow: { minHeight: 41, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resultCount: { color: COLORS.muted, fontSize: 11, fontWeight: '700' },
  sortButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 7 },
  sortText: { color: COLORS.green, fontSize: 11, fontWeight: '700' },
  list: { gap: 10, paddingBottom: 12 },
  itemCard: { flexDirection: 'row', gap: 12, padding: 11, borderWidth: 1, borderColor: COLORS.line, borderRadius: 9, backgroundColor: COLORS.white },
  itemImageWrap: { width: 82, height: 108, overflow: 'hidden', borderRadius: 7, backgroundColor: '#E8ECE7' },
  itemImage: { width: '100%', height: '100%' },
  itemPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 5, backgroundColor: '#E8ECE7' },
  itemPlaceholderText: { color: '#647168', fontSize: 8, lineHeight: 11, fontWeight: '800', letterSpacing: 0.6, textAlign: 'center' },
  itemDetails: { flex: 1, justifyContent: 'center' },
  itemTitleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 7 },
  itemName: { flex: 1, color: COLORS.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  availabilityTag: { overflow: 'hidden', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 10, fontSize: 7, fontWeight: '800', letterSpacing: 0.4 },
  availableTag: { color: COLORS.green, backgroundColor: '#E7EEE4' },
  unavailableTag: { color: '#80534A', backgroundColor: '#F3E7E2' },
  itemMeta: { marginTop: 5, color: COLORS.muted, fontSize: 10, lineHeight: 14 },
  demoLabel: { marginTop: 5, color: COLORS.accent, fontSize: 8, fontWeight: '800', letterSpacing: 0.8 },
  itemActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginTop: 8 },
  actionButton: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 9, borderRadius: 7, backgroundColor: COLORS.green },
  actionButtonSecondary: { borderWidth: 1, borderColor: COLORS.line, backgroundColor: COLORS.white },
  actionButtonText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },
  actionButtonTextSecondary: { color: COLORS.green },
  pressed: { opacity: 0.75 },
  disabled: { opacity: 0.45 },
  emptyState: { alignItems: 'center', padding: 25, borderWidth: 1, borderColor: COLORS.line, borderRadius: 9, backgroundColor: COLORS.white },
  emptyTitle: { color: COLORS.ink, fontFamily: 'serif', fontSize: 22, fontWeight: '600', textAlign: 'center' },
  emptyText: { marginTop: 8, marginBottom: 12, color: COLORS.muted, fontSize: 12, lineHeight: 18, textAlign: 'center' },
  deletedCard: { padding: 13, borderWidth: 1, borderColor: COLORS.line, borderRadius: 9, backgroundColor: COLORS.white },
  deletedCopy: { marginBottom: 9 },
  retentionText: { marginTop: 6, color: COLORS.muted, fontSize: 10, lineHeight: 14 },
  missingPhotoText: { marginTop: 5, color: COLORS.error, fontSize: 10, fontWeight: '600' },
  deletedActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  form: { paddingBottom: 20 },
  formIntro: { marginBottom: 14, color: COLORS.muted, fontSize: 11, lineHeight: 16 },
  textInput: { minHeight: 46, marginBottom: 13, paddingHorizontal: 12, borderWidth: 1, borderColor: COLORS.line, borderRadius: 8, backgroundColor: COLORS.white, color: COLORS.ink, fontSize: 12 },
  checkRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  checkbox: { width: 22, height: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.line, borderRadius: 5 },
  checkboxSelected: { borderColor: COLORS.green, backgroundColor: COLORS.green },
  checkboxMark: { color: COLORS.white, fontSize: 14, fontWeight: '800' },
  checkLabel: { color: COLORS.ink, fontSize: 11, fontWeight: '700' },
  photoPreview: { width: 142, height: 176, marginBottom: 9, borderRadius: 8, backgroundColor: '#E8ECE7' },
  noPhotoPreview: { width: 142, height: 100, alignItems: 'center', justifyContent: 'center', marginBottom: 9, borderRadius: 8, backgroundColor: '#E8ECE7' },
  formActionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginBottom: 9 },
  availabilitySwitch: { minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 9 },
  availabilityValue: { color: COLORS.green, fontSize: 11, fontWeight: '700' },
  saveButton: { minHeight: 46, flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, backgroundColor: COLORS.lime },
  saveButtonText: { color: COLORS.ink, fontSize: 12, fontWeight: '800' },
  formError: { marginBottom: 10, color: COLORS.error, fontSize: 11, lineHeight: 16 },
  errorBanner: { marginBottom: 10, padding: 11, borderRadius: 8, backgroundColor: '#F9E8E4', color: COLORS.error, fontSize: 11, lineHeight: 16 },
  notice: { marginBottom: 10, padding: 11, borderRadius: 8, backgroundColor: '#F9E8E4', color: COLORS.error, fontSize: 11, lineHeight: 16 },
  privacyNote: { marginTop: 8, color: COLORS.muted, fontSize: 10, lineHeight: 15, textAlign: 'center' },
});
