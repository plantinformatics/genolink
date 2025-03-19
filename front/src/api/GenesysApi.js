import BaseApi from './BaseApi';
import { genesysServer } from '../config/apiConfig';
import oidcConfig from '../config/oidcConfig';
import {
  setInstituteCheckedBoxes,
  setActiveFilters,
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
    this.genotypedSamples = [];
  }

  setGenotypedAccessions(genotypedAccessions) {
    this.genotypedAccessions = genotypedAccessions;
  }

  getGenotypedAccessions() {
    return this.genotypedAccessions;
  }

  setGenotypedSamples(genotypedSamples) {
    this.genotypedSamples = genotypedSamples;
  }

  getGenotypedSamples() {
    return this.genotypedSamples;
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


  async fetchInitialFilterData(dispatch, userInput = " ", isReset = false) {
    try {
      let body;
      if (!isReset) {
        body = {
          _text: userInput, "institute": {
            "code": [
              "AUS165"
            ]
          }
        };
      } else {
        body = {
          _text: userInput
        };
      }
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



  async fetchInitialQueryData(dispatch, userInput = " ", isReset = false) {
    try {
      let body;
      if (!isReset) {
        body = {
          _text: userInput, "institute": {
            "code": [
              "AUS165"
            ]
          }
        };
        dispatch(setInstituteCheckedBoxes(["AUS165"]));
        dispatch(setActiveFilters([{ type: "Institute Code", value: ["AUS165"] }]));
      } else {
        body = {
          _text: userInput
        };
      }

      const pageSize = 500;
      const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases,donorName";
      const endpoint = `/api/v1/acn/query?p=0&l=${pageSize}&select=${select}`;
      const searchData = await this.post(endpoint, body);

      dispatch(setSearchResults(searchData.content));
      dispatch(setTotalAccessions(searchData.totalElements));
      dispatch(setCurrentPage(0));
      return { filterCode: searchData.filterCode, body };
    } catch (error) {
      console.error("Error fetching initial data:", error);
      throw error;
    }
  }


  async applyFilter(filterData, dispatch, hasGenotype) {
    try {
      const pageSize = 500;
      const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases,donorName";
      const endpointQuery = `/api/v1/acn/query?p=0&l=${pageSize}&select=${select}`;
      const endpointFilter = "/api/v1/acn/filter";

      if (hasGenotype) {
        if (filterData.hasOwnProperty("accessionNumbers")) {
          filterData.accessionNumbers = Array.from(
            new Set([...filterData.accessionNumbers, ...this.genotypedAccessions])
          );
        } else {
          filterData.accessionNumbers = this.genotypedAccessions;
        }
      
        const [queryData, filterDataResponse] = await Promise.all([
          this.post(endpointQuery, filterData),
          this.post(endpointFilter, filterData),
        ]);

        const genesysAccessions = queryData.content.map(item => item.accessionNumber);
        let genotypedResult = [];

        const matchedAccessions = this.genotypedAccessions.filter(accession =>
          genesysAccessions.includes(accession)
        );

        genotypedResult = genotypedResult.concat(
          queryData.content.filter(item => matchedAccessions.includes(item.accessionNumber))
        );
        this.fetchTotalGenotypedAccessionsInBackground(filterData, dispatch);

        dispatch(setSearchResults(genotypedResult));
        dispatch(setTotalPreGenotypedAccessions(queryData.totalElements));
        dispatch(setInstituteCode(this.extractSuggestions(filterDataResponse, "institute.code")));
        dispatch(setCropList(this.extractSuggestions(filterDataResponse, "crop.shortName")));
        dispatch(setTaxonomyList(this.extractSuggestions(filterDataResponse, "taxonomy.genus")));
        dispatch(setOriginOfMaterialList(this.extractSuggestions(filterDataResponse, "countryOfOrigin.code3")));
        dispatch(setSampStatList(this.extractSuggestions(filterDataResponse, "sampStat")));
        dispatch(setGermplasmStorageList(this.extractSuggestions(filterDataResponse, "storage")));
        dispatch(setCurrentPage(0));
        return queryData.filterCode;
      } else {
        const [queryData, filterDataResponse] = await Promise.all([
          this.post(endpointQuery, filterData),
          this.post(endpointFilter, filterData),
        ]);
        dispatch(setSearchResults(queryData.content));
        dispatch(setTotalAccessions(queryData.totalElements));
        dispatch(setInstituteCode(this.extractSuggestions(filterDataResponse, "institute.code")));
        dispatch(setCropList(this.extractSuggestions(filterDataResponse, "crop.shortName")));
        dispatch(setTaxonomyList(this.extractSuggestions(filterDataResponse, "taxonomy.genus")));
        dispatch(setOriginOfMaterialList(this.extractSuggestions(filterDataResponse, "countryOfOrigin.code3")));
        dispatch(setSampStatList(this.extractSuggestions(filterDataResponse, "sampStat")));
        dispatch(setGermplasmStorageList(this.extractSuggestions(filterDataResponse, "storage")));
        dispatch(setCurrentPage(0));
        return queryData.filterCode;
      }
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
        this.fetchInitialFilterData(dispatch, " ", true),
        this.fetchInitialQueryData(dispatch, " ", true),
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
        'instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases,donorName';

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

  async downloadFilteredData(filterData, hasGenotype) {
    try {
      const pageSize = 10000;
      const batchSize = 50;
      const select = "instituteCode,accessionNumber,institute.fullName,taxonomy.taxonName,cropName,countryOfOrigin.name,lastModifiedDate,acquisitionDate,doi,institute.id,accessionName,institute.owner.name,genus,taxonomy.grinTaxonomySpecies.speciesName,taxonomy.grinTaxonomySpecies.name,crop.name,taxonomy.grinTaxonomySpecies.id,taxonomy.grinTaxonomySpecies.name,uuid,institute.owner.lastModifiedDate,institute.owner.createdDate,aliases,donorName";

      const firstGenesysEndpoint = `/api/v1/acn/query?p=0&l=${pageSize}&select=${select}`;
      const firstGenesysResult = await this.post(firstGenesysEndpoint, filterData);
      let allResults = firstGenesysResult.content || [];
      const filterCode = firstGenesysResult.filterCode;

      if (!firstGenesysResult || !firstGenesysResult.totalElements) {
        console.error("No data available or totalElements missing.");
        return;
      }

      const totalPages = Math.ceil(firstGenesysResult.totalElements / pageSize);

      const genesysRequests = [];
      for (let genesysPage = 1; genesysPage < totalPages; genesysPage++) {
        const endpoint = `/api/v1/acn/query?f=${filterCode}&p=${genesysPage}&l=${pageSize}&select=${select}`;
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
            allResults.push(...genesysResult.content);
          }
        });
      }

      if (allResults.length > 0) {
        if (hasGenotype) {
          allResults = allResults.filter(result => this.genotypedAccessions.includes(result.accessionNumber));
        }
        const fieldsToExport = {
          "Institute Code": "instituteCode",
          "Holding Institute": "institute.fullName",
          "Accession Number": "accessionNumber",
          "Accession Name": "accessionName",
          "Aliases": "aliases",
          "Taxonomy": "taxonomy.taxonName",
          "Crop Name": "cropName",
          "Donor Institute": "donorName",
          "Provenance of Material": "countryOfOrigin.name",
          "Acquisition Date": "acquisitionDate",
          "DOI": "doi",
          "Last Updated": "lastModifiedDate",
          "isGenotyped": "isGenotyped",
          "GenotypeID": "GenotypeID",
        };

        const tsvContent = this.generateTSV(allResults, fieldsToExport);

        this.downloadFile(tsvContent, "filtered_data_all_pages.tsv", "text/tab-separated-values");
      } else {
        console.error("No data available to export.");
      }
    } catch (error) {
      console.error("Error downloading filtered data:", error);
    }
  }


  generateTSV(data, fieldsMap) {
    const header = Object.keys(fieldsMap).join("\t");

    const rows = data.map(item => {
      return Object.entries(fieldsMap)
        .map(([_, fieldPath]) => {

          if (fieldPath === "isGenotyped") {
            return this.genotypedAccessions.includes(item.accessionNumber) ? "Yes" : "No";
          }

          if (fieldPath === "GenotypeID") {
            const index = this.genotypedAccessions.indexOf(item.accessionNumber);
            return index !== -1 ? this.genotypedSamples[index] : "N/A";
          }
          if (fieldPath === "institute.fullName") {
            return item["institute.fullName"] || "";
          }

          if (fieldPath === "countryOfOrigin.name") {
            return item["countryOfOrigin.name"] || "";
          }

          if (fieldPath === "taxonomy.taxonName") {
            return item["taxonomy.taxonName"] || "";
          }

          if (fieldPath === "aliases") {
            return item.aliases && item.aliases.length > 0
              ? item.aliases
                .filter(alias => alias.aliasType !== "ACCENAME")
                .map(alias => `${alias.name}${alias.usedBy ? ` ${alias.usedBy}` : ''}`)
                .join(", ")
              : "";
          }

          if (fieldPath === "acquisitionDate") {
            const dateStr = item.acquisitionDate;
            if (dateStr && dateStr.length === 8) {
              const year = dateStr.substring(0, 4);
              const month = dateStr.substring(4, 6);
              const day = dateStr.substring(6, 8);
              return `${day}-${month}-${year}`;
            }
            return dateStr || "";
          }

          return item[fieldPath] || "";
        })
        .join("\t");
    });

    return [header, ...rows].join("\n");
  }

  downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

}

export default GenesysApi;