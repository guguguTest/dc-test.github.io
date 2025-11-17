// 补丁工具系统主模块（修复版 - 添加数据验证和错误处理）
(function() {
  'use strict';
  
  const API_BASE = 'https://api.am-all.com.cn';
  
  // 辅助函数：获取完整的图片URL
  function getFullImageUrl(path) {
    if (!path) return 'https://oss.am-all.com.cn/asset/img/main/default-tool.png';
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return API_BASE + path;
  }
  
  // 辅助函数：验证工具数据完整性
  function validateToolData(tool) {
    if (!tool) {
      console.error('工具数据为空');
      return false;
    }
    
    // 检查必需字段
    const requiredFields = ['id', 'tool_name'];
    for (const field of requiredFields) {
      if (!tool[field]) {
        console.error(`工具数据缺少必需字段: ${field}`, tool);
        return false;
      }
    }
    
    return true;
  }
  
  // 辅助函数：验证分类数据完整性
  function validateCategoryData(category) {
    if (!category) {
      console.error('分类数据为空');
      return false;
    }
    
    const requiredFields = ['id', 'name'];
    for (const field of requiredFields) {
      if (!category[field]) {
        console.error(`分类数据缺少必需字段: ${field}`, category);
        return false;
      }
    }
    
    return true;
  }
  
  // 渲染一级页面（工具分类选择）
  window.renderPatcherCategories = async function() {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="patcher-page">
        <div class="patcher-header">
          <h1 class="patcher-page-title">
            <i class="fas fa-plug me-2"></i>
            补丁工具
          </h1>
          <p class="patcher-page-description">选择游戏类型查看可用的补丁工具</p>
        </div>
        
        <div class="patcher-categories-loading">
          <div class="spinner-border text-primary"></div>
          <p>加载中...</p>
        </div>
        
        <div class="patcher-categories-container" style="display: none;"></div>
      </div>
    `;
    
    try {
      const response = await fetch(`${API_BASE}/api/patcher-tools/categories`);
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '加载分类失败');
      }
      
      if (!data.categories || !Array.isArray(data.categories)) {
        throw new Error('服务器返回的数据格式错误');
      }
      
      // 过滤掉无效的分类数据
      const validCategories = data.categories.filter(cat => {
        const isValid = validateCategoryData(cat);
        if (!isValid) {
          console.warn('跳过无效的分类数据:', cat);
        }
        return isValid;
      });
      
      if (validCategories.length === 0) {
        throw new Error('没有有效的分类数据');
      }
      
      renderCategories(validCategories);
    } catch (error) {
      console.error('加载工具分类失败:', error);
      container.querySelector('.patcher-categories-loading').innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>加载失败</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="renderPatcherCategories()">
            <i class="fas fa-sync-alt me-2"></i>
            重试
          </button>
        </div>
      `;
    }
  };
  
  function renderCategories(categories) {
    const container = document.querySelector('.patcher-categories-container');
    const loading = document.querySelector('.patcher-categories-loading');
    
    if (!container) return;
    
    try {
      container.innerHTML = `
        <div class="patcher-categories-grid">
          ${categories.map(cat => {
            // 为每个分类提供默认值
            const icon = cat.icon || 'fas fa-gamepad';
            const name = cat.name || '未命名分类';
            const description = cat.description || '暂无描述';
            
            return `
              <div class="patcher-category-card" data-category="${cat.id}">
                <div class="category-card-icon">
                  <i class="${icon}"></i>
                </div>
                <h3 class="category-card-title">${name}</h3>
                <p class="category-card-description">${description}</p>
                <button class="btn-category-enter">
                  <i class="fas fa-arrow-right me-2"></i>
                  进入
                </button>
              </div>
            `;
          }).join('')}
        </div>
      `;
      
      loading.style.display = 'none';
      container.style.display = 'block';
      
      // 绑定点击事件
      container.querySelectorAll('.patcher-category-card').forEach(card => {
        card.addEventListener('click', function() {
          const category = this.dataset.category;
          if (category) {
            renderPatcherTools(category);
          } else {
            console.error('分类ID缺失');
          }
        });
      });
    } catch (error) {
      console.error('渲染分类失败:', error);
      loading.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>渲染失败</h3>
          <p>显示分类时发生错误，请刷新页面重试</p>
          <button class="btn btn-primary mt-3" onclick="renderPatcherCategories()">
            <i class="fas fa-sync-alt me-2"></i>
            重试
          </button>
        </div>
      `;
    }
  }
  
  // 渲染二级页面（具体工具列表）
  window.renderPatcherTools = async function(category) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    const categoryNames = {
      'chunithm': 'CHUNITHM 补丁工具',
      'bemani': 'BEMANI 补丁工具'
    };
    
    container.innerHTML = `
      <div class="patcher-page">
        <div class="patcher-tools-header">
          <button class="btn-back" onclick="renderPatcherCategories()">
            <i class="fas fa-arrow-left me-2"></i>
            返回
          </button>
          <h1 class="patcher-page-title">
            <i class="fas fa-gamepad me-2"></i>
            ${categoryNames[category] || '补丁工具'}
          </h1>
        </div>
        
        <div class="patcher-tools-loading">
          <div class="spinner-border text-primary"></div>
          <p>加载中...</p>
        </div>
        
        <div class="patcher-tools-container" style="display: none;"></div>
      </div>
    `;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('请先登录');
      }
      
      const response = await fetch(`${API_BASE}/api/patcher-tools/${category}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('登录已过期，请重新登录');
        }
        throw new Error(`加载工具列表失败 (${response.status})`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '加载工具列表失败');
      }
      
      if (!data.tools || !Array.isArray(data.tools)) {
        throw new Error('服务器返回的数据格式错误');
      }
      
      // 过滤掉无效的工具数据
      const validTools = data.tools.filter(tool => {
        const isValid = validateToolData(tool);
        if (!isValid) {
          console.warn('跳过无效的工具数据:', tool);
        }
        return isValid;
      });
      
      console.log(`成功加载 ${validTools.length} 个有效工具`);
      renderTools(validTools, category);
    } catch (error) {
      console.error('加载工具列表失败:', error);
      container.querySelector('.patcher-tools-loading').innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>加载失败</h3>
          <p>${error.message}</p>
          <button class="btn btn-primary mt-3" onclick="renderPatcherTools('${category}')">
            <i class="fas fa-sync-alt me-2"></i>
            重试
          </button>
          <button class="btn btn-secondary mt-3 ms-2" onclick="renderPatcherCategories()">
            <i class="fas fa-arrow-left me-2"></i>
            返回分类选择
          </button>
        </div>
      `;
    }
  };
  
  function renderTools(tools, category) {
    const container = document.querySelector('.patcher-tools-container');
    const loading = document.querySelector('.patcher-tools-loading');
    
    if (!container) return;
    
    try {
      if (tools.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <i class="fas fa-inbox"></i>
            <h3>暂无可用工具</h3>
            <p>该分类下暂时没有可用的补丁工具</p>
            <button class="btn btn-primary mt-3" onclick="renderPatcherCategories()">
              <i class="fas fa-arrow-left me-2"></i>
              返回分类选择
            </button>
          </div>
        `;
      } else {
        container.innerHTML = `
          <div class="patcher-tools-grid">
            ${tools.map(tool => {
              // 为每个工具提供安全的默认值
              const toolId = tool.id;
              const toolName = tool.tool_name || '未命名工具';
              const coverImage = getFullImageUrl(tool.cover_image);
              
              return `
                <div class="patcher-tool-card" data-tool-id="${toolId}" data-tool-name="${toolName}">
                  <div class="tool-card-image">
                    <img src="${coverImage}" 
                         alt="${toolName}"
                         onerror="this.src='https://oss.am-all.com.cn/asset/img/main/default-tool.png'">
                  </div>
                  <div class="tool-card-divider"></div>
                  <div class="tool-card-title">${toolName}</div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        
        // 绑定点击事件
        container.querySelectorAll('.patcher-tool-card').forEach(card => {
          card.addEventListener('click', function() {
            const toolId = this.dataset.toolId;
            const toolName = this.dataset.toolName;
            
            if (!toolId) {
              console.error('工具ID缺失');
              alert('无法打开工具：工具ID缺失');
              return;
            }
            
            console.log(`打开工具: ${toolName} (ID: ${toolId})`);
            renderPatcherToolDetail(toolId, category);
          });
        });
      }
      
      loading.style.display = 'none';
      container.style.display = 'block';
    } catch (error) {
      console.error('渲染工具列表失败:', error);
      loading.innerHTML = `
        <div class="error-state">
          <i class="fas fa-exclamation-triangle"></i>
          <h3>渲染失败</h3>
          <p>显示工具列表时发生错误</p>
          <button class="btn btn-primary mt-3" onclick="renderPatcherTools('${category}')">
            <i class="fas fa-sync-alt me-2"></i>
            重试
          </button>
        </div>
      `;
    }
  }
  
  // 渲染三级页面（具体工具iframe页面）
  async function renderPatcherToolDetail(toolId, category) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    container.innerHTML = `
      <div class="patcher-page">
        <div class="patcher-detail-loading">
          <div class="spinner-border text-primary"></div>
          <p>加载中...</p>
        </div>
      </div>
    `;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('请先登录');
      }
      
      const response = await fetch(`${API_BASE}/api/patcher-tools/tool/${toolId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('登录已过期，请重新登录');
        } else if (response.status === 403) {
          throw new Error('权限不足，无法访问此工具');
        } else if (response.status === 404) {
          throw new Error('工具不存在或已被删除');
        }
        throw new Error(`加载工具失败 (${response.status})`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || '加载工具失败');
      }
      
      if (!data.tool) {
        throw new Error('服务器未返回工具数据');
      }
      
      // 验证工具数据
      if (!validateToolData(data.tool)) {
        throw new Error('工具数据不完整');
      }
      
      if (!data.tool.tool_path) {
        throw new Error('工具路径缺失');
      }
      
      console.log(`成功加载工具: ${data.tool.tool_name}`);
      showToolIframe(data.tool, category);
    } catch (error) {
      console.error('加载工具详情失败:', error);
      container.innerHTML = `
        <div class="patcher-page">
          <div class="error-state">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>加载失败</h3>
            <p>${error.message}</p>
            <button class="btn btn-primary mt-3" onclick="renderPatcherToolDetail(${toolId}, '${category}')">
              <i class="fas fa-sync-alt me-2"></i>
              重试
            </button>
            <button class="btn btn-secondary mt-3 ms-2" onclick="renderPatcherTools('${category}')">
              <i class="fas fa-arrow-left me-2"></i>
              返回工具列表
            </button>
          </div>
        </div>
      `;
    }
  }
  
  function showToolIframe(tool, category) {
    const container = document.getElementById('content-container');
    if (!container) return;
    
    const toolName = tool.tool_name || '补丁工具';
    const toolPath = tool.tool_path;
    
    container.innerHTML = `
      <div class="patcher-page patcher-iframe-page">
        <div class="patcher-iframe-header">
          <button class="btn-back" onclick="renderPatcherTools('${category}')">
            <i class="fas fa-arrow-left me-2"></i>
            返回
          </button>
          <h1 class="patcher-page-title">${toolName}</h1>
        </div>
        
        <div class="patcher-iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载工具...</p>
          </div>
          <iframe 
            src="${toolPath}" 
            frameborder="0"
            class="patcher-iframe"
            onload="this.previousElementSibling.style.display='none'"
            onerror="console.error('iframe加载失败:', '${toolPath}')">
          </iframe>
        </div>
      </div>
    `;
  }
  
  // 全局暴露函数
  window.renderPatcherCategories = renderPatcherCategories;
  window.renderPatcherTools = renderPatcherTools;
  
  // 添加调试信息
  console.log('补丁工具模块已加载');
  
})();
