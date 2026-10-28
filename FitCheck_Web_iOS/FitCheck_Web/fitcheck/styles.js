import { StyleSheet } from 'react-native';
import { MAX_CONTENT_WIDTH } from './constants';

const styles = StyleSheet.create({
    photoUrlSection: {
        marginVertical: 12,
    },
    photoUrlToggle: {
        alignSelf: "center",
        padding: 12,
    },
    photoUrlInput: {
        marginTop: 8,
        marginBottom: 8,
    },
    photoUrlBusy: {
        opacity: 0.6,
    },
    // On a browser window wider than a phone, cap + center the whole app
    // at phone width (see MAX_CONTENT_WIDTH in constants.js) instead of
    // stretching the grid/cards across the full window.
    container: {
        flex: 1,
        width: "100%",
        maxWidth: MAX_CONTENT_WIDTH,
        // The web root renders as a row-direction flex container, where
        // alignSelf only controls cross-axis (vertical) placement - these
        // auto margins center the capped-width container horizontally
        // instead.
        marginLeft: "auto",
        marginRight: "auto",
        backgroundColor: "#F8F7F4",
        paddingHorizontal: 20,
        // Keep the tabs below the status area and easier to reach.
        paddingTop: 64,
        paddingBottom: 35,
    },


    //container for the clothing images.

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

    // Closet/Wishlist tab switcher, side by side with the active one
    // underlined.
    tabBar: {
        flexDirection: "row",
        marginBottom: 6,
    },

    tabButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    },

    tabText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#777777",
    },

    activeTabText: {
    color: "#252525",
    },

    activeTabUnderline: {
    marginTop: 6,
    width: "80%",
    height: 3,
    borderRadius: 2,
    backgroundColor: "#536B5B",
    },

    // Replaces the old "N Clothing Items" subtitle - sits under the tab
    // bar instead of under a now-removed "My Closet" header.
    itemCountText: {
    fontSize: 13,
    color: "#777777",
    marginBottom: 2,
    },

    // Newest/Oldest sort dropdown + search/filter icons row.
    controlRow: {
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minWidth: 0,
    marginBottom: 8,
    },

    // Let the selected label and arrow determine the sort button width.
    sortDropdownWrapper: {
    alignSelf: "flex-start",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    zIndex: 1,
    },

    sortMenuButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
    },

    sortMenuText: {
    fontSize: 12,
    color: "#777777",
    },

    sortMenuOptions: {
    position: "absolute",
    top: "100%",
    left: 0,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    backgroundColor: "#FFFFFF",
    minWidth: "100%",
    },

    controlActions: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    minWidth: 0,
    marginLeft: 6,
    gap: 2,
    },

    iconButton: {
    flexShrink: 0,
    padding: 3,
    },

    iconButtonText: {
    fontSize: 18,
    },

    // "Select" / "Cancel" text toggle for entering/exiting multi-select mode.
    selectModeButton: {
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 4,
    },

    selectModeButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#536B5B",
    },

    // Replaces the search icon in place when expanded, instead of opening a
    // separate modal.
    searchInputExpanded: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 14,
    fontSize: 12,
    color: "#252525",
    backgroundColor: "#FFFFFF",
    },

    // Horizontal row of category chips (Tops/Bottoms/Socks/Shoes/Suits-Dresses/All),
    // reusing optionButton/selectedOptionButton for the chip shape. Sizing
    // (gap/padding/font) scales with screen width - see CATEGORY_CHIP_* in
    // constants.js - instead of a fixed size tuned for one phone width, so
    // it neither overflows on a narrow phone nor leaves excess empty space
    // on a wider one. categoryTabsRow/categoryChip/categoryChipText are
    // applied inline from those constants in TabScreen.js rather than here.
    categoryTabsScroll: {
    flexGrow: 0,
    marginBottom: 15,
    },

    categoryTabsRow: {
    flexDirection: "row",
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

    // "space-between" assumed exactly 2 fixed-ratio columns; with fixed-width
    // cards we just want them to flow left-to-right and wrap, with a little
    // gap between them, how ever many fit per row.
    // Width is pinned to the current gridWidth (see
    // getResponsiveLayout() in constants.js - exactly 3 cards + 2 gaps,
    // applied inline in TabScreen.js since it depends on live window width)
    // and centered as a whole block via alignSelf, instead of centering each
    // wrapped row individually - that would also center a trailing partial
    // row (e.g. 2 leftover items), making it float instead of lining up
    // under the full rows above. cardWidth already reserves gutter space
    // for a vertical scrollbar that may appear once items overflow, so this
    // block's own whitespace margin shows up evenly on both sides before
    // the scrollbar appears, and silently shifts left once it does, without
    // changing card size or row alignment either way.
    clothingGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    alignSelf: "center",
    },

    // Fixed width (sized to the image box below + padding) instead of "48%",
    // so the card itself is only as wide as its photo - not half the screen
    // - regardless of how many items are in the closet.
    clothingCard: {
    width: 140,
    // Fixed height so every card is a uniform size regardless of name
    // length - 120px photo + padding + 1 line each of name/details.
    // Paired with numberOfLines=1 on the text below so long names are
    // truncated with "..." instead of wrapping and breaking the height.
    height: 190,
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 10,
    marginBottom: 15,
    },

    imagePlaceholder: {
    // Fixed pixel size so the photo is always the same square size.
    width: 120,
    height: 120,
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#EAEAEA",
    overflow: "hidden",
    },

    placeHolderText: {
    fontSize: 13,
    color: "#777777",
    },

    // Fills the imagePlaceholder box once a photo (local or, later, remote URL) exists.
    imagePreview: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    },

    clothingName: {
    marginTop: 5,
    fontSize: 16,
    fontWeight: "600",
    color: "#252525",
    },

    clothingDetails: {
    marginTop: 2,
    fontSize: 13,
    color: "#777777",
    },

    // Selection checkmark overlay shown in a card's top-right corner during
    // multi-select mode - a plain circle, filled when the card is selected.
    selectionBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    backgroundColor: "rgba(37,37,37,0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    },

    selectionBadgeSelected: {
    backgroundColor: "#536B5B",
    },

    // Favorite heart overlay, top-left corner of a card's photo (mirrors
    // selectionBadge's top-right placement) - tap to toggle favorite
    // without opening the Detail modal.
    favoriteBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(37,37,37,0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
    },

    emptyContainer: {
    padding: 20,
    alignItems: "center",
    },

    emptyText: {
    fontSize: 14,
    color: "#777777",
    },

    // Row holding the floating "+" button (and, for tabs that opt in via
    // fieldsConfig.enableQuickDelete, a "-" button beside it) bottom-center
    // over the grid - position is absolute relative to `container` so it
    // stays put while the grid scrolls underneath it. alignSelf centers it
    // on container's cross axis regardless of screen width, instead of a
    // fixed left/right offset.
    floatingButtonRow: {
    position: "absolute",
    alignSelf: "center",
    bottom: 35,
    flexDirection: "row",
    gap: 14,
    },

    addButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: "#536B5B",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 4,
    },

    addButtonText: {
        fontSize: 24,
        fontWeight: "600",
        lineHeight: 24,
        color: "#FFFFFF",
    },

    // Bulk action bar shown bottom-center (replacing the floating add
    // button) while in multi-select mode with at least one item selected.
    bulkActionBar: {
        position: "absolute",
        alignSelf: "center",
        bottom: 25,
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
        paddingHorizontal: 14,
        borderRadius: 24,
        backgroundColor: "#FFFFFF",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 4,
    },

    bulkActionBarCount: {
        fontSize: 13,
        color: "#777777",
        marginRight: 4,
    },

    bulkActionButton: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 18,
        backgroundColor: "#536B5B",
    },

    bulkActionButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
    },

    bulkDeleteButton: {
    backgroundColor: "#FCE8E8",
    },

    bulkDeleteButtonText: {
    color: "#842318",
    },

    //Modal for scanner, photo roll, and image search.

    /*
    modalAddFunction{
    flex: 3,
    justifyContent: "center",
    padding: 15,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    },

    */
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        padding: 20,
        backgroundColor: "rgba(0, 0, 0, 0.45)",
    },

    // Modal renders as a portal outside `container`, so it doesn't inherit
    // container's width cap - capped + centered here too, same
    // MAX_CONTENT_WIDTH, so dialogs stay phone-width on a wide browser
    // instead of stretching full viewport width.
    modalContent: {
        width: "100%",
        maxWidth: MAX_CONTENT_WIDTH,
        alignSelf: "center",
        maxHeight: "95%",
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
    borderRadius: 20,
    fontSize: 15,
    color: "#252525",
    marginBottom: 20,
    // Small horizontal inset so the box doesn't sit flush against the
    // modal's own inner edges - just enough breathing room, not a
    // visible width change.
    marginHorizontal: 4,
    },

    optionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
    },

    // Wraps every Category/Color/Design/Material Picker (filter bar, Add
    // form, and Detail modal) so each dropdown gets a consistent bordered
    // box instead of relying on the OS-default look, which varies a lot
    // between web/iOS/Android.
    dropdownWrapper: {
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginBottom: 15,
    marginHorizontal: 4,
    overflow: "hidden",
    },

    dropdownPicker: {
    width: "100%",
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

    favoriteButton: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    },

    favoriteButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#252525",
    },

    // Wishlist-only "Move to Closet" button in the Detail modal, placed
    // directly under favoriteButton - same shape, tinted with the app's
    // accent color instead of a neutral border to read as a distinct action.
    moveToClosetButton: {
    flexDirection: "row",
    marginBottom: 15,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#536B5B",
    backgroundColor: "#EDF2EE",
    },

    moveToClosetButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#536B5B",
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

export default styles;
