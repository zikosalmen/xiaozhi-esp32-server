/**
 * [text] - [text]CDN[text]Service Worker[text]
 */

/**
 * [text]Service Worker[text]
 * @returns {Promise<string[]>} [text]
 */
export const getCacheNames = async () => {
  if (!('caches' in window)) {
    return [];
  }
  
  try {
    return await caches.keys();
  } catch (error) {
    console.error('获取缓存名称失败:', error);
    return [];
  }
};

/**
 * [text]URL
 * @param {string} cacheName [text]
 * @returns {Promise<string[]>} [text]URL[text]
 */
export const getCacheUrls = async (cacheName) => {
  if (!('caches' in window)) {
    return [];
  }
  
  try {
    const cache = await caches.open(cacheName);
    const requests = await cache.keys();
    return requests.map(request => request.url);
  } catch (error) {
    console.error(`获取缓存 ${cacheName} 的URL失败:`, error);
    return [];
  }
};

/**
 * [text]URL[text]
 * @param {string} url [text]URL
 * @returns {Promise<boolean>} [text]
 */
export const isUrlCached = async (url) => {
  if (!('caches' in window)) {
    return false;
  }
  
  try {
    const cacheNames = await getCacheNames();
    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName);
      const match = await cache.match(url);
      if (match) {
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error(`检查URL ${url} 是否缓存失败:`, error);
    return false;
  }
};

/**
 * [text]CDN[text]
 * @returns {Promise<Object>} [text]
 */
export const checkCdnCacheStatus = async () => {
  // [text]CDN[text]
  const cdnCaches = ['cdn-stylesheets', 'cdn-scripts'];
  const results = {
    css: [],
    js: [],
    totalCached: 0,
    totalNotCached: 0
  };
  
  for (const cacheName of cdnCaches) {
    try {
      const urls = await getCacheUrls(cacheName);
      
      // [text]CSS[text]JS[text]
      for (const url of urls) {
        if (url.endsWith('.css')) {
          results.css.push({ url, cached: true });
        } else if (url.endsWith('.js')) {
          results.js.push({ url, cached: true });
        }
        results.totalCached++;
      }
    } catch (error) {
      console.error(`获取 ${cacheName} 缓存信息失败:`, error);
    }
  }
  
  return results;
};

/**
 * [text]Service Worker[text]
 * @returns {Promise<boolean>} [text]
 */
export const clearAllCaches = async () => {
  if (!('caches' in window)) {
    return false;
  }
  
  try {
    const cacheNames = await getCacheNames();
    for (const cacheName of cacheNames) {
      await caches.delete(cacheName);
    }
    return true;
  } catch (error) {
    console.error('清除所有缓存失败:', error);
    return false;
  }
};

/**
 * [text]
 */
export const logCacheStatus = async () => {
  console.group('Service Worker 缓存状态');
  
  const cacheNames = await getCacheNames();
  console.log('已发现的缓存:', cacheNames);
  
  for (const cacheName of cacheNames) {
    const urls = await getCacheUrls(cacheName);
    console.group(`缓存: ${cacheName} (${urls.length} 项)`);
    urls.forEach(url => console.log(url));
    console.groupEnd();
  }
  
  console.groupEnd();
  return cacheNames.length > 0;
}; 