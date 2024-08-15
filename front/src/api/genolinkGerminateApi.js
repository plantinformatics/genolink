import axios from 'axios';
import { genolinkServer } from '../config/apiConfig';

// Create a bidirectional mapping
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

// CHROMConverter now can handle both directions
const CHROMConverter = (key) => CHROMMapping[key] || null;

const buildUrl = (group, posStart, posEnd) => {
  const baseUrl = `${genolinkServer}/api/germinate/brapi/v2/callset/calls`;
  let url = baseUrl;

  if (group) {
    url += `/chromosome/${group}`;
  }

  if (posStart && posEnd) {
    url += `/position/${posStart}/${posEnd}`;
  }

  return url;
};

export const fetchCallsetDataForAccession = async (username, password, accession, selectedGroups, posStart, posEnd) => {
  try {
    const group = selectedGroups.length > 0 ? CHROMConverter(selectedGroups[0]) : null;
    const url = buildUrl(group, posStart, posEnd);

    const response = await axios.post(url, {
      username,
      password,
      accession,
    });

    return response.data;
  } catch (error) {
    console.error(`Error fetching data for accession ${accession}:`, error);
    throw error;
  }
};

export const fetchGerminateLinkageGroups = async (username, password) => {
  try {
    const response = await axios.post(`${genolinkServer}/api/germinate/brapi/v2/maps/2/linkagegroups`, {
      username,
      password,
    });
    const linkageGroupNames = response.data.result.data.map(item => CHROMConverter(item.linkageGroupName));
    return linkageGroupNames;
  } catch (error) {
    console.error("Error fetching Germinate linkage groups:", error);
    throw error;
  }
};
