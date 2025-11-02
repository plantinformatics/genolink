import BaseApi from "./BaseApi";
import { genolinkServer } from "../config/apiConfig";
import { BASE_PATH } from "../config/basePath";

class GenolinkInternalApi extends BaseApi {
  constructor() {
    super(genolinkServer);
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
        `${BASE_PATH}/api/internalApi/getGenotypeStatus`
      );
      return response;
    } catch (error) {
      console.error("Error fetching all accessions:", error);
      throw error;
    }
  }

  async getAllFigs() {
    try {
      const response = await this.get(
        `${BASE_PATH}/api/internalApi/getAllFigs`
      );
      return response;
    } catch (error) {
      console.error("Error fetching all figs:", error);
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

  async figMapping(figs) {
    try {
      const response = await this.post(
        `${BASE_PATH}/api/internalApi/mapFigToAccession`,
        {
          figs,
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
      console.error("Error mapping figs:", error);
      throw error;
    }
  }

  async getFigsByAccessions(accessionIds) {
    try {
      const batchSize = 5000;
      const figMapping = {};

      for (let i = 0; i < accessionIds.length; i += batchSize) {
        const chunk = accessionIds.slice(i, i + batchSize);
        const response = await this.post(
          `${BASE_PATH}/api/internalApi/getFigsByAccessions`,
          {
            accessionIds: chunk,
          }
        );

        Object.assign(figMapping, response);
      }

      return figMapping;
    } catch (error) {
      console.error("Error fetching figs by accessions:", error);
      throw error;
    }
  }
}

export default GenolinkInternalApi;
