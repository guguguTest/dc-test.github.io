// 积分商城主模块
(function() {
  'use strict';
  
  let currentShopType = 'points';
  let currentUser = null;
  let shippingAddress = null;
  
  // 初始化积分商城
  window.initPointShop = async function() {
    try {
      // 获取当前用户信息
      currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
      
      // 检查收货地址
      const addressRes = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address');
      
      if (addressRes.success && addressRes.address) {
        shippingAddress = addressRes.address;
        renderShopSelection();
      } else {
        renderShippingForm();
      }
    } catch (error) {
      console.error('初始化积分商城失败:', error);
      showErrorMessage('加载失败，请刷新重试');
    }
  };
  
  // 渲染收货信息表单
  function renderShippingForm() {
    const content = document.getElementById('content-container');
    content.innerHTML = `
      <div class="section">
        <h1 class="page-title">绑定收货信息</h1>
        <div class="shipping-form-container">
          <div class="form-card">
            <p class="form-hint">首次使用积分商城需要绑定收货信息</p>
            <form id="shipping-form">
              <div class="form-group">
                <label for="taobao-id">淘宝ID <span class="required">*</span></label>
                <input type="text" id="taobao-id" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="receiver-name">收件人 <span class="required">*</span></label>
                <input type="text" id="receiver-name" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="shipping-address">收货地址 <span class="required">*</span></label>
                <textarea id="shipping-address" class="form-control" rows="3" required></textarea>
              </div>
              <div class="form-group">
                <label for="contact-phone">联系电话 <span class="required">*</span></label>
                <input type="tel" id="contact-phone" class="form-control" required>
              </div>
              <div class="form-actions">
                <button type="submit" class="btn btn-primary">
                  <i class="fas fa-check"></i> 绑定信息
                </button>
                <button type="button" class="btn btn-secondary" onclick="loadPage('home')">
                  <i class="fas fa-times"></i> 取消
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    document.getElementById('shipping-form').addEventListener('submit', handleShippingSubmit);
  }
  
  // 处理收货信息提交
  async function handleShippingSubmit(e) {
    e.preventDefault();
    
    const data = {
      taobao_id: document.getElementById('taobao-id').value,
      receiver_name: document.getElementById('receiver-name').value,
      shipping_address: document.getElementById('shipping-address').value,
      contact_phone: document.getElementById('contact-phone').value
    };
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      
      if (res.success) {
        shippingAddress = data;
        showSuccessMessage('收货信息绑定成功');
        renderShopSelection();
      }
    } catch (error) {
      showErrorMessage('绑定失败：' + error.message);
    }
  }
  
  // 渲染商店选择页面
  function renderShopSelection() {
    const content = document.getElementById('content-container');
    content.innerHTML = `
      <div class="section">
        <h1 class="page-title">积分商城</h1>
        <div class="shop-selection-container">
          <div class="shop-cards">
            <div class="shop-card" onclick="openPointShop('points')">
              <div class="shop-card-icon">
                <i class="fas fa-coins"></i>
              </div>
              <h3>普通积分商店</h3>
              <p>使用普通积分兑换商品</p>
              <div class="shop-card-points">
                当前积分：<span class="points-value">${currentUser.points || 0}</span>
              </div>
            </div>
            
            <div class="shop-card" onclick="openPointShop('point2')">
              <div class="shop-card-icon">
                <i class="fas fa-dove"></i>
              </div>
              <h3>鸽屋积分商店</h3>
              <p>使用鸽屋积分兑换商品</p>
              <div class="shop-card-points">
                当前积分：<span class="points-value">${currentUser.point2 || 0}</span>
              </div>
            </div>
            
            <div class="shop-card disabled">
              <div class="shop-card-icon">
                <i class="fas fa-star"></i>
              </div>
              <h3>CREDIT商店</h3>
              <p>敬请期待</p>
              <div class="shop-card-coming">
                <i class="fas fa-clock"></i> 未开放
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  // 打开积分商店
  window.openPointShop = async function(shopType) {
    currentShopType = shopType;
    renderShopPage(shopType);
  };
  
  // 渲染商店页面
async function renderShopPage(shopType) {
  const content = document.getElementById('content-container');
  const shopName = shopType === 'points' ? '普通积分商店' : '鸽屋积分商店';
  const pointsName = shopType === 'points' ? '普通积分' : '鸽屋积分';
  const userPoints = shopType === 'points' ? currentUser.points : currentUser.point2;
  
  content.innerHTML = `
    <div class="section">
      <div class="shop-header">
        <button class="btn-back" onclick="initPointShop()">
          <i class="fas fa-arrow-left"></i> 返回
        </button>
        <h1 class="page-title">${shopName}</h1>
        <div class="shop-header-right">
          <button class="btn btn-info" onclick="showMyOrders('${shopType}')">
            <i class="fas fa-history"></i> 兑换记录
          </button>
          <div class="user-points">
            <i class="fas fa-coins"></i> ${pointsName}：<span id="current-points">${userPoints || 0}</span>
          </div>
        </div>
      </div>
      
      <div class="shop-filters">
        <div class="search-bar">
          <input type="text" id="search-input" placeholder="搜索商品名称">
          <button onclick="searchItems()"><i class="fas fa-search"></i></button>
        </div>
        <div class="price-filter">
          <input type="number" id="min-price" placeholder="最低价">
          <span>~</span>
          <input type="number" id="max-price" placeholder="最高价">
          <button onclick="searchItems()">筛选</button>
        </div>
      </div>
      
      <div class="shop-items" id="shop-items">
        <div class="loading">
          <i class="fas fa-spinner fa-spin"></i> 加载中...
        </div>
      </div>
    </div>
  `;
  
  loadShopItems(shopType);
}

// ========== 新增显示用户兑换记录函数 ==========
window.showMyOrders = async function(shopType) {
  const content = document.getElementById('content-container');
  const shopName = shopType === 'points' ? '普通积分商店' : '鸽屋积分商店';
  
  content.innerHTML = `
    <div class="section">
      <div class="shop-header">
        <button class="btn-back" onclick="openPointShop('${shopType}')">
          <i class="fas fa-arrow-left"></i> 返回商店
        </button>
        <h1 class="page-title">${shopName} - 我的兑换记录</h1>
      </div>
      
      <div class="orders-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>商品名称</th>
              <th>类型</th>
              <th>消耗积分</th>
              <th>兑换码</th>
              <th>状态</th>
              <th>兑换时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody id="orders-tbody">
            <tr>
              <td colspan="8" class="loading-cell">
                <i class="fas fa-spinner fa-spin"></i> 加载中...
              </td>
            </tr>
          </tbody>
        </table>
        <div id="orders-pagination"></div>
      </div>
    </div>
  `;
  
  loadUserOrders(shopType, 1);
};

// ========== 加载用户兑换记录 ==========
async function loadUserOrders(shopType, page = 1) {
  try {
    const res = await secureFetch(`https://api.am-all.com.cn/api/shop/orders/my?shop_type=${shopType}&page=${page}`);
    
    if (res.success) {
      renderUserOrders(res.orders, res.pagination, shopType);
    }
  } catch (error) {
    showErrorMessage('加载兑换记录失败');
  }
}

// ========== 渲染用户兑换记录 ==========
function renderUserOrders(orders, pagination, shopType) {
  const tbody = document.getElementById('orders-tbody');
  
  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-cell">暂无兑换记录</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = orders.map(order => {
    const typeText = {
      'virtual': '虚拟物品',
      'upgrade': '用户组升级',
      'physical': '实体商品'
    }[order.item_type] || '未知';
    
    const statusText = order.order_status === 'completed' ? '已完成' : '处理中';
    
    return `
      <tr>
        <td class="order-number">${order.order_number}</td>
        <td>${order.item_name}</td>
        <td>${typeText}</td>
        <td>${order.price}</td>
        <td>
          ${order.redemption_code ? 
            `<span class="redemption-code">${order.redemption_code}</span>
             <button class="btn-small btn-copy" onclick="copyRedemptionCode('${order.redemption_code}')">
               <i class="fas fa-copy"></i>
             </button>` : 
            '-'}
        </td>
        <td><span class="status-badge ${order.order_status}">${statusText}</span></td>
        <td>${new Date(order.created_at).toLocaleString()}</td>
        <td>
          <button class="btn-small btn-info" onclick="showOrderDetail('${order.order_number}')">
            <i class="fas fa-eye"></i> 详情
          </button>
        </td>
      </tr>
    `;
  }).join('');
  
  // 渲染分页
  renderPagination('orders-pagination', pagination, (page) => loadUserOrders(shopType, page));
}

// ========== 复制兑换码 ==========
window.copyRedemptionCode = function(code) {
  const textarea = document.createElement('textarea');
  textarea.value = code;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  showSuccessMessage('兑换码已复制到剪贴板');
};

// ========== 显示订单详情 ==========
window.showOrderDetail = function(orderNumber) {
  // 这里可以实现显示订单详情的弹窗
  showInfoMessage('订单号：' + orderNumber);
};


  // 加载商品列表
  async function loadShopItems(shopType, search = '', minPrice = '', maxPrice = '') {
    try {
      const params = new URLSearchParams({
        shop_type: shopType,
        search: search,
        min_price: minPrice,
        max_price: maxPrice
      });
      
      const res = await secureFetch(`https://api.am-all.com.cn/api/shop/items?${params}`);
      
      if (res.success) {
        renderItems(res.items);
      }
    } catch (error) {
      showErrorMessage('加载商品失败');
    }
  }
  
  // 渲染商品列表
  function renderItems(items) {
    const container = document.getElementById('shop-items');
    
    if (items.length === 0) {
      container.innerHTML = '<div class="no-items">暂无商品</div>';
      return;
    }
    
    container.innerHTML = items.map(item => `
      <div class="shop-item ${item.stock === 0 ? 'sold-out' : ''}" onclick="showItemDetail(${item.id})">
        ${item.stock === 0 ? '<div class="sold-out-badge">售罄</div>' : ''}
        <div class="item-image">
          <img src="${item.item_image ? BASE_URL + item.item_image : '/images/default-item.png'}" alt="${item.item_name}">
        </div>
        <div class="item-name">${item.item_name}</div>
        <div class="item-price">${item.price} ${currentShopType === 'points' ? '积分' : '鸽屋积分'}</div>
        <div class="item-stock">库存: ${item.stock > 0 ? item.stock : '等待补货'}</div>
      </div>
    `).join('');
  }
  
  // 搜索商品
  window.searchItems = function() {
    const search = document.getElementById('search-input').value;
    const minPrice = document.getElementById('min-price').value;
    const maxPrice = document.getElementById('max-price').value;
    
    loadShopItems(currentShopType, search, minPrice, maxPrice);
  };
  
  // 显示商品详情
  window.showItemDetail = async function(itemId) {
    try {
      const params = new URLSearchParams({ shop_type: currentShopType });
      const res = await secureFetch(`https://api.am-all.com.cn/api/shop/items?${params}`);
      
      const item = res.items.find(i => i.id === itemId);
      if (!item) return;
      
      const modal = document.createElement('div');
      modal.className = 'modal show';
      modal.innerHTML = `
        <div class="modal-content shop-detail-modal">
          <div class="modal-header">
            <h3>${item.item_name}</h3>
            <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
          </div>
          <div class="modal-body">
            <div class="detail-image">
              <img src="${item.item_image ? BASE_URL + item.item_image : '/images/default-item.png'}" alt="${item.item_name}">
            </div>
            <div class="detail-info">
              <div class="detail-desc">${item.item_description || '暂无介绍'}</div>
              <div class="detail-price">价格：${item.price} ${currentShopType === 'points' ? '积分' : '鸽屋积分'}</div>
              <div class="detail-stock">库存：${item.stock}</div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" onclick="redeemItem(${item.id})" ${item.stock === 0 ? 'disabled' : ''}>
              <i class="fas fa-shopping-cart"></i> 兑换
            </button>
            <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
              <i class="fas fa-times"></i> 取消
            </button>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
    } catch (error) {
      showErrorMessage('加载商品详情失败');
    }
  };
  
  // 兑换商品
  window.redeemItem = async function(itemId) {
    if (!confirm('确定要兑换此商品吗？')) return;
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/shop/redeem', {
        method: 'POST',
        body: JSON.stringify({ item_id: itemId })
      });
      
      if (res.success) {
        showSuccessMessage('兑换成功！');
        
        // 更新用户积分显示
        const token = localStorage.getItem('token');
        const userRes = await secureFetch('https://api.am-all.com.cn/api/user', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (userRes) {
          currentUser = userRes;
          localStorage.setItem('userInfo', JSON.stringify(userRes));
          document.getElementById('current-points').textContent = 
            currentShopType === 'points' ? userRes.points : userRes.point2;
        }
        
        // 关闭详情弹窗
        document.querySelector('.modal').remove();
        
        // 刷新商品列表
        loadShopItems(currentShopType);
        
        // 显示兑换码（如果有）
        if (res.redemption_code) {
          alert(`兑换码：${res.redemption_code}\n请妥善保管！`);
        }
      }
    } catch (error) {
      showErrorMessage('兑换失败：' + error.message);
    }
  };
  
  // 商品管理页面
window.initShopAdmin = async function(shopType) {
  const content = document.getElementById('content-container');
  const isPointShop = shopType === 'points';
  const pageTitle = isPointShop ? '积分商品管理' : '鸽屋积分商品管理';
  
  content.innerHTML = `
    <div class="section">
      <h1 class="page-title">${pageTitle}</h1>
      <div class="admin-toolbar">
        <button class="btn btn-primary" onclick="showAddItemModal('${shopType}')">
          <i class="fas fa-plus"></i> 新建商品
        </button>
        <button class="btn btn-info" onclick="showAdminOrders('${shopType}')">
          <i class="fas fa-history"></i> 兑换记录
        </button>
        <button class="btn btn-secondary" onclick="selectAllItems()">
          <i class="fas fa-check-square"></i> 全选
        </button>
        <button class="btn btn-secondary" onclick="unselectAllItems()">
          <i class="fas fa-square"></i> 取消全选
        </button>
        <button class="btn btn-danger" onclick="deleteSelectedItems()">
          <i class="fas fa-trash"></i> 删除选中
        </button>
      </div>
      
      <div class="admin-table-container">
        <table class="admin-table">
          <thead>
            <tr>
              <th width="40"><input type="checkbox" id="select-all-checkbox"></th>
              <th width="60">图片</th>
              <th>商品名</th>
              <th>介绍</th>
              <th width="100">价格</th>
              <th width="80">库存</th>
              <th width="80">限购</th>
              ${isPointShop ? '<th width="100">类型</th>' : ''}
              <th width="120">操作</th>
            </tr>
          </thead>
          <tbody id="items-tbody">
            <tr>
              <td colspan="${isPointShop ? 9 : 8}" class="loading-cell">
                <i class="fas fa-spinner fa-spin"></i> 加载中...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  
  loadAdminItems(shopType);
  
  document.getElementById('select-all-checkbox').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    checkboxes.forEach(cb => cb.checked = this.checked);
  });
};
  
  // 加载管理商品列表
  async function loadAdminItems(shopType) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items?shop_type=${shopType}`);
      
      if (res.success) {
        renderAdminItems(res.items, shopType);
      }
    } catch (error) {
      showErrorMessage('加载商品列表失败');
    }
  }
  
  // 渲染管理商品列表
function renderAdminItems(items, shopType) {
  const tbody = document.getElementById('items-tbody');
  const isPointShop = shopType === 'points';
  
  if (items.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="${isPointShop ? 9 : 8}" class="empty-cell">暂无商品</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = items.map(item => {
    const typeText = {
      'virtual': '虚拟物品',
      'upgrade': '用户组升级',
      'physical': '实体商品'
    }[item.item_type] || '实体商品';
    
    const limitText = item.max_per_user ? `${item.max_per_user}次` : '不限';
    
    return `
      <tr data-item-id="${item.id}">
        <td><input type="checkbox" class="item-checkbox" value="${item.id}"></td>
        <td>
          <img src="${item.item_image ? BASE_URL + item.item_image : '/images/default-item.png'}" 
               class="admin-item-thumb" alt="${item.item_name}">
        </td>
        <td>${item.item_name}</td>
        <td class="desc-cell">${item.item_description || '-'}</td>
        <td>${item.price}</td>
        <td>${item.stock}</td>
        <td>${limitText}</td>
        ${isPointShop ? `<td>${typeText}</td>` : ''}
        <td>
          <button class="btn-small btn-edit" onclick="editItem(${item.id}, '${shopType}')">
            <i class="fas fa-edit"></i> 编辑
          </button>
          <button class="btn-small btn-delete" onclick="deleteItem(${item.id}, '${shopType}')">
            <i class="fas fa-trash"></i> 删除
          </button>
        </td>
      </tr>
    `;
  }).join('');
}
  
  // 显示添加商品弹窗
  window.showAddItemModal = function(shopType) {
    showItemModal(null, shopType);
  };
  
  // 编辑商品
  window.editItem = async function(itemId, shopType) {
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items?shop_type=${shopType}`);
      const item = res.items.find(i => i.id === itemId);
      if (item) {
        showItemModal(item, shopType);
      }
    } catch (error) {
      showErrorMessage('加载商品信息失败');
    }
  };
  
  // 显示商品编辑弹窗
function showItemModal(item, shopType) {
  const isEdit = !!item;
  const isPointShop = shopType === 'points';
  
  const modal = document.createElement('div');
  modal.className = 'modal show';
  modal.innerHTML = `
    <div class="modal-content item-modal">
      <div class="modal-header">
        <h3>${isEdit ? '编辑商品' : '新建商品'}</h3>
        <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
      </div>
      <form id="item-form" class="modal-body">
        <div class="form-group">
          <label>商品名 <span class="required">*</span></label>
          <input type="text" name="item_name" value="${item?.item_name || ''}" required>
        </div>
        
        <div class="form-group">
          <label>商品介绍</label>
          <textarea name="item_description" rows="3">${item?.item_description || ''}</textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>价格 <span class="required">*</span></label>
            <input type="number" name="price" value="${item?.price || ''}" min="1" required>
          </div>
          
          <div class="form-group">
            <label>库存 <span class="required">*</span></label>
            <input type="number" name="stock" value="${item?.stock || 0}" min="0" required>
          </div>
        </div>
        
        <div class="form-group limit-setting">
          <label>
            <input type="checkbox" id="enable-limit" ${item?.max_per_user ? 'checked' : ''} 
                   onchange="toggleLimitInput()">
            启用限购
          </label>
          <input type="number" name="max_per_user" id="max-per-user" 
                 value="${item?.max_per_user || 1}" min="1" 
                 style="display: ${item?.max_per_user ? 'inline-block' : 'none'};"
                 placeholder="每人限购次数">
        </div>
        
        ${isPointShop ? `
          <div class="form-group">
            <label>物品类型</label>
            <select name="item_type" onchange="onItemTypeChange(this.value)">
              <option value="physical" ${item?.item_type === 'physical' ? 'selected' : ''}>实体商品</option>
              <option value="virtual" ${item?.item_type === 'virtual' ? 'selected' : ''}>虚拟物品</option>
              <option value="upgrade" ${item?.item_type === 'upgrade' ? 'selected' : ''}>用户组升级</option>
            </select>
          </div>
          
          <div class="form-group" id="upgrade-rank-group" style="display: ${item?.item_type === 'upgrade' ? 'block' : 'none'}">
            <label>升级到用户组</label>
            <select name="upgrade_rank">
              <option value="1" ${item?.upgrade_rank === 1 ? 'selected' : ''}>初级用户</option>
              <option value="2" ${item?.upgrade_rank === 2 ? 'selected' : ''}>中级用户</option>
              <option value="3" ${item?.upgrade_rank === 3 ? 'selected' : ''}>高级用户</option>
              <option value="4" ${item?.upgrade_rank === 4 ? 'selected' : ''}>贵宾用户</option>
              <option value="5" ${item?.upgrade_rank === 5 ? 'selected' : ''}>管理员</option>
            </select>
          </div>
        ` : ''}
        
        <div class="form-group">
          <label>商品图片</label>
          <div class="image-upload-area">
            <input type="file" id="item-image-file" accept="image/*" onchange="previewImage(this)">
            <input type="hidden" name="item_image" value="${item?.item_image || ''}">
            <div id="image-preview" ${item?.item_image ? '' : 'style="display:none"'}>
              <img src="${item?.item_image ? BASE_URL + item.item_image : ''}" alt="">
            </div>
          </div>
        </div>
      </form>
      <div class="modal-footer">
        <button class="btn btn-primary" onclick="saveItem(${item?.id || 'null'}, '${shopType}')">
          <i class="fas fa-save"></i> 保存
        </button>
        <button class="btn btn-secondary" onclick="this.closest('.modal').remove()">
          <i class="fas fa-times"></i> 取消
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
}

// ========== 切换限购输入框显示 ==========
window.toggleLimitInput = function() {
  const checkbox = document.getElementById('enable-limit');
  const input = document.getElementById('max-per-user');
  input.style.display = checkbox.checked ? 'inline-block' : 'none';
  if (!checkbox.checked) {
    input.value = '';
  }
};
  
  // 物品类型变化
  window.onItemTypeChange = function(type) {
    const upgradeGroup = document.getElementById('upgrade-rank-group');
    if (upgradeGroup) {
      upgradeGroup.style.display = type === 'upgrade' ? 'block' : 'none';
    }
  };
  
  // 预览图片
  window.previewImage = async function(input) {
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // 上传图片
      const formData = new FormData();
      formData.append('image', file);
      
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('https://api.am-all.com.cn/api/admin/shop/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        const data = await res.json();
        if (data.success) {
          document.querySelector('input[name="item_image"]').value = data.url;
          
          const preview = document.getElementById('image-preview');
          preview.style.display = 'block';
          preview.querySelector('img').src = BASE_URL + data.url;
        }
      } catch (error) {
        showErrorMessage('图片上传失败');
      }
    }
  };
  
  // 保存商品
window.saveItem = async function(itemId, shopType) {
  const form = document.getElementById('item-form');
  const formData = new FormData(form);
  
  const enableLimit = document.getElementById('enable-limit').checked;
  const maxPerUser = enableLimit ? parseInt(formData.get('max_per_user')) : null;
  
  const data = {
    item_name: formData.get('item_name'),
    item_description: formData.get('item_description'),
    price: parseInt(formData.get('price')),
    stock: parseInt(formData.get('stock')),
    item_image: formData.get('item_image'),
    shop_type: shopType,
    max_per_user: maxPerUser,
    item_type: 'physical',
    is_active: true
  };
  
  if (shopType === 'points') {
    data.item_type = formData.get('item_type') || 'physical';
    if (data.item_type === 'upgrade') {
      data.upgrade_rank = parseInt(formData.get('upgrade_rank')) || null;
    }
  }
  
  try {
    const url = itemId ? 
      `https://api.am-all.com.cn/api/admin/shop/items/${itemId}` :
      'https://api.am-all.com.cn/api/admin/shop/items';
    
    const method = itemId ? 'PUT' : 'POST';
    
    const res = await secureFetch(url, {
      method: method,
      body: JSON.stringify(data)
    });
    
    if (res.success) {
      showSuccessMessage(itemId ? '更新成功' : '添加成功');
      document.querySelector('.modal').remove();
      loadAdminItems(shopType);
    }
  } catch (error) {
    showErrorMessage('保存失败：' + error.message);
  }
};

// ========== 显示管理员兑换记录 ==========
window.showAdminOrders = async function(shopType) {
  const content = document.getElementById('content-container');
  const shopName = shopType === 'points' ? '普通积分商店' : '鸽屋积分商店';
  
  content.innerHTML = `
    <div class="section">
      <div class="shop-header">
        <button class="btn-back" onclick="initShopAdmin('${shopType}')">
          <i class="fas fa-arrow-left"></i> 返回管理
        </button>
        <h1 class="page-title">${shopName} - 所有兑换记录</h1>
      </div>
      
      <div class="admin-search-bar">
        <input type="text" id="order-search" placeholder="搜索订单号、用户名或商品名">
        <button class="btn btn-primary" onclick="searchAdminOrders('${shopType}')">
          <i class="fas fa-search"></i> 搜索
        </button>
      </div>
      
      <div class="orders-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>用户</th>
              <th>商品名称</th>
              <th>类型</th>
              <th>消耗积分</th>
              <th>兑换码</th>
              <th>收货信息</th>
              <th>状态</th>
              <th>兑换时间</th>
            </tr>
          </thead>
          <tbody id="admin-orders-tbody">
            <tr>
              <td colspan="9" class="loading-cell">
                <i class="fas fa-spinner fa-spin"></i> 加载中...
              </td>
            </tr>
          </tbody>
        </table>
        <div id="admin-orders-pagination"></div>
      </div>
    </div>
  `;
  
  loadAdminOrders(shopType, 1);
};

// ========== 加载管理员兑换记录 ==========
async function loadAdminOrders(shopType, page = 1, search = '') {
  try {
    const params = new URLSearchParams({
      shop_type: shopType,
      page: page
    });
    
    if (search) {
      params.append('search', search);
    }
    
    const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/orders?${params}`);
    
    if (res.success) {
      renderAdminOrders(res.orders, res.pagination, shopType);
    }
  } catch (error) {
    showErrorMessage('加载兑换记录失败');
  }
}

// ========== 渲染管理员兑换记录 ==========
function renderAdminOrders(orders, pagination, shopType) {
  const tbody = document.getElementById('admin-orders-tbody');
  
  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" class="empty-cell">暂无兑换记录</td>
      </tr>
    `;
    return;
  }
  
  tbody.innerHTML = orders.map(order => {
    const typeText = {
      'virtual': '虚拟物品',
      'upgrade': '用户组升级',
      'physical': '实体商品'
    }[order.item_type] || '未知';
    
    const statusText = order.order_status === 'completed' ? '已完成' : '处理中';
    
    let shippingInfo = '-';
    if (order.shipping_info) {
      const info = order.shipping_info;
      shippingInfo = `
        <div class="shipping-info-cell">
          <div>淘宝ID: ${info.taobao_id}</div>
          <div>收件人: ${info.receiver_name}</div>
          <div>电话: ${info.contact_phone}</div>
        </div>
      `;
    }
    
    return `
      <tr>
        <td class="order-number">${order.order_number}</td>
        <td>${order.nickname || order.username} (UID:${order.uid})</td>
        <td>${order.item_name}</td>
        <td>${typeText}</td>
        <td>${order.price}</td>
        <td>${order.redemption_code || '-'}</td>
        <td>${shippingInfo}</td>
        <td><span class="status-badge ${order.order_status}">${statusText}</span></td>
        <td>${new Date(order.created_at).toLocaleString()}</td>
      </tr>
    `;
  }).join('');
  
  // 渲染分页
  renderPagination('admin-orders-pagination', pagination, (page) => {
    const search = document.getElementById('order-search')?.value || '';
    loadAdminOrders(shopType, page, search);
  });
}

// ========== 搜索管理员兑换记录 ==========
window.searchAdminOrders = function(shopType) {
  const search = document.getElementById('order-search').value;
  loadAdminOrders(shopType, 1, search);
};

// ========== 分页渲染函数 ==========
function renderPagination(containerId, pagination, onPageChange) {
  const container = document.getElementById(containerId);
  if (!container) return;
  
  const { currentPage, totalPages } = pagination;
  
  if (totalPages <= 1) {
    container.innerHTML = '';
    return;
  }
  
  let html = '<div class="pagination">';
  
  // 上一页
  if (currentPage > 1) {
    html += `<button onclick="(${onPageChange})(${currentPage - 1})">上一页</button>`;
  }
  
  // 页码
  for (let i = 1; i <= totalPages; i++) {
    if (i === currentPage) {
      html += `<span class="current-page">${i}</span>`;
    } else if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 2) {
      html += `<button onclick="(${onPageChange})(${i})">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span>...</span>`;
    }
  }
  
  // 下一页
  if (currentPage < totalPages) {
    html += `<button onclick="(${onPageChange})(${currentPage + 1})">下一页</button>`;
  }
  
  html += '</div>';
  container.innerHTML = html;
}
  
  // 删除商品
  window.deleteItem = async function(itemId, shopType) {
    if (!confirm('确定要删除此商品吗？')) return;
    
    try {
      const res = await secureFetch(`https://api.am-all.com.cn/api/admin/shop/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (res.success) {
        showSuccessMessage('删除成功');
        loadAdminItems(shopType);
      }
    } catch (error) {
      showErrorMessage('删除失败');
    }
  };
  
  // 全选
  window.selectAllItems = function() {
    document.getElementById('select-all-checkbox').checked = true;
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = true);
  };
  
  // 取消全选
  window.unselectAllItems = function() {
    document.getElementById('select-all-checkbox').checked = false;
    document.querySelectorAll('.item-checkbox').forEach(cb => cb.checked = false);
  };
  
  // 删除选中
  window.deleteSelectedItems = async function() {
    const checkboxes = document.querySelectorAll('.item-checkbox:checked');
    const ids = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (ids.length === 0) {
      showErrorMessage('请选择要删除的商品');
      return;
    }
    
    if (!confirm(`确定要删除选中的 ${ids.length} 个商品吗？`)) return;
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/admin/shop/items/batch-delete', {
        method: 'POST',
        body: JSON.stringify({ ids })
      });
      
      if (res.success) {
        showSuccessMessage('批量删除成功');
        const shopType = window.location.hash.includes('point2') ? 'point2' : 'points';
        loadAdminItems(shopType);
      }
    } catch (error) {
      showErrorMessage('删除失败');
    }
  };
  
  // 用户设置页面的收货信息管理
  window.initShippingSettings = async function() {
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address');
      
      const container = document.getElementById('shipping-settings-content');
      if (!container) return;
      
      if (res.success && res.address) {
        container.innerHTML = `
          <div class="shipping-info">
            <div class="info-row">
              <span class="label">淘宝ID：</span>
              <span>${res.address.taobao_id}</span>
            </div>
            <div class="info-row">
              <span class="label">收件人：</span>
              <span>${res.address.receiver_name}</span>
            </div>
            <div class="info-row">
              <span class="label">收货地址：</span>
              <span>${res.address.shipping_address}</span>
            </div>
            <div class="info-row">
              <span class="label">联系电话：</span>
              <span>${res.address.contact_phone}</span>
            </div>
            <button class="btn btn-danger" onclick="unbindShipping()">
              <i class="fas fa-unlink"></i> 解绑
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <p class="no-shipping">未绑定收货信息</p>
          <button class="btn btn-primary" onclick="loadPage('point-shop')">
            <i class="fas fa-link"></i> 去绑定
          </button>
        `;
      }
    } catch (error) {
      console.error('加载收货信息失败:', error);
    }
  };
  
  // 解绑收货信息
  window.unbindShipping = async function() {
    if (!confirm('确定要解绑收货信息吗？解绑后需要重新绑定才能使用积分商城。')) return;
    
    try {
      const res = await secureFetch('https://api.am-all.com.cn/api/shop/shipping-address', {
        method: 'DELETE'
      });
      
      if (res.success) {
        showSuccessMessage('解绑成功');
        initShippingSettings();
      }
    } catch (error) {
      showErrorMessage('解绑失败');
    }
  };
  
  const BASE_URL = 'https://api.am-all.com.cn';
  
})();