//[text]
import Api from "@/apis/api";
import store from "@/store";

class FeatureManager {
    constructor() {
        this.defaultFeatures = {
            voiceprintRecognition: {
                name: 'feature.voiceprintRecognition.name',
                enabled: false,
                description: 'feature.voiceprintRecognition.description'
            },
            voiceClone: {
                name: 'feature.voiceClone.name',
                enabled: false,
                description: 'feature.voiceClone.description'
            },
            knowledgeBase: {
                name: 'feature.knowledgeBase.name',
                enabled: false,
                description: 'feature.knowledgeBase.description'
            },
            mcpAccessPoint: {
                name: 'feature.mcpAccessPoint.name',
                enabled: false,
                description: 'feature.mcpAccessPoint.description'
            },
            vad: {
                name: 'feature.vad.name',
                enabled: false,
                description: 'feature.vad.description'
            },
            asr: {
                name: 'feature.asr.name',
                enabled: false,
                description: 'feature.asr.description'
            },
            addressBook: {
                name: 'feature.addressBook.name',
                enabled: false,
                description: 'feature.addressBook.description'
            }
        };
        this.currentFeatures = { ...this.defaultFeatures }; // 当前内存中的配// [comment]
        this.initialized = false;
        this.initPromise = null;
    }

    /**
     * [text]
     */
    async waitForInitialization() {
        if (!this.initPromise) {
            this.initPromise = this.init();
        }
        await this.initPromise;
        return this.initialized;
    }

    /**
     * [text]
     */
    async init() {
        try {
            // [text]pub-config[text]
            const config = await this.getConfigFromPubConfig();
            if (config) {
                this.currentFeatures = { ...config }; // 保存到内// [comment]
                this.initialized = true;
                return;
            }
        } catch (error) {
            console.warn('从pub-config接口获取配置失败:', error);
        }

        // pub-config[text]，[text]
        this.currentFeatures = { ...this.defaultFeatures }; // 保存默认配置到内// [comment]
        this.initialized = true;
    }

    /**
     * [text]config[text]
     */
    updateConfigCache(config) {
        store.commit('setPubConfig', config);
        localStorage.setItem('pubConfig', JSON.stringify(config));
    }

    /**
     * [text]pub-config[text]
     */
    async getConfigFromPubConfig() {
        return new Promise((resolve) => {
            // [text]pub-config[text]
            Api.user.getPubConfig((result) => {
                // [text]
                if (result && result.status === 200) {
                    // [text]data[text]
                    if (result.data) {
                        const configCache = result.data.data || {};
                        // [text]code[text]，[text]code[text]
                        if (result.data.code !== undefined) {
                            if (result.data.code === 0 && result.data.data && result.data.data.systemWebMenu) {
                                try {
                                    let config;
                                    if (typeof result.data.data.systemWebMenu === 'string') {
                                        // [text]，[text]JSON
                                        config = JSON.parse(result.data.data.systemWebMenu);
                                    } else {
                                        // [text]，[text]
                                        config = result.data.data.systemWebMenu;
                                    }

                                    // [text]features[text]
                                    if (config && config.features) {
                                        // [text]knowledgeBase[text]
                                        if (!config.features.knowledgeBase) {
                                            console.warn('配置中缺少knowledgeBase功能，合并默认配置');
                                            config.features = { ...this.defaultFeatures, ...config.features };
                                        }
                                        resolve(config.features);
                                    } else {
                                        console.warn('配置中缺少features对象，使用默认配置');
                                        resolve(this.defaultFeatures);
                                    }
                                    configCache.systemWebMenu = config;
                                } catch (error) {
                                    console.warn('处理systemWebMenu配置失败:', error);
                                    resolve(null);
                                }
                            } else {
                                console.warn('接口返回code不为0或缺少必要数据，使用默认配置');
                                resolve(null);
                            }
                        } else {
                            // [text]code[text]，[text]systemWebMenu
                            if (result.data && result.data.systemWebMenu) {
                                try {
                                    let config;
                                    if (typeof result.data.systemWebMenu === 'string') {
                                        // [text]，[text]JSON
                                        config = JSON.parse(result.data.systemWebMenu);
                                    } else {
                                        // [text]，[text]
                                        config = result.data.systemWebMenu;
                                    }

                                    // [text]features[text]
                                    if (config && config.features) {
                                        // [text]knowledgeBase[text]
                                        if (!config.features.knowledgeBase) {
                                            console.warn('配置中缺少knowledgeBase功能，合并默认配置');
                                            config.features = { ...this.defaultFeatures, ...config.features };
                                        }
                                        resolve(config.features);
                                    } else {
                                        console.warn('配置中缺少features对象，使用默认配置');
                                        resolve(this.defaultFeatures);
                                    }
                                    configCache.systemWebMenu = config;
                                } catch (error) {
                                    console.warn('处理systemWebMenu配置失败:', error);
                                    resolve(null);
                                }
                            } else {
                                console.warn('接口返回缺少systemWebMenu数据，使用默认配置');
                                resolve(null);
                            }
                        }
                        this.updateConfigCache(configCache)
                    } else {
                        console.warn('接口返回数据中缺少data字段，使用默认配置');
                        resolve(null);
                    }
                } else {
                    console.warn('pub-config接口调用失败，使用默认配置');
                    resolve(null);
                }
            });
        });
    }

    /**
     * [text]
     */
    getCurrentConfig() {
        // [text]
        return this.currentFeatures;
    }

    /**
     * [text]API
     */
    async saveConfig(config) {
        try {
            // [text]
            this.currentFeatures = { ...config };

            // [text]API
            this.saveConfigToAPI(config).catch(error => {
                console.warn('保存配置到API失败:', error);
            }).finally(() => {
                this.init()
            });

            // [text]
            window.dispatchEvent(new CustomEvent('featureConfigChanged', {
                detail: config
            }));
        } catch (error) {
            console.error('保存功能配置失败:', error);
        }
    }

    /**
     * [text]API
     */
    async saveConfigToAPI(config) {
        return new Promise((resolve) => {
            // [text]ID（600）[text]
            Api.admin.updateParam(
                {
                    id: 600,
                    paramCode: 'system-web.menu',
                    paramValue: JSON.stringify({
                        features: config,
                        groups: {
                            featureManagement: ["voiceprintRecognition", "voiceClone", "knowledgeBase", "mcpAccessPoint", "addressBook"],
                            voiceManagement: ["vad", "asr"]
                        }
                    }),
                    valueType: 'json',
                    remark: 'Default configuration'
                },
                (updateResult) => {
                    if (updateResult.code === 0) {
                        resolve();
                    } else {
                        // [text]，[text]，[text]localStorage
                        console.warn('更新参数失败:', updateResult.msg);
                        resolve(); // 不阻止保存// [comment]localStorage
                    }
                },
                (error) => {
                    console.warn('更新参数失败:', error);
                    resolve(); // 不阻止保存// [comment]localStorage
                }
            );
        });
    }



    /**
     * [text]
     */
    getAllFeatures() {
        return this.getCurrentConfig();
    }

    /**
     * [text]（[text]）
     */
    getConfig() {
        const features = this.getAllFeatures();
        return {
            voiceprintRecognition: features.voiceprintRecognition?.enabled || false,
            voiceClone: features.voiceClone?.enabled || false,
            knowledgeBase: features.knowledgeBase?.enabled || false,
            mcpAccessPoint: features.mcpAccessPoint?.enabled || false,
            vad: features.vad?.enabled || false,
            asr: features.asr?.enabled || false,
            addressBook: features.addressBook?.enabled || false
        };
    }

    /**
     * [text]
     */
    getFeatureStatus(featureKey) {
        const features = this.getAllFeatures();
        return features[featureKey]?.enabled || false;
    }

    /**
     * [text]
     */
    setFeatureStatus(featureKey, enabled) {
        const features = this.getAllFeatures();
        if (features[featureKey]) {
            features[featureKey].enabled = enabled;
            this.saveConfig(features);
            return true;
        }
        return false;
    }

    /**
     * [text]
     */
    enableFeature(featureKey) {
        return this.setFeatureStatus(featureKey, true);
    }

    /**
     * [text]
     */
    disableFeature(featureKey) {
        return this.setFeatureStatus(featureKey, false);
    }

    /**
     * [text]
     */
    toggleFeature(featureKey) {
        const currentStatus = this.getFeatureStatus(featureKey);
        return this.setFeatureStatus(featureKey, !currentStatus);
    }

    /**
     * [text]
     */
    resetToDefault() {
        this.saveConfig(this.defaultFeatures);
    }

    /**
     * [text]
     */
    updateFeatures(featureUpdates) {
        const features = this.getAllFeatures();
        Object.keys(featureUpdates).forEach(featureKey => {
            if (features[featureKey]) {
                features[featureKey].enabled = featureUpdates[featureKey];
            } else if (this.defaultFeatures[featureKey]) {
                features[featureKey] = { ...this.defaultFeatures[featureKey] };
                features[featureKey].enabled = featureUpdates[featureKey];
            }
        });
        this.saveConfig(features);
    }

    /**
     * [text]
     */
    getEnabledFeatures() {
        const features = this.getAllFeatures();
        return Object.keys(features).filter(key => features[key].enabled);
    }

    /**
     * [text]
     */
    isFeatureEnabled(featureKey) {
        return this.getFeatureStatus(featureKey);
    }
}

// [text]
const featureManager = new FeatureManager();

export default featureManager;