import BaseApi from "./BaseApi";
import { genolinkServer } from "../config/apiConfig";
import { BASE_PATH } from "../config/basePath";

class GenolinkGigwaApi extends BaseApi {
  constructor(selectedGigwaServer = "") {
    super(genolinkServer);
    this.selectedGigwaServer = selectedGigwaServer;
    this.gigwaSessionId = null;
  }

  getSelectedGigwaServer() {
    if (!this.selectedGigwaServer) {
      throw new Error("Gigwa server is not available.");
    }

    return this.selectedGigwaServer;
  }

  ensureAuthenticated() {
    if (!this.gigwaSessionId) {
      throw new Error(
        "Gigwa session is not available. Please authenticate first.",
      );
    }
  }

  async getGigwaToken(username = "", password = "") {
    try {
      const server = this.getSelectedGigwaServer();

      const body = {
        selectedGigwaServer: server,
      };

      if (username && password) {
        body.username = username;
        body.password = password;
      }

      const response = await this.post(
        `${BASE_PATH}/api/gigwa/generateGigwaToken`,
        body,
      );

      this.gigwaSessionId = response.gigwaSessionId;

      return response.gigwaSessionId;
    } catch (error) {
      console.error(
        `Login failed for ${this.selectedGigwaServer}:`,
        error?.response?.data || error.message,
      );

      throw error;
    }
  }

  async searchSamplesInDatasets({
    accessions,
    accessionNames = {},
    accessionDoiPairs = [],
    onlyAccessions = false,
  }) {
    try {
      this.ensureAuthenticated();

      const server = this.getSelectedGigwaServer();

      const body = {
        selectedGigwaServer: server,
        gigwaSessionId: this.gigwaSessionId,
        accessions,
        accessionNames,
        accessionDoiPairs,
        onlyAccessions,
      };

      return await this.post(
        `${BASE_PATH}/api/gigwa/searchSamplesInDatasets`,
        body,
      );
    } catch (error) {
      console.error("Error searching samples in datasets:", error);
      throw error;
    }
  }

  async fetchVariants(body) {
    try {
      this.ensureAuthenticated();

      const requestBody = {
        ...body,
        selectedGigwaServer: this.getSelectedGigwaServer(),
        gigwaSessionId: this.gigwaSessionId,
      };

      return await this.post(
        `${BASE_PATH}/api/gigwa/brapi/v2/search/variants`,
        requestBody,
      );
    } catch (error) {
      console.error("Error fetching variants:", error);
      throw error;
    }
  }

  async fetchAlleles(body) {
    try {
      this.ensureAuthenticated();

      const requestBody = {
        ...body,
        selectedGigwaServer: this.getSelectedGigwaServer(),
        gigwaSessionId: this.gigwaSessionId,
      };

      return await this.post(
        `${BASE_PATH}/api/gigwa/brapi/v2/search/allelematrix`,
        requestBody,
      );
    } catch (error) {
      console.error("Error fetching alleles:", error);
      throw error;
    }
  }

  async exportGigwaVCF(body) {
    try {
      this.ensureAuthenticated();

      const requestBody = {
        ...body,
        selectedGigwaServer: this.getSelectedGigwaServer(),
        gigwaSessionId: this.gigwaSessionId,
      };

      const response = await this.post(
        `${BASE_PATH}/api/gigwa/exportData`,
        requestBody,
        {},
        "blob",
      );

      const fileName =
        requestBody.selectedCallSetDetails?.[0]?.studyDbId?.split("§")?.[0] ||
        "gigwa-export";

      const url = window.URL.createObjectURL(
        new Blob([response], { type: "application/octet-stream" }),
      );

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `${fileName}.zip`);

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting VCF:", error);
      throw error;
    }
  }

  async fetchGigwaLinkageGroups(selectedStudyDbId) {
    try {
      this.ensureAuthenticated();

      const server = this.getSelectedGigwaServer();

      const referenceSetDbIdsResponse = await this.get(
        `${BASE_PATH}/api/gigwa/brapi/v2/referencesets`,
        {
          gigwaSessionId: this.gigwaSessionId,
          selectedGigwaServer: server,
        },
      );

      const referenceSetDbIds = referenceSetDbIdsResponse?.result?.data || [];

      if (!referenceSetDbIds.length) {
        throw new Error("No reference sets found for the user.");
      }

      const studyId = Array.isArray(selectedStudyDbId)
        ? selectedStudyDbId[0]
        : selectedStudyDbId;

      const selectedReferenceSetDbId = referenceSetDbIds
        .map((referenceSet) => referenceSet.referenceSetDbId)
        .find((reference) => reference.startsWith(studyId));

      if (!selectedReferenceSetDbId) {
        throw new Error(`No reference set found for study ID: ${studyId}`);
      }

      const referencesResponse = await this.get(
        `${BASE_PATH}/api/gigwa/brapi/v2/references`,
        {
          gigwaSessionId: this.gigwaSessionId,
          referenceSetDbId: selectedReferenceSetDbId,
          selectedGigwaServer: server,
        },
      );

      return (
        referencesResponse?.result?.data?.map((item) => item.referenceName) ||
        []
      );
    } catch (error) {
      console.error("Error fetching Gigwa linkage groups:", error);
      throw error;
    }
  }
}

export default GenolinkGigwaApi;
