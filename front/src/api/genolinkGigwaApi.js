import axios from 'axios';
import { genolinkServer } from '../config/apiConfig';

export const searchSamplesInDatasets = async (username, password, Accessions) => {
  try {
    const result = await axios.post(
      `${genolinkServer}/api/gigwa/searchSamplesInDatasets`, {
      username,
      password,
      accessions: Accessions,
    }
    );
    return result.data;
  } catch (error) {
    console.error("Error searching samples in datasets: ", error);
    throw error;
  }
};

export const fetchVariants = async (params) => {
  try {
    const response = await axios.post(`${genolinkServer}/api/gigwa/ga4gh/variants/search`, params);
    return response.data;
  } catch (error) {
    console.error("Error fetching variants: ", error);
    throw error;
  }
};

export const fetchAlleles = async (params) => {
  try {
    const response = await axios.post(`${genolinkServer}/api/gigwa/brapi/v2/search/allelematrix`, params);
    return response.data;
  } catch (error) {
    console.error("Error fetching variants: ", error);
    throw error;
  }
};

export const exportGigwaVCF = async (params) => {
  try {
    const response = await axios.post(`${genolinkServer}/api/gigwa/exportData`, params, {
      responseType: 'blob',  // Expect a blob response
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/octet-stream' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${params.selectedSamplesDetails[0]?.studyDbId.split("§")[0]}.zip`); // Specify the filename for download
    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  } catch (error) {
    console.error("Error fetching variants: ", error);
    throw error;
  }
};

export const fetchGigwaLinkageGroups = (username, password, selectedStudyDbId) => {
  return axios
    .get(`${genolinkServer}/api/gigwa/brapi/v2/referencesets`, {
      params: {
        username,
        password,
      },
    })
    .then((referenceSetDbIdsResponse) => {
      const referenceSetDbIds = referenceSetDbIdsResponse.data?.result?.data || [];
      if (!referenceSetDbIds.length) {
        throw new Error("No reference sets found for the user.");
      }
      const selectedReferenceSetDbId = referenceSetDbIds
        .map((referenceSet) => referenceSet.referenceSetDbId)
        .find((reference) => reference.startsWith(Array.isArray(selectedStudyDbId) ? selectedStudyDbId[0] : selectedStudyDbId));

      if (!selectedReferenceSetDbId) {
        throw new Error(`No reference set found for study ID: ${selectedStudyDbId}`);
      }

      return selectedReferenceSetDbId;
    })
    .then((selectedReferenceSetDbId) => {
      return axios.get(`${genolinkServer}/api/gigwa/brapi/v2/references`, {
        params: {
          username,
          password,
          referenceSetDbId: selectedReferenceSetDbId,
        },
      });
    })
    .then((referencesResponse) => {
      const linkageGroups = referencesResponse.data?.result?.data?.map(
        (item) => item.referenceName
      ) || [];
      return linkageGroups;
    })
    .catch((error) => {
      console.error("Error fetching Gigwa linkage groups:", error);
      throw error;
    });
};