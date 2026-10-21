import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Alert,
    Modal,
    TextInput,
} from 'react-native';

//import { CameraView, useCameraPermissions } from 'expo-camera';

//import AsyncStorage from '@react-native-async-storage/async-storage';

const CATEGORIES = [
    "All",
    "Tops",
    "Bottoms",
    "Dresses",
    "Outerwear",
    "Accessories",
    "Suits",
    "Shoes",
];

const COLORS = [
    "All",
    "White",
    "Black",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Pink",
    "Purple",
    "Orange",
    "Brown",
    "Gray",
    "Tie-Dye",
    "Beige",
    "Maroon",
    "Other",
];

const DESIGNS = [
    "All",
    "Solid",
    "Striped",
    "Polka Dot",
    "Floral",
    "Plaid",
    "Animal Print",
    "Geometric",
    "Paisley",
    "Camouflage",
    "Tie-Dye",
    "Multicolor",
    "Other",
]

const LAUNDRY_STATUSES = [
    'All',
    'Clean',
    'Dirty',
    'In Washer',
]

const MATERIALS = [
    'All',
    'Cotton',
    'Polyester',
    'Fleece',
    'Linen',
    'Leather',
    'Wool',
    'Silk',
    'Jersey',
    'Denim',
    'Other',
]
const TIMES_WORN = [
    'All',
    'Never Worn',
    'Worn Once',
    '2-5',
    '6-10',
    '11-20',
    '20+',
]

function matchesTimesWorn(count, selection){
    const worn = Number(count) || 0
    switch (selection){
        case 'Never Worn': return worn === 0;
        case 'Worn Once': return worn === 1;
        case '2-5': return worn >=2 && worn <=5;
        case '6-10': return worn >=6 && worn <= 10;
        case '11-20': return worn >=11 && worn <=20;
        case '20+': return worn > 20;
        default: return true;
    }
}

export default function App() {

    {/* Screens

        const [home, setHome] = useState(['closet']);

    */}

    {/*
        Camera

        const [permission, requestPermission] = useCameraPermissions();
        const [scanned, setScanned] = useState(false);


        if (!permission) {
            // Camera permissions are still loading
            return <View style={styles.container}><Text>Loading permissions...</Text></View>;
        }

        if (!permission.granted) {
            // Camera permissions are not granted yet
            return (
        <   View style={styles.container}>
            <Text style={styles.text}>We need your permission to show the camera</Text>
            <Button onPress={requestPermission} title="grant permission" />
            </View>
        );

        const handleBarcodeScanned = ({ type, data }) => {
        setScanned(true);
        alert(`Item scanned! Type: ${type} | Data: ${data}`);
        };
    */}

    {/* Clothes */}
    const [clothes, setClothes] = useState([]);

    {/* Categories */}
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedColor, setSelectedColor] = useState('All');
    const [selectedDesign, setSelectedDesign] = useState('All');

    {/* Modal */}
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedClothes, setSelectedClothes] = useState(null);

    {/* New Clothes */}
    const [name, setName] = useState('');
    const [category, setCategory] = useState('');
    const [color, setColor] = useState('');
    const [design, setDesign] = useState('');
    const [material, setMaterial] = useState('');
    const [timesWorn, setTimesWorn] = useState('0');
    const [laundryStatus, setLaundryStatus] = useState('Clean');

    {/* Filter */}
    const [showFilters, setShowFilters] = useState(false);
    const [openFilters, setOpenFilters] = useState([]);

    {/* Filter filters */}
    const [selectedLaundryStatus, setSelectedLaundryStatus] = useState('All');
    const [selectedMaterial, setSelectedMaterial] = useState('All');
    const [selectedTimesWorn, setSelectedTimesWorn] = useState('All');


    //filter


    //adding a clothing item
    const addClothing = () => {
        if (!name.trim() || !category || !color || !design || !material){
            Alert.alert('Missing information', 'Please enter a name, select a category, color, design, and material.');
            return;
        }

        const count = Number(timesWorn);
        if(!Number.isInteger(count) || count < 0){
            Alert.alert('Invalid Times Worn', 'Enter a whole number that is 0 or greater.');
            return;
        }

        const newClothingItem = {
            id: Date.now().toString() + Math.random().toString(),
            name: name.trim(),
            category: category.trim(),
            color: color.trim(),
            design: design.trim(),
            material: material.trim(),
            timesWorn: count,
            laundryStatus: laundryStatus,
        }

        setClothes((previousClothes) => [...previousClothes, newClothingItem]);

        //Reset the clothing input fields and close the modal
        setName('');
        setCategory('');
        setColor('');
        setDesign('');
        setMaterial('');
        setTimesWorn('0');
        setLaundryStatus('Clean');

        setIsModalVisible(false);
    };

    //deleting a clothing item
    const deleteClothing = (id) => {
        Alert.alert(
            'Delete Clothing Item',
            'Are you sure you want to delete this clothing item?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        setClothes(
                            (previousClothes) =>
                                previousClothes.filter(
                                    (item) => item.id !== id)
                        );
                    setSelectedClothes(null);
                    },
                },
            ]
        );
    };
    //filtering clothing
    const filteringClothes = () => {
        return clothes.filter((item) => {
            const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
            const matchesColor = selectedColor === 'All' || item.color === selectedColor;
            const matchesDesign = selectedDesign === 'All' || item.design === selectedDesign;
            const matchesMaterial = selectedMaterial === 'All' || item.material === selectedMaterial;
            const matchesLaundry = selectedLaundryStatus === 'All' || item.laundryStatus === selectedLaundryStatus;
            const matchesWorn = matchesTimesWorn(item.timesWorn, selectedTimesWorn);



            return matchesCategory && matchesColor && matchesDesign && matchesMaterial && matchesLaundry && matchesWorn;
        });
    };

        {/* Reseting the filters*/}
        const resetFilters = () => {
            setSelectedCategory('All');
            setSelectedColor('All');
            setSelectedDesign('All');
            setSelectedMaterial('All');
            setSelectedTimesWorn('All');
            setSelectedLaundryStatus('All');
        };

    const renderOptions = (options, value, onChange) => {
        return (
            <View style = {styles.optionGrid}>

                {options.filter((item) => item !== 'All').map((item) => (
                    <TouchableOpacity key = {item}
                    style = {[
                        styles.optionButton,
                        value === item && styles.selectedOptionButton,
                    ]}
                    onPress={() => onChange(item)}
                    >
                        <Text style = {[
                            styles.optionButtonText,
                            value === item && styles.selectedOptionButtonText,
                        ]}> {item} </Text>

                    </TouchableOpacity>
                ))}
            </View>
        );
    };
    const renderFilterSection = ({
        title,
        options,
        value,
        onChange,
    }) => {
    const isOpen = openFilters.includes(title);
    return (
        <View style={styles.filterSection} key={title}>
            <TouchableOpacity
                style={styles.filterSectionHeader}
                onPress={() => {
                    setOpenFilters((previous) =>
                        previous.includes(title)
                            ? previous.filter((item) => item !== title)
                            : [...previous, title]
                    );
                }}
            >
                <Text style={styles.filterSectionTitle}>
                    {title}
                </Text>

                <View style={styles.filterSectionRight}>
                    <Text style={styles.filterSelection}>
                        {value}
                    </Text>

                    <Text style={styles.arrow}>
                        {isOpen ? '▲' : '▼'}
                    </Text>
                </View>
            </TouchableOpacity>

            {isOpen && (
                <View style={styles.filterChoices}>
                    {options.map((item) => (
                        <TouchableOpacity
                            key={item}
                            style={[
                                styles.filterButton,
                                value === item && styles.selectedFilterButton,
                            ]}
                            onPress={() => onChange(item)}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    value === item &&
                                        styles.selectedFilterButtonText,
                                ]}
                            >
                                {item}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
            </View>
        );
    };
        const filteredClothes = filteringClothes();

        return (
            <View style={styles.container}>
                <StatusBar barStyle="dark-content" />
            <View style={styles.header}>
                <Text style={styles.headerText}>My Closet</Text>
                <Text style={styles.subtitle}>
                    {clothes.length} Clothing Items
                </Text>
            </View>

            <Text style = {styles.filterTitle}> Category </Text>
            <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                style={styles.filterScroll}
                contentContainerStyle={styles.filterRow}
            >
            {CATEGORIES.map((item) => (
                <TouchableOpacity
                    key={item}
                    style={[
                        styles.filterButton,
                        selectedCategory === item && styles.selectedFilterButton,
                    ]}
                    onPress={() => setSelectedCategory(item)}
                >
                    <Text
                        style={[
                            styles.filterText,
                            selectedCategory === item && styles.selectedFilterButtonText,
                        ]}
                        >
                            {item}
                        </Text>
                        </TouchableOpacity>
            ))}
            </ScrollView>

            <TouchableOpacity
            style = {styles.filtersToggle}
            onPress={() => setShowFilters(!showFilters)}>

                <Text style = {styles.filtersToggleText}>
                    Filters
                </Text>

                <Text style = {styles.filtersToggleText}>
                    {showFilters ? '▲' : '▼'}
                </Text>
            </TouchableOpacity>


            {
                showFilters && (
                    <View style = {styles.filtersPanel}>
                        <ScrollView
                            nestedScrollEnabled={true}
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            {renderFilterSection({
                                title: 'Colors',
                                options: COLORS,
                                value: selectedColor,
                                onChange: setSelectedColor,
                            })}

                            {renderFilterSection({
                                title: 'Designs',
                                options: DESIGNS,
                                value: selectedDesign,
                                onChange: setSelectedDesign,
                            })}

                            {renderFilterSection({
                                title: 'Materials',
                                options: MATERIALS,
                                value: selectedMaterial,
                                onChange: setSelectedMaterial,
                            })}

                            {renderFilterSection({
                                title: 'Times Worn',
                                options: TIMES_WORN,
                                value: selectedTimesWorn,
                                onChange: setSelectedTimesWorn,
                            })}

                            {renderFilterSection({
                                title: 'Laundry Status',
                                options: LAUNDRY_STATUSES,
                                value: selectedLaundryStatus,
                                onChange: setSelectedLaundryStatus,
                            })}
                        </ScrollView>
                    </View>
                )
            }
            <View style = {styles.resultsRow}>
                <Text style = {styles.resultsText}>
                    {filteredClothes.length} Results
                </Text>

                <TouchableOpacity onPress = {resetFilters}>
                    <Text style={styles.resetText}>Reset Filters</Text>
                </TouchableOpacity>
            </View>

            <ScrollView
            style = {styles.clothesScroll}
            contentContainerStyle={styles.clothingContent}
            showsVerticalScrollIndicator={true}
            >
                <View style = {styles.clothingGrid}>
                    {filteredClothes.map((item) => (
                        <View
                        key = {item.id}
                        style = {styles.clothingGridItem}
                        >
                            <TouchableOpacity
                            style = {styles.clothingCard}
                            onPress={() => {
                                setSelectedClothes(item);
                            }}
                            >
                                <View style = {styles.imagePlaceholder}>
                                    <Text style = {styles.imagePlaceholderText}>
                                        {item.name}
                                    </Text>
                                </View>
                            </TouchableOpacity>

                            <Text style = {styles.clothingName}>
                                {item.name}
                            </Text>
                             <Text style = {styles.clothingDetails}>
                                {item.category} | {item.color} | {item.design}
                            </Text>
                    </View>
                    ))}
                </View>

                {filteredClothes.length === 0 && (
                    <View style = {styles.emptyContainer}>
                        <Text style = {styles.emptyText}>
                            No clothing items match the selected filters.
                        </Text>
                    </View>
                )}

            </ScrollView>


            <TouchableOpacity
                style = {styles.addButton}
                onPress = {() => setIsModalVisible(true)}
            >
                <Text style = {styles.addButtonText}> + Add Clothing Item </Text>
            </TouchableOpacity>


            <Modal
                visible={isModalVisible}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setIsModalVisible(false)}
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContent}>

                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                        >

                            <Text style={styles.modalTitle}>
                                Add Clothing Item
                            </Text>

                            <Text style={styles.inputLabel}>
                                Clothing Name
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Ex: Blue T-Shirt"
                                value={name}
                                onChangeText={setName}
                            />

                            <Text style={styles.inputLabel}>
                                Category
                            </Text>

                            {renderOptions(
                                CATEGORIES,
                                category,
                                setCategory
                            )}

                            <Text style={styles.inputLabel}>
                                Color
                            </Text>

                            {renderOptions(
                                COLORS,
                                color,
                                setColor
                            )}

                            <Text style={styles.inputLabel}>
                                Design
                            </Text>

                            {renderOptions(
                                DESIGNS,
                                design,
                                setDesign
                            )}


                            <Text style={styles.inputLabel}>
                                Material
                            </Text>

                            {renderOptions(
                                MATERIALS,
                                material,
                                setMaterial
                            )}

                            <Text style={styles.inputLabel}>
                                Laundry Status
                            </Text>

                            {renderOptions(
                                LAUNDRY_STATUSES,
                                laundryStatus,
                                setLaundryStatus
                            )}

                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={addClothing}
                            >

                                <Text style={styles.saveButtonText}>
                                    Save
                                </Text>

                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={() => setIsModalVisible(false)}
                            >

                                <Text style={styles.cancelButtonText}>
                                    Cancel
                                </Text>

                            </TouchableOpacity>

                        </ScrollView>

                    </View>

                </View>

            </Modal>


            <Modal
                visible={selectedClothes !== null}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setSelectedClothes(null)}
            >

                <View style={styles.modalOverlay}>

                    <View style={styles.modalContent}>

                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                        >

                            <Text style={styles.modalTitle}>
                                Clothing Item Details
                            </Text>

                            {selectedClothes && (

                                <>

                                    <Text style={styles.detailLabel}>
                                        Name:
                                    </Text>

                                    <Text style={styles.detailValue}>
                                        {selectedClothes.name}
                                    </Text>

                                    <Text style={styles.detailLabel}>
                                        Category:
                                    </Text>

                                    <Text style={styles.detailValue}>
                                        {selectedClothes.category}
                                    </Text>

                                    <Text style={styles.detailLabel}>
                                        Color:
                                    </Text>

                                    <Text style={styles.detailValue}>
                                        {selectedClothes.color}
                                    </Text>

                                    <Text style={styles.detailLabel}>
                                        Design:
                                    </Text>

                                    <Text style={styles.detailValue}>
                                        {selectedClothes.design}
                                    </Text>

                                    <Text style={styles.detailLabel}>
                                        Material:
                                    </Text>

                                    <Text style={styles.detailValue}>
                                        {selectedClothes.material || 'Not Set'}
                                    </Text>

                                    <Text style={styles.detailLabel}>
                                        Times Worn:
                                    </Text>

                                    <Text style={styles.detailValue}>
                                        {selectedClothes.timesWorn ?? 0}
                                    </Text>

                                    <Text style={styles.detailLabel}>
                                        Laundry Status:
                                    </Text>

                                    <Text style={styles.detailValue}>
                                        {selectedClothes.laundryStatus || 'Not Set'}
                                    </Text>

                                    <TouchableOpacity
                                        style={styles.deleteButton}
                                        onPress={() =>
                                            deleteClothing(selectedClothes.id)
                                        }
                                    >
                                        <Text style={styles.deleteButtonText}>
                                            Delete
                                        </Text>

                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={styles.closeButton}
                                        onPress={() => setSelectedClothes(null)}
                                    >

                                        <Text style={styles.closeButtonText}>
                                            Close
                                        </Text>

                                    </TouchableOpacity>

                                </>

                            )}

                        </ScrollView>

                    </View>

                </View>

            </Modal>

        </View>
    );
}


const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 35,
    },

    header: {
        marginBottom: 15,
    },

    headerText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#111111",
    },

    subtitle: {
        fontSize: 14,
        color: "#777777",
        marginTop: 5,
    },

    filterTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#111111",
        marginBottom: 15,
    },

    filterScroll: {
        flexGrow: 0,
        marginBottom: 10,
    },

    filterRow: {
        gap: 10,
        paddingBottom: 5,
    },

    filterButton: {
        paddingVertical: 9,
        paddingHorizontal: 15,
        borderRadius: 20,
        backgroundColor: "#F5F5F5",
        borderWidth: 1,
        borderColor: "#DADADA",
    },

    selectedFilterButton: {
        backgroundColor: "#333333",
        borderColor: "#333333",
    },

    filterText: {
        fontSize: 12,
        color: "#222222",
    },

    selectedFilterButtonText: {
        color: "#FFFFFF",
    },

    filtersToggle: {
        backgroundColor: "#F5F5F5",
        borderWidth: 1,
        borderColor: "#DADADA",
        borderRadius: 12,
        padding: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
    },

    filtersToggleText: {
        fontSize: 15,
        color: "#222222",
        fontWeight: "600",
    },

    filtersPanel: {
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#DADADA",
        borderRadius: 12,
        marginBottom: 10,
        maxHeight: 260,
        overflow: "hidden",
    },

    filterSection: {
        borderBottomWidth: 1,
        borderBottomColor: "#E5E5E5",
    },

    filterSectionHeader: {
        paddingVertical: 14,
        paddingHorizontal: 15,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },

    filterSectionTitle: {
        fontSize: 14,
        fontWeight: "600",
        color: "#222222",
    },

    filterSectionRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
    },

    filterSelection: {
        fontSize: 12,
        color: "#777777",
    },

    arrow: {
        fontSize: 11,
        color: "#444444",
    },

    filterChoices: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        paddingHorizontal: 15,
        paddingBottom: 15,
    },

    resultsRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 15,
    },

    resultsText: {
        fontSize: 12,
        color: "#777777",
    },

    resetText: {
        fontSize: 13,
        color: "#333333",
        fontWeight: "600",
    },

    clothesScroll: {
        flex: 1,
    },

    clothingContent: {
        paddingBottom: 20,
    },

    clothingGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "space-between",
    },

    clothingGridItem: {
        width: "48%",
        marginBottom: 15,
    },

    clothingCard: {
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 10,
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },

    imagePlaceholder: {
        minHeight: 140,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: "#EEEEEE",
    },

    imagePlaceholderText: {
        fontSize: 13,
        color: "#777777",
        textAlign: "center",
    },

    placeHolderText: {
        fontSize: 13,
        color: "#777777",
        textAlign: "center",
    },

    clothingName: {
        marginTop: 5,
        fontSize: 16,
        fontWeight: "600",
        color: "#111111",
    },

    clothingDetails: {
        marginTop: 2,
        fontSize: 13,
        color: "#777777",
    },

    emptyContainer: {
        padding: 20,
        alignItems: "center",
    },

    emptyText: {
        fontSize: 14,
        color: "#777777",
        textAlign: "center",
    },

    addButton: {
        backgroundColor: "#222222",
        padding: 17,
        borderRadius: 12,
        alignItems: "center",
        marginTop: 10,
    },

    addButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },

    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },

    modalContent: {
        maxHeight: "85%",
        padding: 20,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
    },

    modalTitle: {
        marginBottom: 20,
        fontSize: 20,
        fontWeight: "bold",
        color: "#111111",
    },

    inputLabel: {
        marginBottom: 10,
        fontSize: 15,
        fontWeight: "600",
        color: "#222222",
    },

    input: {
        padding: 14,
        borderWidth: 1,
        borderColor: "#DADADA",
        borderRadius: 20,
        fontSize: 15,
        color: "#111111",
        backgroundColor: "#FAFAFA",
        marginBottom: 20,
    },

    optionGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginBottom: 20,
    },

    optionButton: {
        paddingVertical: 9,
        paddingHorizontal: 12,
        borderWidth: 1,
        borderColor: "#DADADA",
        borderRadius: 18,
        backgroundColor: "#F5F5F5",
    },

    selectedOptionButton: {
        borderColor: "#333333",
        backgroundColor: "#333333",
    },

    optionButtonText: {
        fontSize: 13,
        color: "#222222",
    },

    selectedOptionButtonText: {
        color: "#FFFFFF",
    },

    saveButton: {
        marginTop: 5,
        padding: 15,
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: "#222222",
    },

    saveButtonText: {
        fontSize: 16,
        fontWeight: "600",
        color: "#FFFFFF",
    },

    cancelButton: {
        padding: 15,
        alignItems: "center",
    },

    cancelButtonText: {
        fontSize: 15,
        color: "#666666",
    },

    detailLabel: {
        marginBottom: 5,
        fontSize: 15,
        color: "#777777",
    },

    detailValue: {
        marginTop: 4,
        fontSize: 16,
        color: "#111111",
        fontWeight: "600",
    },

    deleteButton: {
        marginTop: 25,
        padding: 15,
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: "#EEEEEE",
        borderWidth: 1,
        borderColor: "#CCCCCC",
    },

    deleteButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#222222",
    },

    closeButton: {
        padding: 15,
        alignItems: "center",
    },

    closeButtonText: {
        fontSize: 15,
        color: "#666666",
    },
});
