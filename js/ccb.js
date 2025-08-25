// ccb.js - 游戏查分系统

// 初始化游戏查分页面
function initCCBPage() {
  // 检查用户是否已绑定游戏信息
  const token = localStorage.getItem('token');
  if (!token) {
    showLoginRequired('ccb');
    return;
  }
  
  // 获取用户信息
  secureFetch('https://api.am-all.com.cn/api/user', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(user => {
    // 加载服务器列表
    loadServerList();
    
    if (user.game_server && user.keychip && user.guid) {
      // 已绑定，显示查询界面
      showQuerySection(user);
    } else {
      // 未绑定，显示绑定界面
      showBindSection();
    }
  })
  .catch(error => {
    console.error('获取用户信息失败:', error);
    showErrorMessage('获取用户信息失败');
  });
  
  // 绑定按钮点击事件
  document.getElementById('bind-game-info').addEventListener('click', bindGameInfo);
  
  // 查询按钮点击事件
  document.getElementById('query-score').addEventListener('click', queryScore);
  
  // 修改绑定信息按钮点击事件
  document.getElementById('change-bind').addEventListener('click', showBindSection);
}

// 加载服务器列表
function loadServerList() {
  const token = localStorage.getItem('token');
  
  secureFetch('https://api.am-all.com.cn/api/admin/servers', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(servers => {
    const gameServerSelect = document.getElementById('game-server');
    const gameTitleSelect = document.getElementById('game-title');
    const queryGameTitleSelect = document.getElementById('query-game-title');
    
    // 清空选项
    gameServerSelect.innerHTML = '<option value="">请选择服务器...</option>';
    gameTitleSelect.innerHTML = '<option value="">请选择游戏...</option>';
    queryGameTitleSelect.innerHTML = '<option value="">请选择游戏...</option>';
    
    // 添加服务器选项
    const uniqueGames = new Set();
    servers.forEach(server => {
      // 添加到服务器下拉框
      const option = document.createElement('option');
      option.value = server.server_url;
      option.textContent = `${server.server_name} (${server.game_title})`;
      option.dataset.gameTitle = server.game_title;
      gameServerSelect.appendChild(option);
      
      // 收集唯一游戏名称
      uniqueGames.add(server.game_title);
    });
    
    // 添加游戏选项
    uniqueGames.forEach(game => {
      const option1 = document.createElement('option');
      option1.value = game;
      option1.textContent = game;
      gameTitleSelect.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = game;
      option2.textContent = game;
      queryGameTitleSelect.appendChild(option2);
    });
    
    // 服务器选择变化时更新游戏选择
    gameServerSelect.addEventListener('change', function() {
      const selectedOption = this.options[this.selectedIndex];
      if (selectedOption.dataset.gameTitle) {
        gameTitleSelect.value = selectedOption.dataset.gameTitle;
      }
    });
  })
  .catch(error => {
    console.error('加载服务器列表失败:', error);
    showErrorMessage('加载服务器列表失败');
  });
}

// 显示绑定界面
function showBindSection() {
  document.getElementById('ccb-bind-section').style.display = 'block';
  document.getElementById('ccb-query-section').style.display = 'none';
}

// 显示查询界面
function showQuerySection(user) {
  document.getElementById('ccb-bind-section').style.display = 'none';
  document.getElementById('ccb-query-section').style.display = 'block';
  
  // 填充当前绑定信息
  document.getElementById('game-server').value = user.game_server || '';
  document.getElementById('keychip').value = user.keychip || '';
  document.getElementById('guid').value = user.guid || '';
  
  // 如果有游戏标题信息，也设置上
  if (user.game_server) {
    const gameServerSelect = document.getElementById('game-server');
    for (let i = 0; i < gameServerSelect.options.length; i++) {
      if (gameServerSelect.options[i].value === user.game_server) {
        document.getElementById('game-title').value = gameServerSelect.options[i].dataset.gameTitle || '';
        document.getElementById('query-game-title').value = gameServerSelect.options[i].dataset.gameTitle || '';
        break;
      }
    }
  }
}

// 绑定游戏信息
function bindGameInfo() {
  const gameServer = document.getElementById('game-server').value;
  const keychip = document.getElementById('keychip').value;
  const guid = document.getElementById('guid').value;
  const gameTitle = document.getElementById('game-title').value;
  
  if (!gameServer || !keychip || !guid || !gameTitle) {
    showErrorMessage('请填写所有必填字段');
    return;
  }
  
  const token = localStorage.getItem('token');
  
  secureFetch('https://api.am-all.com.cn/api/user/game-info', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ game_server: gameServer, keychip, guid })
  })
  .then(data => {
    if (data.success) {
      showSuccessMessage('游戏信息绑定成功');
      showQuerySection(data.user);
    } else {
      throw new Error(data.error || '绑定失败');
    }
  })
  .catch(error => {
    console.error('绑定游戏信息失败:', error);
    showErrorMessage('绑定游戏信息失败: ' + error.message);
  });
}

// 查询分数
function queryScore() {
  const gameTitle = document.getElementById('query-game-title').value;
  
  if (!gameTitle) {
    showErrorMessage('请选择要查询的游戏');
    return;
  }
  
  const token = localStorage.getItem('token');
  
  secureFetch('https://api.am-all.com.cn/api/ccb/query', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ game_title: gameTitle })
  })
  .then(data => {
    if (data.success) {
      // 显示查询结果
      const resultDiv = document.getElementById('query-result');
      const scoreImage = document.getElementById('score-image');
      
      scoreImage.innerHTML = `<img src="data:image/png;base64,${data.image_base64}" class="img-fluid" alt="分数结果">`;
      resultDiv.style.display = 'block';
      
      // 更新用户积分显示
      if (currentUser) {
        currentUser.points = data.points;
        updateUserInfo(currentUser);
      }
      
      showSuccessMessage('查询成功，已扣除5积分');
    } else {
      throw new Error(data.error || '查询失败');
    }
  })
  .catch(error => {
    console.error('查询分数失败:', error);
    showErrorMessage('查询分数失败: ' + error.message);
  });
}

// 初始化网站管理页面
function initWebsiteAdminPage() {
  // 检查用户权限
  if (!currentUser || currentUser.user_rank < 5) {
    showLoginRequired('website-admin');
    return;
  }
  
  // 加载服务器列表
  loadAdminServerList();
  
  // 添加事件监听器
  document.getElementById('add-server').addEventListener('click', showServerEditor);
  document.getElementById('save-server').addEventListener('click', saveServer);
  document.getElementById('cancel-server').addEventListener('click', cancelServerEdit);
}

// 加载管理员服务器列表
function loadAdminServerList() {
  const token = localStorage.getItem('token');
  
  secureFetch('https://api.am-all.com.cn/api/admin/servers', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(servers => {
    const serversList = document.getElementById('servers-list');
    
    if (servers.length === 0) {
      serversList.innerHTML = '<div class="text-center py-4"><p>暂无服务器</p></div>';
      return;
    }
    
    let html = '<div class="list-group">';
    
    servers.forEach(server => {
      html += `
        <div class="list-group-item d-flex justify-content-between align-items-center">
          <div>
            <h6 class="mb-1">${server.server_name}</h6>
            <p class="mb-1 text-muted">${server.server_url}</p>
            <small>游戏: ${server.game_title}</small>
          </div>
          <div>
            <button class="btn btn-sm btn-outline-primary edit-server" data-id="${server.id}">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-sm btn-outline-danger delete-server" data-id="${server.id}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });
    
    html += '</div>';
    serversList.innerHTML = html;
    
    // 添加编辑和删除事件
    document.querySelectorAll('.edit-server').forEach(btn => {
      btn.addEventListener('click', function() {
        const serverId = this.dataset.id;
        editServer(serverId);
      });
    });
    
    document.querySelectorAll('.delete-server').forEach(btn => {
      btn.addEventListener('click', function() {
        const serverId = this.dataset.id;
        deleteServer(serverId);
      });
    });
  })
  .catch(error => {
    console.error('加载服务器列表失败:', error);
    document.getElementById('servers-list').innerHTML = '<div class="alert alert-danger">加载服务器列表失败</div>';
  });
}

// 显示服务器编辑器
function showServerEditor(server = null) {
  const editor = document.getElementById('server-editor');
  const title = document.getElementById('server-editor-title');
  const serverId = document.getElementById('server-id');
  const serverName = document.getElementById('editor-server-name');
  const serverUrl = document.getElementById('editor-server-url');
  const gameTitle = document.getElementById('editor-game-title');
  
  if (server) {
    title.textContent = '编辑服务器';
    serverId.value = server.id;
    serverName.value = server.server_name;
    serverUrl.value = server.server_url;
    gameTitle.value = server.game_title;
  } else {
    title.textContent = '添加服务器';
    serverId.value = '';
    serverName.value = '';
    serverUrl.value = '';
    gameTitle.value = '';
  }
  
  editor.style.display = 'block';
}

// 保存服务器
function saveServer() {
  const serverId = document.getElementById('server-id').value;
  const serverName = document.getElementById('editor-server-name').value;
  const serverUrl = document.getElementById('editor-server-url').value;
  const gameTitle = document.getElementById('editor-game-title').value;
  
  if (!serverName || !serverUrl || !gameTitle) {
    showErrorMessage('请填写所有字段');
    return;
  }
  
  const token = localStorage.getItem('token');
  const url = serverId ? 
    `https://api.am-all.com.cn/api/admin/servers/${serverId}` : 
    'https://api.am-all.com.cn/api/admin/servers';
  
  const method = serverId ? 'PUT' : 'POST';
  
  secureFetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ server_name: serverName, server_url: serverUrl, game_title: gameTitle })
  })
  .then(() => {
    showSuccessMessage(serverId ? '服务器更新成功' : '服务器添加成功');
    cancelServerEdit();
    loadAdminServerList();
  })
  .catch(error => {
    console.error('保存服务器失败:', error);
    showErrorMessage('保存服务器失败: ' + error.message);
  });
}

// 取消编辑
function cancelServerEdit() {
  document.getElementById('server-editor').style.display = 'none';
}

// 编辑服务器
function editServer(serverId) {
  const token = localStorage.getItem('token');
  
  secureFetch(`https://api.am-all.com.cn/api/admin/servers/${serverId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(server => {
    showServerEditor(server);
  })
  .catch(error => {
    console.error('获取服务器详情失败:', error);
    showErrorMessage('获取服务器详情失败');
  });
}

// 删除服务器
function deleteServer(serverId) {
  if (!confirm('确定要删除这个服务器吗？此操作不可撤销。')) {
    return;
  }
  
  const token = localStorage.getItem('token');
  
  secureFetch(`https://api.am-all.com.cn/api/admin/servers/${serverId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })
  .then(() => {
    showSuccessMessage('服务器删除成功');
    loadAdminServerList();
  })
  .catch(error => {
    console.error('删除服务器失败:', error);
    showErrorMessage('删除服务器失败: ' + error.message);
  });
}