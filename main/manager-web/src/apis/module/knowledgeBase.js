import { getServiceUrl } from '../api';
import RequestService from '../httpRequest';

/**
 * [text]token
 */
function getAuthToken() {
  return localStorage.getItem('token') || '';
}

/**
 * [text]API[text]
 * @param {Object} config - [text]
 * @param {string} config.url - [text]URL
 * @param {string} config.method - [text]
 * @param {Object} [config.data] - [text]
 * @param {Object} [config.headers] - [text]
 * @param {Function} config.callback - [text]
 * @param {Function} [config.errorCallback] - [text]
 * @param {string} [config.errorMessage] - [text]
 * @param {Function} [config.retryFunction] - [text]
 */
function makeApiRequest(config) {
  const token = getAuthToken();
  const { url, method, data, headers, callback, errorCallback, errorMessage, retryFunction } = config;

  const requestBuilder = RequestService.sendRequest()
    .url(url)
    .method(method)
    .header({
      'Authorization': `Bearer ${token}`,
      ...headers
    });

  if (data) {
    requestBuilder.data(data);
  }

  requestBuilder
    .success((res) => {
      RequestService.clearRequestTime();
      callback(res);
    })
    .fail((err) => {
      console.error(errorMessage || 'Operation failed', err);
      if (errorCallback) {
        errorCallback(err);
      }
    })
    .networkFail(() => {
      if (retryFunction) {
        RequestService.reAjaxFun(() => {
          retryFunction();
        });
      }
    }).send();
}

/**
 * [text]API
 */
export default {
  /**
   * [text]
   * @param {Object} params - [text]
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  getKnowledgeBaseList(params, callback, errorCallback) {
    const queryParams = new URLSearchParams({
      page: params.page,
      page_size: params.page_size,
      name: params.name || ''
    }).toString();

    makeApiRequest({
      url: `${getServiceUrl()}/datasets?${queryParams}`,
      method: 'GET',
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to fetch knowledge bases',
      retryFunction: () => this.getKnowledgeBaseList(params, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {Object} data - [text]
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  createKnowledgeBase(data, callback, errorCallback) {
    console.log('createKnowledgeBase called with data:', data);
    console.log('API URL:', `${getServiceUrl()}/datasets`);

    makeApiRequest({
      url: `${getServiceUrl()}/datasets`,
      method: 'POST',
      data: data,
      headers: { 'Content-Type': 'application/json' },
      callback: (res) => {
        console.log('createKnowledgeBase success response:', res);
        callback(res);
      },
      errorCallback: (err) => {
        console.error('Create knowledge base failed:', err);
        if (err.response) {
          console.error('Error response data:', err.response.data);
          console.error('Error response status:', err.response.status);
        }
        if (errorCallback) {
          errorCallback(err);
        }
      },
      errorMessage: 'Failed to create knowledge base',
      retryFunction: () => this.createKnowledgeBase(data, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string} datasetId - [text]ID
   * @param {Object} data - [text]
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  updateKnowledgeBase(datasetId, data, callback, errorCallback) {
    console.log('updateKnowledgeBase called with datasetId:', datasetId, 'data:', data);
    console.log('API URL:', `${getServiceUrl()}/datasets/${datasetId}`);

    makeApiRequest({
      url: `${getServiceUrl()}/datasets/${datasetId}`,
      method: 'PUT',
      data: data,
      headers: { 'Content-Type': 'application/json' },
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to update knowledge base',
      retryFunction: () => this.updateKnowledgeBase(datasetId, data, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string} datasetId - [text]ID
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  deleteKnowledgeBase(datasetId, callback, errorCallback) {
    console.log('deleteKnowledgeBase called with datasetId:', datasetId);
    console.log('API URL:', `${getServiceUrl()}/datasets/${datasetId}`);

    makeApiRequest({
      url: `${getServiceUrl()}/datasets/${datasetId}`,
      method: 'DELETE',
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to delete knowledge base',
      retryFunction: () => this.deleteKnowledgeBase(datasetId, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string|Array} ids - [text]ID[text]
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  deleteKnowledgeBases(ids, callback, errorCallback) {
    // [text]ids[text]
    const idsStr = Array.isArray(ids) ? ids.join(',') : ids;

    makeApiRequest({
      url: `${getServiceUrl()}/datasets/batch?ids=${idsStr}`,
      method: 'DELETE',
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to batch delete knowledge bases',
      retryFunction: () => this.deleteKnowledgeBases(ids, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string} datasetId - [text]ID
   * @param {Object} params - [text]
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  getDocumentList(datasetId, params, callback, errorCallback) {
    const queryParams = new URLSearchParams({
      page: params.page,
      page_size: params.page_size,
      name: params.name || ''
    }).toString();

    makeApiRequest({
      url: `${getServiceUrl()}/datasets/${datasetId}/documents?${queryParams}`,
      method: 'GET',
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to fetch document list',
      retryFunction: () => this.getDocumentList(datasetId, params, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string} datasetId - [text]ID
   * @param {Object} formData - [text]
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  uploadDocument(datasetId, formData, callback, errorCallback) {
    makeApiRequest({
      url: `${getServiceUrl()}/datasets/${datasetId}/documents`,
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to upload document',
      retryFunction: () => this.uploadDocument(datasetId, formData, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string} datasetId - [text]ID
   * @param {string} documentId - [text]ID
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  parseDocument(datasetId, documentId, callback, errorCallback) {
    const requestBody = {
      document_ids: [documentId]
    };

    makeApiRequest({
      url: `${getServiceUrl()}/datasets/${datasetId}/chunks`,
      method: 'POST',
      data: requestBody,
      headers: { 'Content-Type': 'application/json' },
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to parse document',
      retryFunction: () => this.parseDocument(datasetId, documentId, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string} datasetId - [text]ID
   * @param {string} documentId - [text]ID
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  deleteDocument(datasetId, documentId, callback, errorCallback) {
    makeApiRequest({
      url: `${getServiceUrl()}/datasets/${datasetId}/documents/${documentId}`,
      method: 'DELETE',
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to delete document',
      retryFunction: () => this.deleteDocument(datasetId, documentId, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string} datasetId - [text]ID
   * @param {string} documentId - [text]ID
   * @param {Object} params - [text]
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  listChunks(datasetId, documentId, params, callback, errorCallback) {
    let queryParams = new URLSearchParams({
      page: params.page || 1,
      page_size: params.page_size || 10
    }).toString();

    // [text]
    if (params.keywords) {
      queryParams += `&keywords=${encodeURIComponent(params.keywords)}`;
    }

    makeApiRequest({
      url: `${getServiceUrl()}/datasets/${datasetId}/documents/${documentId}/chunks?${queryParams}`,
      method: 'GET',
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Failed to fetch slice list',
      retryFunction: () => this.listChunks(datasetId, documentId, params, callback, errorCallback)
    });
  },

  /**
   * [text]
   * @param {string} datasetId - [text]ID
   * @param {Object} data - [text]
   * @param {Function} callback - [text]
   * @param {Function} errorCallback - [text]
   */
  retrievalTest(datasetId, data, callback, errorCallback) {
    makeApiRequest({
      url: `${getServiceUrl()}/datasets/${datasetId}/retrieval-test`,
      method: 'POST',
      data: data,
      headers: { 'Content-Type': 'application/json' },
      callback: callback,
      errorCallback: errorCallback,
      errorMessage: 'Recall test failed',
      retryFunction: () => this.retrievalTest(datasetId, data, callback, errorCallback)
    });
  }

};