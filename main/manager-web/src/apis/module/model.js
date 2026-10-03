import { getServiceUrl } from '../api';
import RequestService from '../httpRequest';

const CALLBACK_RETRY_LIMIT = 10;
const CALLBACK_RETRY_DELAY_MS = 2000;
const CALLBACK_RETRY_WINDOW_MS = CALLBACK_RETRY_LIMIT * CALLBACK_RETRY_DELAY_MS;

function retryCallbackRequest(retry, retryCount, onTerminalFailure, error, retryStartedAt) {
  if (!onTerminalFailure) {
    RequestService.reAjaxFun(() => retry(retryCount + 1));
    return;
  }
  const startedAt = retryStartedAt || Date.now();
  if (retryCount >= CALLBACK_RETRY_LIMIT || Date.now() - startedAt >= CALLBACK_RETRY_WINDOW_MS) {
    RequestService.clearRequestTime();
    if (onTerminalFailure) {
      onTerminalFailure(error);
    }
    return;
  }
  setTimeout(() => retry(retryCount + 1, startedAt), CALLBACK_RETRY_DELAY_MS);
}

export default {
  // [text]
  getModelList(params, callback) {
    const queryParams = new URLSearchParams({
      modelType: params.modelType,
      modelName: params.modelName || '',
      page: params.page || 0,
      limit: params.limit || 10
    }).toString();

    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/list?${queryParams}`)
      .method('GET')
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res)
      })
      .networkFail((err) => {
        console.error('Fetch model list failed:', err)
        RequestService.reAjaxFun(() => {
          this.getModelList(params, callback)
        })
      }).send()
  },
  // [text]
  getModelProviders(modelType, callback) {
    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/${modelType}/provideTypes`)
      .method('GET')
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res.data?.data || [])
      })
      .networkFail((err) => {
        console.error('Fetch provider list failed:', err)
        this.$message.error('Failed to fetch providers')
        RequestService.reAjaxFun(() => {
          this.getModelProviders(modelType, callback)
        })
      }).send()
  },

  // [text]
  addModel(params, callback) {
    const { modelType, provideCode, formData } = params;
    const postData = {
      id: formData.id,
      modelCode: formData.modelCode,
      modelName: formData.modelName,
      isDefault: formData.isDefault ? 1 : 0,
      isEnabled: formData.isEnabled ? 1 : 0,
      configJson: formData.configJson,
      docLink: formData.docLink,
      remark: formData.remark,
      sort: formData.sort || 0
    };

    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/${modelType}/${provideCode}`)
      .method('POST')
      .data(postData)
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res)
      })
      .networkFail((err) => {
        console.error('Add model failed:', err)
        this.$message.error(err.msg || 'Failed to add model')
        RequestService.reAjaxFun(() => {
          this.addModel(params, callback)
        })
      }).send()
  },
  // [text]
  deleteModel(id, callback) {
    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/${id}`)
      .method('DELETE')
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res)
      })
      .networkFail((err) => {
        console.error('Delete model failed:', err)
        this.$message.error(err.msg || 'Failed to delete model')
        RequestService.reAjaxFun(() => {
          this.deleteModel(id, callback)
        })
      }).send()
  },
  // [text]
  getModelNames(modelType, modelName, callback, onTerminalFailure, retryCount = 0, retryStartedAt = 0) {
    const retryWindowStartedAt = retryStartedAt || Date.now();
    const request = RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/names`)
      .method('GET')
      .data({ modelType, modelName })
      .success((res) => {
        RequestService.clearRequestTime();
        callback(res);
      })
      .networkFail((error) => {
        retryCallbackRequest(
          (nextRetryCount, nextRetryStartedAt) => this.getModelNames(
            modelType,
            modelName,
            callback,
            onTerminalFailure,
            nextRetryCount,
            nextRetryStartedAt
          ),
          retryCount,
          onTerminalFailure,
          error,
          retryWindowStartedAt
        );
      });
    if (onTerminalFailure) {
      request.fail((error) => {
        RequestService.clearRequestTime();
        onTerminalFailure(error);
      });
    }
    request.send();
  },
  // [text]LLM[text]
  getLlmModelCodeList(modelName, callback, onTerminalFailure, retryCount = 0, retryStartedAt = 0) {
    const retryWindowStartedAt = retryStartedAt || Date.now();
    const request = RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/llm/names`)
      .method('GET')
      .data({ modelName })
      .success((res) => {
        RequestService.clearRequestTime();
        callback(res);
      })
      .networkFail((error) => {
        retryCallbackRequest(
          (nextRetryCount, nextRetryStartedAt) => this.getLlmModelCodeList(
            modelName,
            callback,
            onTerminalFailure,
            nextRetryCount,
            nextRetryStartedAt
          ),
          retryCount,
          onTerminalFailure,
          error,
          retryWindowStartedAt
        );
      });
    if (onTerminalFailure) {
      request.fail((error) => {
        RequestService.clearRequestTime();
        onTerminalFailure(error);
      });
    }
    request.send();
  },
  // [text]
  getModelVoices(modelId, voiceName, callback, onTerminalFailure, retryCount = 0, retryStartedAt = 0) {
    const retryWindowStartedAt = retryStartedAt || Date.now();
    const queryParams = new URLSearchParams({
      voiceName: voiceName || ''
    }).toString();
    const request = RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/${modelId}/voices?${queryParams}`)
      .method('GET')
      .success((res) => {
        RequestService.clearRequestTime();
        callback(res);
      })
      .networkFail((error) => {
        retryCallbackRequest(
          (nextRetryCount, nextRetryStartedAt) => this.getModelVoices(
            modelId,
            voiceName,
            callback,
            onTerminalFailure,
            nextRetryCount,
            nextRetryStartedAt
          ),
          retryCount,
          onTerminalFailure,
          error,
          retryWindowStartedAt
        );
      });
    if (onTerminalFailure) {
      request.fail((error) => {
        RequestService.clearRequestTime();
        onTerminalFailure(error);
      });
    }
    request.send();
  },
  // [text]
  getModelConfig(id, callback) {
    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/${id}`)
      .method('GET')
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res)
      })
      .networkFail((err) => {
        console.error('Fetch model config failed:', err)
        this.$message.error(err.msg || 'Failed to fetch model configuration')
        RequestService.reAjaxFun(() => {
          this.getModelConfig(id, callback)
        })
      }).send()
  },
  // [text]/[text]
  updateModelStatus(id, status, callback) {
    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/enable/${id}/${status}`)
      .method('PUT')
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res)
      })
      .networkFail((err) => {
        console.error('Update model status failed:', err)
        this.$message.error(err.msg || 'Failed to update model status')
        RequestService.reAjaxFun(() => {
          this.updateModelStatus(id, status, callback)
        })
      }).send()
  },
  // [text]
  updateModel(params, callback) {
    const { modelType, provideCode, id, formData } = params;
    const payload = {
      ...formData,
      configJson: formData.configJson
    };
    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/${modelType}/${provideCode}/${id}`)
      .method('PUT')
      .data(payload)
      .success((res) => {
        RequestService.clearRequestTime();
        callback(res);
      })
      .networkFail((err) => {
        console.error('Update model failed:', err);
        this.$message.error(err.msg || 'Failed to update model');
        RequestService.reAjaxFun(() => {
          this.updateModel(params, callback);
        });
      }).send();
  },
  // [text]
  setDefaultModel(id, callback) {
    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/default/${id}`)
      .method('PUT')
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res)
      })
      .networkFail((err) => {
        console.error('Set default model failed:', err)
        this.$message.error(err.msg || 'Failed to set default model')
        RequestService.reAjaxFun(() => {
          this.setDefaultModel(id, callback)
        })
      }).send()
  },

  /**
   * [text]（[text]）
   * @param {Object} params - [text]，[text] { name: 'test', modelType: 1 }
   * @param {Function} callback - [text]
   */
  getModelProvidersPage(params, callback) {
    // [text]
    const queryParams = new URLSearchParams();
    if (params.name) queryParams.append('name', params.name);
    if (params.modelType !== undefined) queryParams.append('modelType', params.modelType);
    if (params.page !== undefined) queryParams.append('page', params.page);
    if (params.limit !== undefined) queryParams.append('limit', params.limit);

    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/provider?${queryParams.toString()}`)
      .method('GET')
      .success((res) => {
        RequestService.clearRequestTime();
        callback(res);
      })
      .networkFail((err) => {
        this.$message.error(err.msg || 'Failed to fetch providers');
        RequestService.reAjaxFun(() => {
          this.getModelProviders(params, callback);
        });
      }).send();
  },

  /**
   * [text]
   * @param {Object} params - [text]，[text] { modelType: '1', providerCode: '1', name: '1', fields: '1', sort: 1 }
   * @param {Function} callback - [text]
   */
  addModelProvider(params, callback) {
    const postData = {
      modelType: params.modelType || '',
      providerCode: params.providerCode || '',
      name: params.name || '',
      fields: JSON.stringify(params.fields || []),
      sort: params.sort || 0
    };

    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/provider`)
      .method('POST')
      .data(postData)
      .success((res) => {
        RequestService.clearRequestTime();
        callback(res);
      })
      .networkFail((err) => {
        console.error('Add provider failed:', err)
        this.$message.error(err.msg || 'Failed to add provider')
        RequestService.reAjaxFun(() => {
          this.addModelProvider(params, callback);
        });
      }).send();
  },

  /**
   * [text]
   * @param {Object} params - [text]，[text] { id: '111', modelType: '1', providerCode: '1', name: '1', fields: '1', sort: 1 }
   * @param {Function} callback - [text]
   */
  updateModelProvider(params, callback) {
    const putData = {
      id: params.id || '',
      modelType: params.modelType || '',
      providerCode: params.providerCode || '',
      name: params.name || '',
      fields: JSON.stringify(params.fields || []),
      sort: params.sort || 0
    };

    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/provider`)
      .method('PUT')
      .data(putData)
      .success((res) => {
        RequestService.clearRequestTime();
        callback(res);
      })
      .networkFail((err) => {
        this.$message.error(err.msg || 'Failed to update provider')
        RequestService.reAjaxFun(() => {
          this.updateModelProvider(params, callback);
        });
      }).send();
  },
  // [text]
  deleteModelProviderByIds(ids, callback) {
    RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/provider/delete`)
      .method('POST')
      .data(ids)
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res);
      })
      .networkFail((err) => {
        this.$message.error(err.msg || 'Failed to delete provider')
        RequestService.reAjaxFun(() => {
          this.deleteModelProviderByIds(ids, callback)
        })
      }).send()
  },
  // [text]
  getPluginFunctionList(params, callback, onTerminalFailure, retryCount = 0, retryStartedAt = 0) {
    const retryWindowStartedAt = retryStartedAt || Date.now();
    const request = RequestService.sendRequest()
      .url(`${getServiceUrl()}/models/provider/plugin/names`)
      .method('GET')
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res)
      })
      .networkFail((err) => {
        if (!onTerminalFailure && this.$message) {
          this.$message.error(err.msg || 'Failed to fetch plugin list');
        }
        retryCallbackRequest(
          (nextRetryCount, nextRetryStartedAt) => this.getPluginFunctionList(
            params,
            callback,
            onTerminalFailure,
            nextRetryCount,
            nextRetryStartedAt
          ),
          retryCount,
          onTerminalFailure,
          err,
          retryWindowStartedAt
        );
      });
    if (onTerminalFailure) {
      request.fail((error) => {
        RequestService.clearRequestTime();
        onTerminalFailure(error);
      });
    }
    request.send()
  },

  // [text]RAG[text]
  getRAGModels(callback) {
    RequestService.sendRequest()
      .url(`${getServiceUrl()}/datasets/rag-models`)
      .method('GET')
      .success((res) => {
        RequestService.clearRequestTime()
        callback(res)
      })
      .networkFail((err) => {
        console.error('Fetch RAG model list failed:', err)
        this.$message.error(err.msg || 'Failed to fetch RAG model list')
        RequestService.reAjaxFun(() => {
          this.getRAGModels(callback)
        })
      }).send()
  }
}
