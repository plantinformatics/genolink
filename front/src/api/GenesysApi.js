import BaseApi from './BaseApi';
import { genesysServer } from '../config/apiConfig';
import {
  setSearchResults,
  setInstituteCode,
  setCropList,
  setTaxonomyList,
  setOriginOfMaterialList,
  setSampStatList,
  setGermplasmStorageList,
  setTotalAccessions,
  setCurrentPage,
  setSearchAcc,
  setResetTrigger,
} from '../actions';

class GenesysApi extends BaseApi {
  constructor(token) {
    super(genesysServer, token); 
  }

  async fetchInitialFilterData(dispatch, userInput = " ") {
    try {
      const body = { _text: userInput };
      const endpoint = "/api/v1/acn/filter?l=1";
      const searchData = await this.post(endpoint, body);

      const codes = this.extractSuggestions(searchData, "institute.code");
      const crops = this.extractSuggestions(searchData, "crop.shortName");
      const taxons = this.extractSuggestions(searchData, "taxonomy.genus");
      const origins = this.extractSuggestions(searchData, "countryOfOrigin.code3");
      const sampStat = this.extractSuggestions(searchData, "sampStat");
      const germplasmStorage = this.extractSuggestions(searchData, "storage");

      dispatch(setInstituteCode(codes));
      dispatch(setCropList(crops));
      dispatch(setTaxonomyList(taxons));
      dispatch(setOriginOfMaterialList(origins));
      dispatch(setSampStatList(sampStat));
      dispatch(setGermplasmStorageList(germplasmStorage));
      dispatch(setCurrentPage(0)); 
    } catch (error) {
      console.error("Error fetching initial data:", error);
      throw error;
    }
  }

  async fetchInitialQueryData(dispatch, userInput = " ") {
    try {
      const body = { _text: userInput };
      const pageSize = 500;
      const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases";
      const endpoint = `/api/v1/acn/query?p=0&l=${pageSize}&select=${select}`;
      const searchData = await this.post(endpoint, body);

      dispatch(setSearchResults(searchData));
      dispatch(setTotalAccessions(searchData.totalElements));
      dispatch(setCurrentPage(0));
      return searchData.filterCode;
    } catch (error) {
      console.error("Error fetching initial data:", error);
      throw error;
    }
  }

  async applyFilter(filterData, dispatch) {
    try {
      const pageSize = 500;
      const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases";
      const endpointQuery = `/api/v1/acn/query?p=0&l=${pageSize}&select=${select}`;
      const endpointFilter = "/api/v1/acn/filter";

      const [queryData, filterDataResponse] = await Promise.all([
        this.post(endpointQuery, filterData),
        this.post(endpointFilter, filterData),
      ]);

      dispatch(setSearchResults(queryData));
      dispatch(setInstituteCode(this.extractSuggestions(filterDataResponse, "institute.code")));
      dispatch(setCropList(this.extractSuggestions(filterDataResponse, "crop.shortName")));
      dispatch(setTaxonomyList(this.extractSuggestions(filterDataResponse, "taxonomy.genus")));
      dispatch(setOriginOfMaterialList(this.extractSuggestions(filterDataResponse, "countryOfOrigin.code3")));
      dispatch(setSampStatList(this.extractSuggestions(filterDataResponse, "sampStat")));
      dispatch(setGermplasmStorageList(this.extractSuggestions(filterDataResponse, "storage")));
      dispatch(setTotalAccessions(queryData.totalElements));
      dispatch(setCurrentPage(0));
      dispatch(setSearchAcc(""));
      return queryData.filterCode;
    } catch (error) {
      console.error("Error applying filter:", error);
      throw error;
    }
  }

  async resetFilter(dispatch) {
    try {
      const [filtercode, initialData] = await Promise.all([
        this.fetchInitialFilterData(dispatch),
        this.fetchInitialQueryData(dispatch),
      ]);

      dispatch(setResetTrigger(true));
      return filtercode;
    } catch (error) {
      console.error("Error resetting filter:", error);
      throw error;
    }
  }

  extractSuggestions(data, field) {
    return (
      data.suggestions[field]?.terms
        .map((item) => [item.term, item.count])
        .filter((code, index, arr) => arr.indexOf(code) === index) || []
    );
  }
}

export default GenesysApi;