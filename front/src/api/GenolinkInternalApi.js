import BaseApi from "./BaseApi";
import { genolinkServer } from "../config/apiConfig";

class GenolinkInternalApi extends BaseApi {
  constructor() {
    super(genolinkServer);
  }

  async createSampleAccessions(file) {
    const formData = new FormData();
    formData.append("file", file);

    try {
      await this.post("/api/internalApi/createSampleAccessions", formData, {
        "Content-Type": "multipart/form-data",
      });
    } catch (error) {
      console.error("Error creating sample accessions:", error);
      throw error;
    }
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
}

export default GenolinkInternalApi;
