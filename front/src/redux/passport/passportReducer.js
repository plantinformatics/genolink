const initialState = {
  isSubmit: false,
  searchResults: {},
  instituteCheckedBoxes: [],
  cropCheckedBoxes: [],
  taxonomyCheckedBoxes: [],
  originOfMaterialCheckedBoxes: [],
  sampStatCheckedBoxes: [],
  germplasmStorageCheckedBoxes: [],
  instituteCode: [],
  cropList: [],
  taxonomyList: [],
  originOfMaterialList: [],
  sampStatList: [],
  germplasmStorageList: [],
  resetTrigger: false,
  passportCurrentPage: 0,
  accessionNumbers: [],
  genotypeIds: [],
  figs: [],
  totalAccessions: 0,
  totalPreGenotypedAccessions: 0,
  creationStartDate: null,
  creationEndDate: null,
  checkedAccessions: {},
  checkedAccessionNames: {},
  platform: "Gigwa",
  activeFilters: [],
  wildSearchValue: "",
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_CHECKED_ACCESSION_NAMES":
      return {
        ...state,
        checkedAccessionNames: action.payload,
      };
    case "SET_CHECKED_ACCESSIONS":
      return {
        ...state,
        checkedAccessions: action.payload,
      };
    case "SET_IS_SUBMIT":
      return {
        ...state,
        isSubmit: action.payload,
      };

    case "SET_SEARCH_RESULTS":
      return {
        ...state,
        searchResults: action.payload,
      };

    case "SET_INSTITUTE_CHECKED_BOXES":
      return {
        ...state,
        instituteCheckedBoxes: action.payload,
      };
    case "SET_CROP_CHECKED_BOXES":
      return {
        ...state,
        cropCheckedBoxes: action.payload,
      };
    case "SET_TAXONOMY_CHECKED_BOXES":
      return {
        ...state,
        taxonomyCheckedBoxes: action.payload,
      };
    case "SET_ORIGIN_OF_MATERIAL_CHECKED_BOXES":
      return {
        ...state,
        originOfMaterialCheckedBoxes: action.payload,
      };
    case "SET_SAMP_STAT_CHECKED_BOXES":
      return {
        ...state,
        sampStatCheckedBoxes: action.payload,
      };
    case "SET_GERMPLASM_STORAGE_CHECKED_BOXES":
      return {
        ...state,
        germplasmStorageCheckedBoxes: action.payload,
      };
    case "SET_INSTITUTE_CODE":
      return {
        ...state,
        instituteCode: action.payload,
      };
    case "SET_CROP_LIST":
      return {
        ...state,
        cropList: action.payload,
      };
    case "SET_TAXONOMY_LIST":
      return {
        ...state,
        taxonomyList: action.payload,
      };

    case "SET_ORIGIN_OF_MATERIAL_LIST":
      return {
        ...state,
        originOfMaterialList: action.payload,
      };
    case "SET_SAMP_STAT_LIST":
      return {
        ...state,
        sampStatList: action.payload,
      };
    case "SET_GERMPLASM_STORAGE_LIST":
      return {
        ...state,
        germplasmStorageList: action.payload,
      };
    case "SET_RESET_TRIGGER":
      return {
        ...state,
        resetTrigger: action.payload,
      };
    case "SET_PASSPORT_CURRENT_PAGE ":
      return {
        ...state,
        passportCurrentPage: action.payload,
      };
    case "SET_ACCESSION_NUMBERS":
      return {
        ...state,
        accessionNumbers: action.payload,
      };
    case "SET_GENOTYPE_IDS":
      return {
        ...state,
        genotypeIds: action.payload,
      };
    case "SET_FIGS":
      return {
        ...state,
        figs: action.payload,
      };
    case "SET_TOTAL_ACCESSIONS":
      return {
        ...state,
        totalAccessions: action.payload,
      };
    case "SET_TOTAL_PRE_GENOTYPED_ACCESSIONS":
      return {
        ...state,
        totalPreGenotypedAccessions: action.payload,
      };
    case "SET_CREATION_START_DATE":
      return {
        ...state,
        creationStartDate: action.payload,
      };
    case "SET_CREATION_END_DATE":
      return {
        ...state,
        creationEndDate: action.payload,
      };
    case "SET_PLATFORM":
      return {
        ...state,
        platform: action.payload,
      };
    case "SET_ACTIVE_FILTERS":
      return {
        ...state,
        activeFilters: action.payload,
      };
    case "SET_WILD_SEARCH_VALUE":
      return {
        ...state,
        wildSearchValue: action.payload,
      };
    default:
      return state;
  }
};

export default rootReducer;
