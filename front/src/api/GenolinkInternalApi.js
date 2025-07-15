import BaseApi from "./BaseApi";
import { genolinkServer } from "../config/apiConfig";

class GenolinkInternalApi extends BaseApi {
  constructor() {
    super(genolinkServer);
  }

  async getAllAccessions() {
    try {
      const response = await this.get("/api/internalApi/getAllAccessions");
      return response;
    } catch (error) {
      console.error("Error fetching all accessions:", error);
      throw error;
    }
  }

  async getAllFigs() {
    try {
      const response = await this.get("/api/internalApi/getAllFigs");
      return response;
    } catch (error) {
      console.error("Error fetching all figs:", error);
      throw error;
    }
  }

  async genotypeIdMapping(genotypeIds) {
    try {
      const response = await this.post("/api/internalApi/genotypIdMapping", {
        genotypeIds,
      });
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
      const response = await this.post("/api/internalApi/figMapping", {
        figs,
      });
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
      const response = await this.post("/api/internalApi/getFigsByAccessions", {
        accessionIds,
      });
      return response;
    } catch (error) {
      console.error("Error fetching figs by accessions:", error);
      throw error;
    }
  }
}

export default GenolinkInternalApi;
