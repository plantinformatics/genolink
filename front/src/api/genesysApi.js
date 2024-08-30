import axios from "axios";
// import { genesysServer } from "../config/apiConfig";
import {
  setSearchResults,
  setInstituteCode,
  setCropList,
  setTaxonomyList,
  setOriginOfMaterialList,
  setTotalAccessions,
  setCurrentPage,
  setSearchAcc,
  setResetTrigger,
} from '../actions';

export const fetchInitialData = async (token, dispatch, userInput=" ") => {
  try {
    const body = { _text: userInput};
    const response = await axios.post('https://api.sandbox.genesys-pgr.org/api/v1/acn/filter?l=1', body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
    });

    const searchData = response.data;
    const codes = searchData.suggestions["institute.code"].terms
      .map((item) => [item.term, item.count])
      .filter((code, index, arr) => arr.indexOf(code) === index);
    const crops = searchData.suggestions["crop.shortName"].terms
      .map((item) => [item.term, item.count])
      .filter((code, index, arr) => arr.indexOf(code) === index);
    const taxons = searchData.suggestions["taxonomy.genus"].terms
      .map((item) => [item.term, item.count])
      .filter((code, index, arr) => arr.indexOf(code) === index);
    const origins = searchData.suggestions["countryOfOrigin.code3"].terms
      .map((item) => [item.term, item.count])
      .filter((code, index, arr) => arr.indexOf(code) === index);

    dispatch(setInstituteCode(codes));
    dispatch(setCropList(crops));
    dispatch(setTaxonomyList(taxons));
    dispatch(setOriginOfMaterialList(origins));
    dispatch(setCurrentPage(0)); // Reset page count
  } catch (error) {
    console.error("Error fetching initial data:", error);
    throw error;
  }
};

export const fetchInitialData2 = async (token, dispatch, userInput=" ") => {
  try {
    const body = { _text: userInput};
    const pageSize = 500;
    const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,institute.country.name";
    const response = await axios.post(`https://api.sandbox.genesys-pgr.org/api/v1/acn/query?p=0&l=${pageSize}&select=${select}`, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json, text/plain, */*",
      },
    });

    const searchData = response.data;
    dispatch(setSearchResults(searchData));
    dispatch(setTotalAccessions(searchData.totalElements));
    dispatch(setCurrentPage(0));
    return searchData.filterCode;
  } catch (error) {
    console.error("Error fetching initial data:", error);
    throw error;
  }
};

export const applyFilter = async (token, filterData, dispatch) => {
  try {
    const pageSize = 500;
    const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate";
    const [response1, response2] = await Promise.all([
      axios.post(
        `https://api.sandbox.genesys-pgr.org/api/v1/acn/query?p=0&l=${pageSize}&select=${select}`,
        filterData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
          },
        }
      ),
      axios.post(
        "https://api.sandbox.genesys-pgr.org/api/v1/acn/filter",
        filterData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/json, text/plain, */*",
          },
        }
      )
    ]);

    dispatch(setSearchResults(response1.data));
    const codes = response2.data.suggestions["institute.code"].terms
      .map((item) => [item.term, item.count])
      .filter((code, index, arr) => arr.indexOf(code) === index);
    const crops = response2.data.suggestions["crop.shortName"].terms
      .map((item) => [item.term, item.count])
      .filter((code, index, arr) => arr.indexOf(code) === index);
    const taxons = response2.data.suggestions["taxonomy.genus"].terms
      .map((item) => [item.term, item.count])
      .filter((code, index, arr) => arr.indexOf(code) === index);
    const origins = response2.data.suggestions["countryOfOrigin.code3"].terms
      .map((item) => [item.term, item.count])
      .filter((code, index, arr) => arr.indexOf(code) === index);
    dispatch(setInstituteCode(codes));
    dispatch(setCropList(crops));
    dispatch(setTaxonomyList(taxons));
    dispatch(setOriginOfMaterialList(origins));
    dispatch(setTotalAccessions(response1.data.totalElements));
    dispatch(setCurrentPage(0));
    dispatch(setSearchAcc(""));
    return response1.data.filterCode;
  } catch (error) {
    console.error("Error applying filter:", error);
    throw error;
  }
};

export const resetFilter = async (token, dispatch) => {
  try {
    const [filtercode, response2] = await Promise.all([
      fetchInitialData(token, dispatch),
      fetchInitialData2(token, dispatch)
    ]);

    dispatch(setResetTrigger(true));
    return filtercode;
  } catch (error) {
    console.error("Error resetting filter:", error);
    throw error; // Re-throw the error to be handled by the caller
  }
};





