import React, { useState } from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import { CATEGORIES } from './constants';
import styles from './addItemStyles';

export default function CategoryDropdown({ options = CATEGORIES, label = 'Category', value, onChange }) {
    const [expanded, setExpanded] = useState(false);
    const categories = options.filter((item) => item !== 'All');

    // Browsers already render Picker as a compact select menu.
    if (Platform.OS === 'web') {
        return (
            <View style={styles.dropdownWrapper}>
                <Picker accessibilityLabel={label} selectedValue={value} onValueChange={onChange} style={styles.dropdownPicker}>
                    <Picker.Item label="Select..." value="" />
                    {categories.map((item) => <Picker.Item key={item} label={item} value={item} />)}
                </Picker>
            </View>
        );
    }

    return (
        <View style={styles.dropdownWrapper}>
            <TouchableOpacity
                style={styles.categoryTrigger}
                accessibilityRole="button"
                accessibilityLabel={`${label}: ${value || 'Select...'}`}
                accessibilityState={{ expanded }}
                onPress={() => setExpanded((open) => !open)}
            >
                <Text style={styles.categoryText}>{value || 'Select...'}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={16} color="#252525" />
            </TouchableOpacity>
            {expanded && (
                <ScrollView style={styles.categoryOptions} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                    {categories.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={styles.categoryTrigger}
                            accessibilityRole="button"
                            accessibilityState={{ selected: value === item }}
                            onPress={() => {
                                onChange(item);
                                setExpanded(false);
                            }}
                        >
                            <Text style={styles.categoryText}>{item}</Text>
                            {value === item && <Ionicons name="checkmark" size={16} color="#536B5B" />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            )}
        </View>
    );
}
