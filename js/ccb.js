// ccb.js - 游戏查分系统功能 (多卡片支持版本)
let queryCooldown = false;
let cooldownTimer = null;
let currentCardSlot = 1; // 当前选中的卡片槽位

// 输入验证函数
function validateAndFormatKeychip(input) {
    // 移除所有非英数字字符
    let value = input.replace(/[^A-Za-z0-9]/g, '');
    
    // 如果是15位(AXXX-XXXXXXXXXXX格式),删除最后4位
    if (value.length === 15) {
        value = value.substring(0, 11);
    }
    
    // 限制为11位
    value = value.substring(0, 11).toUpperCase();
    
    return value;
}

function validateAndFormatGuid(input) {
    // 只保留数字
    let value = input.replace(/\D/g, '');
    
    // 限制为20位
    value = value.substring(0, 20);
    
    return value;
}

// 初始化查分页面
function initCCBPage() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginRequired('ccb');
        return;
    }
    
    // 检查用户组级别
    if (!currentUser || currentUser.user_rank <= 0) {
        showErrorMessage('您的用户组级别不足,无法使用查分功能');
        loadPage('home');
        return;
    }
    
    // 预加载服务器列表
    loadServerListCache().then(() => {
        // 获取用户的完整绑定信息
        checkUserBinding();
    });
}

// 检查用户绑定状态
function checkUserBinding() {
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/user', {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(user => {
        // 更新全局用户信息
        currentUser = user;
        
        // 检查是否有任何卡片已绑定
        const hasSlot1 = user.game_server && user.keychip && user.guid;
        const hasSlot2 = user.ccb_slot2_server && user.ccb_slot2_keychip && user.ccb_slot2_guid;
        const hasSlot3 = user.ccb_slot3_server && user.ccb_slot3_keychip && user.ccb_slot3_guid;
        
        if (hasSlot1 || hasSlot2 || hasSlot3) {
            // 设置当前卡片槽位为用户设置的激活槽位
            currentCardSlot = user.ccb_active_slot || 1;
            renderQueryPage(user);
        } else {
            // 默认显示卡片1的绑定页面
            currentCardSlot = 1;
            renderBindingPage();
        }
    })
    .catch(error => {
        console.error('获取用户信息失败:', error);
        showErrorMessage('获取用户信息失败');
    });
}

// 渲染绑定页面
function renderBindingPage() {
    const contentContainer = document.getElementById('content-container');
    
    // 获取当前用户的所有卡片绑定状态
    const slot1Bound = currentUser.game_server && currentUser.keychip && currentUser.guid;
    const slot2Bound = currentUser.ccb_slot2_server && currentUser.ccb_slot2_keychip && currentUser.ccb_slot2_guid;
    const slot3Bound = currentUser.ccb_slot3_server && currentUser.ccb_slot3_keychip && currentUser.ccb_slot3_guid;
    
    contentContainer.innerHTML = `
        <div class="section">
            <h1 class="page-title">游戏查分 - 绑定卡片${currentCardSlot}</h1>
            <div class="ccb-container">
                <!-- 卡片切换按钮 -->
                <div class="ccb-section">
                    <h2 class="ccb-title">选择卡片槽位</h2>
                    <div class="ccb-card-selector">
                        <button class="ccb-card-btn ${currentCardSlot === 1 ? 'active' : ''} ${slot1Bound ? 'bound' : ''}" 
                                onclick="switchCardSlot(1)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片1</span>
                            ${slot1Bound ? '<i class="fas fa-check-circle"></i>' : ''}
                        </button>
                        <button class="ccb-card-btn ${currentCardSlot === 2 ? 'active' : ''} ${slot2Bound ? 'bound' : ''}" 
                                onclick="switchCardSlot(2)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片2</span>
                            ${slot2Bound ? '<i class="fas fa-check-circle"></i>' : ''}
                        </button>
                        <button class="ccb-card-btn ${currentCardSlot === 3 ? 'active' : ''} ${slot3Bound ? 'bound' : ''}" 
                                onclick="switchCardSlot(3)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片3</span>
                            ${slot3Bound ? '<i class="fas fa-check-circle"></i>' : ''}
                        </button>
                    </div>
                </div>
                
                <div class="ccb-section">
                    <h2 class="ccb-title">绑定卡片${currentCardSlot}信息</h2>
                    <p>请填写以下信息以绑定卡片${currentCardSlot}：</p>
                    
                    <form id="ccb-binding-form" class="ccb-form">
                        <div class="form-group">
                            <label for="server-select">选择服务器</label>
                            <select id="server-select" required>
                                <option value="">请选择服务器</option>
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="guid-input">游戏卡号 (20位纯数字)</label>
                            <div class="guid-input-container">
                                <input type="text" id="guid-input" required placeholder="请输入20位游戏卡号" maxlength="20">
                                <button type="button" class="scan-btn" onclick="openScanModal()">
                                    <i class="fas fa-camera"></i>
                                    <span>扫码输入</span>
                                </button>
                            </div>
                            <small style="color: var(--modern-text-secondary); margin-top: 4px; display: block;">
                                仅限输入20位纯数字，或点击扫码按钮识别卡片
                            </small>
                        </div>
                        
                        <div class="form-group">
                            <label for="keychip-input">KeyChip (11位英数字)</label>
                            <input type="text" id="keychip-input" required placeholder="请输入KeyChip (格式: AXXXXXXXXXX)" maxlength="11">
                            <small style="color: var(--modern-text-secondary); margin-top: 4px; display: block;">
                                格式: AXXXXXXXXXX (11位英数字),如复制的是15位格式会自动转换
                            </small>
                            <div class="checkbox-group">
                                <input type="checkbox" id="default-keychip">
                                <label for="default-keychip">使用默认KeyChip</label>
                            </div>
                        </div>
                        
                        <div class="ccb-actions">
                            <button type="submit" class="ccb-btn ccb-btn-primary">绑定卡片${currentCardSlot}</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // 加载服务器列表
    loadServerList();
    
    // 绑定表单提交事件
    document.getElementById('ccb-binding-form').addEventListener('submit', handleBindingSubmit);
    
    // 绑定输入验证事件
    const guidInput = document.getElementById('guid-input');
    guidInput.addEventListener('input', function(e) {
        e.target.value = validateAndFormatGuid(e.target.value);
    });
    guidInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        e.target.value = validateAndFormatGuid(pastedText);
    });
    
    const keychipInput = document.getElementById('keychip-input');
    keychipInput.addEventListener('input', function(e) {
        e.target.value = validateAndFormatKeychip(e.target.value);
    });
    keychipInput.addEventListener('paste', function(e) {
        e.preventDefault();
        const pastedText = (e.clipboardData || window.clipboardData).getData('text');
        e.target.value = validateAndFormatKeychip(pastedText);
    });
    
    // 绑定默认KeyChip复选框事件
    document.getElementById('default-keychip').addEventListener('change', function() {
        const keychipInput = document.getElementById('keychip-input');
        if (this.checked) {
            keychipInput.value = 'A63E01A8888';
            keychipInput.disabled = true;
        } else {
            keychipInput.value = '';
            keychipInput.disabled = false;
        }
    });
    
    // 初始化扫码功能
    if (typeof initScanner === 'function') {
        initScanner();
    }
}

// 切换卡片槽位（在绑定页面使用）
window.switchCardSlot = function(slot) {
    currentCardSlot = slot;
    
    // 检查目标卡片是否已绑定
    let isSlotBound = false;
    if (slot === 1) {
        isSlotBound = currentUser.game_server && currentUser.keychip && currentUser.guid;
    } else if (slot === 2) {
        isSlotBound = currentUser.ccb_slot2_server && currentUser.ccb_slot2_keychip && currentUser.ccb_slot2_guid;
    } else if (slot === 3) {
        isSlotBound = currentUser.ccb_slot3_server && currentUser.ccb_slot3_keychip && currentUser.ccb_slot3_guid;
    }
    
    // 如果卡片已绑定，显示查询页面；否则显示绑定页面
    if (isSlotBound) {
        // 不修改 ccb_active_slot，只是用这个卡片的数据渲染查询页面
        renderQueryPage(currentUser);
    } else {
        renderBindingPage();
    }
};

// 加载服务器列表并缓存
async function loadServerListCache() {
    if (window.serverListCache) {
        return window.serverListCache;
    }
    
    try {
        const list = await secureFetch('https://api.am-all.com.cn/api/ccb/servers');
        window.serverListCache = list || [];
        return window.serverListCache;
    } catch (error) {
        console.error('加载服务器列表失败:', error);
        window.serverListCache = [];
        return window.serverListCache;
    }
}

// 根据服务器URL获取服务器名称
function getServerNameByUrl(serverUrl) {
    if (!serverUrl || !window.serverListCache) {
        return serverUrl || '未知服务器';
    }
    
    const server = window.serverListCache.find(s => s.server_url === serverUrl);
    return server ? server.server_name : serverUrl;
}

// 加载服务器列表
function loadServerList() {
    const selectEl = document.getElementById('server-select');
    if (!selectEl) return;
    const placeholder = '<option value="">请选择服务器</option>';
    selectEl.innerHTML = placeholder;
    const seen = new Set();
    secureFetch('https://api.am-all.com.cn/api/ccb/servers')
      .then(list => {
        window.serverListCache = list || []; // 同时更新缓存
        (list || []).forEach(item => {
          const key = `${item.server_url}|${item.server_name}`;
          if (seen.has(key)) return;
          seen.add(key);
          const option = document.createElement('option');
          option.value = item.server_url;
          option.textContent = item.server_name;
          selectEl.appendChild(option);
        });
      })
      .catch(error => {
        console.error('加载服务器列表失败:', error);
        showErrorMessage('加载服务器列表失败');
      });
}

// 处理绑定表单提交
function handleBindingSubmit(e) {
    e.preventDefault();
    
    const server = document.getElementById('server-select').value;
    const keychip = document.getElementById('keychip-input').value;
    const guid = document.getElementById('guid-input').value;
    
    if (!server || !keychip || !guid) {
        showErrorMessage('请填写所有必填字段');
        return;
    }
    
    // 验证格式
    if (guid.length !== 20) {
        showErrorMessage('游戏卡号必须为20位数字');
        return;
    }
    
    if (keychip.length !== 11) {
        showErrorMessage('KeyChip必须为11位英数字');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/ccb/bind', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            slot: currentCardSlot,
            game_server: server,
            keychip: keychip,
            guid: guid
        })
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage(`卡片${currentCardSlot}绑定成功`);
            
            // 立即更新本地用户信息，确保界面能立即显示正确状态
            if (currentCardSlot === 1) {
                currentUser.game_server = server;
                currentUser.keychip = keychip;
                currentUser.guid = guid;
            } else if (currentCardSlot === 2) {
                currentUser.ccb_slot2_server = server;
                currentUser.ccb_slot2_keychip = keychip;
                currentUser.ccb_slot2_guid = guid;
            } else if (currentCardSlot === 3) {
                currentUser.ccb_slot3_server = server;
                currentUser.ccb_slot3_keychip = keychip;
                currentUser.ccb_slot3_guid = guid;
            }
            
            // 注意：这里不修改 ccb_active_slot，保持服务器端的值
            // 如果用户想切换激活卡片，需要使用 switchActiveCard 函数
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            
            // 立即渲染页面，让用户看到更新
            renderQueryPage(currentUser);
            
        } else {
            throw new Error(result.error || '绑定失败');
        }
    })
    .catch(error => {
        console.error('绑定失败:', error);
        showErrorMessage('绑定失败: ' + (error.error || error.message || '服务器错误'));
    });
}

// 渲染查询页面
function renderQueryPage(user) {
    const contentContainer = document.getElementById('content-container');
    
    // 获取所有卡片的绑定状态
    const slot1Bound = user.game_server && user.keychip && user.guid;
    const slot2Bound = user.ccb_slot2_server && user.ccb_slot2_keychip && user.ccb_slot2_guid;
    const slot3Bound = user.ccb_slot3_server && user.ccb_slot3_keychip && user.ccb_slot3_guid;
    
    // 验证当前选中的卡片槽位是否有效且已绑定
    let isCurrentSlotValid = false;
    if (currentCardSlot === 1 && slot1Bound) isCurrentSlotValid = true;
    else if (currentCardSlot === 2 && slot2Bound) isCurrentSlotValid = true;
    else if (currentCardSlot === 3 && slot3Bound) isCurrentSlotValid = true;
    
    // 如果当前槽位无效，使用服务器端的激活槽位或第一个有效槽位
    if (!isCurrentSlotValid) {
        if (user.ccb_active_slot && (
            (user.ccb_active_slot === 1 && slot1Bound) ||
            (user.ccb_active_slot === 2 && slot2Bound) ||
            (user.ccb_active_slot === 3 && slot3Bound)
        )) {
            currentCardSlot = user.ccb_active_slot;
        } else if (slot1Bound) {
            currentCardSlot = 1;
        } else if (slot2Bound) {
            currentCardSlot = 2;
        } else if (slot3Bound) {
            currentCardSlot = 3;
        } else {
            currentCardSlot = 1;
        }
    }
    
    // 获取当前激活卡片的服务器名称
    let currentServer;
    if (currentCardSlot === 1) {
        currentServer = user.game_server;
    } else if (currentCardSlot === 2) {
        currentServer = user.ccb_slot2_server;
    } else {
        currentServer = user.ccb_slot3_server;
    }
    
    const serverName = getServerNameByUrl(currentServer);
    
    contentContainer.innerHTML = `
        <div class="section">
            <h1 class="page-title">游戏查分</h1>
            <div class="ccb-container">
                <!-- 卡片切换区域 -->
                <div class="ccb-section">
                    <h2 class="ccb-title">卡片管理</h2>
                    <div class="ccb-card-selector">
                        ${slot1Bound ? `
                        <button class="ccb-card-btn ${currentCardSlot === 1 ? 'active' : ''} bound" 
                                onclick="switchActiveCard(1)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片1</span>
                            ${currentCardSlot === 1 ? '<i class="fas fa-star"></i>' : ''}
                        </button>
                        ` : `
                        <button class="ccb-card-btn unbound" onclick="goToBindCard(1)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片1</span>
                            <small>未绑定</small>
                        </button>
                        `}
                        
                        ${slot2Bound ? `
                        <button class="ccb-card-btn ${currentCardSlot === 2 ? 'active' : ''} bound" 
                                onclick="switchActiveCard(2)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片2</span>
                            ${currentCardSlot === 2 ? '<i class="fas fa-star"></i>' : ''}
                        </button>
                        ` : `
                        <button class="ccb-card-btn unbound" onclick="goToBindCard(2)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片2</span>
                            <small>未绑定</small>
                        </button>
                        `}
                        
                        ${slot3Bound ? `
                        <button class="ccb-card-btn ${currentCardSlot === 3 ? 'active' : ''} bound" 
                                onclick="switchActiveCard(3)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片3</span>
                            ${currentCardSlot === 3 ? '<i class="fas fa-star"></i>' : ''}
                        </button>
                        ` : `
                        <button class="ccb-card-btn unbound" onclick="goToBindCard(3)">
                            <i class="fas fa-credit-card"></i>
                            <span>卡片3</span>
                            <small>未绑定</small>
                        </button>
                        `}
                    </div>
                    <div style="margin-top: 12px; text-align: center;">
                        <button type="button" class="ccb-btn ccb-btn-secondary" id="unbind-all-btn" 
                                style="font-size: 13px; padding: 8px 16px;">
                            <i class="fas fa-unlink"></i> 全部解绑
                        </button>
                    </div>
                </div>
                
                <div class="ccb-section">
                    <h2 class="ccb-title">查询分数</h2>
                    <p>当前使用: <strong>卡片${currentCardSlot}</strong> | 服务器: <strong>${serverName}</strong></p>
                    
                    <form id="ccb-query-form" class="ccb-form">
                        <div class="form-group">
                            <label for="game-select">选择游戏</label>
                            <select id="game-select" required>
                                <option value="">请选择游戏</option>
                            </select>
                        </div>
                        
                        <div class="ccb-notice">
                            <h4 class="ccb-notice-title"><i class="fas fa-exclamation-circle"></i>&ensp;提示</h4>
                            <p class="ccb-notice-content">
                                每次查分将消耗<b>5点普通积分</b>,查询结果以图片形式展示。<br>
                                每次查分后需要等待10秒后才能再次查询。<br>
								<br>
								保存图片按钮在移动端某些浏览器可能会无效。<br>
								如果点击后无法正常保存图片,请长按图片选择保存到相册即可。
                            </p>
                        </div>
                        
                        <div class="ccb-actions">
                            <button type="submit" class="ccb-btn ccb-btn-primary" id="query-btn">查分</button>
                            <button type="button" class="ccb-btn ccb-btn-secondary" id="unbind-btn">解绑当前卡片</button>
                        </div>
                        
                        <div class="ccb-points-info">
                            当前积分: <span id="points-display">${user.points || 0}</span>
                            <button id="refresh-points-btn" class="refresh-points-btn" type="button">
                                <i class="fas fa-redo"></i>刷新积分
                            </button>
                            <span id="refresh-success-msg" style="display: none; color: #ef4444; font-weight: 600; margin-left: 8px;">刷新成功</span>
                        </div>
                        
                        <div class="ccb-cooldown" id="cooldown-message" style="display: none;"></div>
                    </form>
                </div>
                
                <div class="ccb-section">
                    <h2 class="ccb-title">查询结果</h2>
                    <div class="ccb-result" id="query-result">
                        <!-- 查询结果将显示在这里 -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 加载游戏列表
    loadGameList();
    
    // 绑定查询表单提交事件
    document.getElementById('ccb-query-form').addEventListener('submit', handleQuerySubmit);
    
    // 绑定解绑按钮事件
    document.getElementById('unbind-btn').addEventListener('click', () => handleUnbind(currentCardSlot));
    
    // 绑定全部解绑按钮事件
    document.getElementById('unbind-all-btn').addEventListener('click', handleUnbindAll);
    
    // 绑定刷新积分按钮事件 - 修复版本
    document.getElementById('refresh-points-btn').addEventListener('click', async function(e) {
        // 防止事件冒泡
        e.preventDefault();
        e.stopPropagation();
        
        const btn = this;
        const icon = btn.querySelector('i');
        const successMsg = document.getElementById('refresh-success-msg');
        
        // 防止重复点击
        if (btn.disabled) return;
        
        try {
            // 禁用按钮并显示加载状态
            btn.disabled = true;
            icon.classList.add('fa-spin');
            
            const token = localStorage.getItem('token');
            const response = await secureFetch('https://api.am-all.com.cn/api/user', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            // 更新当前用户信息
            currentUser.points = response.points;
            
            // 更新积分显示
            document.getElementById('points-display').textContent = response.points || 0;
            
            // 显示红色成功提示
            successMsg.style.display = 'inline';
            
            // 2秒后隐藏提示
            setTimeout(() => {
                successMsg.style.display = 'none';
            }, 2000);
            
        } catch (error) {
            console.error('刷新积分失败:', error);
            showErrorMessage('刷新积分失败');
        } finally {
            // 恢复按钮状态
            btn.disabled = false;
            icon.classList.remove('fa-spin');
        }
    });
}

// 切换激活的卡片
window.switchActiveCard = function(slot) {
    if (!confirm(`确定要将卡片${slot}设置为主查分卡片吗?`)) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/ccb/switch', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slot: slot })
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage(`已切换到卡片${slot}`);
            
            // 立即更新本地状态
            currentCardSlot = slot;
            currentUser.ccb_active_slot = slot;
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            
            // 立即重新渲染页面
            renderQueryPage(currentUser);
            
        } else {
            throw new Error(result.error || '切换失败');
        }
    })
    .catch(error => {
        console.error('切换卡片失败:', error);
        showErrorMessage('切换卡片失败: ' + (error.error || error.message || '服务器错误'));
    });
};

// 前往绑定卡片页面（从查询页面点击未绑定卡片时调用）
window.goToBindCard = function(slot) {
    currentCardSlot = slot;
    
    // 检查目标卡片是否已绑定
    let isSlotBound = false;
    if (slot === 1) {
        isSlotBound = currentUser.game_server && currentUser.keychip && currentUser.guid;
    } else if (slot === 2) {
        isSlotBound = currentUser.ccb_slot2_server && currentUser.ccb_slot2_keychip && currentUser.ccb_slot2_guid;
    } else if (slot === 3) {
        isSlotBound = currentUser.ccb_slot3_server && currentUser.ccb_slot3_keychip && currentUser.ccb_slot3_guid;
    }
    
    // 如果卡片已绑定，显示查询页面；否则显示绑定页面
    if (isSlotBound) {
        // 不修改 ccb_active_slot，只是用这个卡片的数据渲染查询页面
        renderQueryPage(currentUser);
    } else {
        renderBindingPage();
    }
};

// 加载游戏列表
function loadGameList() {
    const selectEl = document.getElementById('game-select');
    if (!selectEl) return;
    const placeholder = '<option value="">请选择游戏</option>';
    selectEl.innerHTML = placeholder;
    const seen = new Set();
    secureFetch('https://api.am-all.com.cn/api/ccb/games')
      .then(list => {
        (list || []).forEach(item => {
          const key = `${item.game_title}|${item.game_name}`;
          if (seen.has(key)) return;
          seen.add(key);
          const option = document.createElement('option');
          option.value = item.game_title;
          option.textContent = item.game_name;
          selectEl.appendChild(option);
        });
      })
      .catch(error => {
        console.error('加载游戏列表失败:', error);
        showErrorMessage('加载游戏列表失败');
      });
}

// 处理查询提交
function handleQuerySubmit(e) {
    e.preventDefault();
    
    if (queryCooldown) {
        showErrorMessage('查询冷却中,请稍后再试');
        return;
    }
    
    const game = document.getElementById('game-select').value;
    
    if (!game) {
        showErrorMessage('请选择游戏');
        return;
    }
    
    // 检查积分
    if ((currentUser.points || 0) < 5) {
        showErrorMessage('积分不足,需要5积分才能查询');
        return;
    }
    
    const token = localStorage.getItem('token');
    const queryBtn = document.getElementById('query-btn');
    
    queryBtn.disabled = true;
    queryBtn.textContent = '查询中...';
    
    secureFetch('https://api.am-all.com.cn/api/ccb/query', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game: game,
            slot: currentCardSlot
        })
    })
    .then(result => {
        queryBtn.disabled = false;
        queryBtn.textContent = '查分';
        
        if (result.success) {
            if (result.status === 'ok' && result.image_base64) {
                // 显示查询结果
                document.getElementById('query-result').innerHTML = `
                    <img src="data:image/png;base64,${result.image_base64}" alt="查分结果">
                    <div class="ccb-save-action">
                        <button id="save-image-btn" class="ccb-btn ccb-btn-primary">保存图片</button>
                    </div>
                `;

                // 绑定保存按钮事件
                document.getElementById('save-image-btn').addEventListener('click', saveCCBImage);
                
                // 更新用户积分显示
                currentUser.points -= 5;
                document.getElementById('points-display').textContent = currentUser.points;
                updateUserInfo(currentUser);
                
                // 启动冷却计时器
                startCooldown();
            } else {
                showErrorMessage(result.error || '查询失败');
            }
        } else {
            showErrorMessage(result.error || '查询失败');
        }
    })
    .catch(error => {
        queryBtn.disabled = false;
        queryBtn.textContent = '查分';
        console.error('查询失败:', error);
        showErrorMessage('查询失败: ' + (error.error || '服务器错误'));
    });
}

// 启动冷却计时器 - 修复版本
function startCooldown() {
    // 清除之前可能存在的计时器，防止重叠
    if (cooldownTimer) {
        clearInterval(cooldownTimer);
        cooldownTimer = null;
    }
    
    queryCooldown = true;
    const cooldownMessage = document.getElementById('cooldown-message');
    
    if (!cooldownMessage) {
        console.error('cooldown-message 元素不存在');
        return;
    }
    
    let seconds = 10;
    
    cooldownMessage.style.display = 'block';
    cooldownMessage.textContent = `${seconds}秒后可再次查分`;
    
    cooldownTimer = setInterval(() => {
        seconds--;
        cooldownMessage.textContent = `${seconds}秒后可再次查分`;
        
        if (seconds <= 0) {
            clearInterval(cooldownTimer);
            cooldownTimer = null;
            cooldownMessage.style.display = 'none';
            queryCooldown = false;
        }
    }, 1000);
}

// 处理解绑单个卡片
function handleUnbind(slot) {
    // 参数验证
    if (typeof slot !== 'number' || slot < 1 || slot > 3) {
        console.error('handleUnbind: 无效的卡片槽位', slot);
        showErrorMessage('参数错误：无效的卡片槽位');
        return;
    }
    
    if (!confirm(`确定要解绑卡片${slot}吗?解绑后该卡片信息将被清除。`)) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/ccb/unbind', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ slot: slot })
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage(`卡片${slot}解绑成功`);
            
            // 立即更新本地用户信息
            if (slot === 1) {
                currentUser.game_server = null;
                currentUser.keychip = null;
                currentUser.guid = null;
            } else if (slot === 2) {
                currentUser.ccb_slot2_server = null;
                currentUser.ccb_slot2_keychip = null;
                currentUser.ccb_slot2_guid = null;
            } else if (slot === 3) {
                currentUser.ccb_slot3_server = null;
                currentUser.ccb_slot3_keychip = null;
                currentUser.ccb_slot3_guid = null;
            }
            
            // 检查是否还有其他已绑定的卡片
            const hasSlot1 = currentUser.game_server && currentUser.keychip && currentUser.guid;
            const hasSlot2 = currentUser.ccb_slot2_server && currentUser.ccb_slot2_keychip && currentUser.ccb_slot2_guid;
            const hasSlot3 = currentUser.ccb_slot3_server && currentUser.ccb_slot3_keychip && currentUser.ccb_slot3_guid;
            
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            
            // 立即渲染页面
            if (!hasSlot1 && !hasSlot2 && !hasSlot3) {
                // 没有任何绑定的卡片了,返回绑定页面
                currentCardSlot = 1;
                renderBindingPage();
            } else {
                // 如果解绑的是当前激活的卡片，切换到第一个有效卡片
                if (currentCardSlot === slot) {
                    if (hasSlot1) currentCardSlot = 1;
                    else if (hasSlot2) currentCardSlot = 2;
                    else if (hasSlot3) currentCardSlot = 3;
                    currentUser.ccb_active_slot = currentCardSlot;
                }
                renderQueryPage(currentUser);
            }
            
        } else {
            throw new Error(result.error || '解绑失败');
        }
    })
    .catch(error => {
        console.error('解绑失败:', error);
        showErrorMessage('解绑失败: ' + (error.error || error.message || '服务器错误'));
    });
}

// 处理全部解绑
function handleUnbindAll() {
    if (!confirm('确定要解绑所有卡片吗?此操作将清除所有绑定信息!')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/ccb/unbind-all', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage('所有卡片已解绑');
            
            // 立即清除所有绑定信息
            currentUser.game_server = null;
            currentUser.keychip = null;
            currentUser.guid = null;
            currentUser.ccb_slot2_server = null;
            currentUser.ccb_slot2_keychip = null;
            currentUser.ccb_slot2_guid = null;
            currentUser.ccb_slot3_server = null;
            currentUser.ccb_slot3_keychip = null;
            currentUser.ccb_slot3_guid = null;
            currentUser.ccb_active_slot = 1;
            currentCardSlot = 1;
            
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            
            // 立即返回绑定页面
            renderBindingPage();
            
        } else {
            throw new Error(result.error || '解绑失败');
        }
    })
    .catch(error => {
        console.error('解绑失败:', error);
        showErrorMessage('解绑失败: ' + (error.error || error.message || '服务器错误'));
    });
}

// 在用户设置页面显示绑定信息
async function displayCCBInfoInSettings() {
    const settingsContainer = document.querySelector('.user-settings-container');
    if (!settingsContainer) return;
    
    // 确保服务器列表已加载
    await loadServerListCache();
    
    // 获取所有卡片的信息
    const slot1Bound = currentUser.game_server && currentUser.keychip && currentUser.guid;
    const slot2Bound = currentUser.ccb_slot2_server && currentUser.ccb_slot2_keychip && currentUser.ccb_slot2_guid;
    const slot3Bound = currentUser.ccb_slot3_server && currentUser.ccb_slot3_keychip && currentUser.ccb_slot3_guid;
    
    let cardsInfo = '';
    
    if (slot1Bound) {
        const serverName1 = getServerNameByUrl(currentUser.game_server);
        cardsInfo += `
            <div style="margin-bottom: 12px; padding: 12px; border: 1px solid var(--modern-border-color); border-radius: 8px;">
                <h4 style="margin-bottom: 8px;">卡片1 ${currentUser.ccb_active_slot === 1 ? '<i class="fas fa-star" style="color: gold;"></i>' : ''}</h4>
                <p><strong>服务器:</strong> ${serverName1}</p>
                <p><strong>KeyChip:</strong> ${currentUser.keychip}</p>
                <p><strong>游戏卡号:</strong> ${currentUser.guid}</p>
            </div>
        `;
    }
    
    if (slot2Bound) {
        const serverName2 = getServerNameByUrl(currentUser.ccb_slot2_server);
        cardsInfo += `
            <div style="margin-bottom: 12px; padding: 12px; border: 1px solid var(--modern-border-color); border-radius: 8px;">
                <h4 style="margin-bottom: 8px;">卡片2 ${currentUser.ccb_active_slot === 2 ? '<i class="fas fa-star" style="color: gold;"></i>' : ''}</h4>
                <p><strong>服务器:</strong> ${serverName2}</p>
                <p><strong>KeyChip:</strong> ${currentUser.ccb_slot2_keychip}</p>
                <p><strong>游戏卡号:</strong> ${currentUser.ccb_slot2_guid}</p>
            </div>
        `;
    }
    
    if (slot3Bound) {
        const serverName3 = getServerNameByUrl(currentUser.ccb_slot3_server);
        cardsInfo += `
            <div style="margin-bottom: 12px; padding: 12px; border: 1px solid var(--modern-border-color); border-radius: 8px;">
                <h4 style="margin-bottom: 8px;">卡片3 ${currentUser.ccb_active_slot === 3 ? '<i class="fas fa-star" style="color: gold;"></i>' : ''}</h4>
                <p><strong>服务器:</strong> ${serverName3}</p>
                <p><strong>KeyChip:</strong> ${currentUser.ccb_slot3_keychip}</p>
                <p><strong>游戏卡号:</strong> ${currentUser.ccb_slot3_guid}</p>
            </div>
        `;
    }
    
    const ccbInfoSection = document.createElement('div');
    ccbInfoSection.className = 'settings-section';
    ccbInfoSection.innerHTML = `
        <h3>游戏查分绑定信息</h3>
        ${cardsInfo || '<p>未绑定任何卡片</p>'}
    `;
    
    settingsContainer.appendChild(ccbInfoSection);
}

// 保存查分图片
function saveCCBImage() {
    const resultImg = document.querySelector('#query-result img');
    if (!resultImg) {
        showErrorMessage('没有可保存的图片');
        return;
    }
    
    // 创建时间戳文件名
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `ccb_card${currentCardSlot}_${timestamp}.png`;
    
    // 创建下载链接
    const link = document.createElement('a');
    link.href = resultImg.src;
    link.download = filename;
    
    // 模拟点击下载
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessMessage('图片已保存');
}

// 在SPA加载页面时初始化
document.addEventListener("DOMContentLoaded", function() {
    // 在loadPage函数中添加ccb页面的处理
    const originalLoadPage = window.loadPage;
    
    window.loadPage = function(pageId) {
        if (pageId === 'ccb') {
            initCCBPage();
            updateActiveMenuItem(pageId);
        } else if (pageId === 'site-admin') {
            originalLoadPage(pageId);
        } else {
            originalLoadPage(pageId);
            
            // 在用户设置页面显示查分绑定信息
            if (pageId === 'user-settings' && currentUser) {
                setTimeout(displayCCBInfoInSettings, 100);
            }
        }
    };
    
    // 在用户登录后显示查分菜单
    const originalShowUserInfo = window.showUserInfo;
    
    window.showUserInfo = function(){
        originalShowUserInfo();
        try { 
            if (typeof updateSidebarVisibility === 'function') { 
                updateSidebarVisibility(window.currentUser || null); 
            } 
        } catch(e){}
    };

    // 在显示登录链接时隐藏查分菜单
    const originalShowAuthLinks = window.showAuthLinks;
    
    window.showAuthLinks = function(){ 
        originalShowAuthLinks(); 
        try { 
            if (typeof updateSidebarVisibility === 'function') { 
                updateSidebarVisibility(null); 
            } 
        } catch(e){} 
    };
});