import BaseApi from "./BaseApi";
import { BASE_PATH } from "../config/basePath";

class GenolinkInternalApi extends BaseApi {
  constructor() {
    super();
  }

  // async getAllAccessions() {
  //   try {
  //     const response = await this.get("/api/internalApi/getAllAccessions");
  //     return response;
  //   } catch (error) {
  //     console.error("Error fetching all accessions:", error);
  //     throw error;
  //   }
  // }

  async getAllGenotypeStatus() {
    try {
      const response = await this.get(
        `${BASE_PATH}/api/internalApi/getGenotypeStatus`,
      );
      return response;
    } catch (error) {
      console.error("Error fetching all accessions:", error);
      throw error;
    }
  }

  async genotypeIdMapping(genotypeIds) {
    try {
      const response = await this.post(
        `${BASE_PATH}/api/internalApi/mapGenotypIdToAccession`,
        {
          genotypeIds,
        }
      );
      return response;
    } catch (error) {
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        alert(error.response.data.message);
      } else {
        alert("An unexpected error occurred.");
      }
      console.error("Error mapping genotypeIds:", error);
      throw error;
    }
  }

  async fetchDatasetInfoForAccessions(accessions) {
    try {
      const cleanedAccessions = [
        ...new Set(
          (Array.isArray(accessions) ? accessions : [])
            .filter((accession) => typeof accession === "string")
            .map((accession) => accession.trim())
            .filter(Boolean),
        ),
      ];

      if (cleanedAccessions.length === 0) {
        return {};
      }

      const batchSize = 5000;
      const datasetInfoMapping = {};

      for (let i = 0; i < cleanedAccessions.length; i += batchSize) {
        const chunk = cleanedAccessions.slice(i, i + batchSize);
        const response = await this.post(
          `${BASE_PATH}/api/internalApi/accession-dataset-info`,
          {
            accessions: chunk,
          },
        );

        Object.assign(datasetInfoMapping, response);
      }

      return datasetInfoMapping;
    } catch (error) {
      console.error("Error fetching dataset DOI metadata:", error);
      return {};
    }
  }
}

export default GenolinkInternalApi;
