import axios from "axios";

class BaseApi {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async post(endpoint, body = {}, customHeaders = {}, responseType = "json") {
    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
        headers: {
          ...this.getHeaders(),
          ...customHeaders,
        },
        responseType,
      });

      return response.data;
    } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint, params = {}, customHeaders = {}, responseType = "json") {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          ...this.getHeaders(),
          ...customHeaders,
        },
        params,
        responseType,
      });

      return response.data;
    } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      throw error;
    }
  }

  getHeaders() {
    return {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    };
  }
}

export default BaseApi;
