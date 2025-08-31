// userManager.js

class UserManager {
    constructor() {
        this.currentPage = 1;
        this.usersPerPage = 20;
        this.totalPages = 1;
        this.users = [];
        this.editingUserId = null;
        this.permissionModal = null;
        this.currentPermissions = {};
    }

    init() {
        this.loadUsers();
        this.setupEventListeners();
        this.createPermissionModal();
    }

    setupEventListeners() {
        // 搜索按钮事件
        document.getElementById('user-search-btn').addEventListener('click', () => {
            this.currentPage = 1;
            this.loadUsers();
        });

        // 搜索输入框回车事件
        document.getElementById('user-search-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.currentPage = 1;
                this.loadUsers();
            }
        });

        // 用户组筛选事件
        document.getElementById('user-rank-filter').addEventListener('change', () => {
            this.currentPage = 1;
            this.loadUsers();
        });

        // 状态筛选事件
        document.getElementById('user-state-filter').addEventListener('change', () => {
            this.currentPage = 1;
            this.loadUsers();
        });

        // 事件委托处理动态生成的按钮
        document.addEventListener('click', (e) => {
            // 编辑按钮
            if (e.target.classList.contains('btn-edit')) {
                const userId = parseInt(e.target.dataset.userId);
                this.toggleEditMode(userId);
            }

            // 保存按钮
            if (e.target.classList.contains('btn-save')) {
                const userId = parseInt(e.target.dataset.userId);
                this.saveUserChanges(userId);
            }

            // 取消按钮
            if (e.target.classList.contains('btn-cancel')) {
                const userId = parseInt(e.target.dataset.userId);
                this.cancelEditMode(userId);
            }

            // 授权按钮
            if (e.target.classList.contains('btn-auth')) {
                const userId = parseInt(e.target.dataset.userId);
                this.showPermissionModal(userId);
            }
        });
    }

	async loadUsers() {
	  try {
		const token = localStorage.getItem('token');
		const search = document.getElementById('user-search-input').value;
		const rankFilter = document.getElementById('user-rank-filter').value;
		const stateFilter = document.getElementById('user-state-filter').value;

		let url = `https://api.am-all.com.cn/api/admin/users?page=${this.currentPage}&limit=${this.usersPerPage}`;
		
		if (search) url += `&search=${encodeURIComponent(search)}`;
		if (rankFilter) url += `&user_rank=${rankFilter}`;
		if (stateFilter) url += `&banState=${stateFilter}`;

		console.log('请求URL:', url); // 添加日志

		const response = await fetch(url, {
		  headers: {
			'Authorization': `Bearer ${token}`
		  }
		});

		if (!response.ok) {
		  // 尝试获取更详细的错误信息
		  let errorMsg = '获取用户列表失败';
		  try {
			const errorData = await response.json();
			errorMsg = errorData.error || errorMsg;
			if (errorData.details) {
			  errorMsg += `: ${errorData.details}`;
			}
		  } catch (e) {
			errorMsg += `: HTTP ${response.status}`;
		  }
		  throw new Error(errorMsg);
		}

		const data = await response.json();
		
		this.users = data.users;
		this.totalPages = data.pagination.totalPages;
		
		this.renderUsers();
		this.renderPagination();
	  } catch (error) {
		console.error('加载用户列表失败:', error);
		showErrorMessage('加载用户列表失败: ' + error.message);
	  }
	}

	renderUsers() {
		const tbody = document.getElementById('users-table-body');
		tbody.innerHTML = '';

		if (this.users.length === 0) {
			tbody.innerHTML = '<tr><td colspan="13" class="text-center">没有找到用户</td></tr>';
			return;
		}

		this.users.forEach(user => {
			const isEditing = this.editingUserId === user.id;
			
			const tr = document.createElement('tr');
			// 添加data-user-id属性以便后续查找
			tr.setAttribute('data-user-id', user.id);
			tr.innerHTML = this.getUserRowHTML(user, isEditing);
			tbody.appendChild(tr);
		});
	}

getUserRowHTML(user, isEditing) {
    // 用户组映射
    const rankMap = {
        0: '普通用户',
        1: '初级用户',
        2: '中级用户',
        3: '高级用户',
        4: '贵宾用户',
        5: '系统管理员'
    };

    // 特殊用户组映射
    const specialRankMap = {
        0: '无',
        1: 'MML'
        // 可根据需要添加更多特殊用户组
    };

    // 账户状态映射
    const stateMap = {
        0: '正常',
        1: '受限',
        2: '封禁'
    };

    // 修复头像URL - 使用正确的服务器地址
    const avatarUrl = user.avatar ? 
        `https://api.am-all.com.cn/avatars/${user.avatar}` : 
        'https://api.am-all.com.cn/avatars/default_avatar.png';

    return `
        <td>
            ${isEditing ? 
                `<input type="text" class="edit-mode-input" value="${user.avatar || ''}" data-field="avatar">` : 
                `<img src="${avatarUrl}" class="user-avatar" alt="头像">`
            }
        </td>
        <td>${user.uid}</td>
        <td>
            ${isEditing ? 
                `<input type="text" class="edit-mode-input" value="${user.username}" data-field="username">` : 
                user.username
            }
        </td>
        <td>
            ${isEditing ? 
                `<input type="text" class="edit-mode-input" value="${user.email || ''}" data-field="email">` : 
                (user.email || '未设置')
            }
        </td>
        <td>
            ${isEditing ? 
                `<select class="edit-mode-select" data-field="user_rank">
                    <option value="0" ${user.user_rank == 0 ? 'selected' : ''}>普通用户</option>
                    <option value="1" ${user.user_rank == 1 ? 'selected' : ''}>初级用户</option>
                    <option value="2" ${user.user_rank == 2 ? 'selected' : ''}>中级用户</option>
                    <option value="3" ${user.user_rank == 3 ? 'selected' : ''}>高级用户</option>
                    <option value="4" ${user.user_rank == 4 ? 'selected' : ''}>贵宾用户</option>
                    <option value="5" ${user.user_rank == 5 ? 'selected' : ''}>系统管理员</option>
                </select>` : 
                rankMap[user.user_rank] || '未知'
            }
        </td>
        <td>
            ${isEditing ? 
                `<select class="edit-mode-select" data-field="rankSp">
                    <option value="0" ${user.rankSp == 0 ? 'selected' : ''}>无</option>
                    <option value="1" ${user.rankSp == 1 ? 'selected' : ''}>MML</option>
                </select>` : 
                specialRankMap[user.rankSp] || '未知'
            }
        </td>
        <td>
            ${isEditing ? 
                `<input type="number" class="edit-mode-input" value="${user.points || 0}" data-field="points" min="0">` : 
                (user.points || 0)
            }
        </td>
        <td>
            ${isEditing ? 
                `<input type="number" class="edit-mode-input" value="${user.point2 || 0}" data-field="point2" min="0">` : 
                (user.point2 || 0)
            }
        </td>
        <td>
            ${isEditing ? 
                `<input type="text" class="edit-mode-input" value="${user.game_server || ''}" data-field="game_server">` : 
                (user.game_server || '未绑定')
            }
        </td>
        <td>
            ${isEditing ? 
                `<input type="text" class="edit-mode-input" value="${user.keychip || ''}" data-field="keychip">` : 
                (user.keychip || '未绑定')
            }
        </td>
        <td>
            ${isEditing ? 
                `<input type="text" class="edit-mode-input" value="${user.guid || ''}" data-field="guid">` : 
                (user.guid || '未绑定')
            }
        </td>
        <td>
            ${isEditing ? 
                `<select class="edit-mode-select" data-field="banState">
                    <option value="0" ${user.banState == 0 ? 'selected' : ''}>正常</option>
                    <option value="1" ${user.banState == 1 ? 'selected' : ''}>受限</option>
                    <option value="2" ${user.banState == 2 ? 'selected' : ''}>封禁</option>
                </select>` : 
                stateMap[user.banState] || '未知'
            }
        </td>
        <td class="user-actions">
            ${isEditing ? 
                `<button class="btn-save" data-user-id="${user.id}">保存</button>
                 <button class="btn-cancel" data-user-id="${user.id}">取消</button>` : 
                `<button class="btn-edit" data-user-id="${user.id}">编辑</button>
                 <button class="btn-auth" data-user-id="${user.id}">授权</button>`
            }
        </td>
    `;
}

    renderPagination() {
        const container = document.getElementById('user-pagination');
        container.innerHTML = '';

        if (this.totalPages <= 1) return;

        const ul = document.createElement('ul');
        ul.className = 'pagination';

        // 上一页
        if (this.currentPage > 1) {
            const prevLi = document.createElement('li');
            prevLi.className = 'page-item';
            prevLi.innerHTML = `<a class="page-link" href="#" data-page="${this.currentPage - 1}">上一页</a>`;
            ul.appendChild(prevLi);
        }

        // 页码
        for (let i = 1; i <= this.totalPages; i++) {
            const li = document.createElement('li');
            li.className = `page-item ${i === this.currentPage ? 'active' : ''}`;
            li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
            ul.appendChild(li);
        }

        // 下一页
        if (this.currentPage < this.totalPages) {
            const nextLi = document.createElement('li');
            nextLi.className = 'page-item';
            nextLi.innerHTML = `<a class="page-link" href="#" data-page="${this.currentPage + 1}">下一页</a>`;
            ul.appendChild(nextLi);
        }

        // 添加分页点击事件
        ul.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = parseInt(e.target.dataset.page);
                if (page && page !== this.currentPage) {
                    this.currentPage = page;
                    this.loadUsers();
                }
            });
        });

        container.appendChild(ul);
    }

    toggleEditMode(userId) {
        this.editingUserId = userId;
        this.renderUsers();
    }

    cancelEditMode(userId) {
        this.editingUserId = null;
        this.renderUsers();
    }

async saveUserChanges(userId) {
  try {
    const token = localStorage.getItem('token');
    
    // 找到用户行
    const userRow = document.querySelector(`tr[data-user-id="${userId}"]`);
    if (!userRow) {
      throw new Error('找不到用户行');
    }

    const inputs = userRow.querySelectorAll('.edit-mode-input, .edit-mode-select');
    const updates = {};

    inputs.forEach(input => {
      const field = input.dataset.field;
      let value = input.value;
      
      // 处理数字字段
      if (['points', 'point2', 'user_rank', 'rankSp', 'banState'].includes(field)) {
        value = parseInt(value) || 0;
      }
      
      // 处理空字符串
      if (value === '') {
        value = null;
      }
      
      // 特殊处理：如果是头像字段且值包含路径，只保留文件名
      if (field === 'avatar' && value && value.includes('/')) {
        value = value.split('/').pop();
      }
      
      updates[field] = value;
    });

    // 添加调试信息
    console.log('发送的用户更新数据:', updates);

    const response = await fetch(`https://api.am-all.com.cn/api/admin/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updates)
    });

    // 添加响应日志
    console.log('响应状态:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('服务器错误响应:', errorText);
      
      let errorMessage = `更新用户信息失败: ${response.status} ${response.statusText}`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) {
          errorMessage += ` - ${errorData.details}`;
        }
      } catch (e) {
        // 如果不是JSON响应，使用原始错误文本
        errorMessage = errorText || errorMessage;
      }
      
      throw new Error(errorMessage);
    }

    const result = await response.json();
    console.log('服务器响应:', result);
    
    if (result.success) {
      showSuccessMessage(result.message || '用户信息更新成功');
      this.editingUserId = null;
      this.loadUsers();
    } else {
      throw new Error(result.error || '更新用户信息失败');
    }
  } catch (error) {
    console.error('保存用户信息失败:', error);
    showErrorMessage('保存用户信息失败: ' + error.message);
  }
}

    createPermissionModal() {
        this.permissionModal = document.createElement('div');
        this.permissionModal.className = 'permission-modal';
        this.permissionModal.innerHTML = `
            <div class="permission-modal-content">
                <div class="permission-modal-header">
                    <h3>用户权限管理</h3>
                    <button class="permission-modal-close">&times;</button>
                </div>
                <div class="permission-modal-body" id="permission-list">
                    <!-- 权限列表将通过JavaScript动态生成 -->
                </div>
                <div class="permission-modal-footer">
                    <button class="btn-cancel" id="permission-cancel">取消</button>
                    <button class="btn-save" id="permission-save">保存</button>
                </div>
            </div>
        `;

        document.body.appendChild(this.permissionModal);

        // 添加关闭事件
        this.permissionModal.querySelector('.permission-modal-close').addEventListener('click', () => {
            this.hidePermissionModal();
        });

        this.permissionModal.querySelector('#permission-cancel').addEventListener('click', () => {
            this.hidePermissionModal();
        });

        this.permissionModal.querySelector('#permission-save').addEventListener('click', () => {
            this.savePermissions();
        });

        // 点击背景关闭
        this.permissionModal.addEventListener('click', (e) => {
            if (e.target === this.permissionModal) {
                this.hidePermissionModal();
            }
        });
    }

async showPermissionModal(userId) {
  try {
    const token = localStorage.getItem('token');
    
    // 获取用户权限
    const response = await fetch(`https://api.am-all.com.cn/api/admin/users/${userId}/permissions`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('获取用户权限失败');
    }

    const permissions = await response.json();
    this.currentPermissions = permissions;
    this.currentEditingUserId = userId;

    // 生成权限列表
    const permissionList = document.getElementById('permission-list');
    permissionList.innerHTML = '';

    // 定义所有可授权的页面（包含用户设置页面）
    const pages = [
      { id: 'home', name: '首页', default: true },
      { id: 'download', name: '下载中心', default: true },
      { id: 'tools', name: '实用工具', default: true },
      { id: 'dllpatcher', name: '补丁工具', default: true },
      { id: 'settings', name: '设置', default: true },
      { id: 'help', name: '帮助', default: true },
      { id: 'fortune', name: '每日签到', default: true },
      { id: 'ccb', name: '游戏查分', default: false },
      { id: 'exchange', name: '兑换', default: true },
      { id: 'user-settings', name: '用户设置', default: true },
      { id: 'announcement-admin', name: '公告管理', default: false },
      { id: 'site-admin', name: '网站管理', default: false },
      { id: 'download-admin', name: '下载管理', default: false },
      { id: 'order-entry', name: '订单录入', default: false },
      { id: 'user-manager', name: '用户管理', default: false }
    ];

    pages.forEach(page => {
      // 检查权限是否已设置，如果没有则使用默认值
      const isAllowed = permissions[page.id] !== undefined ? 
                       permissions[page.id] : page.default;

      const permissionItem = document.createElement('div');
      permissionItem.className = 'permission-item';
      permissionItem.innerHTML = `
        <span class="permission-name">${page.name}</span>
        <label class="permission-switch">
          <input type="checkbox" data-page="${page.id}" ${isAllowed ? 'checked' : ''}>
          <span class="permission-slider"></span>
        </label>
      `;
      
      // 阻止复选框点击事件冒泡
      const checkbox = permissionItem.querySelector('input[type="checkbox"]');
      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      permissionList.appendChild(permissionItem);
    });

    // 显示模态框
    this.permissionModal.classList.add('show');
    document.body.style.overflow = 'hidden';

  } catch (error) {
    console.error('显示权限模态框失败:', error);
    showErrorMessage('加载用户权限失败: ' + error.message);
  }
}

async savePermissions() {
  try {
    const token = localStorage.getItem('token');
    const checkboxes = this.permissionModal.querySelectorAll('input[type="checkbox"]');
    const permissions = {};

    checkboxes.forEach(checkbox => {
      permissions[checkbox.dataset.page] = checkbox.checked;
    });

    console.log('保存权限:', permissions);

    const response = await fetch(`https://api.am-all.com.cn/api/admin/users/${this.currentEditingUserId}/permissions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(permissions)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('权限保存失败:', errorText);
      throw new Error('保存用户权限失败');
    }

    const result = await response.json();
    
    if (result.success) {
      showSuccessMessage('用户权限更新成功');
      this.hidePermissionModal();
    } else {
      throw new Error(result.error || '保存用户权限失败');
    }
  } catch (error) {
    console.error('保存用户权限失败:', error);
    showErrorMessage('保存用户权限失败: ' + error.message);
  }
}

    hidePermissionModal() {
        this.permissionModal.classList.remove('show');
        document.body.style.overflow = '';
        this.currentEditingUserId = null;
        this.currentPermissions = {};
    }

    async savePermissions() {
        try {
            const token = localStorage.getItem('token');
            const checkboxes = this.permissionModal.querySelectorAll('input[type="checkbox"]');
            const permissions = {};

            checkboxes.forEach(checkbox => {
                permissions[checkbox.dataset.page] = checkbox.checked;
            });

            const response = await fetch(`https://api.am-all.com.cn/api/admin/users/${this.currentEditingUserId}/permissions`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(permissions)
            });

            if (!response.ok) {
                throw new Error('保存用户权限失败');
            }

            const result = await response.json();
            
            if (result.success) {
                showSuccessMessage('用户权限更新成功');
                this.hidePermissionModal();
            } else {
                throw new Error(result.error || '保存用户权限失败');
            }
        } catch (error) {
            console.error('保存用户权限失败:', error);
            showErrorMessage('保存用户权限失败: ' + error.message);
        }
    }
}

// 初始化用户管理系统
let userManager = null;

// 导出到全局作用域
window.initUserManager = function() {
    userManager = new UserManager();
    userManager.init();
};