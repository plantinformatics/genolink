import axios from "axios";

class BaseApi {
  constructor(baseUrl, token = null) {
    this.baseUrl = baseUrl;
    this.token = token;
  }

  setToken(token) {
    this.token = token;
  }

  getToken() {
    return this.token;
  }

  async post(endpoint, body = {}, customHeaders = {}, responseType = "json") {
    try {
      const response = await axios.post(`${this.baseUrl}${endpoint}`, body, {
        headers: { ...this.getHeaders(), ...customHeaders },
        responseType,
      });
      return response.data;
    } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      throw error;
    }
  }

  async get(endpoint, params) {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: this.getHeaders(),
        params,
      });
      return response.data;
    } catch (error) {
      console.error(`Error in API call to ${endpoint}:`, error);
      throw error;
    }
  }

  getHeaders() {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }
}

export default BaseApi;
