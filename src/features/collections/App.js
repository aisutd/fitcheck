import { router } from 'expo-router';
import { useFitCheck } from '../../../App';
import { toCollectionItem, toWardrobeItem } from './collectionAdapter';
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import styles from './styles';
import { useItemList } from './useItemList';
import TabScreen from './TabScreen';
export default function App() {
    // Top-level Closet/Wishlist tabs - each has its own independent
    // storage key, filter state, and data via its own useItemList
    // instance. Both stay loaded at all times so switching tabs never
    // re-fetches/flickers.
    const [activeTab, setActiveTab] = useState('closet');
    const { wardrobeState, persistWardrobe, wardrobeError } = useFitCheck();
    const controlled = (field) => ({
      items: (wardrobeState[field] || []).map(toCollectionItem),
      onChange: (updater) => persistWardrobe((state) => {
        const previous = (state[field] || []).map(toCollectionItem);
        const result = typeof updater === 'function' ? updater(previous) : updater;
        const records = result.map(toWardrobeItem);
        const removed = field === 'personalItems' ? (state[field] || []).filter((item) => !records.some((next) => next.id === item.id)) : [];
        return { ...state, [field]: records, recentlyDeleted: [...removed.map((item) => ({ ...item, deletedAt: new Date().toISOString() })), ...state.recentlyDeleted] };
      }).catch(() => {}),
    });
    const closetList = useItemList('@fitcheck/clothes', controlled('personalItems'));
    const wishlistList = useItemList('@fitcheck/wishlist', controlled('wishlistItems'));
    // Shared by the Wishlist Detail modal's single-item "Move to Closet"
    // button and the multi-select bulk action below.
    const moveToCloset = (selectedItems) => {
        selectedItems.forEach(({ id, createdAt, ...rest }) =>
        closetList.addItemObject(rest)
        );
        wishlistList.deleteItems(selectedItems.map((item) => item.id));
        };
        return (
        <View style={styles.container}>
        <StatusBar barStyle="dark-content" />{wardrobeError ? <Text accessibilityRole="alert" style={{ padding: 18, color: '#8A392C' }}>{wardrobeError}</Text> : null}<TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={{ padding: 18 }}><Text style={{ color: '#243528' }}>← Wardrobe · occasion tags and recommendations</Text></TouchableOpacity><Text style={{ paddingHorizontal: 18, color: '#61675F' }}>Manage favorites, laundry, materials and your wishlist. Set suitable occasions in the main wardrobe review form to include new pieces in recommendations.</Text>
        {/* Closet/Wishlist tab switcher - active tab gets an underline
            bar. The item count shows as a small line directly under
            the Closet tab's own label + underline. */}
        <View style = {styles.tabBar}>
            <TouchableOpacity
                style = {styles.tabButton}
                onPress = {() => setActiveTab('closet')}
            >
            <Text style = {[styles.tabText, activeTab === 'closet' && styles.activeTabText]}>
                Closet
            </Text>
            {activeTab === 'closet' && <View style = {styles.activeTabUnderline} />}
            {activeTab === 'closet' && (
                <Text style = {styles.itemCountText}>
                    {closetList.items.length} {closetList.items.length === 1 ? 'item' : 'items'}
                </Text>
            )}
        </TouchableOpacity>
        <TouchableOpacity
            style = {styles.tabButton}
            onPress = {() => setActiveTab('wishlist')}
        >
            <Text style = {[styles.tabText, activeTab === 'wishlist' && styles.activeTabText]}>
            Wishlist
            </Text>
            {activeTab === 'wishlist' && <View style = {styles.activeTabUnderline} />}
            {activeTab === 'wishlist' && (
                <Text style = {styles.itemCountText}>
                    {wishlistList.items.length} {wishlistList.items.length === 1 ? 'item' : 'items'}
                </Text>
            )}
        </TouchableOpacity>
        </View>
        {/* Add-form duplicate-name check is scoped across both tabs
        combined (not just the tab being added to), so passed down
        explicitly here where both lists are in scope. */}
        {activeTab === 'closet' ? (
            <TabScreen
                list = {closetList}
                fieldsConfig = {{ showWornAndLaundry: true }}
                duplicateCheckItems = {[...closetList.items, ...wishlistList.items]}
            />
            ) : (
                <TabScreen
                    list = {wishlistList}
                    fieldsConfig = {{ showWornAndLaundry: false, enableBulkDelete: true }}
                    duplicateCheckItems = {[...closetList.items, ...wishlistList.items]}
                    bulkActions = {[{
                        key: 'moveToCloset',
                        label: 'Move to Closet',
                        onPress: moveToCloset,
                    }]}
                    renderExtraActions = {(item) => (
                        <TouchableOpacity
                            style = {styles.moveToClosetButton}
                            onPress = {() => moveToCloset([item])}
                        >
                            <Ionicons name = "arrow-undo-outline" size = {18} color = "#27483C" style = {{ marginRight: 8 }} />
                            <Text style = {styles.moveToClosetButtonText}> Move to Closet </Text>
                        </TouchableOpacity>
                    )}
                />
            )}
        </View>
    );
}
