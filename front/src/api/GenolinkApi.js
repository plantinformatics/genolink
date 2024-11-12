import BaseApi from './BaseApi';
import { genolinkServer } from '../config/apiConfig';

class GenolinkApi extends BaseApi {
  constructor(token) {
    super(genolinkServer, token); 
  }

  // Method to send token to the app server
  async sendTokenToAppServer(token) {
    try {
      const endpoint = "/api/genesys/login"; 
      await this.post(endpoint, { token });
    } catch (error) {
      console.error("Error sending token to app server:", error);
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      } else if (error.request) {
        console.error("No response:", error.request);
      } else {
        console.error("Error", error.message);
      }
    }
  }
}

export default GenolinkApi;
