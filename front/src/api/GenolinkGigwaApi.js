import BaseApi from './BaseApi';
import { genolinkServer } from '../config/apiConfig';

class GenolinkGigwaApi extends BaseApi {
  constructor() {
    super(genolinkServer);
  }

  async getGigwaToken(username = "", password = "") {
    try {
      const body = username && password ? { username, password } : {};
      const response = await this.post("/api/gigwa/generateGigwaToken", body);
      this.token = response.token; 
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async searchSamplesInDatasets(accessions, accessionNames) {
    try {
      if (!this.token) throw new Error("Token not available. Please authenticate first.");
      const body = {
        gigwaToken: this.token,
        accessions: accessions,
        accessionNames: accessionNames,
      };
      return await this.post("/api/gigwa/searchSamplesInDatasets", body);
    } catch (error) {
      console.error("Error searching samples in datasets:", error);
      throw error;
    }
  }

  async fetchVariants(body) {
    try {
      if (!this.token) throw new Error("Token not available. Please authenticate first.");
      body.gigwaToken = this.token;
      return await this.post("/api/gigwa/ga4gh/variants/search", body);
    } catch (error) {
      console.error("Error fetching variants:", error);
      throw error;
    }
  }

  async fetchAlleles(body) {
    try {
      if (!this.token) throw new Error("Token not available. Please authenticate first.");
      body.gigwaToken = this.token;
      return await this.post("/api/gigwa/brapi/v2/search/allelematrix", body);
    } catch (error) {
      console.error("Error fetching alleles:", error);
      throw error;
    }
  }

  async exportGigwaVCF(body) {
    try {
      if (!this.token) throw new Error("Token not available. Please authenticate first.");
      body.gigwaToken = this.token;
      const response = await this.post("/api/gigwa/exportData", body, {}, 'blob');

      const url = window.URL.createObjectURL(new Blob([response], { type: 'application/octet-stream' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${body.selectedSamplesDetails[0]?.studyDbId.split("§")[0]}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error exporting VCF:", error);
      throw error;
    }
  }

  async fetchGigwaLinkageGroups(selectedStudyDbId) {
    try {
      if (!this.token) throw new Error("Token not available. Please authenticate first.");
      const referenceSetDbIdsResponse = await this.get("/api/gigwa/brapi/v2/referencesets", {
        gigwaToken: this.token,
      });
      const referenceSetDbIds = referenceSetDbIdsResponse?.result?.data || [];
      if (!referenceSetDbIds.length) {
        throw new Error("No reference sets found for the user.");
      }

      const selectedReferenceSetDbId = referenceSetDbIds
        .map((referenceSet) => referenceSet.referenceSetDbId)
        .find((reference) => reference.startsWith(Array.isArray(selectedStudyDbId) ? selectedStudyDbId[0] : selectedStudyDbId));
      if (!selectedReferenceSetDbId) {
        throw new Error(`No reference set found for study ID: ${selectedStudyDbId}`);
      }

      const referencesResponse = await this.get("/api/gigwa/brapi/v2/references", {
        gigwaToken: this.token,
        referenceSetDbId: selectedReferenceSetDbId,
      });

      const linkageGroups = referencesResponse?.result?.data?.map((item) => item.referenceName) || [];
      return linkageGroups;
    } catch (error) {
      console.error("Error fetching Gigwa linkage groups:", error);
      throw error;
    }
  }
}

export default GenolinkGigwaApi;
