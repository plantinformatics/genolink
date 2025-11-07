import BaseApi from "./BaseApi";
import { genolinkServer } from "../config/apiConfig";
import { BASE_PATH } from "../config/basePath";
import { genesysApi } from "../pages/Home";

class GenolinkGigwaApi extends BaseApi {
  constructor() {
    super(genolinkServer);
  }
  async getGigwaToken(selectedGigwaServer, username = "", password = "") {
    try {
      const body = { selectedGigwaServer };
      if (username && password) {
        body.username = username;
        body.password = password;
      }

      const response = await this.post(
        `${BASE_PATH}/api/gigwa/generateGigwaToken`,
        body
      );
      this.token = response.token;
    } catch (error) {
      console.error(
        `Login failed for ${selectedGigwaServer}:`,
        error?.response?.data || error.message
      );
      throw error;
    }
  }

  async searchSamplesInDatasets(
    selectedGigwaServer,
    accessions,
    accessionNames,
    onlyAccessions = false
  ) {
    try {
      if (!this.token)
        throw new Error("Token not available. Please authenticate first.");
      const info = await genesysApi.genotypeInfo(accessions);
      const genotypeIdsPlusAccessionsInGenesys = info.map((item) => ({
        genotypeId: item.genotypeId,
        accessionNumber: item.acceNumb,
      }));
      const body = {
        selectedGigwaServer,
        genotypeIdsPlusAccessionsInGenesys,
        gigwaToken: this.token,
        accessions: accessions,
        accessionNames: accessionNames,
        onlyAccessions: onlyAccessions,
      };
      return await this.post(
        `${BASE_PATH}/api/gigwa/searchSamplesInDatasets`,
        body
      );
    } catch (error) {
      console.error("Error searching samples in datasets:", error);
      throw error;
    }
  }

  async fetchVariants(body) {
    try {
      if (!this.token)
        throw new Error("Token not available. Please authenticate first.");
      body.gigwaToken = this.token;
      return await this.post(
        `${BASE_PATH}/api/gigwa/brapi/v2/search/variants`,
        body
      );
    } catch (error) {
      console.error("Error fetching variants:", error);
      throw error;
    }
  }

  async fetchAlleles(body) {
    try {
      if (!this.token)
        throw new Error("Token not available. Please authenticate first.");
      body.gigwaToken = this.token;
      return await this.post(
        `${BASE_PATH}/api/gigwa/brapi/v2/search/allelematrix`,
        body
      );
    } catch (error) {
      console.error("Error fetching alleles:", error);
      throw error;
    }
  }

  async exportGigwaVCF(body) {
    try {
      if (!this.token)
        throw new Error("Token not available. Please authenticate first.");
      body.gigwaToken = this.token;
      const response = await this.post(
        `${BASE_PATH}/api/gigwa/exportData`,
        body,
        {},
        "blob"
      );

      const url = window.URL.createObjectURL(
        new Blob([response], { type: "application/octet-stream" })
      );
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${body.selectedSamplesDetails[0]?.studyDbId.split("§")[0]}.zip`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting VCF:", error);
      throw error;
    }
  }

  async fetchGigwaLinkageGroups(selectedGigwaServer, selectedStudyDbId) {
    try {
      if (!this.token)
        throw new Error("Token not available. Please authenticate first.");
      const referenceSetDbIdsResponse = await this.get(
        `${BASE_PATH}/api/gigwa/brapi/v2/referencesets`,
        {
          gigwaToken: this.token,
          selectedGigwaServer,
        }
      );
      const referenceSetDbIds = referenceSetDbIdsResponse?.result?.data || [];
      if (!referenceSetDbIds.length) {
        throw new Error("No reference sets found for the user.");
      }

      const selectedReferenceSetDbId = referenceSetDbIds
        .map((referenceSet) => referenceSet.referenceSetDbId)
        .find((reference) =>
          reference.startsWith(
            Array.isArray(selectedStudyDbId)
              ? selectedStudyDbId[0]
              : selectedStudyDbId
          )
        );
      if (!selectedReferenceSetDbId) {
        throw new Error(
          `No reference set found for study ID: ${selectedStudyDbId}`
        );
      }

      const referencesResponse = await this.get(
        `${BASE_PATH}/api/gigwa/brapi/v2/references`,
        {
          gigwaToken: this.token,
          referenceSetDbId: selectedReferenceSetDbId,
          selectedGigwaServer,
        }
      );

      const linkageGroups =
        referencesResponse?.result?.data?.map((item) => item.referenceName) ||
        [];
      return linkageGroups;
    } catch (error) {
      console.error("Error fetching Gigwa linkage groups:", error);
      throw error;
    }
  }
}

export default GenolinkGigwaApi;
