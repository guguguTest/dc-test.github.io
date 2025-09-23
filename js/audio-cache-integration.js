// audio-cache-integration.js - 集成音频缓存功能
// 必须在 emoji-cache.js 之后加载

(function(global) {
  'use strict';

  console.log('Loading audio cache integration...');

  const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';

  // ==================== 增强音频管理器，集成缓存 ====================
  
  if (window.EmojiAudioManager) {
    const originalPlayAudio = window.EmojiAudioManager.playAudio;
    
    // 重写播放函数，添加缓存支持
    window.EmojiAudioManager.playAudio = async function(url) {
      try {
        console.log('Playing audio with cache support:', url);
        
        // 确保有缓存系统
        if (window.EmojiCache && window.EmojiCache.loadAudioWithCache) {
          // 使用缓存系统加载音频
          const audioUrl = await window.EmojiCache.loadAudioWithCache(url);
          
          if (audioUrl) {
            // 停止当前音频
            if (this.currentAudio) {
              this.currentAudio.pause();
              this.currentAudio.currentTime = 0;
            }
            
            // 创建新音频实例
            const audio = new Audio(audioUrl);
            audio.volume = 0.7;
            this.currentAudio = audio;
            
            // 播放音频
            const playPromise = audio.play();
            if (playPromise !== undefined) {
              playPromise.catch(error => {
                console.log('音频自动播放被阻止:', error);
              });
            }
            
            // 如果是blob URL，延迟清理
            if (audioUrl.startsWith('blob:')) {
              audio.addEventListener('ended', () => {
                setTimeout(() => {
                  URL.revokeObjectURL(audioUrl);
                }, 5000);
              });
            }
            
            console.log('Audio played from cache:', audioUrl.startsWith('blob:') ? 'cached' : 'network');
          } else {
            // 降级到原始播放方法
            originalPlayAudio.call(this, url);
          }
        } else {
          // 降级到原始播放方法
          originalPlayAudio.call(this, url);
        }
      } catch (error) {
        console.error('播放音频失败:', error);
        // 降级到原始播放方法
        if (originalPlayAudio) {
          originalPlayAudio.call(this, url);
        }
      }
    };
    
    // 添加预加载音频缓存的方法
    window.EmojiAudioManager.preloadAudioWithCache = async function(url, emojiId) {
      if (window.EmojiCache && window.EmojiCache.loadAudioWithCache) {
        try {
          await window.EmojiCache.loadAudioWithCache(url, emojiId);
          console.log('Audio preloaded to cache:', url);
        } catch (error) {
          console.error('Failed to preload audio:', error);
        }
      }
    };
  }

  // ==================== 修复全局播放函数 ====================
  
  const originalPlayEmojiAudio = window.playEmojiAudio;
  
  window.playEmojiAudio = async function(audioPath) {
    if (!audioPath) return;
    
    console.log('playEmojiAudio called with:', audioPath);
    
    // 确保路径正确
    const fullPath = audioPath.startsWith('http') ? audioPath : `${API_BASE_URL}${audioPath}`;
    
    if (window.EmojiAudioManager && window.EmojiAudioManager.playAudio) {
      // 使用增强的音频管理器（带缓存）
      await window.EmojiAudioManager.playAudio(fullPath);
    } else if (window.EmojiCache && window.EmojiCache.loadAudioWithCache) {
      // 直接使用缓存系统
      try {
        const audioUrl = await window.EmojiCache.loadAudioWithCache(fullPath);
        const audio = new Audio(audioUrl);
        audio.volume = 0.7;
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        // 清理blob URL
        if (audioUrl.startsWith('blob:')) {
          audio.addEventListener('ended', () => {
            setTimeout(() => URL.revokeObjectURL(audioUrl), 5000);
          });
        }
      } catch (error) {
        console.error('Failed to play audio with cache:', error);
        // 降级方案
        const audio = new Audio(fullPath);
        audio.volume = 0.7;
        audio.play().catch(e => console.log('Audio play failed:', e));
      }
    } else {
      // 降级方案
      const audio = new Audio(fullPath);
      audio.volume = 0.7;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  // ==================== 预加载表情包中的音频 ====================
  
  const originalLoadEmojiPackContent = window.loadEmojiPackContent;
  
  window.loadEmojiPackContent = async function(packId) {
    // 先调用原函数
    if (originalLoadEmojiPackContent) {
      await originalLoadEmojiPackContent.call(this, packId);
    }
    
    // 预加载音频
    try {
      const response = await fetch(`${API_BASE_URL}/api/emoji/pack/${packId}/items`);
      if (response.ok) {
        const emojis = await response.json();
        
        // 收集所有音频URL
        const audioData = [];
        emojis.forEach(emoji => {
          const audioPath = emoji.sound_path || emoji.audio_path;
          if (audioPath) {
            const fullUrl = audioPath.startsWith('http') ? audioPath : `${API_BASE_URL}${audioPath}`;
            audioData.push({
              url: fullUrl,
              emojiId: emoji.id
            });
          }
        });
        
        // 批量预加载音频
        if (audioData.length > 0 && window.EmojiCache && window.EmojiCache.preloadAudios) {
          console.log(`Preloading ${audioData.length} audio files for pack ${packId}`);
          window.EmojiCache.preloadAudios(audioData).then(() => {
            console.log(`Audio preload completed for pack ${packId}`);
          }).catch(error => {
            console.error('Audio preload failed:', error);
          });
        }
      }
    } catch (error) {
      console.error('Failed to preload audio for pack:', error);
    }
  };

  // ==================== 修复缓存统计显示 ====================
  
  const originalGetCacheStats = window.EmojiCache ? window.EmojiCache.getStats : null;
  
  if (window.EmojiCache) {
    // 确保getStats正确返回音频计数
    window.EmojiCache.getStats = async function() {
      try {
        // 如果原函数存在，先调用它
        let stats = null;
        if (originalGetCacheStats) {
          stats = await originalGetCacheStats.call(this);
        }
        
        // 如果没有获取到统计或音频计数为0，手动计算
        if (!stats || stats.audioCount === 0) {
          const db = await this.init();
          const transaction = db.transaction(['audios'], 'readonly');
          const audioStore = transaction.objectStore('audios');
          
          const audioCount = await new Promise((resolve) => {
            const request = audioStore.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => resolve(0);
          });
          
          if (stats) {
            stats.audioCount = audioCount;
          } else {
            stats = {
              emojiCount: 0,
              audioCount: audioCount,
              messageCount: 0,
              totalSize: 0,
              totalSizeMB: '0.00',
              maxSize: 500 * 1024 * 1024,
              maxSizeMB: '500.00',
              usagePercent: '0.0'
            };
          }
        }
        
        console.log('Cache stats with audio:', stats);
        return stats;
      } catch (error) {
        console.error('Failed to get cache stats:', error);
        return {
          emojiCount: 0,
          audioCount: 0,
          messageCount: 0,
          totalSize: 0,
          totalSizeMB: '0.00',
          maxSize: 500 * 1024 * 1024,
          maxSizeMB: '500.00',
          usagePercent: '0.0'
        };
      }
    };
  }

  // ==================== 添加音频缓存清理功能 ====================
  
  window.clearAudioCache = async function() {
    if (!window.EmojiCache) {
      console.log('Cache system not available');
      return;
    }
    
    try {
      const db = await window.EmojiCache.init();
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
  };

  // ==================== 测试音频缓存 ====================
  
  window.testAudioCache = async function() {
    console.log('=== Testing Audio Cache ===');
    
    if (!window.EmojiCache) {
      console.log('❌ EmojiCache not available');
      return;
    }
    
    // 测试缓存音频功能
    const testUrl = 'https://api.am-all.com.cn/emojis/test/test.m4a';
    
    try {
      // 尝试缓存
      console.log('Testing cache audio function...');
      const blob = new Blob(['test audio data'], { type: 'audio/m4a' });
      await window.EmojiCache.cacheAudio(testUrl, blob, 'test-emoji');
      console.log('✅ Audio cache write successful');
      
      // 尝试读取
      const cached = await window.EmojiCache.getCachedAudio(testUrl);
      if (cached) {
        console.log('✅ Audio cache read successful');
      } else {
        console.log('❌ Audio cache read failed');
      }
      
      // 获取统计
      const stats = await window.EmojiCache.getStats();
      console.log('Cache stats:', stats);
      
    } catch (error) {
      console.error('❌ Audio cache test failed:', error);
    }
    
    console.log('=== Test Complete ===');
  };

  // ==================== 初始化提示 ====================
  
  console.log('Audio cache integration loaded successfully');
  console.log('Commands available:');
  console.log('- testAudioCache(): Test audio cache functionality');
  console.log('- clearAudioCache(): Clear all cached audio');
  console.log('- EmojiCache.getStats(): Get cache statistics');

})(window);