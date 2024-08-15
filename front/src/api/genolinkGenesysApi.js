import axios from "axios";
import { genolinkServer } from "../config/apiConfig";

export const sendTokenToAppServer = async (token) => {
    try {
      await axios.post(
        `${genolinkServer}/api/genesys/login`, 
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
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      } else if (error.request) {
        console.error("No response:", error.request);
      } else {
        console.error("Error", error.message);
      }
    }
  };