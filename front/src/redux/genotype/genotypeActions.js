export const setSelectedOption = (option) => ({
  type: "SET_SELECTED_OPTION",
  payload: option,
});

export const setGenomData = (data) => ({
  type: "SET_GENOM_DATA",
  payload: data,
});

export const setAlleleData = (data) => ({
  type: "SET_ALLELE_DATA",
  payload: data,
});

export const setSelectedDataset = (dataset) => ({
  type: "SET_SELECTED_DATASET",
  payload: dataset,
});

export const setSelectedStudyDbId = (studyDbId) => ({
  type: "SET_SELECTED_STUDY_DB_ID",
  payload: studyDbId,
});

export const setSelectedVariantSetDbId = (variantSetDbId) => ({
  type: "SET_SELECTED_VARIANT_SET_DB_ID",
  payload: variantSetDbId,
});

export const setCallSetDbIds = (callSetDbIds) => ({
  type: "SET_CALL_SET_DB_IDS",
  payload: callSetDbIds,
});

export const setGermplasms = (germplasms) => ({
  type: "SET_GERMPLASMS",
  payload: germplasms,
});

export const setCompleteNames = (names) => ({
  type: "SET_COMPLETE_NAMES",
  payload: names,
});

export const setSelectedSamplesDetails = (details) => ({
  type: "SET_SELECTED_SAMPLES_DETAILS",
  payload: details,
});

export const setSelectedCallSetDetails = (details) => ({
  type: "SET_SELECTED_CALL_SET_DETAILS",
  payload: details,
});

export const setGenotypeCurrentPage = (page) => ({
  type: "SET_Genotype_CURRENT_PAGE",
  payload: page,
});

export const setVariantList = (list) => ({
  type: "SET_VARIANT_LIST",
  payload: list,
});

export const setSelectedGroups = (groups) => ({
  type: "SET_SELECTED_GROUPS",
  payload: groups,
});

export const setIsGenomeSearchSubmit = (isSubmitted) => ({
  type: "SET_IS_GENOME_SEARCH_SUBMIT",
  payload: isSubmitted,
});

export const setNumberOfGenesysAccessions = (count) => ({
  type: "SET_NUMBER_OF_GENESYS_ACCESSIONS",
  payload: count,
});

export const setNumberOfPresentAccessions = (count) => ({
  type: "SET_NUMBER_OF_PRESENT_ACCESSIONS",
  payload: count,
});

export const setNumberOfMappedAccessions = (count) => ({
  type: "SET_NUMBER_OF_MAPPED_ACCESSIONS",
  payload: count,
});

export const setDatasets = (datasets) => ({
  type: "SET_DATASETS",
  payload: datasets,
});

export const setCallSetDetails = (details) => ({
  type: "SET_CALL_SET_DETAILS",
  payload: details,
});

export const setVariantSetDbIds = (ids) => ({
  type: "SET_VARIANT_SET_DB_IDS",
  payload: ids,
});

export const setSampleVcfNames = (names) => ({
  type: "SET_SAMPLE_VCF_NAMES",
  payload: names,
});

export const setPagesPerServer = (pages) => ({
  type: "SET_PAGES_PER_SERVER",
  payload: pages,
});

export const setPageLengths = (lengths) => ({
  type: "SET_PAGE_LENGTHS",
  payload: lengths,
});

export const setLinkageGroups = (groups) => ({
  type: "SET_LINKAGE_GROUPS",
  payload: groups,
});

export const resetGenotype = () => ({
  type: "RESET_GENOTYPE",
});

export const setLoadingGenotypedAccessions = (isLoading) => ({
  type: "SET_LOADING_GENOTYPED_ACCESSIONS",
  payload: isLoading,
});
