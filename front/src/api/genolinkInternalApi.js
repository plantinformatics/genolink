import axios from 'axios';
import { genolinkServer } from '../config/apiConfig';

// Function to upload a file and create sample accessions
export const createSampleAccessions = async (file) => {
  const formData = new FormData();
  formData.append('file', file); 

  try {
    await axios.post(`${genolinkServer}/api/internalApi/createSampleAccessions`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  } catch (error) {
    console.error('Error creating sample accessions:', error);
    throw error;
  }
};