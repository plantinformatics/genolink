import BaseApi from './BaseApi';
import { genesysServer } from '../config/apiConfig';
import oidcConfig from '../config/oidcConfig';
import {
  setSearchResults,
  setInstituteCode,
  setCropList,
  setTaxonomyList,
  setOriginOfMaterialList,
  setSampStatList,
  setGermplasmStorageList,
  setTotalAccessions,
  setTotalPreGenotypedAccessions,
  setCurrentPage,
  setSearchAcc,
  setResetTrigger,
  setLoadingGenotypedAccessions,
} from '../actions';

class GenesysApi extends BaseApi {
  constructor() {
    super(genesysServer);
    this.genotypedAccessions = [];
  }

  setGenotypedAccessions(genotypedAccessions) {
    this.genotypedAccessions = genotypedAccessions;
  }

  getGenotypedAccessions() {
    return this.genotypedAccessions;
  }

  async fetchAndSetToken() {
    try {
      const endpoint = '/oauth/token'
      const body = {
        grant_type: 'client_credentials',
        client_id: oidcConfig.client_id,
        client_secret: oidcConfig.client_secret,
      }
      const response = await this.post(endpoint, body,
        { "Content-Type": "application/x-www-form-urlencoded" }
      );

      const { access_token } = response;
      this.setToken(access_token);
    } catch (error) {
      console.error("Error fetching token:", error);
      throw new Error("Failed to fetch access token");
    }
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

      dispatch(setSearchResults(searchData.content));
      dispatch(setTotalAccessions(searchData.totalElements));
      dispatch(setCurrentPage(0));
      return searchData.filterCode;
    } catch (error) {
      console.error("Error fetching initial data:", error);
      throw error;
    }
  }


  async applyFilter(filterData, dispatch, hasGenotype) {
    try {
      const pageSize = hasGenotype ? 10000 : 500;
      const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases";
      const endpointQuery = `/api/v1/acn/query?p=0&l=${pageSize}&select=${select}`;
      const endpointFilter = "/api/v1/acn/filter";

      const [queryData, filterDataResponse] = await Promise.all([
        this.post(endpointQuery, filterData),
        this.post(endpointFilter, filterData),
      ]);

      if (hasGenotype) {
        const genesysAccessions = queryData.content.map(item => item.accessionNumber);
        let genotypedResult = [];

        const matchedAccessions = this.genotypedAccessions.filter(accession =>
          genesysAccessions.includes(accession)
        );

        genotypedResult = genotypedResult.concat(
          queryData.content.filter(item => matchedAccessions.includes(item.accessionNumber))
        );

        // Fetch total genotyped accessions asynchronously
        this.fetchTotalGenotypedAccessionsInBackground(filterData, dispatch);

        dispatch(setSearchResults(genotypedResult));
        dispatch(setTotalPreGenotypedAccessions(queryData.totalElements));
        dispatch(setInstituteCode([]));
        dispatch(setCropList([]));
        dispatch(setTaxonomyList([]));
        dispatch(setOriginOfMaterialList([]));
        dispatch(setSampStatList([]));
        dispatch(setGermplasmStorageList([]));

      } else {
        dispatch(setSearchResults(queryData.content));
        dispatch(setTotalAccessions(queryData.totalElements));
        dispatch(setInstituteCode(this.extractSuggestions(filterDataResponse, "institute.code")));
        dispatch(setCropList(this.extractSuggestions(filterDataResponse, "crop.shortName")));
        dispatch(setTaxonomyList(this.extractSuggestions(filterDataResponse, "taxonomy.genus")));
        dispatch(setOriginOfMaterialList(this.extractSuggestions(filterDataResponse, "countryOfOrigin.code3")));
        dispatch(setSampStatList(this.extractSuggestions(filterDataResponse, "sampStat")));
        dispatch(setGermplasmStorageList(this.extractSuggestions(filterDataResponse, "storage")));
      }

      dispatch(setCurrentPage(0));
      dispatch(setSearchAcc(""));
      return queryData.filterCode;
    } catch (error) {
      console.error("Error applying filter:", error);
      throw error;
    }
  }

  async getTotalGenotypedAccessions(filterData) {
    try {
      const pageSize = 10000;
      const batchSize = 50;
      let genotypedCount = 0;

      const firstGenesysEndpoint = `/api/v1/acn/query?p=0&l=${pageSize}&select=accessionNumber`;
      const firstGenesysResult = await this.post(firstGenesysEndpoint, filterData);

      if (!firstGenesysResult || !firstGenesysResult.filterCode) {
        throw new Error('No filterCode returned from Genesys.');
      }

      const filterCode = firstGenesysResult.filterCode;
      const totalGenesysPages = Math.ceil(firstGenesysResult.totalElements / pageSize);

      const genesysRequests = [];
      for (let genesysPage = 0; genesysPage < totalGenesysPages; genesysPage++) {
        const endpoint = `/api/v1/acn/query?f=${filterCode}&p=${genesysPage}&l=${pageSize}&select=accessionNumber`;
        genesysRequests.push(async () => {
          const response = await this.post(endpoint, null);
          return response;
        });
      }

      for (let i = 0; i < genesysRequests.length; i += batchSize) {
        const batch = genesysRequests.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map(req => req()));

        batchResults.forEach(genesysResult => {
          if (genesysResult && genesysResult.content) {
            const genesysAccessions = genesysResult.content.map(item => item.accessionNumber);

            const matchedAccessions = genesysAccessions.filter(accession =>
              this.genotypedAccessions.includes(accession)
            );
            genotypedCount += matchedAccessions.length;
          }
        });
      }

      return genotypedCount;
    } catch (error) {
      console.error("Error calculating total genotyped accessions:", error);
      throw error;
    }
  }

  async fetchTotalGenotypedAccessionsInBackground(filterData, dispatch) {
    try {
      dispatch(setLoadingGenotypedAccessions(true));
      const totalGenotypedAccession = await this.getTotalGenotypedAccessions(filterData);
      dispatch(setTotalAccessions(totalGenotypedAccession));
    } catch (error) {
      console.error("Error fetching total genotyped accessions:", error);
    } finally {
      dispatch(setLoadingGenotypedAccessions(false));
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

  async fetchMoreResults({ filterCode, currentPage, pageSize, dispatch, searchResults, hasGenotype }) {
    try {
      const select =
        'instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases';

      const endpoint = filterCode
        ? `/api/v1/acn/query?f=${filterCode}&p=${currentPage + 1}&l=${pageSize}&select=${select}`
        : `/api/v1/acn/query?p=${currentPage + 1}&l=${pageSize}&select=${select}`;

      const response = await this.post(endpoint, null);

      if (hasGenotype) {
        const genesysAccessions = response.content.map(item => item.accessionNumber);
        let genotypedResult = [];

        const matchedAccessions = this.genotypedAccessions.filter(accession =>
          genesysAccessions.includes(accession)
        );

        genotypedResult = genotypedResult.concat(
          response.content.filter(item => matchedAccessions.includes(item.accessionNumber))
        );
        dispatch(setSearchResults([...searchResults, ...genotypedResult]));
      } else {
        const endpoint = filterCode
          ? `/api/v1/acn/query?f=${filterCode}&p=${currentPage + 1}&l=${pageSize}&select=${select}`
          : `/api/v1/acn/query?p=${currentPage + 1}&l=${pageSize}&select=${select}`;

        const response = await this.post(endpoint, null);
        dispatch(setSearchResults([...searchResults, ...response.content]));
      }
      dispatch(setCurrentPage(currentPage + 1));
    } catch (error) {
      console.error('Error fetching more data:', error);
      throw error;
    }
  }
}

export default GenesysApi;