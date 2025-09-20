// 表情缓存系统 - 使用IndexedDB存储图片数据
(function(global) {
  'use strict';

  // 缓存配置
  const CACHE_CONFIG = {
    dbName: 'EmojiCacheDB',
    dbVersion: 1,
    emojiStore: 'emojis',
    messageStore: 'messages',
    cacheExpiry: 30 * 24 * 60 * 60 * 1000, // 30天过期
    maxCacheSize: 100 * 1024 * 1024, // 100MB限制
    currentCacheSize: 0
  };

  // IndexedDB实例
  let db = null;
  let isInitialized = false;

  // ==================== 初始化数据库 ====================
  async function initDB() {
    if (isInitialized) return db;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(CACHE_CONFIG.dbName, CACHE_CONFIG.dbVersion);
      
      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };
      
      request.onsuccess = () => {
        db = request.result;
        isInitialized = true;
        console.log('IndexedDB initialized successfully');
        
        // 计算当前缓存大小
        calculateCacheSize();
        resolve(db);
      };
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // 创建表情存储
        if (!db.objectStoreNames.contains(CACHE_CONFIG.emojiStore)) {
          const emojiStore = db.createObjectStore(CACHE_CONFIG.emojiStore, { keyPath: 'url' });
          emojiStore.createIndex('timestamp', 'timestamp', { unique: false });
          emojiStore.createIndex('size', 'size', { unique: false });
        }
        
        // 创建消息图片存储
        if (!db.objectStoreNames.contains(CACHE_CONFIG.messageStore)) {
          const messageStore = db.createObjectStore(CACHE_CONFIG.messageStore, { keyPath: 'url' });
          messageStore.createIndex('timestamp', 'timestamp', { unique: false });
          messageStore.createIndex('messageId', 'messageId', { unique: false });
        }
      };
    });
  }

  // ==================== 缓存表情图片 ====================
  async function cacheEmojiImage(url, blob) {
    try {
      if (!db) await initDB();
      
      // 检查缓存大小限制
      const blobSize = blob.size;
      if (CACHE_CONFIG.currentCacheSize + blobSize > CACHE_CONFIG.maxCacheSize) {
        await cleanOldCache();
      }
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.emojiStore);
      
      const data = {
        url: url,
        blob: blob,
        timestamp: Date.now(),
        size: blobSize,
        mimeType: blob.type
      };
      
      const request = store.put(data);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          CACHE_CONFIG.currentCacheSize += blobSize;
          console.log(`Cached emoji: ${url}`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to cache emoji:', error);
    }
  }

  // ==================== 获取缓存的表情 ====================
  async function getCachedEmoji(url) {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore], 'readonly');
      const store = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const request = store.get(url);
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // 检查是否过期
            if (Date.now() - result.timestamp > CACHE_CONFIG.cacheExpiry) {
              // 删除过期缓存
              deleteCachedEmoji(url);
              resolve(null);
            } else {
              console.log(`Using cached emoji: ${url}`);
              resolve(result.blob);
            }
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Failed to get cached emoji:', error);
      return null;
    }
  }

  // ==================== 删除缓存 ====================
  async function deleteCachedEmoji(url) {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.emojiStore);
      
      // 先获取大小信息
      const getRequest = store.get(url);
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          CACHE_CONFIG.currentCacheSize -= result.size;
          
          // 删除记录
          const deleteRequest = store.delete(url);
          deleteRequest.onsuccess = () => {
            console.log(`Deleted cached emoji: ${url}`);
          };
        }
      };
    } catch (error) {
      console.error('Failed to delete cached emoji:', error);
    }
  }

  // ==================== 清理旧缓存 ====================
  async function cleanOldCache() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const index = store.index('timestamp');
      
      const request = index.openCursor();
      let deletedSize = 0;
      const targetSize = CACHE_CONFIG.maxCacheSize * 0.7; // 清理到70%
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && CACHE_CONFIG.currentCacheSize - deletedSize > targetSize) {
          deletedSize += cursor.value.size;
          cursor.delete();
          cursor.continue();
        } else {
          CACHE_CONFIG.currentCacheSize -= deletedSize;
          console.log(`Cleaned ${deletedSize} bytes from cache`);
        }
      };
    } catch (error) {
      console.error('Failed to clean old cache:', error);
    }
  }

  // ==================== 计算缓存大小 ====================
  async function calculateCacheSize() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore, CACHE_CONFIG.messageStore], 'readonly');
      const emojiStore = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const messageStore = transaction.objectStore(CACHE_CONFIG.messageStore);
      
      let totalSize = 0;
      
      // 计算表情缓存大小
      const emojiRequest = emojiStore.openCursor();
      emojiRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          totalSize += cursor.value.size;
          cursor.continue();
        }
      };
      
      // 计算消息图片缓存大小
      const messageRequest = messageStore.openCursor();
      messageRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          totalSize += cursor.value.size;
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        CACHE_CONFIG.currentCacheSize = totalSize;
        console.log(`Current cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
      };
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
    }
  }

  // ==================== 智能图片加载器 ====================
  async function loadImageWithCache(url, imgElement) {
    try {
      // 先尝试从缓存获取
      const cachedBlob = await getCachedEmoji(url);
      
      if (cachedBlob) {
        // 使用缓存的图片
        const objectUrl = URL.createObjectURL(cachedBlob);
        imgElement.src = objectUrl;
        
        // 清理对象URL（延迟执行避免图片加载被中断）
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      } else {
        // 从网络加载并缓存
        const response = await fetch(url);
        const blob = await response.blob();
        
        // 缓存图片
        await cacheEmojiImage(url, blob);
        
        // 显示图片
        const objectUrl = URL.createObjectURL(blob);
        imgElement.src = objectUrl;
        
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
    } catch (error) {
      console.error('Failed to load image with cache:', error);
      // 降级到直接加载
      imgElement.src = url;
    }
  }

  // ==================== 批量预加载 ====================
  async function preloadEmojis(urls) {
    const promises = urls.map(async (url) => {
      try {
        const cached = await getCachedEmoji(url);
        if (!cached) {
          const response = await fetch(url);
          const blob = await response.blob();
          await cacheEmojiImage(url, blob);
        }
      } catch (error) {
        console.error(`Failed to preload ${url}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    console.log(`Preloaded ${urls.length} emojis`);
  }

  // ==================== 清空所有缓存 ====================
  async function clearAllCache() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore, CACHE_CONFIG.messageStore], 'readwrite');
      const emojiStore = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const messageStore = transaction.objectStore(CACHE_CONFIG.messageStore);
      
      await emojiStore.clear();
      await messageStore.clear();
      
      CACHE_CONFIG.currentCacheSize = 0;
      console.log('All cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // ==================== 获取缓存统计 ====================
  async function getCacheStats() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore, CACHE_CONFIG.messageStore], 'readonly');
      const emojiStore = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const messageStore = transaction.objectStore(CACHE_CONFIG.messageStore);
      
      const emojiCount = await new Promise((resolve) => {
        const request = emojiStore.count();
        request.onsuccess = () => resolve(request.result);
      });
      
      const messageCount = await new Promise((resolve) => {
        const request = messageStore.count();
        request.onsuccess = () => resolve(request.result);
      });
      
      return {
        emojiCount,
        messageCount,
        totalSize: CACHE_CONFIG.currentCacheSize,
        totalSizeMB: (CACHE_CONFIG.currentCacheSize / 1024 / 1024).toFixed(2),
        maxSize: CACHE_CONFIG.maxCacheSize,
        maxSizeMB: (CACHE_CONFIG.maxCacheSize / 1024 / 1024).toFixed(2),
        usagePercent: ((CACHE_CONFIG.currentCacheSize / CACHE_CONFIG.maxCacheSize) * 100).toFixed(1)
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return null;
    }
  }

  // ==================== 修改后的渲染表情网格函数 ====================
  window.renderEmojiGridWithCache = async function(emojis, gridContainer) {
    if (!gridContainer) return;
    
    if (emojis.length === 0) {
      gridContainer.innerHTML = `
        <div class="emoji-empty">
          <div class="emoji-empty-icon"><i class="far fa-meh"></i></div>
          <div class="emoji-empty-text">暂无表情</div>
        </div>
      `;
      return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'emoji-grid';
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(6, 1fr)';
    grid.style.gap = '8px';
    grid.style.padding = '12px';
    
    // 预加载所有表情URL
    const urls = emojis.map(emoji => `${window.API_BASE_URL}${emoji.file_path}`);
    preloadEmojis(urls); // 异步预加载，不阻塞渲染
    
    emojis.forEach(emoji => {
      const item = document.createElement('div');
      item.className = 'emoji-item';
      item.style.cursor = 'pointer';
      item.style.padding = '4px';
      item.style.borderRadius = '8px';
      item.style.transition = 'all 0.2s';
      
      const img = document.createElement('img');
      img.alt = emoji.emoji_name || emoji.file_name;
      img.style.width = '32px';
      img.style.height = '32px';
      img.style.objectFit = 'contain';
      
      // 使用缓存加载器
      const fullUrl = `${window.API_BASE_URL}${emoji.file_path}`;
      loadImageWithCache(fullUrl, img);
      
      item.appendChild(img);
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'emoji-item-name';
      nameSpan.style.display = 'none';
      nameSpan.textContent = emoji.emoji_name || emoji.file_name;
      item.appendChild(nameSpan);
      
      item.addEventListener('mouseenter', () => {
        item.style.background = '#f0f2f5';
        item.style.transform = 'scale(1.1)';
      });
      
      item.addEventListener('mouseleave', () => {
        item.style.background = 'transparent';
        item.style.transform = 'scale(1)';
      });
      
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        if (window.sendEmoji) {
          window.sendEmoji(emoji);
        }
      });
      
      grid.appendChild(item);
    });
    
    gridContainer.innerHTML = '';
    gridContainer.appendChild(grid);
  };

  // ==================== 暴露API ====================
  global.EmojiCache = {
    init: initDB,
    cacheEmoji: cacheEmojiImage,
    getCachedEmoji: getCachedEmoji,
    loadImageWithCache: loadImageWithCache,
    preloadEmojis: preloadEmojis,
    clearCache: clearAllCache,
    getStats: getCacheStats,
    cleanOldCache: cleanOldCache
  };

  // 自动初始化
  initDB().catch(console.error);

  console.log('Emoji cache system initialized');

})(window);