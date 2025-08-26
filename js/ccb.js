// ccb.js - 游戏查分系统功能
let queryCooldown = false;
let cooldownTimer = null;

// 初始化查分页面
function initCCBPage() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginRequired('ccb');
        return;
    }
    
    // 检查用户组级别
    if (!currentUser || currentUser.user_rank <= 0) {
        showErrorMessage('您的用户组级别不足，无法使用查分功能');
        loadPage('home');
        return;
    }
    
    // 直接检查当前用户信息中的绑定状态
    if (currentUser.game_server && currentUser.keychip && currentUser.guid) {
        renderQueryPage(currentUser);
    } else {
        // 如果没有绑定信息，从服务器获取最新用户信息
        checkUserBinding();
    }
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
        // 检查用户是否已绑定查分信息
        if (user.game_server && user.keychip && user.guid) {
            renderQueryPage(user);
        } else {
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
    
    contentContainer.innerHTML = `
        <div class="section">
            <h1 class="page-title">游戏查分系统 - 绑定信息</h1>
            <div class="ccb-container">
                <div class="ccb-section">
                    <h2 class="ccb-title">绑定查分信息</h2>
                    <p>请填写以下信息以使用查分功能：</p>
                    
                    <form id="ccb-binding-form" class="ccb-form">
                        <div class="form-group">
                            <label for="server-select">选择服务器</label>
                            <select id="server-select" required>
                                <option value="">请选择服务器</option>
                                <!-- 服务器选项将通过JS动态添加 -->
                            </select>
                        </div>
                        
                        <div class="form-group">
                            <label for="keychip-input">KeyChip</label>
                            <input type="text" id="keychip-input" required placeholder="请输入KeyChip">
                        </div>
                        
                        <div class="form-group">
                            <label for="guid-input">游戏卡号</label>
                            <input type="text" id="guid-input" required placeholder="请输入游戏卡号">
                        </div>
                        
                        <div class="ccb-actions">
                            <button type="submit" class="ccb-btn ccb-btn-primary">绑定信息</button>
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
}

// 加载服务器列表
function loadServerList() {
    secureFetch('https://api.am-all.com.cn/api/ccb/servers')
        .then(servers => {
            const serverSelect = document.getElementById('server-select');
            
            servers.forEach(server => {
                const option = document.createElement('option');
                option.value = server.server_url;
                option.textContent = server.server_name;
                serverSelect.appendChild(option);
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
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/ccb/bind', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game_server: server,
            keychip: keychip,
            guid: guid
        })
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage('绑定成功');
            // 更新当前用户信息
            currentUser.game_server = server;
            currentUser.keychip = keychip;
            currentUser.guid = guid;
            
            // 保存更新后的用户信息到本地存储
            localStorage.setItem('userInfo', JSON.stringify(currentUser));
            
            // 重新渲染页面
            renderQueryPage(currentUser);
        } else {
            showErrorMessage(result.error || '绑定失败');
        }
    })
    .catch(error => {
        console.error('绑定失败:', error);
        showErrorMessage('绑定失败: ' + (error.error || '服务器错误'));
    });
}

// 渲染查询页面
function renderQueryPage(user) {
    const contentContainer = document.getElementById('content-container');
    
    contentContainer.innerHTML = `
        <div class="section">
            <h1 class="page-title">游戏查分系统</h1>
            <div class="ccb-container">
                <div class="ccb-section">
                    <h2 class="ccb-title">查询分数</h2>
                    <p>已绑定服务器: ${user.game_server}</p>
                    
                    <form id="ccb-query-form" class="ccb-form">
                        <div class="form-group">
                            <label for="game-select">选择游戏</label>
                            <select id="game-select" required>
                                <option value="">请选择游戏</option>
                                <!-- 游戏选项将通过JS动态添加 -->
                            </select>
                        </div>
                        
                        <div class="ccb-actions">
                            <button type="submit" class="ccb-btn ccb-btn-primary" id="query-btn">查询分数 (消耗5积分)</button>
                            <button type="button" class="ccb-btn ccb-btn-secondary" id="unbind-btn">解绑信息</button>
                        </div>
                        
                        <div class="ccb-points-info">
                            当前积分: ${user.points || 0}  <!-- 只显示普通积分 -->
                        </div>
                        
                        <div class="ccb-cooldown" id="cooldown-message" style="display: none;"></div>
                    </form>
                </div>
                
                <div class="ccb-section">
                    <div class="ccb-result" id="query-result">
                        <!-- 查询结果将显示在这里 -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 加载游戏列表
    loadGameList();
    
    // 绑定表单提交事件
    document.getElementById('ccb-query-form').addEventListener('submit', handleQuerySubmit);
    
    // 绑定解绑按钮事件
    document.getElementById('unbind-btn').addEventListener('click', handleUnbind);
}

// 加载游戏列表
function loadGameList() {
    secureFetch('https://api.am-all.com.cn/api/ccb/games')
        .then(games => {
            const gameSelect = document.getElementById('game-select');
            
            games.forEach(game => {
                const option = document.createElement('option');
                option.value = game.game_title;
                option.textContent = game.game_name;
                gameSelect.appendChild(option);
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
        showErrorMessage('查询冷却中，请稍后再试');
        return;
    }
    
    const game = document.getElementById('game-select').value;
    
    if (!game) {
        showErrorMessage('请选择游戏');
        return;
    }
    
    // 检查积分（只检查普通积分）
	if ((currentUser.points || 0) < 5) {
		showErrorMessage('积分不足，需要5积分才能查询');
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
            game: game
        })
    })
    .then(result => {
        queryBtn.disabled = false;
        queryBtn.textContent = '查询分数 (消耗5积分)';
        
		if (result.success) {
			if (result.status === 'ok' && result.image_base64) {
				// 显示查询结果
				document.getElementById('query-result').innerHTML = `
					<img src="data:image/png;base64,${result.image_base64}" alt="查分结果">
				`;
                
				// 更新用户积分（只更新普通积分）
				currentUser.points -= 5;
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
        queryBtn.textContent = '查询分数 (消耗5积分)';
        console.error('查询失败:', error);
        showErrorMessage('查询失败: ' + (error.error || '服务器错误'));
    });
}

// 启动冷却计时器
function startCooldown() {
    queryCooldown = true;
    const cooldownMessage = document.getElementById('cooldown-message');
    let seconds = 10;
    
    cooldownMessage.style.display = 'block';
    cooldownMessage.textContent = `冷却时间: ${seconds}秒`;
    
    cooldownTimer = setInterval(() => {
        seconds--;
        cooldownMessage.textContent = `冷却时间: ${seconds}秒`;
        
        if (seconds <= 0) {
            clearInterval(cooldownTimer);
            cooldownMessage.style.display = 'none';
            queryCooldown = false;
        }
    }, 1000);
}

// 处理解绑
function handleUnbind() {
    if (!confirm('确定要解绑查分信息吗？解绑后需要重新绑定才能使用查分功能。')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/ccb/unbind', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage('解绑成功');
            // 更新当前用户信息
            currentUser.game_server = null;
            currentUser.keychip = null;
            currentUser.guid = null;
            // 重新渲染绑定页面
            renderBindingPage();
        } else {
            showErrorMessage(result.error || '解绑失败');
        }
    })
    .catch(error => {
        console.error('解绑失败:', error);
        showErrorMessage('解绑失败: ' + (error.error || '服务器错误'));
    });
}

// 在用户设置页面显示绑定信息
function displayCCBInfoInSettings() {
    const settingsContainer = document.querySelector('.user-settings-container');
    if (!settingsContainer) return;
    
    const ccbInfoSection = document.createElement('div');
    ccbInfoSection.className = 'settings-section';
    ccbInfoSection.innerHTML = `
        <h3>游戏查分绑定信息</h3>
        ${currentUser.game_server && currentUser.keychip && currentUser.guid ? `
            <div class="ccb-info">
                <p><strong>服务器:</strong> ${currentUser.game_server}</p>
                <p><strong>KeyChip:</strong> ${currentUser.keychip}</p>
                <p><strong>游戏卡号:</strong> ${currentUser.guid}</p>
                <button type="button" class="ccb-btn ccb-btn-secondary" id="settings-unbind-btn">解绑查分信息</button>
            </div>
        ` : '<p>未绑定查分信息</p>'}
    `;
    
    settingsContainer.appendChild(ccbInfoSection);
    
    // 绑定解绑按钮事件
    const unbindBtn = document.getElementById('settings-unbind-btn');
    if (unbindBtn) {
        unbindBtn.addEventListener('click', handleUnbind);
    }
}

// 初始化网站管理页面
function initSiteAdminPage() {
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginRequired('site-admin');
        return;
    }
    
    // 检查用户是否为管理员
    if (!currentUser || currentUser.user_rank < 5) {
        showErrorMessage('需要管理员权限才能访问此页面');
        loadPage('home');
        return;
    }
    
    const contentContainer = document.getElementById('content-container');
    
    contentContainer.innerHTML = `
        <div class="section">
            <h1 class="page-title">网站管理</h1>
            <div class="admin-container">
                <div class="admin-card">
                    <h3>查分服务器设置</h3>
                    <form id="server-form" class="admin-form">
                        <div class="form-group">
                            <label for="server-name">服务器名称</label>
                            <input type="text" id="server-name" required>
                        </div>
                        <div class="form-group">
                            <label for="server-url">服务器地址</label>
                            <input type="text" id="server-url" required>
                        </div>
                        <div class="form-group">
                            <label for="server-game">游戏代码</label>
                            <input type="text" id="server-game" required>
                        </div>
                        <button type="submit" class="ccb-btn ccb-btn-primary">添加服务器</button>
                    </form>
                    
                    <div class="admin-list" id="server-list">
                        <h4>服务器列表</h4>
                        <!-- 服务器列表将通过JS动态添加 -->
                    </div>
                </div>
                
                <div class="admin-card">
                    <h3>查分游戏设置</h3>
                    <form id="game-form" class="admin-form">
                        <div class="form-group">
                            <label for="game-name">游戏名称</label>
                            <input type="text" id="game-name" required>
                        </div>
                        <div class="form-group">
                            <label for="game-title">游戏代码</label>
                            <input type="text" id="game-title" required>
                        </div>
                        <button type="submit" class="ccb-btn ccb-btn-primary">添加游戏</button>
                    </form>
                    
                    <div class="admin-list" id="game-list">
                        <h4>游戏列表</h4>
                        <!-- 游戏列表将通过JS动态添加 -->
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 加载服务器和游戏列表
    loadAdminServerList();
    loadAdminGameList();
    
    // 绑定表单提交事件
    document.getElementById('server-form').addEventListener('submit', handleServerAdd);
    document.getElementById('game-form').addEventListener('submit', handleGameAdd);
}

// 加载管理页面的服务器列表
function loadAdminServerList() {
    secureFetch('https://api.am-all.com.cn/api/ccb/servers')
        .then(servers => {
            const serverList = document.getElementById('server-list');
            
            if (servers.length === 0) {
                serverList.innerHTML += '<p>暂无服务器</p>';
                return;
            }
            
            servers.forEach(server => {
                const item = document.createElement('div');
                item.className = 'admin-item';
                item.innerHTML = `
                    <div>
                        <strong>${server.server_name}</strong> - ${server.server_url} (${server.game_title})
                    </div>
                    <div class="admin-item-actions">
                        <button class="ccb-btn ccb-btn-secondary" data-id="${server.id}" onclick="deleteServer(${server.id})">删除</button>
                    </div>
                `;
                serverList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('加载服务器列表失败:', error);
            showErrorMessage('加载服务器列表失败');
        });
}

// 加载管理页面的游戏列表
function loadAdminGameList() {
    secureFetch('https://api.am-all.com.cn/api/ccb/games')
        .then(games => {
            const gameList = document.getElementById('game-list');
            
            if (games.length === 0) {
                gameList.innerHTML += '<p>暂无游戏</p>';
                return;
            }
            
            games.forEach(game => {
                const item = document.createElement('div');
                item.className = 'admin-item';
                item.innerHTML = `
                    <div>
                        <strong>${game.game_name}</strong> (${game.game_title})
                    </div>
                    <div class="admin-item-actions">
                        <button class="ccb-btn ccb-btn-secondary" data-id="${game.id}" onclick="deleteGame(${game.id})">删除</button>
                    </div>
                `;
                gameList.appendChild(item);
            });
        })
        .catch(error => {
            console.error('加载游戏列表失败:', error);
            showErrorMessage('加载游戏列表失败');
        });
}

// 处理添加服务器
function handleServerAdd(e) {
    e.preventDefault();
    
    const name = document.getElementById('server-name').value;
    const url = document.getElementById('server-url').value;
    const game = document.getElementById('server-game').value;
    
    if (!name || !url || !game) {
        showErrorMessage('请填写所有字段');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/admin/ccb/servers', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            server_name: name,
            server_url: url,
            game_title: game
        })
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage('服务器添加成功');
            document.getElementById('server-form').reset();
            // 重新加载服务器列表
            document.getElementById('server-list').innerHTML = '<h4>服务器列表</h4>';
            loadAdminServerList();
        } else {
            showErrorMessage(result.error || '添加服务器失败');
        }
    })
    .catch(error => {
        console.error('添加服务器失败:', error);
        showErrorMessage('添加服务器失败: ' + (error.error || '服务器错误'));
    });
}

// 处理添加游戏
function handleGameAdd(e) {
    e.preventDefault();
    
    const name = document.getElementById('game-name').value;
    const title = document.getElementById('game-title').value;
    
    if (!name || !title) {
        showErrorMessage('请填写所有字段');
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch('https://api.am-all.com.cn/api/admin/ccb/games', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            game_name: name,
            game_title: title
        })
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage('游戏添加成功');
            document.getElementById('game-form').reset();
            // 重新加载游戏列表
            document.getElementById('game-list').innerHTML = '<h4>游戏列表</h4>';
            loadAdminGameList();
        } else {
            showErrorMessage(result.error || '添加游戏失败');
        }
    })
    .catch(error => {
        console.error('添加游戏失败:', error);
        showErrorMessage('添加游戏失败: ' + (error.error || '服务器错误'));
    });
}

// 删除服务器
function deleteServer(id) {
    if (!confirm('确定要删除这个服务器吗？')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch(`https://api.am-all.com.cn/api/admin/ccb/servers/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage('服务器删除成功');
            // 重新加载服务器列表
            document.getElementById('server-list').innerHTML = '<h4>服务器列表</h4>';
            loadAdminServerList();
        } else {
            showErrorMessage(result.error || '删除服务器失败');
        }
    })
    .catch(error => {
        console.error('删除服务器失败:', error);
        showErrorMessage('删除服务器失败: ' + (error.error || '服务器错误'));
    });
}

// 删除游戏
function deleteGame(id) {
    if (!confirm('确定要删除这个游戏吗？')) {
        return;
    }
    
    const token = localStorage.getItem('token');
    
    secureFetch(`https://api.am-all.com.cn/api/admin/ccb/games/${id}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(result => {
        if (result.success) {
            showSuccessMessage('游戏删除成功');
            // 重新加载游戏列表
            document.getElementById('game-list').innerHTML = '<h4>游戏列表</h4>';
            loadAdminGameList();
        } else {
            showErrorMessage(result.error || '删除游戏失败');
        }
    })
    .catch(error => {
        console.error('删除游戏失败:', error);
        showErrorMessage('删除游戏失败: ' + (error.error || '服务器错误'));
    });
}

// 在SPA加载页面时初始化
document.addEventListener("DOMContentLoaded", function() {
    // 在loadPage函数中添加ccb页面的处理
    const originalLoadPage = window.loadPage;
    
    window.loadPage = function(pageId) {
        if (pageId === 'ccb') {
            initCCBPage();
        } else if (pageId === 'site-admin') {
            initSiteAdminPage();
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
    
    window.showUserInfo = function() {
        originalShowUserInfo();
        
        // 显示游戏查分菜单（用户组级别>0）
        if (currentUser && currentUser.user_rank > 0) {
            document.getElementById('sidebar-ccb').style.display = 'block';
        } else {
            document.getElementById('sidebar-ccb').style.display = 'none';
        }
        
        // 显示网站管理菜单（用户组级别>=5）
        if (currentUser && currentUser.user_rank >= 5) {
            document.getElementById('sidebar-site-admin').style.display = 'block';
        } else {
            document.getElementById('sidebar-site-admin').style.display = 'none';
        }
    };
    
    // 在显示登录链接时隐藏查分菜单
    const originalShowAuthLinks = window.showAuthLinks;
    
    window.showAuthLinks = function() {
        originalShowAuthLinks();
        document.getElementById('sidebar-ccb').style.display = 'none';
        document.getElementById('sidebar-site-admin').style.display = 'none';
    };
});