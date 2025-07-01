const initialState = {
  selectedOption: "Gigwa",
  genomData: [],
  alleleData: [],
  selectedDataset: "",
  selectedStudyDbId: [],
  selectedVariantSetDbId: [],
  sampleDbIds: [],
  sampleNames: [],
  completeNames: [],
  selectedSamplesDetails: [],
  genotypeCurrentPage: 1,
  variantList: [],
  selectedGroups: [],
  isGenomeSearchSubmit: false,
  numberOfGenesysAccessions: null,
  numberOfPresentAccessions: null,
  numberOfMappedAccessions: null,
  datasets: [],
  sampleDetails: [],
  variantSetDbIds: [],
  sampleVcfNames: [],
  pagesPerServer: [],
  pageLengths: [],
  linkageGroups: [],
  isLoadingGenotypedAccessions: false,
};

const genotypeReducer = (state = initialState, action) => {
  switch (action.type) {
    case "SET_SELECTED_OPTION":
      return { ...state, selectedOption: action.payload };
    case "SET_GENOM_DATA":
      return { ...state, genomData: action.payload };
    case "SET_ALLELE_DATA":
      return { ...state, alleleData: action.payload };
    case "SET_SELECTED_DATASET":
      return { ...state, selectedDataset: action.payload };
    case "SET_SELECTED_STUDY_DB_ID":
      return { ...state, selectedStudyDbId: action.payload };
    case "SET_SELECTED_VARIANT_SET_DB_ID":
      return { ...state, selectedVariantSetDbId: action.payload };
    case "SET_SAMPLE_DB_IDS":
      return { ...state, sampleDbIds: action.payload };
    case "SET_SAMPLE_NAMES":
      return { ...state, sampleNames: action.payload };
    case "SET_COMPLETE_NAMES":
      return { ...state, completeNames: action.payload };
    case "SET_SELECTED_SAMPLES_DETAILS":
      return { ...state, selectedSamplesDetails: action.payload };
    case "SET_Genotype_CURRENT_PAGE":
      return { ...state, genotypeCurrentPage: action.payload };
    case "SET_VARIANT_LIST":
      return { ...state, variantList: action.payload };
    case "SET_SELECTED_GROUPS":
      return { ...state, selectedGroups: action.payload };
    case "SET_IS_GENOME_SEARCH_SUBMIT":
      return { ...state, isGenomeSearchSubmit: action.payload };
    case "SET_NUMBER_OF_GENESYS_ACCESSIONS":
      return { ...state, numberOfGenesysAccessions: action.payload };
    case "SET_NUMBER_OF_PRESENT_ACCESSIONS":
      return { ...state, numberOfPresentAccessions: action.payload };
    case "SET_NUMBER_OF_MAPPED_ACCESSIONS":
      return { ...state, numberOfMappedAccessions: action.payload };
    case "SET_DATASETS":
      return { ...state, datasets: action.payload };
    case "SET_SAMPLE_DETAILS":
      return { ...state, sampleDetails: action.payload };
    case "SET_VARIANT_SET_DB_IDS":
      return { ...state, variantSetDbIds: action.payload };
    case "SET_SAMPLE_VCF_NAMES":
      return { ...state, sampleVcfNames: action.payload };
    case "SET_PAGES_PER_SERVER":
      return { ...state, pagesPerServer: action.payload };
    case "SET_PAGE_LENGTHS":
      return { ...state, pageLengths: action.payload };
    case "SET_LINKAGE_GROUPS":
      return { ...state, linkageGroups: action.payload };
    case "SET_LOADING_GENOTYPED_ACCESSIONS":
      return {
        ...state,
        isLoadingGenotypedAccessions: action.payload,
      };
    case "RESET_GENOTYPE":
      return initialState;
    default:
      return state;
  }
};

export default genotypeReducer;
