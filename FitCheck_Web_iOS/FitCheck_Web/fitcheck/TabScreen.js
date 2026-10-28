import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    ScrollView,
    Alert,
    Platform,
    Modal,
    TextInput,
    useWindowDimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import addItemStyles from './addItemStyles';
import CategoryDropdown from './CategoryDropdown';
import PhotoUrlInput from './PhotoUrlInput';
import { itemImageSource } from './publicPhotos';
import {
    CATEGORIES,
    getItemLabels,
    CLOTHING_FITS,
    getClothingFits,
    COLORS,
    DESIGNS,
    LAUNDRY_STATUSES,
    MATERIALS,
    getResponsiveLayout,
} from './constants';
import { processPhoto } from './photoService';
// Shared screen for both the Closet and Wishlist tabs - everything that's
// identical between the two (grid, Add/Detail modals, filter panel,
// multi-select) lives here once; per-tab differences come in through
// `fieldsConfig` (which optional fields to show), `renderExtraActions`
// (an extra slot in the Detail modal), and `bulkActions` (extra buttons in
// the multi-select bulk action bar) - see the project plan for why.
// Capitalizes just the first character as the user types (leaving the
// rest of what they've typed untouched) so "nike" / "graphical t-shirt"
// become "Nike" / "Graphical t-shirt" without forcing shout-case on every
// word - used by the Name/Brand fields' onChangeText below.
function capitalizeFirst(text) {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
}
// Returns a message naming the first unfilled required field, or null if
// all are filled - used by the Add/Detail forms' Save buttons to show a
// specific warning instead of silently doing nothing (Alert.alert, used by
// useItemList's own validation, is a no-op on react-native-web).
function getMissingFieldMessage({ name, category, color, design, material }) {
    if (!name.trim()) return 'Please enter a name.';
    if (!category) return 'Please select a category.';
    if (!color) return 'Please select a color.';
    if (!design) return 'Please select a design.';
    if (!material) return 'Please select a material.';
    return null;
}
export default function TabScreen({ list, fieldsConfig, renderExtraActions, bulkActions = [], duplicateCheckItems }) {
    const [isSortMenuVisible, setIsSortMenuVisible] = useState(false);
    const sortOptions = [
        { label: "Newest", value: "newest" },
        { label: "Oldest", value: "oldest" },
        { label: "Favorites", value: "favorites" },
    ];
    const showWornAndLaundry = fieldsConfig?.showWornAndLaundry ?? true;
    // Re-derives card/grid/chip sizing from the current window width on
    // every render - useWindowDimensions (unlike a value read once from
    // Dimensions.get() at module load) updates live when the window/viewport
    // actually changes, e.g. Chrome DevTools' device toolbar switching
    // between device presets, a real browser resize, or a phone rotation.
    const { width: windowWidth } = useWindowDimensions();
    const {
        cardWidth,
        gridWidth,
        gridImageSize,
        gridCardHeight,
        categoryChipPaddingVertical,
        categoryChipPaddingHorizontal,
        categoryChipFontSize,
        categoryTabsGap,
    } = getResponsiveLayout(windowWidth);
    const {
        items,
        selectedClothes,
        setSelectedClothes,
        failedImageUrls,
        markImageFailed,
        selectedCategory, setSelectedCategory,
        selectedColor, setSelectedColor,
        selectedDesign, setSelectedDesign,
        selectedLaundryStatus, setSelectedLaundryStatus,
        selectedMaterial, setSelectedMaterial,
        selectedFit, setSelectedFit,
        sortOrder, setSortOrder,
        searchText, setSearchText,
        filteringItems,
        resetFilters,
        addItem,
        deleteItem,
        deleteItems,
        setLaundryStatusForItems,
        updateItemImage,
        toggleFavorite,
        saveDetailChanges,
    } = list;
    // Add-form state - a brand-new, not-yet-saved item.
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [name, setName] = useState('');
    const [brand, setBrand] = useState('');
    const [category, setCategory] = useState('');
    const [color, setColor] = useState('');
    const [design, setDesign] = useState('');
    const [itemType, setItemType] = useState('');
    const [fit, setFit] = useState('');
    const [material, setMaterial] = useState('');
    const [timesWorn] = useState('0');
    const [laundryStatus, setLaundryStatus] = useState('Clean');
    const [imageUri, setImageUri] = useState(null);
    // Detail modal edit fields - populated from `selectedClothes` and
    // only written back when "Save Changes" is tapped.
    const [editName, setEditName] = useState('');
    const [editCategory, setEditCategory] = useState('');
    const [editColor, setEditColor] = useState('');
    const [editDesign, setEditDesign] = useState('');
    const [editItemType, setEditItemType] = useState('');
    const [editFit, setEditFit] = useState('');
    const [editMaterial, setEditMaterial] = useState('');
    const [editLaundryStatus, setEditLaundryStatus] = useState('Clean');
    useEffect(() => {
        if (selectedClothes) {
            setEditName(selectedClothes.name);
            setEditCategory(selectedClothes.category);
            setEditColor(selectedClothes.color);
            setEditDesign(selectedClothes.design);
            setEditMaterial(selectedClothes.material);
            setEditItemType((selectedClothes.item || selectedClothes.itemType || '').toLowerCase());
            setEditFit(selectedClothes.fit || '');
            setEditLaundryStatus(selectedClothes.laundryStatus);
        }
    }, [selectedClothes?.id]);
    // Photo-source chooser ("Take Photo" / "Choose from Library"). Built as
    // our own Modal instead of Alert.alert's button list because
    // Alert.alert's buttons are a no-op on react-native-web.
    const [isImageSourceModalVisible, setIsImageSourceModalVisible] = useState(false);
    // Delete-confirmation modal, same Alert.alert-doesn't-work-on-web reasoning.
    const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
    // Duplicate-name warning modal, same Alert.alert-doesn't-work-on-web reasoning.
    const [duplicateNameWarning, setDuplicateNameWarning] = useState(null);
    // Missing-required-field warning modal, same Alert.alert-doesn't-work-on-web
    // reasoning - useItemList's own validation calls Alert.alert, which is a
    // no-op on web, so these forms check first and show this instead.
    const [missingFieldWarning, setMissingFieldWarning] = useState(null);
    const [pendingImageCallback, setPendingImageCallback] = useState(null);
    const [isSearchVisible, setIsSearchVisible] = useState(false);
    const [isFilterPanelVisible, setIsFilterPanelVisible] = useState(false);
    // Snapshot of the filters taken when the panel opens, so tapping Cancel
    // can restore them exactly as they were.
    const [filterPanelSnapshot, setFilterPanelSnapshot] = useState(null);
    // Multi-select state - entering selection mode lets the user tap
    // multiple cards instead of opening the Detail modal, then act on all
    // of them at once via the bulk action bar (built-in Delete, plus
    // whatever `bulkActions` this tab was given - e.g. Wishlist's
    // "Move to Closet").
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState(() => new Set());
    const exitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedIds(new Set());
    };
    const toggleSelected = (id) => {
    setSelectedIds((previous) => {
    const next = new Set(previous);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
    });
    };
    const pickImage = (onImagePicked) => {
        if (Platform.OS === 'ios') {
            // Present from the current form rather than stacking sibling Modals.
            Alert.alert('Add Photo', 'Choose an image source', [
                { text: 'Photo Library', onPress: () => { void openImagePicker('library', onImagePicked); } },
                { text: 'Take Photo', onPress: () => { void openImagePicker('camera', onImagePicked); } },
                { text: 'Cancel', style: 'cancel' },
            ]);
            return;
        }
        setPendingImageCallback(() => onImagePicked);
        setIsImageSourceModalVisible(true);
    };
    const openImagePicker = async (source, onImagePicked = pendingImageCallback) => {
        try {
            if (source === 'camera') {
                const permission = await ImagePicker.requestCameraPermissionsAsync();
                if (!permission.granted) {
                    Alert.alert('Permission needed', 'Camera access is required to take a photo.');
                    return;
                }
            }
            // The system photo picker grants access to the selected image;
            // it does not require permission to the entire photo library.
            const options = { mediaTypes: ['images'], allowsEditing: false, quality: 0.7 };
            const result = source === 'camera'
                ? await ImagePicker.launchCameraAsync(options)
                : await ImagePicker.launchImageLibraryAsync(options);
            if (!result.canceled && result.assets?.[0] && onImagePicked) {
                onImagePicked(await processPhoto(result.assets[0]));
            }
        } catch (error) {
            console.warn('Unable to add photo:', error);
            const message = source === 'camera'
                ? 'Could not take or upload a photo. The iOS Simulator has no camera; choose Photo Library instead. Also check that the photo service is running.'
                : 'Could not select or upload the photo. Check that the photo service is running and try again.';
            if (Platform.OS === 'web') {
                setMissingFieldWarning(message);
            } else {
                Alert.alert('Unable to add photo', message);
            }
        }
    };
    const selectImageSource = (source) => {
        setIsImageSourceModalVisible(false);
        void openImagePicker(source);
    };
    const takePhotoFromCamera = () => selectImageSource('camera');
    const chooseFromLibrary = () => selectImageSource('library');

    const handleAddClothing = () => {
        const missingMessage = getMissingFieldMessage({ name, category, color, design, material });
        if (missingMessage) {
            if (Platform.OS === 'ios') {
                Alert.alert('Missing Information', missingMessage);
            } else {
                setMissingFieldWarning(missingMessage);
            }
            return;
        }
        const existingItems = duplicateCheckItems ?? items;
        const isDuplicateName = existingItems.some(
            (item) => item.name.trim().toLowerCase() === name.trim().toLowerCase()
        );
        if (isDuplicateName) {
            if (Platform.OS === 'ios') {
                Alert.alert('Name Already In Use', `An item named "${name.trim()}" already exists. Please use a different name.`);
            } else {
                setDuplicateNameWarning(name.trim());
            }
            return;
        }
        const added = addItem({
            name, brand, category, color, design, material, itemType, fit, image: imageUri,
            ...(showWornAndLaundry ? { timesWorn, laundryStatus } : {}),
        });
        if (!added) return;

        setName('');
        setBrand('');
        setCategory('');
        setColor('');
        setDesign('');
        setMaterial('');
        setItemType('');
       
        setFit('');
        setLaundryStatus('Clean');
        setImageUri(null);
        setIsModalVisible(false);
    };

    const handleSaveDetailChanges = () => {
        const missingMessage = getMissingFieldMessage({
        name: editName, category: editCategory, color: editColor, design: editDesign, material: editMaterial,
        });
        if (missingMessage) {
            if (Platform.OS === 'ios') {
                Alert.alert('Missing Information', missingMessage);
            } else {
                setMissingFieldWarning(missingMessage);
            }
            return;
        }
        const existingItems = duplicateCheckItems ?? items;
        // Existing name collisions must not block edits to design/material.
        const nameChanged = editName.trim().toLowerCase() !== selectedClothes.name.trim().toLowerCase();
        const isDuplicateName = nameChanged && existingItems.some(
            (item) => item.id !== selectedClothes.id && item.name.trim().toLowerCase() === editName.trim().toLowerCase()
        );
        if (isDuplicateName) {
            if (Platform.OS === 'ios') {
                Alert.alert('Name Already In Use', `An item named "${editName.trim()}" already exists. Please use a different name.`);
            } else {
                setDuplicateNameWarning(editName.trim());
            }
            return;
        }
        saveDetailChanges(selectedClothes.id, {
            name: editName,
            category: editCategory,
            color: editColor,
            design: editDesign,
            material: editMaterial,
            itemType: editItemType,
            fit: editFit,
            ...(showWornAndLaundry ? { laundryStatus: editLaundryStatus } : {}),
        });
    };

    const confirmDeleteClothing = (id) => {
        deleteItem(id);
        setIsDeleteConfirmVisible(false);
    };

    const filteredItems = filteringItems();
    const selectedItemObjects = items.filter((item) => selectedIds.has(item.id));
    return (
        <>
            {/* Sort (Newest/Oldest/Favorites) on the left, Select/search/
                filter icons on the right. Category is the quick-tabs row
                below, and Color/Design/Material/Laundry Status live in the
                filter-panel modal. */}
            <View style = {styles.controlRow}>
                <View style = {styles.sortDropdownWrapper}>
                    <TouchableOpacity
                        style={styles.sortMenuButton}
                        accessibilityRole="button"
                        accessibilityLabel="Sort items"
                        accessibilityState={{ expanded: isSortMenuVisible }}
                        onPress={() => setIsSortMenuVisible((visible) => !visible)}
                    >
                        <Text style={styles.sortMenuText}>
                            {sortOptions.find((option) => option.value === sortOrder)?.label ?? 'Newest'}
                        </Text>
                        <Ionicons name={isSortMenuVisible ? "chevron-up" : "chevron-down"} size={12} color="#252525" />
                    </TouchableOpacity>
                    {isSortMenuVisible && (
                        <View style={styles.sortMenuOptions}>
                            {sortOptions.map((option) => (
                                <TouchableOpacity
                                    key={option.value}
                                    style={styles.sortMenuButton}
                                    accessibilityRole="button"
                                    accessibilityState={{ selected: sortOrder === option.value }}
                                    onPress={() => {
                                        setSortOrder(option.value);
                                        setIsSortMenuVisible(false);
                                    }}
                                >
                                    <Text style={[styles.sortMenuText, sortOrder === option.value && styles.activeTabText]}>
                                        {option.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>

                <View style = {styles.controlActions}>
                    <TouchableOpacity
                        style = {styles.selectModeButton}
                        onPress = {() => (isSelectionMode ? exitSelectionMode() : setIsSelectionMode(true))}
                    >
                        <Text style = {styles.selectModeButtonText}>
                            {isSelectionMode ? 'Cancel' : 'Select'}
                        </Text>
                    </TouchableOpacity>
                    {isSearchVisible ? (
                        <TextInput
                            style = {styles.searchInputExpanded}
                            placeholder = "Search name or brand"
                            value = {searchText}
                            onChangeText = {setSearchText}
                            autoFocus = {true}
                            onBlur = {() => { if (!searchText.trim()) setIsSearchVisible(false); }}
                        />
                    ) : (
                        <TouchableOpacity style = {styles.iconButton} onPress = {() => setIsSearchVisible(true)}>
                            <Ionicons name = "search" size = {18} color = "#252525" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity
                        style = {styles.iconButton}
                        onPress = {() => {
                            setFilterPanelSnapshot({
                                selectedColor,
                                selectedDesign,
                                selectedMaterial,
                                selectedFit,
                                selectedLaundryStatus,
                            });
                            setIsFilterPanelVisible(true);
                        }}
                    >
                        <Ionicons name = "filter" size = {18} color = "#252525" />
                    </TouchableOpacity>
                </View>
            </View>
                    
                {/* Category quick-tabs. */}
                <ScrollView
                    horizontal = {true}
                    showsHorizontalScrollIndicator = {false}
                    style = {styles.categoryTabsScroll}
                    contentContainerStyle = {[styles.categoryTabsRow, { gap: categoryTabsGap, paddingRight: categoryTabsGap }]}
                >
                    {CATEGORIES.map((item) => (
                        <TouchableOpacity
                            key = {item}
                            style = {[
                            styles.optionButton,
                            { paddingVertical: categoryChipPaddingVertical, paddingHorizontal: categoryChipPaddingHorizontal },
                            selectedCategory === item && styles.selectedOptionButton,
                            ]}
                            onPress = {() => setSelectedCategory(item)}
                        >
                            <Text style = {[
                                styles.optionButtonText,
                                { fontSize: categoryChipFontSize },
                                selectedCategory === item && styles.selectedOptionButtonText,
                            ]}>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                <View style = {styles.resultsRow}>
                    <Text style = {styles.resultsText}>
                    {filteredItems.length} Results
                    </Text>
                </View>
                <ScrollView
                    style = {styles.clothesScroll}
                    contentContainerStyle = {styles.clothingContent}
                    showsVerticalScrollIndicator = {true}
                >
                    <View style = {[styles.clothingGrid, { width: gridWidth }]}>
                    {filteredItems.map((item) => {
                    const isSelected = selectedIds.has(item.id);
                    return (
                    <View key={item.id} style = {[styles.clothingCard, { width: cardWidth, height: gridCardHeight }]}>
                    <TouchableOpacity
                    onPress = {() => {
                    if (isSelectionMode) toggleSelected(item.id);
                    else setSelectedClothes(item);
                    }}>
                    <View style = {[styles.imagePlaceholder, { width: gridImageSize, height: gridImageSize }]}>
                    {isSelectionMode && (
                    <View style = {[styles.selectionBadge, isSelected && styles.selectionBadgeSelected]}>
                    {isSelected && <Ionicons name = "checkmark" size = {14} color = "#FFFFFF" />}
                    </View>
                    )}
                    {!isSelectionMode && (
                    <TouchableOpacity
                    style = {styles.favoriteBadge}
                    onPress = {(event) => {
                    event.stopPropagation();
                    toggleFavorite(item.id);
                    }}
                    >
                    <Ionicons
                    name = {item.isFavorite ? 'heart' : 'heart-outline'}
                    size = {16}
                    color = {item.isFavorite ? '#C23B3B' : '#FFFFFF'}
                    />
                    </TouchableOpacity>
                    )}
                    {item.image && !failedImageUrls.has(item.image) ? (
                    <Image
                    source = {itemImageSource(item.image)}
                    style = {styles.imagePreview}
                    resizeMode = "contain"
                    onError = {() => markImageFailed(item.image)}
                    />
                    ) : (
                    <Text style = {styles.placeHolderText}>
                    {item.name}
                    </Text>
                    )}
                    </View>
                    </TouchableOpacity>
                    <Text style = {styles.clothingName} numberOfLines = {1} ellipsizeMode = "tail">
                    {item.name}
                    </Text>
                    <Text style = {styles.clothingDetails} numberOfLines = {1} ellipsizeMode = "tail">
                    {item.category} | {item.color} | {item.design}
                    </Text>
                    </View>
                    );
                    })}
                    </View>
                    {filteredItems.length === 0 && (
                    <View style = {styles.emptyContainer}>
                    <Text style = {styles.emptyText}>
                    No items match the selected filters.
                    </Text>
                    </View>
                    )}
                    </ScrollView>
                    {isSelectionMode && selectedIds.size > 0 ? (
                    <View style = {styles.bulkActionBar}>
                    <Text style = {styles.bulkActionBarCount}>
                    {selectedIds.size} selected
                    </Text>
                    {bulkActions.map((action) => (
                    <TouchableOpacity
                    key = {action.key}
                    style = {styles.bulkActionButton}
                    onPress = {() => {
                    action.onPress(selectedItemObjects);
                    exitSelectionMode();
                    }}
                    >
                    <Text style = {styles.bulkActionButtonText}>{action.label}</Text>
                    </TouchableOpacity>
                    ))}
                    {/* Laundry bulk actions - Closet-only (showWornAndLaundry),
                    intentionally non-destructive since Closet's "Select"
                    mode doesn't offer bulk delete (see enableBulkDelete
                    below) - accidentally deleting owned items is far
                    worse than accidentally deleting a Wishlist entry. */}
                    {showWornAndLaundry && (
                    <>
                    <TouchableOpacity
                    style = {styles.bulkActionButton}
                    onPress = {() => {
                    setLaundryStatusForItems(Array.from(selectedIds), 'Clean');
                    exitSelectionMode();
                    }}
                    >
                    <Text style = {styles.bulkActionButtonText}>Mark Clean</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.bulkActionButton}
                    onPress = {() => {
                    setLaundryStatusForItems(Array.from(selectedIds), 'Dirty');
                    exitSelectionMode();
                    }}
                    >
                    <Text style = {styles.bulkActionButtonText}>Mark Dirty</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.bulkActionButton}
                    onPress = {() => {
                    setLaundryStatusForItems(Array.from(selectedIds), 'In Washer');
                    exitSelectionMode();
                    }}
                    >
                    <Text style = {styles.bulkActionButtonText}>In Washer</Text>
                    </TouchableOpacity>
                    </>
                    )}
                    {/* Bulk delete - gated behind fieldsConfig.enableBulkDelete
                    (Wishlist only) so Closet's "Select" mode can never
                    accidentally mass-delete owned items; Closet still only
                    supports deleting one item at a time via its Detail
                    modal's delete-confirmation flow. */}
                    {fieldsConfig?.enableBulkDelete && (
                    <TouchableOpacity
                    style = {[styles.bulkActionButton, styles.bulkDeleteButton]}
                    onPress = {() => {
                    deleteItems(Array.from(selectedIds));
                    exitSelectionMode();
                    }}
                    >
                    <Text style = {[styles.bulkActionButtonText, styles.bulkDeleteButtonText]}>Delete</Text>
                    </TouchableOpacity>
                    )}
                    </View>
                    ) : !isSelectionMode && (
                    <View style = {styles.floatingButtonRow}>
                    <TouchableOpacity
                    style = {styles.addButton}
                    onPress = {() => {
                        setIsModalVisible(true);
                    }}
                    >
                    <Text style = {styles.addButtonText}>+</Text>
                    </TouchableOpacity>
                    </View>
                    )}
                    <Modal visible = {isModalVisible}
                    transparent = {true}
                    animationType = "slide"
                    onRequestClose = {() => setIsModalVisible(false)}
                    >
                    <View style = {addItemStyles.modalOverlay}>
                    <View style = {addItemStyles.modalContent}>
                    <ScrollView
                    style={addItemStyles.scrollView}
                    contentContainerStyle={addItemStyles.scrollContent}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    >
                    <Text style = {addItemStyles.modalTitle}> Add Item </Text>
                    <TouchableOpacity
                    style = {addItemStyles.imagePlaceholder}
                    onPress = {() => pickImage(({ url, tags }) => {
                        setImageUri(url);
                        if (tags?.item) setName(capitalizeFirst(tags.item));
                        if (tags?.category) setCategory(tags.category);
                        if (tags?.color) setColor(tags.color);
                        if (tags?.design) setDesign(tags.design);
                        if (tags?.material) setMaterial(tags.material);
                        if (tags?.item) setItemType(tags.item.toLowerCase());
                        if (tags?.fit) setFit(tags.fit);
                    })}
                    >
                    {imageUri && !failedImageUrls.has(imageUri) ? (
                    <Image
                    source = {itemImageSource(imageUri)}
                    style = {styles.imagePreview}
                    resizeMode = "contain"
                    onError = {() => markImageFailed(imageUri)}
                    />
                    ) : (
                    <Text style = {addItemStyles.placeHolderText}> + Add Photo </Text>
                    )}
                    </TouchableOpacity>

                    <PhotoUrlInput onImported={({ url, tags }) => {
                        setImageUri(url);
                        if (tags?.item) setName(capitalizeFirst(tags.item));
                        if (tags?.category) setCategory(tags.category);
                        if (tags?.color) setColor(tags.color);
                        if (tags?.design) setDesign(tags.design);
                        if (tags?.material) setMaterial(tags.material);
                        if (tags?.item) setItemType(tags.item.toLowerCase());
                        if (tags?.fit) setFit(tags.fit);
                    }} />
                    <Text style = {addItemStyles.inputLabel}> Name </Text>
                    <TextInput
                    style = {addItemStyles.input}
                    placeholder = "Ex: Blue T-Shirt"
                    value = {name}
                    onChangeText = {(text) => setName(capitalizeFirst(text))}
                    />
                    <Text style = {addItemStyles.inputLabel}> Brand </Text>
                    <TextInput
                    style = {addItemStyles.input}
                    placeholder = "Ex: Nike"
                    value = {brand}
                    onChangeText = {(text) => setBrand(capitalizeFirst(text))}
                    />
                    <Text style = {addItemStyles.inputLabel}> Category </Text>
                    <CategoryDropdown value={category} onChange={(next) => { setCategory(next); setFit(''); setItemType(''); }} options={CATEGORIES} label="Category" />
                    <Text style = {addItemStyles.inputLabel}> Color </Text>
                    <CategoryDropdown value={color} onChange={setColor} options={COLORS} label="Color" />
                    <Text style = {addItemStyles.inputLabel}> Design </Text>
                    <CategoryDropdown value={design} onChange={setDesign} options={DESIGNS} label="Design" />
                    {category && (
                    <>
                    <Text style={addItemStyles.inputLabel}>Item</Text>
                    <CategoryDropdown value={itemType} onChange={(next) => { setItemType(next); }} options={getItemLabels(category)} label="Item" />
                    </>
                    )}
                    <Text style={addItemStyles.inputLabel}>Fit</Text>
                    <CategoryDropdown value={getClothingFits(category).includes(fit) ? fit : ''} onChange={setFit} options={getClothingFits(category)} label="Fit" />
                    <Text style = {addItemStyles.inputLabel}> Material </Text>
                    <CategoryDropdown value={material} onChange={setMaterial} options={MATERIALS} label="Material" />
                    {showWornAndLaundry && (
                    <>
                    <Text style = {addItemStyles.inputLabel}> Laundry Status </Text>
                    <CategoryDropdown value={laundryStatus} onChange={setLaundryStatus} options={LAUNDRY_STATUSES} label="Laundry Status" />
                    </>
                    )}
                    <TouchableOpacity
                    style = {addItemStyles.saveButton}
                    onPress = {handleAddClothing}
                    >
                    <Text style = {styles.saveButtonText}> Save </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.cancelButton}
                    onPress = {() => {
                    setImageUri(null);
                    setIsModalVisible(false);
                    }}
                    >
                    <Text style = {styles.cancelButtonText}> Cancel </Text>
                    </TouchableOpacity>
                    </ScrollView>
                    </View>
                    </View>
                    </Modal>
                    <Modal visible = {selectedClothes !== null}
                    transparent = {true}
                    animationType = "slide"
                    onRequestClose = {() => {
                        if (isDeleteConfirmVisible) setIsDeleteConfirmVisible(false);
                        else setSelectedClothes(null);
                    }}
                    >
                    <View style = {styles.modalOverlay}>
                    <View style = {styles.modalContent}>
                    {/* Keep confirmation in this modal: sibling native modals can fail to present on iOS. */}
                    {isDeleteConfirmVisible ? (
                    <>
                    <Text style = {styles.modalTitle}> Delete Clothing Item </Text>
                    <Text style = {styles.subtitle}> Are you sure you want to delete this clothing item? </Text>
                    <TouchableOpacity
                    style = {styles.deleteButton}
                    onPress = {() => confirmDeleteClothing(selectedClothes?.id)}
                    >
                    <Text style = {styles.deleteButtonText}> Delete </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.cancelButton}
                    onPress = {() => setIsDeleteConfirmVisible(false)}
                    >
                    <Text style = {styles.cancelButtonText}> Cancel </Text>
                    </TouchableOpacity>
                    </>
                    ) : (
                    <ScrollView
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    >
                    <Text style = {styles.modalTitle}> Clothing Item Details </Text>
                    {selectedClothes && (
                    <>
                    <TouchableOpacity
                    style = {styles.imagePlaceholder}
                    onPress = {() => pickImage(({ url, tags }) => {
                        updateItemImage(selectedClothes.id, url);
                        if (tags?.item) setEditName(capitalizeFirst(tags.item));
                        if (tags?.category) setEditCategory(tags.category);
                        if (tags?.color) setEditColor(tags.color);
                        if (tags?.design) setEditDesign(tags.design);
                        if (tags?.material) setEditMaterial(tags.material);
                        if (tags?.item) setEditItemType(tags.item.toLowerCase());
                        if (tags?.fit) setEditFit(tags.fit);
                    })}
                    >
                    {selectedClothes.image && !failedImageUrls.has(selectedClothes.image) ? (
                    <Image
                    source = {itemImageSource(selectedClothes.image)}
                    style = {styles.imagePreview}
                    resizeMode = "contain"
                    onError = {() => markImageFailed(selectedClothes.image)}
                    />
                    ) : (
                    <Text style = {styles.placeHolderText}> + Add Photo </Text>
                    )}
                    </TouchableOpacity>

                    <PhotoUrlInput onImported={({ url, tags }) => {
                        updateItemImage(selectedClothes.id, url);
                        if (tags?.item) setEditName(capitalizeFirst(tags.item));
                        if (tags?.category) setEditCategory(tags.category);
                        if (tags?.color) setEditColor(tags.color);
                        if (tags?.design) setEditDesign(tags.design);
                        if (tags?.material) setEditMaterial(tags.material);
                        if (tags?.item) setEditItemType(tags.item.toLowerCase());
                        if (tags?.fit) setEditFit(tags.fit);
                    }} />
                    <TouchableOpacity
                    style = {styles.favoriteButton}
                    onPress = {() => toggleFavorite(selectedClothes.id)}
                    >
                    <Ionicons
                    name = {selectedClothes.isFavorite ? 'heart' : 'heart-outline'}
                    size = {18}
                    color = {selectedClothes.isFavorite ? '#C23B3B' : '#252525'}
                    style = {{ marginRight: 8 }}
                    />
                    <Text style = {styles.favoriteButtonText}>
                    {selectedClothes.isFavorite ? 'Favorited' : 'Add to Favorites'}
                    </Text>
                    </TouchableOpacity>
                    {renderExtraActions?.(selectedClothes)}
                    <Text style = {styles.detailLabel}> Name: </Text>
                    <TextInput
                    style = {styles.input}
                    value = {editName}
                    onChangeText = {(text) => setEditName(capitalizeFirst(text))}
                    />
                    <Text style = {styles.detailLabel}> Category: </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {editCategory}
                    onValueChange = {(next) => { setEditCategory(next); setEditFit(''); setEditItemType(''); }}
                    style = {styles.dropdownPicker}
                    >
                    {CATEGORIES.filter((item) => item !== 'All').map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    <Text style = {styles.detailLabel}> Color: </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {editColor}
                    onValueChange = {setEditColor}
                    style = {styles.dropdownPicker}
                    >
                    {COLORS.filter((item) => item !== 'All').map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    <Text style = {styles.detailLabel}> Design: </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {editDesign}
                    onValueChange = {setEditDesign}
                    style = {styles.dropdownPicker}
                    >
                    {DESIGNS.filter((item) => item !== 'All').map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    {editCategory && (
                    <>
                    <Text style={styles.detailLabel}>Item</Text>
                    <CategoryDropdown value={editItemType} onChange={(next) => { setEditItemType(next); }} options={getItemLabels(editCategory)} label="Item" />
                    </>
                    )}
                    <Text style={styles.detailLabel}>Fit:</Text>
                    <CategoryDropdown value={getClothingFits(editCategory).includes(editFit) ? editFit : ''} onChange={setEditFit} options={getClothingFits(editCategory)} label="Fit" />
                    <Text style = {styles.detailLabel}> Material: </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {editMaterial}
                    onValueChange = {setEditMaterial}
                    style = {styles.dropdownPicker}
                    >
                    {MATERIALS.filter((item) => item !== 'All').map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    {showWornAndLaundry && (
                    <>
                    <Text style = {styles.detailLabel}> Laundry Status: </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {editLaundryStatus}
                    onValueChange = {setEditLaundryStatus}
                    style = {styles.dropdownPicker}
                    >
                    {LAUNDRY_STATUSES.filter((item) => item !== 'All').map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    </>
                    )}
                    <TouchableOpacity
                    style = {styles.saveButton}
                    onPress = {handleSaveDetailChanges}
                    >
                    <Text style = {styles.saveButtonText}> Save Changes </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.deleteButton}
                    onPress = {() => setIsDeleteConfirmVisible(true)}
                    >
                    <Text style = {styles.deleteButtonText}> Delete </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.closeButton}
                    onPress = {() => setSelectedClothes(null)}
                    >
                    <Text style = {styles.closeButtonText}> Close </Text>
                    </TouchableOpacity>
                    </>
                    )}
                    </ScrollView>
                    )}
                    </View>
                    </View>
                    </Modal>
                    {/* Photo-source chooser. */}
                    <Modal
                    visible = {isImageSourceModalVisible}
                    transparent = {true}
                    animationType = "fade"
                    onRequestClose = {() => setIsImageSourceModalVisible(false)}
                    >
                    <View style = {styles.modalOverlay}>
                    <View style = {styles.modalContent}>
                    <Text style = {styles.modalTitle}> Add Photo </Text>
                    <TouchableOpacity
                    style = {styles.saveButton}
                    onPress = {takePhotoFromCamera}
                    >
                    <Text style = {styles.saveButtonText}> Take Photo </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.saveButton}
                    onPress = {chooseFromLibrary}
                    >
                    <Text style = {styles.saveButtonText}> Choose from Library </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.cancelButton}
                    onPress = {() => setIsImageSourceModalVisible(false)}
                    >
                    <Text style = {styles.cancelButtonText}> Cancel </Text>
                    </TouchableOpacity>
                    </View>
                    </View>
                    </Modal>
                    {/* Duplicate-name warning modal. */}
                    <Modal
                    visible = {!!duplicateNameWarning}
                    transparent = {true}
                    animationType = "fade"
                    onRequestClose = {() => setDuplicateNameWarning(null)}
                    >
                    <View style = {styles.modalOverlay}>
                    <View style = {styles.modalContent}>
                    <Text style = {styles.modalTitle}> Name Already In Use </Text>
                    <Text style = {styles.subtitle}>
                    An item named "{duplicateNameWarning}" already exists. Please use a different name.
                    </Text>
                    <TouchableOpacity
                    style = {styles.saveButton}
                    onPress = {() => setDuplicateNameWarning(null)}
                    >
                    <Text style = {styles.saveButtonText}> OK </Text>
                    </TouchableOpacity>
                    </View>
                    </View>
                    </Modal>
                    {/* Missing-required-field warning modal. */}
                    <Modal
                    visible = {!!missingFieldWarning}
                    transparent = {true}
                    animationType = "fade"
                    onRequestClose = {() => setMissingFieldWarning(null)}
                    >
                    <View style = {styles.modalOverlay}>
                    <View style = {styles.modalContent}>
                    <Text style = {styles.modalTitle}> Missing Information </Text>
                    <Text style = {styles.subtitle}>
                    {missingFieldWarning}
                    </Text>
                    <TouchableOpacity
                    style = {styles.saveButton}
                    onPress = {() => setMissingFieldWarning(null)}
                    >
                    <Text style = {styles.saveButtonText}> OK </Text>
                    </TouchableOpacity>
                    </View>
                    </View>
                    </Modal>
                    {/* Filter panel - Color/Design/Material/Laundry Status. */}
                    <Modal
                    visible = {isFilterPanelVisible}
                    transparent = {true}
                    animationType = "fade"
                    onRequestClose = {() => setIsFilterPanelVisible(false)}
                    >
                    <View style = {styles.modalOverlay}>
                    <View style = {styles.modalContent}>
                    <ScrollView showsVerticalScrollIndicator = {true}>
                    <Text style = {styles.modalTitle}> Filters </Text>
                    <Text style = {styles.filterTitle}> Colors </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {selectedColor}
                    onValueChange = {setSelectedColor}
                    style = {styles.dropdownPicker}
                    >
                    {COLORS.map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    <Text style = {styles.filterTitle}> Designs </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {selectedDesign}
                    onValueChange = {setSelectedDesign}
                    style = {styles.dropdownPicker}
                    >
                    {DESIGNS.map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    <Text style={styles.filterTitle}>Fit</Text>
                    <Picker accessibilityLabel="Filter by fit" selectedValue={selectedFit} onValueChange={setSelectedFit}>
                    {['All', ...new Set(Object.values(CLOTHING_FITS).flat())].map((value) => <Picker.Item key={value} label={value} value={value} />)}
                    </Picker>
                    <Text style = {styles.filterTitle}> Material </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {selectedMaterial}
                    onValueChange = {setSelectedMaterial}
                    style = {styles.dropdownPicker}
                    >
                    {MATERIALS.map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    {showWornAndLaundry && (
                    <>
                    <Text style = {styles.filterTitle}> Laundry Status </Text>
                    <View style = {styles.dropdownWrapper}>
                    <Picker
                    selectedValue = {selectedLaundryStatus}
                    onValueChange = {setSelectedLaundryStatus}
                    style = {styles.dropdownPicker}
                    >
                    {LAUNDRY_STATUSES.map((item) => (
                    <Picker.Item key = {item} label = {item} value = {item} />
                    ))}
                    </Picker>
                    </View>
                    </>
                    )}
                    <TouchableOpacity
                    style = {styles.saveButton}
                    onPress = {() => setIsFilterPanelVisible(false)}
                    >
                    <Text style = {styles.saveButtonText}> Done </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.cancelButton}
                    onPress = {() => resetFilters()}
                    >
                    <Text style = {styles.cancelButtonText}> Reset Filters </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                    style = {styles.cancelButton}
                    onPress = {() => {
                    if (filterPanelSnapshot) {
                    setSelectedColor(filterPanelSnapshot.selectedColor);
                    setSelectedDesign(filterPanelSnapshot.selectedDesign);
                    setSelectedMaterial(filterPanelSnapshot.selectedMaterial);
                    setSelectedFit(filterPanelSnapshot.selectedFit);
                    setSelectedLaundryStatus(filterPanelSnapshot.selectedLaundryStatus);
                    }
                    setIsFilterPanelVisible(false);
                    }}
                    >
                    <Text style = {styles.cancelButtonText}> Cancel </Text>
                    </TouchableOpacity>
                    </ScrollView>
                    </View>
                </View>
            </Modal>
        </>
    );
}