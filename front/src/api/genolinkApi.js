import axios from "axios";
// import { genolinkServer } from "../config/apiConfig";

export const sendTokenToAppServer = async (token) => {
  try {
    await axios.post(
      `http://127.0.0.1:3000/api/genesys/login`, // Adjust the endpoint as per your server's API
      { token },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error making request:", error);
    if (error.response) {
      // The request was made and the server responded with a status code
      console.error("Response data:", error.response.data);
      console.error("Response status:", error.response.status);
    } else if (error.request) {
      // The request was made but no response was received
      console.error("No response:", error.request);
    } else {
      // Something happened in setting up the request and triggered an Error
      console.error("Error", error.message);
    }
  }
};
