import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { importPhotoUrl } from './photoService';
import styles from './styles';

export default function PhotoUrlInput({ onImported }) {
    const [expanded, setExpanded] = useState(false);
    const [url, setUrl] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [warning, setWarning] = useState('');
    const importImage = async () => {
        if (busy) return;
        if (!/^https?:\/\/\S+$/i.test(url.trim())) {
            setError('Enter a complete HTTP or HTTPS image URL.');
            return;
        }
        setBusy(true);
        setError('');
        setWarning('');
        try {
            const result = await importPhotoUrl(url);
            onImported(result);
            setWarning(result.tagging_error || '');
            setUrl('');
            setExpanded(false);
        } catch (failure) {
            setError(failure.message === 'Network request failed' || failure.message === 'Failed to fetch'
                ? 'Cannot reach the photo service. Start it and try again.'
                : failure.message);
        } finally {
            setBusy(false);
        }
    };
    return (
        <View style={styles.photoUrlSection}>
            <TouchableOpacity
                style={styles.photoUrlToggle}
                accessibilityRole="button"
                accessibilityState={{ expanded, disabled: busy }}
                disabled={busy}
                onPress={() => setExpanded((value) => !value)}
            >
                <Text style={styles.selectModeButtonText}>{expanded ? 'Hide Image URL' : 'Import from URL'}</Text>
            </TouchableOpacity>
            {!!warning && <Text accessibilityRole="alert" style={styles.bulkDeleteButtonText}>{warning}</Text>}
            {expanded && (
                <>
                    <Text style={styles.resultsText}>Paste a direct image link, rather than a store page link.</Text>
                    <TextInput
                        style={[styles.input, styles.photoUrlInput]}
                        accessibilityLabel="Image URL"
                        placeholder="https://example.com/shirt.jpg"
                        keyboardType="url"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!busy}
                        value={url}
                        onChangeText={setUrl}
                    />
                    {!!error && <Text accessibilityRole="alert" style={styles.bulkDeleteButtonText}>{error}</Text>}
                    <TouchableOpacity
                        style={[styles.saveButton, busy && styles.photoUrlBusy]}
                        accessibilityRole="button"
                        disabled={busy}
                        onPress={importImage}
                    >
                        <Text style={styles.saveButtonText}>{busy ? 'Importing…' : 'Use Image'}</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    );
}
