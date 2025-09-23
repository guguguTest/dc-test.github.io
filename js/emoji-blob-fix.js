// emoji-blob-fix.js - 修复blob URL和音频表情重新加载问题
// 必须在emoji-cache.js之后，emoji-ultimate-fix.js之前加载

(function(global) {
  'use strict';

  console.log('Loading emoji blob URL fix...');

  const API_BASE_URL = window.API_BASE_URL || 'https://api.am-all.com.cn';

  // 存储原始URL映射
  const urlMapping = new Map();
  const blobToOriginalUrl = new Map();

  // ==================== 修复缓存系统的blob URL问题 ====================
  
  // 重写缓存加载函数
  if (window.EmojiCache && window.EmojiCache.loadImageWithCache) {
    const originalLoadImageWithCache = window.EmojiCache.loadImageWithCache;
    
    window.EmojiCache.loadImageWithCache = async function(url, imgElement) {
      // 保存原始URL
      const originalUrl = url;
      imgElement.dataset.originalUrl = originalUrl;
      
      try {
        // 先尝试从缓存获取
        const cachedBlob = await this.getCachedEmoji(url);
        
        if (cachedBlob) {
          // 对于音频表情，直接使用原始URL而不是blob
          if (imgElement.classList.contains('has-audio-emoji') || 
              imgElement.parentElement?.classList.contains('emoji-item') ||
              imgElement.classList.contains('emoji-message-img')) {
            
            // 直接设置原始URL，不使用blob
            imgElement.src = originalUrl;
            console.log('Using original URL for audio emoji:', originalUrl);
          } else {
            // 普通表情使用blob URL
            const objectUrl = URL.createObjectURL(cachedBlob);
            imgElement.src = objectUrl;
            
            // 保存映射关系
            urlMapping.set(imgElement, originalUrl);
            blobToOriginalUrl.set(objectUrl, originalUrl);
            
            // 延迟清理
            setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
          }
        } else {
          // 从网络加载
          imgElement.src = originalUrl;
          
          // 异步缓存（不影响显示）
          fetch(originalUrl)
            .then(response => response.blob())
            .then(blob => {
              if (this.cacheEmoji) {
                this.cacheEmoji(originalUrl, blob);
              }
            })
            .catch(err => console.log('Cache failed:', err));
        }
      } catch (error) {
        console.error('Failed to load image with cache:', error);
        // 降级到直接加载
        imgElement.src = originalUrl;
      }
    };
  }

  // ==================== 修复聊天消息重新加载 ====================
  
  // 监听聊天历史加载
  const originalLoadChatHistory = window.loadChatHistory;
  
  window.loadChatHistory = async function(userId) {
    // 先调用原函数
    if (originalLoadChatHistory) {
      await originalLoadChatHistory.call(this, userId);
    }
    
    // 延迟修复所有表情图片
    setTimeout(fixChatEmojis, 100);
  };

  // 修复聊天中的表情图片
  function fixChatEmojis() {
    const chatMessages = document.getElementById('chat-messages');
    if (!chatMessages) return;
    
    const images = chatMessages.querySelectorAll('img');
    
    images.forEach(img => {
      const src = img.src;
      
      // 检查是否是失效的blob URL
      if (src && src.startsWith('blob:')) {
        // 尝试从映射中恢复原始URL
        const originalUrl = blobToOriginalUrl.get(src) || 
                           img.dataset.originalUrl ||
                           extractOriginalUrl(img);
        
        if (originalUrl) {
          console.log('Restoring broken blob URL:', src, '->', originalUrl);
          img.src = originalUrl;
          
          // 重新添加音频功能
          const audioPath = img.dataset.audioPath;
          if (audioPath) {
            img.style.cursor = 'pointer';
            img.classList.add('has-audio-emoji');
            
            if (!img.hasAudioListener) {
              img.hasAudioListener = true;
              img.addEventListener('click', function(e) {
                e.stopPropagation();
                if (window.playEmojiAudio) {
                  window.playEmojiAudio(audioPath);
                }
              });
            }
          }
        }
      }
      
      // 检查是否是表情图片但没有正确的src
      else if ((!src || src === 'undefined' || src === 'null') && 
               (img.classList.contains('emoji-message-img') || 
                img.parentElement?.classList.contains('message-bubble'))) {
        
        // 尝试从其他属性恢复
        const originalUrl = img.dataset.originalUrl || 
                           img.dataset.src ||
                           extractOriginalUrl(img);
        
        if (originalUrl) {
          console.log('Fixing broken emoji image:', originalUrl);
          img.src = originalUrl;
        }
      }
    });
  }

  // 从元素上下文提取原始URL
  function extractOriginalUrl(img) {
    // 检查是否有其他数据属性
    if (img.dataset.emojiPath) {
      return API_BASE_URL + img.dataset.emojiPath;
    }
    
    // 检查父元素
    const parent = img.parentElement;
    if (parent) {
      const messageId = parent.closest('.chat-message')?.dataset.messageId;
      if (messageId) {
        // 可以尝试从消息ID恢复
        return null; // 需要额外的逻辑来从消息ID恢复URL
      }
    }
    
    return null;
  }

  // ==================== 改进renderChatMessages ====================
  
  const originalRenderChatMessages = window.renderChatMessages;
  
  window.renderChatMessages = function(messages) {
    // 先调用原函数
    if (originalRenderChatMessages) {
      originalRenderChatMessages.call(this, messages);
    }
    
    // 确保所有表情图片正确显示
    setTimeout(() => {
      const messagesDiv = document.getElementById('chat-messages');
      if (!messagesDiv) return;
      
      messages.forEach((msg, index) => {
        if (msg.message_type === 'emoji') {
          const messageEl = messagesDiv.children[index];
          if (!messageEl) return;
          
          const img = messageEl.querySelector('img');
          if (!img) return;
          
          // 解析消息内容获取正确的URL
          try {
            let emojiPath = '';
            let audioPath = '';
            
            if (typeof msg.content === 'string') {
              if (msg.content.startsWith('{')) {
                const data = JSON.parse(msg.content);
                emojiPath = data.emoji_path || '';
                audioPath = data.audio_path || data.sound_path || '';
              }
            }
            
            if (emojiPath) {
              // 确保路径正确
              if (!emojiPath.startsWith('http')) {
                emojiPath = API_BASE_URL + emojiPath;
              }
              
              // 清理可能被污染的路径
              if (emojiPath.includes(':') && !emojiPath.startsWith('http')) {
                emojiPath = emojiPath.split(':')[0];
              }
              
              // 设置正确的src
              img.src = emojiPath;
              img.dataset.originalUrl = emojiPath;
              
              // 添加音频支持
              if (audioPath) {
                if (!audioPath.startsWith('http')) {
                  audioPath = API_BASE_URL + audioPath;
                }
                
                img.dataset.audioPath = audioPath;
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
          } catch (e) {
            console.error('Failed to parse emoji message:', e);
          }
        }
      });
    }, 50);
  };

  // ==================== 定期检查和修复 ====================
  
  // 监听聊天窗口打开
  const originalOpenChatModal = window.openChatModal;
  
  window.openChatModal = function(userId) {
    // 调用原函数
    if (originalOpenChatModal) {
      originalOpenChatModal.call(this, userId);
    }
    
    // 延迟修复表情
    setTimeout(fixChatEmojis, 500);
    setTimeout(fixChatEmojis, 1000);
    setTimeout(fixChatEmojis, 2000);
  };

  // 使用MutationObserver监控聊天消息变化
  const observer = new MutationObserver(function(mutations) {
    let shouldFix = false;
    
    mutations.forEach(function(mutation) {
      if (mutation.target.id === 'chat-messages' || 
          mutation.target.classList?.contains('chat-message')) {
        shouldFix = true;
      }
    });
    
    if (shouldFix) {
      setTimeout(fixChatEmojis, 100);
    }
  });

  // 开始观察
  if (document.getElementById('chat-messages')) {
    observer.observe(document.getElementById('chat-messages'), {
      childList: true,
      subtree: true
    });
  }

  // 全局观察器
  const globalObserver = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      mutation.addedNodes.forEach(function(node) {
        if (node.id === 'chat-messages' || node.id === 'chat-modal') {
          setTimeout(fixChatEmojis, 100);
          
          // 重新绑定观察器
          if (node.id === 'chat-messages') {
            observer.observe(node, {
              childList: true,
              subtree: true
            });
          }
        }
      });
    });
  });

  globalObserver.observe(document.body, {
    childList: true,
    subtree: true
  });

  // ==================== 清理过期的blob URLs ====================
  
  setInterval(function() {
    // 清理不再使用的blob URLs
    const allImages = document.querySelectorAll('img');
    const activeBlobUrls = new Set();
    
    allImages.forEach(img => {
      if (img.src && img.src.startsWith('blob:')) {
        activeBlobUrls.add(img.src);
      }
    });
    
    // 清理映射中不再使用的URLs
    for (const [blobUrl, originalUrl] of blobToOriginalUrl.entries()) {
      if (!activeBlobUrls.has(blobUrl)) {
        blobToOriginalUrl.delete(blobUrl);
      }
    }
  }, 30000); // 每30秒清理一次

  console.log('Emoji blob URL fix loaded successfully');

})(window);