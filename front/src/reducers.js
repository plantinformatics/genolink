const initialState = {
  isSubmit: false,
  searchQuery: "",
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
  accessionNumber: "",
  resetTrigger: false,
  currentPage: 0,
  accessionNumbers: [],
  totalAccessions: 0,
  searchAcc: "",
  creationStartDate: null,
  creationEndDate: null,
  checkedAccessions: {},
  platform: "Gigwa",
};

const rootReducer = (state = initialState, action) => {
  switch (action.type) {
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

    case "SET_SEARCH_QUERY":
      return {
        ...state,
        searchQuery: action.payload,
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
    case "SET_ACCESSION_NUMBER":
      return {
        ...state,
        accessionNumber: action.payload,
      };
    case "SET_RESET_TRIGGER":
      return {
        ...state,
        resetTrigger: action.payload,
      };
    case "SET_CURRENT_PAGE":
      return {
        ...state,
        currentPage: action.payload,
      };
    case "SET_ACCESSION_NUMBERS":
      return {
        ...state,
        accessionNumbers: action.payload,
      };

    case "SET_TOTAL_ACCESSIONS":
      return {
        ...state,
        totalAccessions: action.payload,
      };
    case "SET_SEARCH_ACC":
      return {
        ...state,
        searchAcc: action.payload,
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
    default:
      return state;
  }
};

export default rootReducer;
