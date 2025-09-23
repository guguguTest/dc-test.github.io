// emoji-ultimate-fix.js - 终极表情音频修复方案
// 这个文件必须在所有表情相关JS之后加载
// 直接在最底层拦截和修复所有被污染的URL

(function(global) {
  'use strict';

  console.log('Loading ultimate emoji fix...');

  // 确保API_BASE_URL存在
  if (typeof window.API_BASE_URL === 'undefined') {
    window.API_BASE_URL = 'https://api.am-all.com.cn';
  }
  const API_BASE_URL = window.API_BASE_URL;

  // ==================== 工具函数：清理被污染的URL ====================
  function cleanImageUrl(url) {
    if (!url) return url;
    
    // 如果URL包含冒号（除了http://或https://），说明被音频路径污染
    const protocolEnd = url.indexOf('://') + 3;
    const afterProtocol = url.substring(protocolEnd);
    
    if (afterProtocol.includes(':')) {
      // 分离图片路径和音频路径
      const cleanUrl = url.split(':').slice(0, 2).join(':'); // 保留 protocol://domain/path
      console.log('Cleaned URL:', url, '->', cleanUrl);
      return cleanUrl;
    }
    
    return url;
  }

  // 提取音频路径
  function extractAudioPath(url) {
    if (!url || !url.includes(':')) return null;
    
    const protocolEnd = url.indexOf('://') + 3;
    const afterProtocol = url.substring(protocolEnd);
    
    if (afterProtocol.includes(':')) {
      const parts = url.split(':');
      if (parts.length > 2) {
        const audioPath = parts[2];
        return audioPath.startsWith('/') ? audioPath : '/' + audioPath;
      }
    }
    
    return null;
  }

  // ==================== 拦截所有img元素的src设置 ====================
  const originalImageSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
  
  Object.defineProperty(HTMLImageElement.prototype, 'src', {
    set: function(value) {
      // 检查是否是表情图片
      if (value && typeof value === 'string' && 
          (value.includes('/emojis/') || value.includes('emoji'))) {
        
        // 清理被污染的URL
        const cleanUrl = cleanImageUrl(value);
        
        // 如果URL被清理了，说明包含音频
        if (cleanUrl !== value) {
          const audioPath = extractAudioPath(value);
          if (audioPath) {
            // 保存音频路径到元素属性
            this.dataset.audioPath = API_BASE_URL + audioPath;
            this.style.cursor = 'pointer';
            this.classList.add('has-audio-emoji');
            
            // 添加点击事件
            if (!this.hasAudioListener) {
              this.hasAudioListener = true;
              this.addEventListener('click', function() {
                if (window.playEmojiAudio) {
                  window.playEmojiAudio(this.dataset.audioPath);
                }
              });
            }
          }
          
          // 使用清理后的URL
          originalImageSetter.call(this, cleanUrl);
          return;
        }
      }
      
      // 正常设置src
      originalImageSetter.call(this, value);
    },
    get: function() {
      return this.getAttribute('src');
    }
  });

  // ==================== 修复已存在的img元素 ====================
  function fixExistingImages() {
    const images = document.querySelectorAll('img[src*="emojis"], img.emoji-message-img');
    
    images.forEach(img => {
      const src = img.src;
      if (src && src.includes(':') && !src.startsWith('data:')) {
        const cleanUrl = cleanImageUrl(src);
        const audioPath = extractAudioPath(src);
        
        if (cleanUrl !== src) {
          img.src = cleanUrl;
          
          if (audioPath) {
            img.dataset.audioPath = API_BASE_URL + audioPath;
            img.style.cursor = 'pointer';
            img.classList.add('has-audio-emoji');
            
            if (!img.hasAudioListener) {
              img.hasAudioListener = true;
              img.addEventListener('click', function() {
                if (window.playEmojiAudio) {
                  window.playEmojiAudio(this.dataset.audioPath);
                }
              });
            }
          }
        }
      }
    });
  }

  // ==================== 重写parseMessageContent以防万一 ====================
  const originalParse = window.parseMessageContent;
  
  window.parseMessageContent = function(content, messageType) {
    // 先调用原始函数
    let result = '';
    
    if (originalParse) {
      result = originalParse.call(this, content, messageType);
    } else {
      result = parseMessageContentFixed(content, messageType);
    }
    
    // 清理结果中的URL
    if (result && result.includes('src=')) {
      result = result.replace(/src="([^"]+)"/g, function(match, url) {
        const cleanUrl = cleanImageUrl(url);
        const audioPath = extractAudioPath(url);
        
        if (audioPath) {
          return `src="${cleanUrl}" data-audio-path="${API_BASE_URL}${audioPath}" onclick="playEmojiAudio('${API_BASE_URL}${audioPath}')" style="cursor: pointer;"`;
        }
        return `src="${cleanUrl}"`;
      });
    }
    
    return result;
  };

  // 备用解析函数
  function parseMessageContentFixed(content, messageType) {
    if (messageType === 'emoji' || 
        (typeof content === 'string' && 
         (content.includes('emoji_path') || content.startsWith('[emoji:')))) {
      
      try {
        let emojiPath = '';
        let audioPath = '';
        
        // 尝试各种格式
        if (typeof content === 'string') {
          // JSON格式
          if (content.startsWith('{')) {
            const data = JSON.parse(content);
            emojiPath = data.emoji_path || '';
            audioPath = data.audio_path || data.sound_path || '';
          }
          // [emoji:xxx] 格式
          else if (content.startsWith('[emoji:')) {
            const innerContent = content.slice(7, -1);
            
            // 尝试JSON
            try {
              const data = JSON.parse(innerContent);
              emojiPath = data.path || '';
              audioPath = data.audio || '';
            } catch (e) {
              // 旧格式 id:path 或 id:path:audio
              const parts = innerContent.split(':');
              if (parts.length >= 2) {
                emojiPath = parts[1];
                audioPath = parts[2] || '';
              }
            }
          }
        }
        
        if (emojiPath) {
          // 清理路径
          emojiPath = cleanImageUrl(emojiPath);
          if (!emojiPath.startsWith('http')) {
            emojiPath = API_BASE_URL + emojiPath;
          }
          
          let audioAttr = '';
          if (audioPath) {
            if (!audioPath.startsWith('http')) {
              audioPath = API_BASE_URL + audioPath;
            }
            audioAttr = `data-audio-path="${audioPath}" onclick="playEmojiAudio('${audioPath}')" style="cursor: pointer;"`;
          }
          
          return `<img src="${emojiPath}" class="emoji-message-img" ${audioAttr}
                  style="max-width: 120px; max-height: 120px; vertical-align: middle; 
                  border-radius: 8px;" alt="表情">`;
        }
      } catch (e) {
        console.error('Parse emoji failed:', e);
      }
    }
    
    // 默认返回转义文本
    const div = document.createElement('div');
    div.textContent = content || '';
    return div.innerHTML;
  }

  // ==================== 音频播放功能 ====================
  window.playEmojiAudio = function(audioPath) {
    if (!audioPath) return;
    
    console.log('Playing audio:', audioPath);
    
    // 确保路径正确
    const fullPath = audioPath.startsWith('http') ? audioPath : `${API_BASE_URL}${audioPath}`;
    
    if (window.EmojiAudioManager && window.EmojiAudioManager.playAudio) {
      window.EmojiAudioManager.playAudio(fullPath);
    } else {
      // 降级方案
      const audio = new Audio(fullPath);
      audio.volume = 0.7;
      audio.play().catch(e => console.log('Audio play failed:', e));
    }
  };

  // ==================== 持续监控和修复 ====================
  
  // 使用MutationObserver监控新添加的图片
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.nodeType === 1) { // Element node
          // 检查是否是img
          if (node.tagName === 'IMG') {
            const src = node.src;
            if (src && src.includes(':') && src.includes('emojis')) {
              fixImage(node);
            }
          }
          
          // 检查子元素
          const images = node.querySelectorAll('img[src*="emojis"]');
          images.forEach(fixImage);
        }
      });
    });
  });
  
  function fixImage(img) {
    const src = img.src;
    if (src && src.includes(':') && !src.startsWith('data:')) {
      const cleanUrl = cleanImageUrl(src);
      const audioPath = extractAudioPath(src);
      
      if (cleanUrl !== src) {
        console.log('Fixing image:', src, '->', cleanUrl);
        img.src = cleanUrl;
        
        if (audioPath) {
          img.dataset.audioPath = API_BASE_URL + audioPath;
          img.style.cursor = 'pointer';
          img.classList.add('has-audio-emoji');
          
          if (!img.hasAudioListener) {
            img.hasAudioListener = true;
            img.addEventListener('click', function(e) {
              e.stopPropagation();
              if (window.playEmojiAudio) {
                window.playEmojiAudio(this.dataset.audioPath);
              }
            });
          }
        }
      }
    }
  }

  // 开始观察
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  // ==================== 初始化修复 ====================
  
  // 页面加载完成后修复所有现有图片
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(fixExistingImages, 100);
    });
  } else {
    setTimeout(fixExistingImages, 100);
  }

  // 定期检查和修复（以防万一）
  setInterval(fixExistingImages, 2000);

  // ==================== 添加样式 ====================
  const style = document.createElement('style');
  style.textContent = `
    img.has-audio-emoji {
      position: relative;
      transition: transform 0.2s;
    }
    
    img.has-audio-emoji:hover {
      transform: scale(1.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }
    
    img.has-audio-emoji::after {
      content: '🔊';
      position: absolute;
      bottom: 2px;
      right: 2px;
      background: rgba(255, 255, 255, 0.9);
      border-radius: 50%;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
    }
  `;
  document.head.appendChild(style);

  console.log('Ultimate emoji fix loaded and active');

})(window);