import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    ScrollView,
    StatusBar,
    Alert,
    Modal,
    TextInput,
} from 'react-native';

const CATEGORIES = [
    "All",
    "Tops",
    "Bottoms",
    "Dresses",
    "Outerwear",
    "Accessories",
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
export default function App() {
    
    {/* Screens 

        const [home, setHome] = useState(['closet']);
        
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

    //adding a clothing item
    const addClothing = () => {
        if (!name.trim()){
            Alert.alert('Error', 'Please enter a name for the clothing item.');
            return;
        }

        const newClothingItem = {
            id: Date.now().toString() + Math.random().toString(),
            name: name.trim(),
            category: category.trim(),
            color: color.trim(),
            design: design.trim(),
        }

        setClothes([...clothes, newClothingItem]);

        //Reset the clothing input fields and close the modal
        setName('');
        setCategory('');
        setColor('');
        setDesign('');

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
                        clothes.filter((item) => item.id !== selectedClothes.id)
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

            return matchesCategory && matchesColor && matchesDesign;
        });
    };

        {/* Reseting the filters*/}
        const resetFilters = () => {
            setSelectedCategory('All');
            setSelectedColor('All');
            setSelectedDesign('All');
        };

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

            {/* Filtering Colors */}
            <Text style = {styles.filterTitle}> Colors </Text>
            <ScrollView 
            horizontal  = {true}
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
            >
            {COLORS.map((item) => (
                <TouchableOpacity
                    key={item}
                    style={[
                        styles.filterButton,
                        selectedColor === item && styles.selectedFilterButton,
                    ]}
                    onPress={() => setSelectedColor(item)}
                >
                    <Text
                        style={[
                            styles.filterText,
                            selectedColor === item && styles.selectedFilterButtonText,
                        ]}
                        >
                            {item}
                        </Text>
                        </TouchableOpacity>
            ))}
            </ScrollView>

            {/* Filtering designs */}
            <Text style = {styles.filterTitle}> Designs </Text>
            <ScrollView 
            horizontal  = {true}
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
            contentContainerStyle={styles.filterRow}
            >
            {DESIGNS.map((item) => (
                <TouchableOpacity
                    key={item}
                    style={[
                        styles.filterButton,
                        selectedDesign === item && styles.selectedFilterButton,
                    ]}
                    onPress={() => setSelectedDesign(item)}
                >
                    <Text
                        style={[
                            styles.filterText,
                            selectedDesign === item && styles.selectedFilterButtonText,
                        ]}
                        >
                            {item}
                        </Text>
                        </TouchableOpacity>
            ))}
            </ScrollView>

            <View style = {styles.resultsRow}>
                <Text style = {styles.resultsText}>
                    {filteringClothes().length} Results
                </Text>
                <TouchableOpacity onPress = {() => resetFilters()}>
                    <Text style = {styles.resetText}> Reset Filters </Text>
                </TouchableOpacity>
            </View>
            <ScrollView 
            style = {styles.clothesScroll}
            contentContainerStyle = {styles.clothingContent}
            showsVerticalScrollIndicator = {true}
            >
                <View style = {styles.clothingGrid}>
                    {filteringClothes().map((item) => (
                        <View key={item.id}>
                        <TouchableOpacity
                            style = {styles.clothingCard}
                            onPress = {() => {
                                setSelectedClothes(item)}}>
                        <View style = {styles.imagePlaceholder}>
                        <Text style = {styles.placeHolderText}>
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

                {filteringClothes().length === 0 && (
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

            <Modal visible = {isModalVisible} 
            transparent = {true}
            animationType = "slide"
            onRequestClose = {() => setIsModalVisible(false)}
            >
                    <View style = {styles.modalOverlay}>
                        <View style = {styles.modalContent}>
                            <ScrollView
                                showsVerticalScrollIndicator={true}
                                keyboardShouldPersistTaps="handled"
                            >
                                <Text style = {styles.modalTitle}> Add Clothing Item </Text>
                                <Text style = {styles. inputLabel}> Clothing Name </Text>
                                <TextInput
                                    style = {styles.input}
                                    placeholder = "Ex: Blue T-Shirt"
                                    value = {name}
                                    onChangeText = {setName}
                                />

                            <Text style = {styles.inputLabel}> Category </Text>

                            <View style = {styles.optionGrid}>
                                {CATEGORIES.filter((item) => item !== 'All').map((item) => (
                                    <TouchableOpacity
                                        key = {item}
                                        style = {[
                                            styles.optionButton,
                                            category === item && styles.selectedOptionButton,
                                        ]}
                                        onPress = {() => setCategory(item)}
                                    >
                                        <Text
                                            style = {[
                                                styles.optionButtonText,
                                                category === item && styles.selectedOptionButtonText,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style = {styles.inputLabel}> Color </Text>
                            <View style = {styles.optionGrid}>
                                {COLORS.filter((item) => item !== 'All').map((item) => (
                                    <TouchableOpacity
                                        key = {item}
                                        style = {[
                                            styles.optionButton,
                                            color === item && styles.selectedOptionButton,
                                        ]}
                                        onPress = {() => setColor(item)}
                                    >
                                        <Text
                                            style = {[
                                                styles.optionButtonText,
                                                color === item && styles.selectedOptionButtonText,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            <Text style = {styles.inputLabel}> Design </Text>
                            <View style = {styles.optionGrid}>
                                {DESIGNS.filter((item) => item !== 'All').map((item) => (
                                    <TouchableOpacity
                                        key = {item}
                                        style = {[
                                            styles.optionButton,
                                            design === item && styles.selectedOptionButton,
                                        ]}
                                        onPress = {() => setDesign(item)}
                                    >
                                        <Text
                                            style = {[
                                                styles.optionButtonText,
                                                design === item && styles.selectedOptionButtonText,
                                            ]}
                                        >
                                            {item}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            
                            <TouchableOpacity 
                            style = {styles.saveButton}
                            onPress = {addClothing}
                            >
                                <Text style = {styles.saveButtonText}> Save </Text>
                            </TouchableOpacity>
                            
                            <TouchableOpacity 
                            style = {styles.cancelButton}
                            onPress = {() => setIsModalVisible(false)}
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
            onRequestClose = {() => setSelectedClothes(null)}
            >
                <View style = {styles.modalOverlay}>
                    <View style = {styles.modalContent}>
                        <ScrollView
                            showsVerticalScrollIndicator={true}
                            keyboardShouldPersistTaps="handled"
                        >
                            <Text style = {styles.modalTitle}> Clothing Item Details </Text>
                            {selectedClothes && (
                                <>
                                    <Text style = {styles.detailLabel}> Name: </Text>
                                    <Text style = {styles.detailValue}> {selectedClothes.name} </Text>
                                    <Text style = {styles.detailLabel}> Category: </Text>
                                    <Text style = {styles.detailValue}> {selectedClothes.category} </Text>
                                    <Text style = {styles.detailLabel}> Color: </Text>
                                    <Text style = {styles.detailValue}> {selectedClothes.color} </Text>
                                    <Text style = {styles.detailLabel}> Design: </Text>
                                    <Text style = {styles.detailValue}> {selectedClothes.design} </Text>
                                    <TouchableOpacity 
                                    style = {styles.deleteButton}
                                    onPress = {() => deleteClothing(selectedClothes.id)}
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
                    </View>
                </View>
            </Modal>
        </View>
        );
        {/*  
        return(
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" />
        {screen === 'closet' }
        
          ) */
       }
    }

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F8F7F4",
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 35,
    },

    header:{
        marginBottom: 15,
    },

    headerText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#252525",
    },

    subtitle:{
        fontSize: 14,
        color: "#777777",
        marginTop: 5,
    },

    filterTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: "#252525",
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
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E5E5E5",
    },

    selectedFilterButton: {
        backgroundColor: "#536B5B",
        borderColor: "#536B5B",
    },

    filterText: {
        fontSize: 12,
        color: "#252525",
    },

    selectedFilterButtonText: {
        color: "#FFFFFF",
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
        color: "#536B5B",
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

    clothingCard: {
        width: "48%",
        backgroundColor: "#FFFFFF",
        borderRadius: 15,
        padding: 10,
        marginBottom: 15,
    },

    imagePlaceholder: {
        minHeight: 140,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: "#EAEAEA",
    },

    placeHolderText: {
        fontSize: 13,
        color: "#777777",
    },

    clothingName: {
        marginTop: 10,
        fontSize: 16,
        fontWeight: "600",
        color: "#252525",
    },

    clothingDetails: {
        marginTop: 4,
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
    },

    addButton: {
        backgroundColor: "#536B5B",
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
        color: "#252525",
    },

    inputLabel: {
        marginBottom: 10,
        fontSize: 15,
        fontWeight: "600",
        color: "#252525",
    },

    input: {
        padding: 14,
        borderWidth: 1,
        borderColor: "#E5E5E5",
        borderRadius: 10,
        fontSize: 15,
        color: "#252525",
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
        borderColor: "#F8F7F4",
        borderRadius: 18,
        backgroundColor: "#E5E5E5",
    },

    selectedOptionButton: {
        borderColor: "#536B5B",
        backgroundColor: "#536B5B",
    },

    optionButtonText: {
        fontSize: 13,
        color: "#252525",
    },

    selectedOptionButtonText: {
        color: "#FFFFFF",
    },

    saveButton: {
        marginTop: 5,
        padding: 15,
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: "#536B5B",
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
        color: "#777777",
    },

    detailLabel: {
        marginBottom: 5,
        fontSize: 15,
        color: "#777777",
    },

    detailValue: {
        marginTop: 4,
        fontSize: 16,
        color: "#252525",
        fontWeight: "600",
    },

    deleteButton: {
        marginTop: 25,
        padding: 15,
        alignItems: "center",
        borderRadius: 10,
        backgroundColor: "#FCE8E8",
    },

    deleteButtonText: {
        fontSize: 15,
        fontWeight: "600",
        color: "#842318",
    },

    closeButton: {
        padding: 15,
        alignItems: "center",
    },

    closeButtonText: {
        fontSize: 15,
        color: "#777777",
    },
});