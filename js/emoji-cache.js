// emoji-cache.js - 完整表情缓存系统（支持圆环进度条）
// 包含：图片缓存、音频缓存、缓存管理UI、圆环进度条
(function(global) {
  'use strict';

  console.log('Loading emoji cache system...');

  // ==================== 缓存配置 ====================
  const CACHE_CONFIG = {
    dbName: 'EmojiCacheDB',
    dbVersion: 2,
    emojiStore: 'emojis',
    audioStore: 'audios',
    messageStore: 'messages',
    cacheExpiry: 30 * 24 * 60 * 60 * 1000, // 30天过期
    maxCacheSize: 500 * 1024 * 1024, // 500MB限制
    currentCacheSize: 0
  };

  const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';

  // IndexedDB实例
  let db = null;
  let isInitialized = false;

  // ==================== 数据库初始化 ====================
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
        console.log('IndexedDB initialized successfully (v2 with audio support)');
        
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
        
        // 创建音频存储
        if (!db.objectStoreNames.contains(CACHE_CONFIG.audioStore)) {
          const audioStore = db.createObjectStore(CACHE_CONFIG.audioStore, { keyPath: 'url' });
          audioStore.createIndex('timestamp', 'timestamp', { unique: false });
          audioStore.createIndex('size', 'size', { unique: false });
          audioStore.createIndex('emojiId', 'emojiId', { unique: false });
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

  // ==================== 缓存功能 ====================
  
  // 缓存表情图片
  async function cacheEmojiImage(url, blob) {
    try {
      if (!db) await initDB();
      
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
          console.log(`Cached emoji: ${url} (${(blobSize/1024).toFixed(2)}KB)`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to cache emoji:', error);
    }
  }

  // 缓存音频文件
  async function cacheAudioFile(url, blob, emojiId) {
    try {
      if (!db) await initDB();
      
      const blobSize = blob.size;
      if (CACHE_CONFIG.currentCacheSize + blobSize > CACHE_CONFIG.maxCacheSize) {
        await cleanOldCache();
      }
      
      const transaction = db.transaction([CACHE_CONFIG.audioStore], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.audioStore);
      
      const data = {
        url: url,
        blob: blob,
        timestamp: Date.now(),
        size: blobSize,
        mimeType: blob.type,
        emojiId: emojiId || null
      };
      
      const request = store.put(data);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          CACHE_CONFIG.currentCacheSize += blobSize;
          console.log(`Cached audio: ${url} (${(blobSize/1024).toFixed(2)}KB)`);
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to cache audio:', error);
    }
  }

  // 获取缓存的表情
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

  // 获取缓存的音频
  async function getCachedAudio(url) {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.audioStore], 'readonly');
      const store = transaction.objectStore(CACHE_CONFIG.audioStore);
      const request = store.get(url);
      
      return new Promise((resolve) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            // 检查是否过期
            if (Date.now() - result.timestamp > CACHE_CONFIG.cacheExpiry) {
              deleteCachedAudio(url);
              resolve(null);
            } else {
              console.log(`Using cached audio: ${url}`);
              resolve(result.blob);
            }
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      });
    } catch (error) {
      console.error('Failed to get cached audio:', error);
      return null;
    }
  }

  // ==================== 智能加载器 ====================
  
  // 智能图片加载器
  async function loadImageWithCache(url, imgElement) {
    try {
      // 保存原始URL
      const originalUrl = url;
      if (imgElement) {
        imgElement.dataset.originalUrl = originalUrl;
      }
      
      // 先尝试从缓存获取
      const cachedBlob = await getCachedEmoji(url);
      
      if (cachedBlob) {
        // 对于音频表情，考虑是否使用blob URL
        if (imgElement && (imgElement.classList.contains('has-audio-emoji') || 
            imgElement.parentElement?.classList.contains('emoji-item') ||
            imgElement.classList.contains('emoji-message-img'))) {
          
          // 音频表情可以选择直接使用原始URL（避免blob URL问题）
          imgElement.src = originalUrl;
          console.log('Using original URL for audio emoji:', originalUrl);
        } else if (imgElement) {
          // 普通表情使用blob URL
          const objectUrl = URL.createObjectURL(cachedBlob);
          imgElement.src = objectUrl;
          
          // 延迟清理
          setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
        }
        
        return cachedBlob;
      } else {
        // 从网络加载并缓存
        const response = await fetch(url);
        const blob = await response.blob();
        
        // 缓存图片
        await cacheEmojiImage(url, blob);
        
        if (imgElement) {
          imgElement.src = url;
        }
        
        return blob;
      }
    } catch (error) {
      console.error('Failed to load image with cache:', error);
      // 降级到直接加载
      if (imgElement) {
        imgElement.src = url;
      }
      return null;
    }
  }

  // 智能音频加载器
  async function loadAudioWithCache(url, emojiId) {
    try {
      // 先尝试从缓存获取
      let cachedBlob = await getCachedAudio(url);
      
      if (cachedBlob) {
        console.log(`Using cached audio for: ${url}`);
        const objectUrl = URL.createObjectURL(cachedBlob);
        return objectUrl;
      } else {
        // 从网络加载并缓存
        console.log(`Fetching audio from network: ${url}`);
        const response = await fetch(url);
        const blob = await response.blob();
        
        // 缓存音频
        await cacheAudioFile(url, blob, emojiId);
        
        // 返回对象URL
        const objectUrl = URL.createObjectURL(blob);
        return objectUrl;
      }
    } catch (error) {
      console.error('Failed to load audio with cache:', error);
      // 降级到直接返回URL
      return url;
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

  async function preloadAudios(audioData) {
    const promises = audioData.map(async ({ url, emojiId }) => {
      try {
        const cached = await getCachedAudio(url);
        if (!cached) {
          const response = await fetch(url);
          const blob = await response.blob();
          await cacheAudioFile(url, blob, emojiId);
        }
      } catch (error) {
        console.error(`Failed to preload audio ${url}:`, error);
      }
    });
    
    await Promise.allSettled(promises);
    console.log(`Preloaded ${audioData.length} audio files`);
  }

  // ==================== 缓存管理 ====================
  
  // 删除缓存的表情
  async function deleteCachedEmoji(url) {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.emojiStore);
      
      const getRequest = store.get(url);
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          CACHE_CONFIG.currentCacheSize -= result.size;
          
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

  // 删除缓存的音频
  async function deleteCachedAudio(url) {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.audioStore], 'readwrite');
      const store = transaction.objectStore(CACHE_CONFIG.audioStore);
      
      const getRequest = store.get(url);
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          CACHE_CONFIG.currentCacheSize -= result.size;
          
          const deleteRequest = store.delete(url);
          deleteRequest.onsuccess = () => {
            console.log(`Deleted cached audio: ${url}`);
          };
        }
      };
    } catch (error) {
      console.error('Failed to delete cached audio:', error);
    }
  }

  // 清理旧缓存
  async function cleanOldCache() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([CACHE_CONFIG.emojiStore, CACHE_CONFIG.audioStore], 'readwrite');
      const emojiStore = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const audioStore = transaction.objectStore(CACHE_CONFIG.audioStore);
      const emojiIndex = emojiStore.index('timestamp');
      const audioIndex = audioStore.index('timestamp');
      
      let deletedSize = 0;
      const targetSize = CACHE_CONFIG.maxCacheSize * 0.7; // 清理到70%
      
      // 清理表情缓存
      const emojiRequest = emojiIndex.openCursor();
      emojiRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && CACHE_CONFIG.currentCacheSize - deletedSize > targetSize) {
          deletedSize += cursor.value.size;
          cursor.delete();
          cursor.continue();
        }
      };
      
      // 清理音频缓存
      const audioRequest = audioIndex.openCursor();
      audioRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && CACHE_CONFIG.currentCacheSize - deletedSize > targetSize) {
          deletedSize += cursor.value.size;
          cursor.delete();
          cursor.continue();
        }
      };
      
      transaction.oncomplete = () => {
        CACHE_CONFIG.currentCacheSize -= deletedSize;
        console.log(`Cleaned ${(deletedSize/1024/1024).toFixed(2)}MB from cache`);
      };
    } catch (error) {
      console.error('Failed to clean old cache:', error);
    }
  }

  // 清空所有缓存
  async function clearAllCache() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([
        CACHE_CONFIG.emojiStore, 
        CACHE_CONFIG.audioStore, 
        CACHE_CONFIG.messageStore
      ], 'readwrite');
      
      const emojiStore = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const audioStore = transaction.objectStore(CACHE_CONFIG.audioStore);
      const messageStore = transaction.objectStore(CACHE_CONFIG.messageStore);
      
      await emojiStore.clear();
      await audioStore.clear();
      await messageStore.clear();
      
      CACHE_CONFIG.currentCacheSize = 0;
      console.log('All cache cleared');
      
      // 刷新统计显示
      if (typeof refreshCacheStatsSilently === 'function') {
        refreshCacheStatsSilently();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // 清空音频缓存
  async function clearAudioCache() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction(['audios'], 'readwrite');
      const audioStore = transaction.objectStore('audios');
      
      await audioStore.clear();
      
      console.log('Audio cache cleared');
      alert('音频缓存已清空');
      
      // 刷新统计
      if (typeof refreshCacheStatsSilently === 'function') {
        refreshCacheStatsSilently();
      }
    } catch (error) {
      console.error('Failed to clear audio cache:', error);
      alert('清空音频缓存失败');
    }
  }

  // ==================== 缓存统计 ====================
  
  // 计算缓存大小
  async function calculateCacheSize() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([
        CACHE_CONFIG.emojiStore, 
        CACHE_CONFIG.audioStore, 
        CACHE_CONFIG.messageStore
      ], 'readonly');
      
      const emojiStore = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const audioStore = transaction.objectStore(CACHE_CONFIG.audioStore);
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
      
      // 计算音频缓存大小
      const audioRequest = audioStore.openCursor();
      audioRequest.onsuccess = (event) => {
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
        console.log(`Current cache size: ${(totalSize / 1024 / 1024).toFixed(2)} MB / ${(CACHE_CONFIG.maxCacheSize / 1024 / 1024).toFixed(0)} MB`);
      };
    } catch (error) {
      console.error('Failed to calculate cache size:', error);
    }
  }

  // 获取缓存统计
  async function getCacheStats() {
    try {
      if (!db) await initDB();
      
      const transaction = db.transaction([
        CACHE_CONFIG.emojiStore, 
        CACHE_CONFIG.audioStore, 
        CACHE_CONFIG.messageStore
      ], 'readonly');
      
      const emojiStore = transaction.objectStore(CACHE_CONFIG.emojiStore);
      const audioStore = transaction.objectStore(CACHE_CONFIG.audioStore);
      const messageStore = transaction.objectStore(CACHE_CONFIG.messageStore);
      
      const emojiCount = await new Promise((resolve) => {
        const request = emojiStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      
      const audioCount = await new Promise((resolve) => {
        const request = audioStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      
      const messageCount = await new Promise((resolve) => {
        const request = messageStore.count();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => resolve(0);
      });
      
      return {
        emojiCount,
        audioCount,
        messageCount,
        totalSize: CACHE_CONFIG.currentCacheSize,
        totalSizeMB: (CACHE_CONFIG.currentCacheSize / 1024 / 1024).toFixed(2),
        maxSize: CACHE_CONFIG.maxCacheSize,
        maxSizeMB: (CACHE_CONFIG.maxCacheSize / 1024 / 1024).toFixed(2),
        usagePercent: ((CACHE_CONFIG.currentCacheSize / CACHE_CONFIG.maxCacheSize) * 100).toFixed(1)
      };
    } catch (error) {
      console.error('Failed to get cache stats:', error);
      return {
        emojiCount: 0,
        audioCount: 0,
        messageCount: 0,
        totalSize: 0,
        totalSizeMB: '0.00',
        maxSize: CACHE_CONFIG.maxCacheSize,
        maxSizeMB: (CACHE_CONFIG.maxCacheSize / 1024 / 1024).toFixed(2),
        usagePercent: '0.0'
      };
    }
  }

  // ==================== 缓存管理UI ====================
  
  // 刷新缓存统计
  global.handleRefreshCacheStats = async function() {
    console.log('=== 刷新缓存统计 ===');
    const btn = document.getElementById('refresh-cache-stats');
    
    if (!btn) {
      console.error('找不到刷新按钮');
      return;
    }
    
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>刷新中...';
    
    try {
      await refreshCacheStatsCore();
      showCacheStatus('缓存统计已更新', 'success');
    } catch (error) {
      console.error('刷新失败:', error);
      showCacheStatus('刷新失败: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  };
  
  // 清理旧缓存
  global.handleCleanOldCache = async function() {
    console.log('=== 清理旧缓存 ===');
    
    if (!confirm('确定要清理旧缓存吗？这将删除最早的缓存数据以释放空间。')) {
      return;
    }
    
    const btn = document.getElementById('clean-old-cache');
    if (!btn) {
      console.error('找不到清理按钮');
      return;
    }
    
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>清理中...';
    
    try {
      await cleanOldCache();
      showCacheStatus('旧缓存已清理', 'success');
      await refreshCacheStatsCore();
    } catch (error) {
      console.error('清理失败:', error);
      showCacheStatus('清理失败: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  };
  
  // 清空所有缓存
  global.handleClearAllCache = async function() {
    console.log('=== 清空所有缓存 ===');
    
    if (!confirm('确定要清空所有缓存吗？这将删除所有已缓存的表情、音频和消息图片。')) {
      return;
    }
    
    const btn = document.getElementById('clear-all-cache');
    if (!btn) {
      console.error('找不到清空按钮');
      return;
    }
    
    btn.disabled = true;
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>清空中...';
    
    try {
      await clearAllCache();
      showCacheStatus('所有缓存已清空', 'success');
      await refreshCacheStatsCore();
    } catch (error) {
      console.error('清空失败:', error);
      showCacheStatus('清空失败: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = originalHTML;
    }
  };
  
  // 核心刷新统计函数
  async function refreshCacheStatsCore() {
    console.log('开始刷新缓存统计（核心）...');
    
    try {
      const stats = await getCacheStats();
      updateCacheDisplay(stats);
    } catch (error) {
      console.error('刷新缓存统计失败:', error);
      updateCacheDisplayDefault();
      throw error;
    }
  }
  
  // 更新缓存显示（支持圆环进度条）
  function updateCacheDisplay(stats) {
    // 更新统计数字
    const emojiCountEl = document.getElementById('cache-emoji-count');
    const audioCountEl = document.getElementById('cache-audio-count');
    const messageCountEl = document.getElementById('cache-message-count');
    const cacheSizeEl = document.getElementById('cache-size');
    const usageTextEl = document.getElementById('cache-usage-text');
    
    if (emojiCountEl) emojiCountEl.textContent = stats.emojiCount || 0;
    if (audioCountEl) audioCountEl.textContent = stats.audioCount || 0;
    if (messageCountEl) messageCountEl.textContent = stats.messageCount || 0;
    if (cacheSizeEl) cacheSizeEl.textContent = (stats.totalSizeMB || '0.00') + ' MB';
    
    const totalMB = parseFloat(stats.totalSizeMB) || 0;
    const maxMB = parseFloat(stats.maxSizeMB) || 500;
    const percent = parseFloat(stats.usagePercent) || 0;
    
    if (usageTextEl) {
      usageTextEl.textContent = `${totalMB.toFixed(2)} MB / ${maxMB} MB`;
    }
    
    // 更新圆环进度条
    const ringProgressFill = document.getElementById('ring-progress-fill');
    const ringProgressPercent = document.getElementById('ring-progress-percent');
    
    if (ringProgressFill) {
      const circumference = 2 * Math.PI * 65; // 408.4
      const offset = circumference - (circumference * percent / 100);
      ringProgressFill.style.strokeDashoffset = offset;
    }
    
    if (ringProgressPercent) {
      ringProgressPercent.textContent = percent + '%';
    }
    
    // 兼容旧的条形进度条（如果存在）
    const progressFillEl = document.getElementById('cache-progress-fill');
    if (progressFillEl && progressFillEl.style.width !== undefined) {
      progressFillEl.style.width = Math.max(percent, 5) + '%';
      const progressText = progressFillEl.querySelector('.progress-text');
      if (progressText) {
        progressText.textContent = percent.toFixed(1) + '%';
      }
    }
  }
  
  // 显示默认值
  function updateCacheDisplayDefault() {
    const emojiCountEl = document.getElementById('cache-emoji-count');
    const audioCountEl = document.getElementById('cache-audio-count');
    const messageCountEl = document.getElementById('cache-message-count');
    const cacheSizeEl = document.getElementById('cache-size');
    const usageTextEl = document.getElementById('cache-usage-text');
    const ringProgressFill = document.getElementById('ring-progress-fill');
    const ringProgressPercent = document.getElementById('ring-progress-percent');
    const progressFillEl = document.getElementById('cache-progress-fill');
    
    if (emojiCountEl) emojiCountEl.textContent = '0';
    if (audioCountEl) audioCountEl.textContent = '0';
    if (messageCountEl) messageCountEl.textContent = '0';
    if (cacheSizeEl) cacheSizeEl.textContent = '0.00 MB';
    if (usageTextEl) usageTextEl.textContent = '0.00 MB / 500 MB';
    
    // 更新圆环进度条
    if (ringProgressFill) {
      const circumference = 2 * Math.PI * 65;
      ringProgressFill.style.strokeDashoffset = circumference; // 0%
    }
    
    if (ringProgressPercent) {
      ringProgressPercent.textContent = '0%';
    }
    
    // 兼容旧进度条
    if (progressFillEl) {
      progressFillEl.style.width = '5%';
      const progressText = progressFillEl.querySelector('.progress-text');
      if (progressText) {
        progressText.textContent = '0.0%';
      }
    }
  }
  
  // 显示缓存状态信息
  function showCacheStatus(message, type = 'info') {
    const statusDiv = document.getElementById('cache-status');
    const statusText = document.getElementById('cache-status-text');
    
    if (statusDiv && statusText) {
      statusText.textContent = message;
      statusDiv.className = '';
      statusDiv.classList.add(type);
      statusDiv.style.display = 'block';
      
      setTimeout(() => {
        statusDiv.style.display = 'none';
      }, 3000);
    }
    
    if (type === 'success' && typeof global.showSuccessMessage === 'function') {
      global.showSuccessMessage(message);
    } else if (type === 'error' && typeof global.showErrorMessage === 'function') {
      global.showErrorMessage(message);
    }
  }
  
  // 初始化缓存设置
  global.initCacheSettings = async function() {
    console.log('初始化缓存设置...');
    
    // 首先替换进度条为圆环形
    replaceProgressBarWithRing();
    
    try {
      await initDB();
      console.log('EmojiCache 已初始化');
      await refreshCacheStatsCore();
      showCacheStatus('缓存系统已就绪（支持500MB容量）', 'success');
    } catch (error) {
      console.error('初始化缓存系统失败:', error);
      showCacheStatus('缓存系统初始化失败: ' + error.message, 'error');
      updateCacheDisplayDefault();
    }
    
    // 绑定开关事件
    const autoCleanSwitch = document.getElementById('auto-clean-cache');
    const preloadSwitch = document.getElementById('preload-emoji');
    
    if (autoCleanSwitch) {
      autoCleanSwitch.addEventListener('change', function() {
        localStorage.setItem('autoCleanCache', this.checked);
        showCacheStatus('自动清理设置已' + (this.checked ? '开启' : '关闭'), 'success');
      });
      
      const autoClean = localStorage.getItem('autoCleanCache') !== 'false';
      autoCleanSwitch.checked = autoClean;
    }
    
    if (preloadSwitch) {
      preloadSwitch.addEventListener('change', function() {
        localStorage.setItem('preloadEmoji', this.checked);
        showCacheStatus('预加载设置已' + (this.checked ? '开启' : '关闭'), 'success');
      });
      
      const preload = localStorage.getItem('preloadEmoji') !== 'false';
      preloadSwitch.checked = preload;
    }
  };
  
  // 替换进度条为圆环形
  function replaceProgressBarWithRing() {
    const progressDiv = document.querySelector('.cache-progress');
    if (!progressDiv) return;
    
    // 检查是否已经是圆环进度条
    if (progressDiv.querySelector('.ring-progress-container')) return;
    
    // 创建圆环进度条HTML
    const ringHTML = `
      <div class="ring-progress-container">
        <svg class="ring-progress-svg" viewBox="0 0 140 140">
          <defs>
            <linearGradient id="ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
            </linearGradient>
          </defs>
          <circle class="ring-progress-bg" cx="70" cy="70" r="65"></circle>
          <circle class="ring-progress-fill" id="ring-progress-fill" cx="70" cy="70" r="65"></circle>
        </svg>
        <div class="ring-progress-text">
          <span class="ring-progress-percent" id="ring-progress-percent">0%</span>
          <span class="ring-progress-label">已使用</span>
        </div>
      </div>
      <div class="cache-progress-info">
        <span id="cache-usage-text">0.00 MB / 500 MB</span>
      </div>
    `;
    
    progressDiv.innerHTML = ringHTML;
  }
  
  // 静默刷新统计
  global.refreshCacheStatsSilently = async function() {
    try {
      await refreshCacheStatsCore();
    } catch (error) {
      console.error('静默刷新失败:', error);
    }
  };

  // ==================== 测试功能 ====================
  
  window.testAudioCache = async function() {
    console.log('=== Testing Audio Cache ===');
    
    const testUrl = 'https://api.am-all.com.cn/emojis/test/test.m4a';
    
    try {
      console.log('Testing cache audio function...');
      const blob = new Blob(['test audio data'], { type: 'audio/m4a' });
      await cacheAudioFile(testUrl, blob, 'test-emoji');
      console.log('✅ Audio cache write successful');
      
      const cached = await getCachedAudio(testUrl);
      if (cached) {
        console.log('✅ Audio cache read successful');
      } else {
        console.log('❌ Audio cache read failed');
      }
      
      const stats = await getCacheStats();
      console.log('Cache stats:', stats);
      
    } catch (error) {
      console.error('❌ Audio cache test failed:', error);
    }
    
    console.log('=== Test Complete ===');
  };

  // ==================== 暴露API ====================
  global.EmojiCache = {
    init: initDB,
    cacheEmoji: cacheEmojiImage,
    cacheAudio: cacheAudioFile,
    getCachedEmoji: getCachedEmoji,
    getCachedAudio: getCachedAudio,
    loadImageWithCache: loadImageWithCache,
    loadAudioWithCache: loadAudioWithCache,
    preloadEmojis: preloadEmojis,
    preloadAudios: preloadAudios,
    clearCache: clearAllCache,
    getStats: getCacheStats,
    cleanOldCache: cleanOldCache,
    // 添加兼容性方法
    clearAudioCache: clearAudioCache
  };

  // ==================== 自动初始化 ====================
  
  // 页面加载完成后自动初始化
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      const cacheCard = document.getElementById('emoji-cache-card');
      if (cacheCard) {
        console.log('检测到缓存管理卡片，自动初始化...');
        global.initCacheSettings();
      }
    }, 200);
  });

  // 自动初始化数据库
  initDB().then(() => {
    console.log('Emoji cache system initialized successfully (with ring progress)');
    console.log('Commands available:');
    console.log('- testAudioCache(): Test audio cache functionality');
    console.log('- EmojiCache.clearCache(): Clear all cached data');
    console.log('- EmojiCache.getStats(): Get cache statistics');
    console.log('- EmojiCache.cleanOldCache(): Clean old cache to free space');
  }).catch(console.error);

})(window);