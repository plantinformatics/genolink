import BaseApi from './BaseApi';
import { genolinkServer } from '../config/apiConfig';

class GenolinkInternalApi extends BaseApi {
  constructor() {
    super(genolinkServer);
  }

  async createSampleAccessions(file) {
    const formData = new FormData();
    formData.append('file', file);

    try {
    await this.post('/api/internalApi/createSampleAccessions', formData, {
        'Content-Type': 'multipart/form-data',
      });
    } catch (error) {
      console.error('Error creating sample accessions:', error);
      throw error;
    }
  }
}

export default GenolinkInternalApi;
