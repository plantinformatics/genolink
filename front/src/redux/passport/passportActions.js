export const setIsSubmit = (isSubmit) => ({
  type: "SET_IS_SUBMIT",
  payload: isSubmit,
});

export const setSearchResults = (results) => ({
  type: "SET_SEARCH_RESULTS",
  payload: results,
});

export const setInstituteCheckedBoxes = (boxes) => ({
  type: "SET_INSTITUTE_CHECKED_BOXES",
  payload: boxes,
});
export const setCropCheckedBoxes = (boxes) => ({
  type: "SET_CROP_CHECKED_BOXES",
  payload: boxes,
});
export const setTaxonomyCheckedBoxes = (boxes) => ({
  type: "SET_TAXONOMY_CHECKED_BOXES",
  payload: boxes,
});
export const setOriginOfMaterialCheckedBoxes = (boxes) => ({
  type: "SET_ORIGIN_OF_MATERIAL_CHECKED_BOXES",
  payload: boxes,
});
export const setSampStatCheckedBoxes = (boxes) => ({
  type: "SET_SAMP_STAT_CHECKED_BOXES",
  payload: boxes,
});
export const setGermplasmStorageCheckedBoxes = (boxes) => ({
  type: "SET_GERMPLASM_STORAGE_CHECKED_BOXES",
  payload: boxes,
});
export const setInstituteCode = (codes) => ({
  type: "SET_INSTITUTE_CODE",
  payload: codes,
});

export const setCropList = (crops) => ({
  type: "SET_CROP_LIST",
  payload: crops,
});

export const setTaxonomyList = (tax) => ({
  type: "SET_TAXONOMY_LIST",
  payload: tax,
});

export const setOriginOfMaterialList = (origin) => ({
  type: "SET_ORIGIN_OF_MATERIAL_LIST",
  payload: origin,
});

export const setSampStatList = (stat) => ({
  type: "SET_SAMP_STAT_LIST",
  payload: stat,
});

export const setGermplasmStorageList = (storage) => ({
  type: "SET_GERMPLASM_STORAGE_LIST",
  payload: storage,
});

export const setResetTrigger = (isTrigger) => ({
  type: "SET_RESET_TRIGGER",
  payload: isTrigger,
});
export const setPassportCurrentPage = (currentPage) => ({
  type: "SET_PASSPORT_CURRENT_PAGE ",
  payload: currentPage,
});
export const setAccessionNumbers = (accessions) => ({
  type: "SET_ACCESSION_NUMBERS",
  payload: accessions,
});
export const setGenotypeIds = (genotypeIds) => ({
  type: "SET_GENOTYPE_IDS",
  payload: genotypeIds,
});
export const setFigs = (figs) => ({
  type: "SET_FIGS",
  payload: figs,
});
export const setSelectedFig = (selectedFig) => ({
  type: "SET_SELECTED_FIG",
  payload: selectedFig,
});
export const setTotalAccessions = (totalAccessions) => ({
  type: "SET_TOTAL_ACCESSIONS",
  payload: totalAccessions,
});
export const setTotalPreGenotypedAccessions = (
  totalPreGenotypedAccessions
) => ({
  type: "SET_TOTAL_PRE_GENOTYPED_ACCESSIONS",
  payload: totalPreGenotypedAccessions,
});
export const setCreationStartDate = (creationStartDate) => ({
  type: "SET_CREATION_START_DATE",
  payload: creationStartDate,
});
export const setCreationEndDate = (creationEndDate) => ({
  type: "SET_CREATION_END_DATE",
  payload: creationEndDate,
});
export const setCheckedAccessions = (accessions) => ({
  type: "SET_CHECKED_ACCESSIONS",
  payload: accessions,
});
export const setCheckedAccessionNames = (accessionNames) => ({
  type: "SET_CHECKED_ACCESSION_NAMES",
  payload: accessionNames,
});
export const setPlatform = (platform) => ({
  type: "SET_PLATFORM",
  payload: platform,
});
export const setActiveFilters = (activeFilters) => ({
  type: "SET_ACTIVE_FILTERS",
  payload: activeFilters,
});
export const setWildSearchValue = (wildSearchValue) => ({
  type: "SET_WILD_SEARCH_VALUE",
  payload: wildSearchValue,
});
