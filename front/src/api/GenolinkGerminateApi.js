import BaseApi from './BaseApi';
import { genolinkServer } from '../config/apiConfig';


class GenolinkGerminateApi extends BaseApi {
  constructor(token) {
    super(genolinkServer, token);
  }

  buildEndpoint(group, posStart, posEnd) {
    let endpoint = `/api/germinate/brapi/v2/callset/calls`;
    if (group) endpoint += `/chromosome/${group}`;
    if (posStart && posEnd) endpoint += `/position/${posStart}/${posEnd}`;
    return endpoint;
  }

  // Fetch callset data for a specific accession
  async fetchCallsetDataForAccession(username, password, accession, selectedGroups, posStart, posEnd) {
    try {
      const group = selectedGroups.length > 0 ? selectedGroups[0] : null;
      const endpoint = this.buildEndpoint(group, posStart, posEnd);
      const response = await this.post(endpoint, { username, password, accession });
      return response;
    } catch (error) {
      console.error(`Error fetching data for accession ${accession}:`, error);
      throw error;
    }
  }

  // Fetch linkage groups with mapped chromosome names
  async fetchGerminateLinkageGroups(username, password, accession) {
    try {
      const response = await this.post("/api/germinate/brapi/v2/callsets/chromosomes", { username, password, accession });
      const linkageGroupNames = response.chromosomes;
      return linkageGroupNames;
    } catch (error) {
      console.error("Error fetching Germinate linkage groups:", error);
      throw error;
    }
  }
}

export default GenolinkGerminateApi;
