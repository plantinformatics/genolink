import BaseApi from './BaseApi';
import { genolinkServer } from '../config/apiConfig';

const CHROMMapping = {
  '1': 'chr1A', 'chr1A': '1',
  '2': 'chr1B', 'chr1B': '2',
  '3': 'chr1D', 'chr1D': '3',
  '4': 'chr2A', 'chr2A': '4',
  '5': 'chr2B', 'chr2B': '5',
  '6': 'chr2D', 'chr2D': '6',
  '7': 'chr3A', 'chr3A': '7',
  '8': 'chr3B', 'chr3B': '8',
  '9': 'chr3D', 'chr3D': '9',
  '10': 'chr4A', 'chr4A': '10',
  '11': 'chr4B', 'chr4B': '11',
  '12': 'chr4D', 'chr4D': '12',
  '13': 'chr5A', 'chr5A': '13',
  '14': 'chr5B', 'chr5B': '14',
  '15': 'chr5D', 'chr5D': '15',
  '16': 'chr6A', 'chr6A': '16',
  '17': 'chr6B', 'chr6B': '17',
  '18': 'chr6D', 'chr6D': '18',
  '19': 'chr7A', 'chr7A': '19',
  '20': 'chr7B', 'chr7B': '20',
  '21': 'chr7D', 'chr7D': '21',
};

class GenolinkGerminateApi extends BaseApi {
  constructor(token) {
    super(genolinkServer, token); 
  }

  CHROMConverter(key) {
    return CHROMMapping[key] || null;
  }

  buildUrl(group, posStart, posEnd) {
    let url = `${genolinkServer}/api/germinate/brapi/v2/callset/calls`;
    if (group) url += `/chromosome/${group}`;
    if (posStart && posEnd) url += `/position/${posStart}/${posEnd}`;
    return url;
  }

  // Fetch callset data for a specific accession
  async fetchCallsetDataForAccession(username, password, accession, selectedGroups, posStart, posEnd) {
    try {
      const group = selectedGroups.length > 0 ? this.CHROMConverter(selectedGroups[0]) : null;
      const url = this.buildUrl(group, posStart, posEnd);

      const response = await this.post(url, { username, password, accession });
      return response;
    } catch (error) {
      console.error(`Error fetching data for accession ${accession}:`, error);
      throw error;
    }
  }

  // Fetch linkage groups with mapped chromosome names
  async fetchGerminateLinkageGroups(username, password) {
    try {
      const response = await this.post("/api/germinate/brapi/v2/maps/2/linkagegroups", { username, password });
      const linkageGroupNames = response.result.data.map(item => this.CHROMConverter(item.linkageGroupName));
      return linkageGroupNames;
    } catch (error) {
      console.error("Error fetching Germinate linkage groups:", error);
      throw error;
    }
  }
}

export default GenolinkGerminateApi;
