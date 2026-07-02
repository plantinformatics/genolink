import BaseApi from "./BaseApi";
import {
  defaultInstituteCode,
  genolinkServer,
  genotypeMappingSource,
} from "../config/apiConfig";
import { BASE_PATH } from "../config/basePath";
import { genolinkInternalApi } from "../pages/Home";
import country2Region from "shared-data/Country2Region.json";

import {
  setInstituteCheckedBoxes,
  setActiveFilters,
  setSearchResults,
  setInstituteCode,
  setCropList,
  setGenusList,
  setGenusSpeciesList,
  setSpeciesList,
  setOriginOfMaterialList,
  setDonorCodeList,
  setSampStatList,
  setGermplasmStorageList,
  setAvailibilityList,
  setCurationTypeList,
  setTotalAccessions,
  setTotalPreGenotypedAccessions,
  setPassportCurrentPage,
  setResetTrigger,
} from "../redux/passport/passportActions";
import { buildGenesysSelect } from "../components/metadata/MetadataColumns";
import { germplasmStorageMapping } from "../components/metadata/filters/MultiSelectFilter";

const GENESYS_API_BASE = `${BASE_PATH}/api/genesys`;

class GenesysApi extends BaseApi {
  constructor() {
    super(genolinkServer);
    this.genotypedAccessions = [];
    this.genotypedSamples = [];
    this.genotypeStatus = [];
    this.serverUrls = [];
    this.serverUrlSet = new Set();
    this.accessionServerUrlMap = new Map();
  }

  setGenotypeStatus(genotypeStatus = []) {
    this.genotypeStatus = Array.isArray(genotypeStatus) ? genotypeStatus : [];

    this.addServerUrlsFromRows(this.genotypeStatus);
  }

  getGenotypeStatus() {
    return this.genotypeStatus;
  }

  getServerUrls() {
    return this.serverUrls;
  }

  getServerUrlsForAccessions(accessions = []) {
    if (!Array.isArray(accessions)) {
      return [];
    }

    const selectedServerUrls = new Set();

    accessions.forEach((accession) => {
      const accessionKey = this.normaliseAccessionNumber(accession);
      const serverUrls = this.accessionServerUrlMap.get(accessionKey);

      if (!serverUrls) {
        return;
      }

      serverUrls.forEach((serverUrl) => selectedServerUrls.add(serverUrl));
    });

    return Array.from(selectedServerUrls);
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

  setServerUrls(rows = []) {
    this.serverUrlSet = new Set();
    this.serverUrls = [];
    this.accessionServerUrlMap = new Map();

    this.addServerUrlsFromRows(rows);
  }

  getGenotypedSamples() {
    return this.genotypedSamples;
  }

  async getDonorInstituteFullName(donorList) {
    if (!donorList || donorList.length === 0) {
      return;
    }

    const endpoint = `${GENESYS_API_BASE}/wiews/decode`;
    const instituteFullNames = await this.post(endpoint, donorList);
    return instituteFullNames;
  }

  async getGenesysSubsets(body) {
    const endpoint = `${GENESYS_API_BASE}/subset/filter`;
    const limit = 200;
    const allSubsets = [];

    const fetchPage = async (page) => {
      const query = `${endpoint}?l=${limit}&p=${page}`;

      const response = await this.post(query, body);

      const subsets = response.content.map((subset) => ({
        title: subset.title,
        uuid: subset.uuid,
      }));

      return {
        subsets,
        totalPages: response.totalPages,
      };
    };

    const firstResponse = await fetchPage(0);
    allSubsets.push(...firstResponse.subsets);
    const totalPages = firstResponse.totalPages;

    const pagesToFetch = [];
    for (let page = 1; page < totalPages; page++) {
      pagesToFetch.push(fetchPage(page));
    }

    const allPageResults = await Promise.all(pagesToFetch);

    allPageResults.forEach((pageResult) =>
      allSubsets.push(...pageResult.subsets),
    );

    return allSubsets;
  }

  async genotypeInfo(accessionNumbers) {
    if (!Array.isArray(accessionNumbers) || accessionNumbers.length === 0) {
      return {
        Samples: [],
        totalRequestedAccessions: 0,
        totalMappedAccessions: 0,
        source: "genesys",
      };
    }

    const cleanedAccessions = [
      ...new Set(
        accessionNumbers
          .filter((item) => typeof item === "string")
          .map((item) => item.trim())
          .filter(Boolean),
      ),
    ];

    if (cleanedAccessions.length === 0) {
      return {
        Samples: [],
        totalRequestedAccessions: 0,
        totalMappedAccessions: 0,
        source: "genesys",
      };
    }

    const endpoint = `${GENESYS_API_BASE}/genotype-ids`;

    const genotypeInfo = await this.post(endpoint, {
      accessionNumbers: cleanedAccessions,
    });

    this.addServerUrlsFromRows(genotypeInfo?.Samples);

    return genotypeInfo;
  }

  async fetchInitialFilterData(
    dispatch,
    userInput = " ",
    isReset = false,
    accessionNumbers = [],
  ) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const filterMode = urlParams.get("filterMode");
      const genotypeIds = urlParams.get("genotypeIds");

      let body;
      if (!isReset && !filterMode && !genotypeIds) {
        body = {
          _text: userInput,
          institute: {
            code: [defaultInstituteCode],
          },
        };
        dispatch(setInstituteCheckedBoxes([defaultInstituteCode]));
        dispatch(
          setActiveFilters([
            { type: "Institute Code", value: [defaultInstituteCode] },
          ]),
        );
      } else if (!isReset && filterMode && genotypeIds) {
        body = {
          _text: userInput,
          accessionNumbers:
            accessionNumbers.length > 0 ? accessionNumbers : ["__INVALID__"],
        };
        dispatch(
          setActiveFilters([
            { type: "Genotype Ids", value: genotypeIds.split(",") },
          ]),
        );
      } else {
        body = {
          _text: userInput,
        };
      }

      const limit = 100;
      const endpoint = `${GENESYS_API_BASE}/overview?l=${limit}`;
      const searchData = await this.post(endpoint, body);

      const codes = this.extractSuggestions(searchData, "institute.code");
      const crops = this.extractSuggestions(searchData, "crop.shortName");
      const genus = this.extractSuggestions(searchData, "taxonomy.genus");
      const genusSpecies = this.extractSuggestions(
        searchData,
        "taxonomy.genusSpecies",
      );
      const species = this.extractSuggestions(searchData, "taxonomy.species");
      const origins = this.extractSuggestions(
        searchData,
        "countryOfOrigin.code3",
      );
      const sampStat = this.extractSuggestions(searchData, "sampStat");
      const germplasmStorage = this.extractSuggestions(searchData, "storage");
      const availibility = this.extractSuggestions(searchData, "available");
      const curationType = this.extractSuggestions(searchData, "curationType");
      const donorCode = this.extractSuggestions(searchData, "donorCode");

      dispatch(setInstituteCode(codes));
      dispatch(setCropList(crops));
      dispatch(setGenusList(genus));
      dispatch(setGenusSpeciesList(genusSpecies));
      dispatch(setSpeciesList(species));
      dispatch(setOriginOfMaterialList(origins));
      dispatch(setDonorCodeList(donorCode));
      dispatch(setSampStatList(sampStat));
      dispatch(setGermplasmStorageList(germplasmStorage));
      dispatch(setAvailibilityList(availibility));
      dispatch(setCurationTypeList(curationType));
      dispatch(setPassportCurrentPage(0));
    } catch (error) {
      console.error("Error fetching initial data:", error);
      throw error;
    }
  }

  async fetchInitialQueryData(
    dispatch,
    userInput = " ",
    isReset = false,
    accessionNumbers = [],
    selectedColumnIds = null,
  ) {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const filterMode = urlParams.get("filterMode");
      const genotypeIds = urlParams.get("genotypeIds");

      let body;
      if (!isReset && !filterMode && !genotypeIds) {
        body = {
          _text: userInput,
          institute: {
            code: [defaultInstituteCode],
          },
        };
        dispatch(setInstituteCheckedBoxes([defaultInstituteCode]));
        dispatch(
          setActiveFilters([
            { type: "Institute Code", value: [defaultInstituteCode] },
          ]),
        );
      } else if (!isReset && filterMode && genotypeIds) {
        body = {
          _text: userInput,
          accessionNumbers:
            accessionNumbers.length > 0 ? accessionNumbers : ["__INVALID__"],
        };
        dispatch(
          setActiveFilters([
            { type: "Genotype Ids", value: genotypeIds.split(",") },
          ]),
        );
      } else {
        body = {
          _text: userInput,
        };
      }

      const pageSize = 500;
      const select = buildGenesysSelect(selectedColumnIds);
      const endpoint =
        `${GENESYS_API_BASE}/accession/query` +
        `?p=0&l=${pageSize}&select=${encodeURIComponent(select)}`;
      const searchData = await this.post(endpoint, body);

      dispatch(setSearchResults(searchData.content));
      dispatch(setTotalAccessions(searchData.totalElements));
      dispatch(setPassportCurrentPage(0));
      return { filterCode: searchData.filterCode, body };
    } catch (error) {
      console.error("Error fetching initial data:", error);
      throw error;
    }
  }

  normaliseServerUrl(serverUrl) {
    if (!serverUrl || typeof serverUrl !== "string") {
      return null;
    }

    const trimmed = serverUrl.trim();

    if (!trimmed) {
      return null;
    }

    return trimmed.replace(/\/+$/, "");
  }

  addAccessionServerUrl(accession, serverUrl) {
    const accessionKey = this.normaliseAccessionNumber(accession);
    const normalisedServerUrl = this.normaliseServerUrl(serverUrl);

    if (!accessionKey || !normalisedServerUrl) {
      return;
    }

    this.serverUrlSet.add(normalisedServerUrl);

    if (!this.accessionServerUrlMap.has(accessionKey)) {
      this.accessionServerUrlMap.set(accessionKey, new Set());
    }

    this.accessionServerUrlMap.get(accessionKey).add(normalisedServerUrl);

    this.serverUrls = Array.from(this.serverUrlSet);
  }

  addServerUrlsFromRows(rows = []) {
    if (!Array.isArray(rows)) {
      return;
    }

    rows.forEach((row) => {
      const accession =
        row.Accession ??
        row.accession ??
        row.accessionNumber ??
        row.acceNumb ??
        null;

      const serverUrl = row.serverUrl ?? row.ServerUrl ?? null;

      this.addAccessionServerUrl(accession, serverUrl);
    });

    this.serverUrls = Array.from(this.serverUrlSet);
  }

  normaliseAccessionNumber(accession) {
    return String(accession || "")
      .replace(/"/g, "")
      .trim()
      .toUpperCase();
  }

  addUniqueAccessions(targetMap, accessions = []) {
    if (!Array.isArray(accessions)) {
      return;
    }

    accessions.forEach((accession) => {
      const cleaned = String(accession || "")
        .replace(/"/g, "")
        .trim();
      const normalised = this.normaliseAccessionNumber(cleaned);

      if (cleaned && normalised && !targetMap.has(normalised)) {
        targetMap.set(normalised, cleaned);
      }
    });
  }

  getInternalGenotypedAccessionsForRequest(requestBody = {}) {
    const internalGenotypedAccessions = Array.isArray(this.genotypedAccessions)
      ? this.genotypedAccessions
      : [];

    const internalMap = new Map();
    this.addUniqueAccessions(internalMap, internalGenotypedAccessions);

    const requestedAccessions = Array.isArray(requestBody.accessionNumbers)
      ? requestBody.accessionNumbers
      : [];

    if (requestedAccessions.length > 0) {
      return requestedAccessions
        .map((accession) =>
          String(accession || "")
            .replace(/"/g, "")
            .trim(),
        )
        .filter((accession) =>
          internalMap.has(this.normaliseAccessionNumber(accession)),
        );
    }

    return Array.from(internalMap.values());
  }

  async fetchAllGenesysGenotypedAccessions(filterData = {}) {
    const pageSize = 10000;
    const select = "accessionNumber";

    const requestBody = JSON.parse(JSON.stringify(filterData || {}));
    requestBody.genotyped = true;

    const firstEndpoint =
      `${GENESYS_API_BASE}/accession/query` +
      `?p=0&l=${pageSize}&select=${encodeURIComponent(select)}`;

    const firstResponse = await this.post(firstEndpoint, requestBody);

    const accessionMap = new Map();

    this.addUniqueAccessions(
      accessionMap,
      (firstResponse.content || []).map((item) => item.accessionNumber),
    );

    const totalPages =
      firstResponse.totalPages ||
      Math.ceil((firstResponse.totalElements || 0) / pageSize) ||
      1;

    const filterCode = firstResponse.filterCode;

    for (let page = 1; page < totalPages; page++) {
      const endpoint = filterCode
        ? `${GENESYS_API_BASE}/accession/query?f=${filterCode}&p=${page}&l=${pageSize}&select=${encodeURIComponent(select)}`
        : `${GENESYS_API_BASE}/accession/query?p=${page}&l=${pageSize}&select=${encodeURIComponent(select)}`;

      const response = await this.post(endpoint, filterCode ? {} : requestBody);

      this.addUniqueAccessions(
        accessionMap,
        (response.content || []).map((item) => item.accessionNumber),
      );
    }

    return Array.from(accessionMap.values());
  }

  async buildGenotypedRequestBody(filterData = {}) {
    const requestBody = JSON.parse(JSON.stringify(filterData || {}));

    const internalGenotypedAccessions =
      this.getInternalGenotypedAccessionsForRequest(requestBody);

    if (genotypeMappingSource === "internal") {
      requestBody.accessionNumbers =
        internalGenotypedAccessions.length > 0
          ? internalGenotypedAccessions
          : ["__INVALID__"];

      delete requestBody.genotyped;

      return requestBody;
    }

    if (genotypeMappingSource === "genesys") {
      requestBody.genotyped = true;
      delete requestBody.accessionNumbers;

      return requestBody;
    }

    if (
      genotypeMappingSource === "hybrid_internal_first" ||
      genotypeMappingSource === "hybrid_genesys_first"
    ) {
      if (internalGenotypedAccessions.length === 0) {
        requestBody.genotyped = true;
        delete requestBody.accessionNumbers;

        return requestBody;
      }

      const genesysGenotypedAccessions =
        await this.fetchAllGenesysGenotypedAccessions(requestBody);

      const mergedAccessionsMap = new Map();

      this.addUniqueAccessions(
        mergedAccessionsMap,
        internalGenotypedAccessions,
      );
      this.addUniqueAccessions(mergedAccessionsMap, genesysGenotypedAccessions);

      const mergedAccessions = Array.from(mergedAccessionsMap.values());

      requestBody.accessionNumbers =
        mergedAccessions.length > 0 ? mergedAccessions : ["__INVALID__"];

      delete requestBody.genotyped;

      return requestBody;
    }

    requestBody.genotyped = true;
    delete requestBody.accessionNumbers;

    return requestBody;
  }

  async applyFilter(
    filterData,
    dispatch,
    hasGenotype,
    selectedColumnIds = null,
  ) {
    try {
      const pageSize = 500;
      const select = buildGenesysSelect(selectedColumnIds);
      const endpointQuery =
        `${GENESYS_API_BASE}/accession/query` +
        `?p=0&l=${pageSize}&select=${encodeURIComponent(select)}`;
      const limit = 100;
      const endpointOverview = `${GENESYS_API_BASE}/overview?l=${limit}`;

      if (hasGenotype) {
        const requestBody = await this.buildGenotypedRequestBody(filterData);

        const [queryData, filterDataResponse] = await Promise.all([
          this.post(endpointQuery, requestBody),
          this.post(endpointOverview, requestBody),
        ]);

        dispatch(setSearchResults(queryData.content));
        dispatch(setTotalAccessions(queryData.totalElements));
        dispatch(setTotalPreGenotypedAccessions(queryData.totalElements));

        dispatch(
          setInstituteCode(
            this.extractSuggestions(filterDataResponse, "institute.code"),
          ),
        );
        dispatch(
          setCropList(
            this.extractSuggestions(filterDataResponse, "crop.shortName"),
          ),
        );
        dispatch(
          setGenusList(
            this.extractSuggestions(filterDataResponse, "taxonomy.genus"),
          ),
        );
        dispatch(
          setGenusSpeciesList(
            this.extractSuggestions(
              filterDataResponse,
              "taxonomy.genusSpecies",
            ),
          ),
        );
        dispatch(
          setSpeciesList(
            this.extractSuggestions(filterDataResponse, "taxonomy.species"),
          ),
        );
        dispatch(
          setOriginOfMaterialList(
            this.extractSuggestions(
              filterDataResponse,
              "countryOfOrigin.code3",
            ),
          ),
        );
        dispatch(
          setDonorCodeList(
            this.extractSuggestions(filterDataResponse, "donorCode"),
          ),
        );
        dispatch(
          setSampStatList(
            this.extractSuggestions(filterDataResponse, "sampStat"),
          ),
        );
        dispatch(
          setGermplasmStorageList(
            this.extractSuggestions(filterDataResponse, "storage"),
          ),
        );
        dispatch(
          setAvailibilityList(
            this.extractSuggestions(filterDataResponse, "available"),
          ),
        );
        dispatch(
          setCurationTypeList(
            this.extractSuggestions(filterDataResponse, "curationType"),
          ),
        );

        dispatch(setPassportCurrentPage(0));

        return queryData.filterCode;
      } else {
        const [queryData, filterDataResponse] = await Promise.all([
          this.post(endpointQuery, filterData),
          this.post(endpointOverview, filterData),
        ]);

        dispatch(setSearchResults(queryData.content));
        dispatch(setTotalAccessions(queryData.totalElements));
        dispatch(
          setInstituteCode(
            this.extractSuggestions(filterDataResponse, "institute.code"),
          ),
        );
        dispatch(
          setCropList(
            this.extractSuggestions(filterDataResponse, "crop.shortName"),
          ),
        );
        dispatch(
          setGenusList(
            this.extractSuggestions(filterDataResponse, "taxonomy.genus"),
          ),
        );
        dispatch(
          setGenusSpeciesList(
            this.extractSuggestions(
              filterDataResponse,
              "taxonomy.genusSpecies",
            ),
          ),
        );
        dispatch(
          setSpeciesList(
            this.extractSuggestions(filterDataResponse, "taxonomy.species"),
          ),
        );
        dispatch(
          setOriginOfMaterialList(
            this.extractSuggestions(
              filterDataResponse,
              "countryOfOrigin.code3",
            ),
          ),
        );
        dispatch(
          setDonorCodeList(
            this.extractSuggestions(filterDataResponse, "donorCode"),
          ),
        );
        dispatch(
          setSampStatList(
            this.extractSuggestions(filterDataResponse, "sampStat"),
          ),
        );
        dispatch(
          setGermplasmStorageList(
            this.extractSuggestions(filterDataResponse, "storage"),
          ),
        );
        dispatch(
          setCurationTypeList(
            this.extractSuggestions(filterDataResponse, "curationType"),
          ),
        );
        dispatch(setPassportCurrentPage(0));

        return queryData.filterCode;
      }
    } catch (error) {
      console.error("Error applying filter:", error);
      throw error;
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
    const container = field === "donorCode" ? data.overview : data.suggestions;

    const terms = container?.[field]?.terms || [];

    return terms
      .map((item) => [item.term, item.count])
      .filter((entry, index, arr) => {
        const [term] = entry;
        return arr.findIndex(([t]) => t === term) === index;
      });
  }

  async fetchMoreResults({
    filterCode,
    passportCurrentPage,
    pageSize,
    dispatch,
    searchResults,
    selectedColumnIds = null,
  }) {
    try {
      const select = buildGenesysSelect(selectedColumnIds);

      const endpoint = filterCode
        ? `${GENESYS_API_BASE}/accession/query?f=${filterCode}&p=${
            passportCurrentPage + 1
          }&l=${pageSize}&select=${encodeURIComponent(select)}`
        : `${GENESYS_API_BASE}/accession/query?p=${
            passportCurrentPage + 1
          }&l=${pageSize}&select=${encodeURIComponent(select)}`;

      const response = await this.post(endpoint, {});
      dispatch(setSearchResults([...searchResults, ...response.content]));

      dispatch(setPassportCurrentPage(passportCurrentPage + 1));
    } catch (error) {
      console.error("Error fetching more data:", error);
      throw error;
    }
  }

  async fetchGenesysGenotypeIdMapByAccessions(accessions = []) {
    const accessionMap = new Map();
    this.addUniqueAccessions(accessionMap, accessions);

    const cleanedAccessions = Array.from(accessionMap.values());

    if (cleanedAccessions.length === 0) {
      return {};
    }

    const batchSize = 500;
    const genotypeIdMap = {};

    for (let i = 0; i < cleanedAccessions.length; i += batchSize) {
      const chunk = cleanedAccessions.slice(i, i + batchSize);

      try {
        const response = await this.genotypeInfo(chunk);
        const samples = Array.isArray(response?.Samples)
          ? response.Samples
          : [];

        samples.forEach((sample) => {
          const accession = sample.Accession;
          const genotypeId = String(sample.Sample ?? "").trim();

          if (!accession || !genotypeId) {
            return;
          }

          const currentIds = genotypeIdMap[accession] || [];

          if (!currentIds.includes(genotypeId)) {
            genotypeIdMap[accession] = [...currentIds, genotypeId];
          }
        });
      } catch (error) {
        console.error(
          "Failed to fetch Genesys genotype IDs for export:",
          error,
        );
      }
    }

    return genotypeIdMap;
  }

  async downloadFilteredData(filterData, selectedMappings, hasGenotype) {
    try {
      const pageSize = 10000;

      const batchSize = 50;
      const shouldDownloadFigsSet = Boolean(selectedMappings["FIGs Set"]);

      const genesysSelectedMappings = { ...selectedMappings };
      delete genesysSelectedMappings["FIGs Set"];
      const select = Object.keys(genesysSelectedMappings)
        .map((field) => genesysSelectedMappings[field].apiParam)
        .join(",");

      const firstGenesysEndpoint =
        `${GENESYS_API_BASE}/accession/query` +
        `?p=0&l=${pageSize}&select=${encodeURIComponent(select)}`;

      const requestBody = hasGenotype
        ? await this.buildGenotypedRequestBody(filterData)
        : filterData;

      const firstGenesysResult = await this.post(
        firstGenesysEndpoint,
        requestBody,
      );

      let allResults = firstGenesysResult.content || [];
      const filterCode = firstGenesysResult.filterCode;

      if (!firstGenesysResult || !firstGenesysResult.totalElements) {
        console.error("No data available or totalElements missing.");
        return;
      }

      const totalPages = Math.ceil(firstGenesysResult.totalElements / pageSize);

      const genesysRequests = [];
      for (let genesysPage = 1; genesysPage < totalPages; genesysPage++) {
        const endpoint =
          `${GENESYS_API_BASE}/accession/query` +
          `?f=${filterCode}&p=${genesysPage}&l=${pageSize}&select=${encodeURIComponent(select)}`;

        genesysRequests.push(async () => {
          const response = await this.post(
            endpoint,
            filterCode ? {} : requestBody,
          );
          return response;
        });
      }

      for (let i = 0; i < genesysRequests.length; i += batchSize) {
        const batch = genesysRequests.slice(i, i + batchSize);
        const batchResults = await Promise.all(batch.map((req) => req()));

        batchResults.forEach((genesysResult) => {
          if (genesysResult && genesysResult.content) {
            allResults.push(...genesysResult.content);
          }
        });
      }

      if (allResults.length > 0) {
        let figMapping = {};
        let genesysGenotypeIdMap = {};

        const accessionIds = allResults
          .map((item) => item.accessionNumber)
          .filter(Boolean);

        const shouldExportGenotypeId = Object.values(selectedMappings).some(
          (mapping) => mapping.apiParam === "GenotypeID",
        );

        if (shouldDownloadFigsSet) {
          figMapping =
            await genolinkInternalApi.getFigsByAccessions(accessionIds);
        }

        if (
          shouldExportGenotypeId &&
          (genotypeMappingSource === "genesys" ||
            genotypeMappingSource === "hybrid_internal_first" ||
            genotypeMappingSource === "hybrid_genesys_first")
        ) {
          genesysGenotypeIdMap =
            await this.fetchGenesysGenotypeIdMapByAccessions(accessionIds);
        }

        const selectedMappingsForTSV = { ...selectedMappings };
        delete selectedMappingsForTSV["Country Code"];

        const tsvContent = this.generateTSV(
          allResults,
          selectedMappingsForTSV,
          figMapping,
          genesysGenotypeIdMap,
        );

        this.downloadFile(
          tsvContent,
          "filtered_data_selected_fields.tsv",
          "text/tab-separated-values",
        );
      } else {
        console.error("No data available to export.");
      }
    } catch (error) {
      console.error("Error downloading filtered data:", error);
    }
  }

  generateTSV(data, selectedMappings, figMapping, genesysGenotypeIdMap = {}) {
    const header = Object.keys(selectedMappings)
      .map((field) => selectedMappings[field].tsvHeader)
      .join("\t");
    const internalGenotypeIdsByAccession = {};

    const internalAccessions = Array.isArray(this.genotypedAccessions)
      ? this.genotypedAccessions
      : [];

    const internalSamples = Array.isArray(this.genotypedSamples)
      ? this.genotypedSamples
      : [];

    internalAccessions.forEach((accession, index) => {
      const genotypeId = String(internalSamples[index] ?? "").trim();

      if (!accession || !genotypeId) {
        return;
      }

      const currentIds = internalGenotypeIdsByAccession[accession] || [];

      if (!currentIds.includes(genotypeId)) {
        internalGenotypeIdsByAccession[accession] = [...currentIds, genotypeId];
      }
    });
    const rows = data.map((item) => {
      return Object.keys(selectedMappings)
        .map((field) => {
          const fieldPath = selectedMappings[field].apiParam;
          if (fieldPath === "status") {
            return (
              this.genotypeStatus?.find?.(
                (r) => r.Accession === item.accessionNumber,
              )?.Status ??
              (item.accessionNumber.startsWith("AGG") ? "TBC" : "N/A")
            );
          }

          if (fieldPath === "GenotypeID") {
            const internalGenotypeIds =
              internalGenotypeIdsByAccession[item.accessionNumber] || [];

            const genesysGenotypeIds =
              genesysGenotypeIdMap[item.accessionNumber] || [];

            let orderedIds;

            switch (genotypeMappingSource) {
              case "internal":
                orderedIds = internalGenotypeIds;
                break;

              case "genesys":
                orderedIds = genesysGenotypeIds;
                break;

              case "hybrid_genesys_first":
                orderedIds = [...genesysGenotypeIds, ...internalGenotypeIds];
                break;

              case "hybrid_internal_first":
              default:
                orderedIds = [...internalGenotypeIds, ...genesysGenotypeIds];
                break;
            }

            const uniqueIds = [
              ...new Set(
                orderedIds.map((id) => String(id ?? "").trim()).filter(Boolean),
              ),
            ];

            return uniqueIds.length > 0 ? uniqueIds.join(", ") : "N/A";
          }

          if (fieldPath === "figsSet") {
            return figMapping[item.accessionNumber]
              ? figMapping[item.accessionNumber].join(", ")
              : "";
          }

          if (fieldPath === "institute.fullName") {
            return item["institute.fullName"] || "";
          }

          if (fieldPath === "countryOfOrigin.name") {
            return item["countryOfOrigin.name"] || "";
          }

          if (fieldPath === "taxonomy.genus") {
            return item["taxonomy.genus"] || "";
          }

          if (fieldPath === "taxonomy.species") {
            return item["taxonomy.species"] || "";
          }

          if (fieldPath === "storage") {
            return item["storage"]
              ? item["storage"]
                  .toString()
                  .match(/.{1,2}/g)
                  ?.map((code) => germplasmStorageMapping[parseInt(code)])
                  .filter(Boolean)
                  .join(", ") || "N/A"
              : "N/A" || "";
          }

          if (fieldPath === "region") {
            return (
              country2Region.find(
                (country) =>
                  country["country-code"] == item["countryOfOrigin.codeNum"],
              )?.["region"] || ""
            );
          }

          if (fieldPath === "sub-region") {
            return (
              country2Region.find(
                (country) =>
                  country["country-code"] == item["countryOfOrigin.codeNum"],
              )?.["sub-region"] || ""
            );
          }

          if (fieldPath === "taxonomy.taxonName") {
            return item["taxonomy.taxonName"] || "";
          }
          if (fieldPath === "sampStat") {
            return item["sampStat"] || "";
          }
          if (fieldPath === "aliases") {
            return item.aliases && item.aliases.length > 0
              ? item.aliases
                  .filter((alias) => alias.aliasType !== "ACCENAME")
                  .map(
                    (alias) =>
                      `${alias.name}${alias.usedBy ? ` ${alias.usedBy}` : ""}`,
                  )
                  .join(", ")
              : "";
          }

          if (fieldPath === "remarks.remark") {
            return item["remarks.remark"] || "";
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

          if (fieldPath === "donorName") {
            const name = item["donorName"] || "";
            const code = item["donorCode"] || "";
            if (name && code) return `${name}, ${code}`;
            if (name) return name;
            if (code) return code;
            return "";
          }

          if (fieldPath === "pdci.score") {
            return item["pdci.score"] || "";
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
