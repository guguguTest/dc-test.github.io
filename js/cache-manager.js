// cache-manager.js - 缓存管理模块（更新版，显示音频统计）
(function(global) {
    'use strict';
    
    console.log('初始化缓存管理模块...');
    
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
            if (global.EmojiCache && global.EmojiCache.cleanOldCache) {
                await global.EmojiCache.cleanOldCache();
                showCacheStatus('旧缓存已清理', 'success');
                await refreshCacheStatsCore();
            } else {
                throw new Error('缓存系统未就绪');
            }
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
            if (global.EmojiCache && global.EmojiCache.clearCache) {
                await global.EmojiCache.clearCache();
                showCacheStatus('所有缓存已清空', 'success');
                await refreshCacheStatsCore();
            } else {
                throw new Error('缓存系统未就绪');
            }
        } catch (error) {
            console.error('清空失败:', error);
            showCacheStatus('清空失败: ' + error.message, 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    };
    
    // 核心刷新统计函数（更新：显示音频统计）
    async function refreshCacheStatsCore() {
        console.log('开始刷新缓存统计（核心）...');
        
        try {
            if (!global.EmojiCache) {
                console.error('EmojiCache 不存在');
                updateCacheDisplayDefault();
                throw new Error('缓存系统未加载');
            }
            
            if (global.EmojiCache.init) {
                await global.EmojiCache.init();
            }
            
            if (!global.EmojiCache.getStats) {
                console.error('getStats 方法不存在');
                updateCacheDisplayDefault();
                throw new Error('缓存系统方法缺失');
            }
            
            const stats = await global.EmojiCache.getStats();
            console.log('获取到的统计数据:', stats);
            
            if (stats) {
                updateCacheDisplay(stats);
            } else {
                updateCacheDisplayDefault();
            }
            
        } catch (error) {
            console.error('刷新缓存统计失败:', error);
            updateCacheDisplayDefault();
            throw error;
        }
    }
    
    // 更新缓存显示（增加音频显示）
    function updateCacheDisplay(stats) {
        const emojiCountEl = document.getElementById('cache-emoji-count');
        const audioCountEl = document.getElementById('cache-audio-count');
        const messageCountEl = document.getElementById('cache-message-count');
        const cacheSizeEl = document.getElementById('cache-size');
        const usageTextEl = document.getElementById('cache-usage-text');
        const progressFillEl = document.getElementById('cache-progress-fill');
        
        if (emojiCountEl) emojiCountEl.textContent = stats.emojiCount || 0;
        if (audioCountEl) audioCountEl.textContent = stats.audioCount || 0;
        if (messageCountEl) messageCountEl.textContent = stats.messageCount || 0;
        if (cacheSizeEl) cacheSizeEl.textContent = (stats.totalSizeMB || '0.00') + ' MB';
        
        const totalMB = parseFloat(stats.totalSizeMB) || 0;
        const maxMB = parseFloat(stats.maxSizeMB) || 500; // 500MB
        const percent = parseFloat(stats.usagePercent) || 0;
        
        if (usageTextEl) {
            usageTextEl.textContent = `${totalMB.toFixed(2)} MB / ${maxMB} MB`;
        }
        
        if (progressFillEl) {
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
        const progressFillEl = document.getElementById('cache-progress-fill');
        
        if (emojiCountEl) emojiCountEl.textContent = '0';
        if (audioCountEl) audioCountEl.textContent = '0';
        if (messageCountEl) messageCountEl.textContent = '0';
        if (cacheSizeEl) cacheSizeEl.textContent = '0.00 MB';
        if (usageTextEl) usageTextEl.textContent = '0.00 MB / 500 MB';
        
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
        
        if (global.EmojiCache) {
            try {
                if (global.EmojiCache.init) {
                    await global.EmojiCache.init();
                    console.log('EmojiCache 已初始化');
                }
                await refreshCacheStatsCore();
                showCacheStatus('缓存系统已就绪（支持500MB容量）', 'success');
            } catch (error) {
                console.error('初始化缓存系统失败:', error);
                showCacheStatus('缓存系统初始化失败: ' + error.message, 'error');
            }
        } else {
            console.warn('EmojiCache 未加载，缓存功能不可用');
            showCacheStatus('缓存系统未加载，功能不可用', 'error');
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
    
    console.log('缓存管理模块加载完成！');
    
})(window);