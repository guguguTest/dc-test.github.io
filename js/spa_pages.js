// 页面内容定义
const pages = {

	// 首页
	home: `
	  <div class="section">
		<h1 class="page-title" id="top-page">首页</h1>
		
		<!-- 公告区域 -->
		<div class="announcements-container" id="announcements-container">
		  <div class="text-center">
			<div class="spinner-border text-primary" role="status">
			  <span class="visually-hidden">加载中...</span>
			</div>
			<p>公告加载中...</p>
		  </div>
		</div>
		
		<!-- footer -->
		<hr>
		<div class="welcome-section mt-5">
		  <h2 class="section-title">
			<i class="fas fa-star"></i>
			<span>MAY THE LEAKER BE WITH YOU!</span>
		  </h2>
		  <p>请从左侧菜单选择功能</p>
		</div>
	  </div>
	`,

// 用户管理界面
'user-manager': `
<div class="section">
  <h1 class="page-title">用户管理</h1>
  <div class="user-manager-container">
    <div class="user-search-section">
      <div class="search-filters">
        <div class="search-input">
          <input type="text" id="user-search-input" placeholder="搜索用户ID、用户名或邮箱...">
          <button id="user-search-btn" class="btn btn-primary">
            <i class="fas fa-search"></i> 搜索
          </button>
        </div>
        <select id="user-rank-filter" class="filter-select">
          <option value="">所有用户组</option>
          <option value="0">普通用户</option>
          <option value="1">初级用户</option>
          <option value="2">中级用户</option>
          <option value="3">高级用户</option>
          <option value="4">贵宾用户</option>
          <option value="5">系统管理员</option>
        </select>
        <select id="user-state-filter" class="filter-select">
          <option value="">所有状态</option>
          <option value="0">正常</option>
          <option value="1">受限</option>
          <option value="2">封禁</option>
        </select>
      </div>
    </div>
    
    <div class="user-table-container">
      <table class="user-table">
        <thead>
          <tr>
            <th>头像</th>
            <th>UID</th>
            <th>用户名</th>
            <th>邮箱</th>
            <th>用户组</th>
            <th>特殊用户组</th>
            <th>积分</th>
            <th>鸽屋积分</th>
            <th>游戏服务器</th>
            <th>Keychip</th>
            <th>GUID</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="users-table-body">
          <!-- 用户数据将通过JavaScript动态填充 -->
        </tbody>
      </table>
      <div id="user-pagination" class="pagination-container"></div>
    </div>
  </div>
</div>
`,

// 下载页面
download: `
  <h1 class="page-title" id="download-heading">下载中心</h1>
  <div class="section">
    <h2 class="section-title">
      <i class="fas fa-gamepad"></i>
      <span id="game-heading">游戏下载</span>
    </h2>
    <div class="warning">
      <strong><i class="fas fa-exclamation-circle me-2"></i> <span id="warning-text">重要提示：</span></strong>
      <span id="warning-detail">OneDrive下载渠道已下线</span>
    </div>
    <p class="mb-4"><strong><span id="latest-update-text">最后更新</span>: <span id="game-last-update"></span></strong></p>
    <div class="table-container" id="game-downloads">
      <!-- 游戏下载内容将通过JavaScript动态填充 -->
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">
      <i class="fas fa-archive"></i>
      <span id="archive-heading">存档下载</span>
    </h2>
    <p class="mb-4"><strong><span id="latest-update-text-archive">最后更新</span>: <span id="archive-last-update"></span></strong></p>
    <div class="table-container" id="archive-downloads">
      <!-- 存档下载内容将通过JavaScript动态填充 -->
    </div>
  </div>
  
  <div class="section">
    <h2 class="section-title">
      <i class="fas fa-folder-plus"></i>
      <span id="other-heading">其他资源</span>
    </h2>
    <p class="mb-4"><strong><span id="latest-update-text-other">最后更新</span>: <span id="other-last-update"></span></strong></p>
    <div class="table-container" id="other-downloads">
      <!-- 其他资源内容将通过JavaScript动态填充 -->
    </div>
    <div class="warning mt-4">
      <strong><i class="fas fa-info-circle me-2"></i> <span id="download-info-text">下载说明：</span></strong>
      <span id="download-info-detail">目前本站全部资源仅提供「百度网盘」作为下载方式</span>
    </div>
  </div>

  <script>
    // 页面加载完成后初始化下载内容
    setTimeout(function() {
      if (typeof initDownloadPage === 'function') {
        initDownloadPage();
      }
    }, 100);
  </script>

  <footer>
    <p>SEGAY FEIWU</p>
    <p>1145141919810</p>
  </footer>
`,

// 通用下载详情页面
'download-detail': `
  <div class="game-detail">
    <h1 class="page-title" id="detail-title">下载详情</h1>
    <button class="back-button" data-page="download">
      <i class="fas fa-arrow-left me-2"></i>
      <span id="back-to-download">返回下载中心</span>
    </button>
    
    <div class="section">
      <h2 class="section-title">
        <i class="fas fa-download"></i>
        <span id="download-list-title">下载列表</span>
      </h2>
      
      <div class="mb-4">
        <p><span id="last-update-label">最后更新</span>: <span id="detail-last-update"></span></p>
        <div class="table-container">
          <table class="table">
            <thead>
              <tr>
                <td id="download-method">下载方式</td>
                <td id="file-count">文件数</td>
                <td id="access-code">提取码/访问密码</td>
                <td id="validity">资源有效期</td>
              </tr>
            </thead>
            <tbody id="detail-download-info">
              <!-- 下载信息将通过JavaScript动态填充 -->
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <footer>
      <p>SEGAY FEIWU</p>
      <p>1145141919810</p>
    </footer>
  </div>
`,

// 下载管理页面
'download-admin': `
  <div class="section">
    <h1 class="page-title">下载管理</h1>
    <button class="back-button" data-page="home">
      <i class="fas fa-arrow-left me-2"></i>
      <span>返回</span>
    </button>
    
    <div class="admin-actions mb-4">
      <button id="create-download-btn" class="btn btn-primary">
        <i class="fas fa-plus me-2"></i>新建下载项目
      </button>
    </div>
    
    <div class="table-responsive">
      <table class="table table-hover" id="downloads-table">
        <thead>
          <tr>
            <th>序号</th>
            <th>标题</th>
            <th>分类</th>
            <th>页面ID</th>
            <th>版本</th>
            <th>文件数</th>
            <th>最后更新</th>
            <th>状态</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody id="downloads-body">
          <!-- 下载项目数据将通过JavaScript动态填充 -->
        </tbody>
      </table>
    </div>
    
    <!-- 下载项目编辑模态框 -->
    <div class="modal" id="download-modal">
      <div class="modal-content">
        <div class="modal-header">
          <h5 id="modal-title">新建下载项目</h5>
          <button type="button" class="close">&times;</button>
        </div>
        <form id="download-form">
          <div class="modal-body">
            <input type="hidden" id="download-id">
            
            <div class="form-row">
              <div class="form-group">
                <label for="download-title">标题 *</label>
                <input type="text" id="download-title" class="form-control" required>
              </div>
              <div class="form-group">
                <label for="download-version">版本</label>
                <input type="text" id="download-version" class="form-control">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="download-category">分类 *</label>
                <select id="download-category" class="form-control" required>
                  <option value="">请选择分类</option>
                  <option value="game">游戏下载</option>
                  <option value="archive">存档下载</option>
                  <option value="other">其他资源</option>
                </select>
              </div>
              <div class="form-group">
                <label for="download-file-count">文件数</label>
                <input type="number" id="download-file-count" class="form-control" min="0">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="download-page-id">页面ID *</label>
                <input type="text" id="download-page-id" class="form-control" required 
                       placeholder="用于生成下载详情页面的唯一标识">
              </div>
              <div class="form-group">
                <label for="download-last-update">最后更新时间</label>
                <input type="date" id="download-last-update" class="form-control">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="download-baidu-url">百度网盘链接</label>
                <input type="url" id="download-baidu-url" class="form-control" 
                       placeholder="https://pan.baidu.com/s/...">
              </div>
              <div class="form-group">
                <label for="download-baidu-code">提取码</label>
                <input type="text" id="download-baidu-code" class="form-control" 
                       placeholder="如: abcd">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="download-access-level">最低访问权限</label>
                <select id="download-access-level" class="form-control">
                  <option value="-1">不限</option>
                  <option value="0">普通用户</option>
                  <option value="1">初级用户</option>
                  <option value="2">中级用户</option>
                  <option value="3">高级用户</option>
                  <option value="4">贵宾用户</option>
                  <option value="5">系统管理员</option>
                </select>
                <small class="form-text text-muted">
                  设置访问此资源所需的最低用户组级别
                </small>
              </div>
              <div class="form-group">
                <label for="download-special-group">特殊用户组验证</label>
                <select id="download-special-group" class="form-control">
                  <option value="">无</option>
                  <option value="maimoller">maimoller</option>
                  <option value="coadmin">协同管理员</option>
                </select>
                <small class="form-text text-muted">
                  额外的特殊用户组验证，与基础权限叠加
                </small>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="download-required-points">所需积分</label>
                <input type="number" id="download-required-points" class="form-control" 
                       min="0" value="0" placeholder="0">
                <small class="form-text text-muted">
                  访问此资源需要消耗的积分数量，0表示免费
                </small>
              </div>
              <div class="form-group">
                <label for="download-status">状态</label>
                <select id="download-status" class="form-control">
                  <option value="1">激活</option>
                  <option value="0">禁用</option>
                </select>
              </div>
            </div>
            
            <div class="form-group">
              <label for="download-image-url">封面图片URL</label>
              <input type="url" id="download-image-url" class="form-control" 
                     placeholder="https://example.com/image.jpg">
              <small class="form-text text-muted">
                可选的封面图片链接
              </small>
            </div>
            
            <div class="form-group">
              <label for="download-description">描述</label>
              <textarea id="download-description" class="form-control" rows="3" 
                        placeholder="资源描述信息"></textarea>
            </div>
          </div>
          
          <div class="modal-footer">
            <button type="button" id="cancel-download-btn" class="btn btn-secondary">取消</button>
            <button type="submit" class="btn btn-primary">保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
`,

  // 公告管理页面
  'announcement-admin': `
    <div class="section">
      <h1 class="page-title">公告管理</h1>
      <button class="back-button" data-page="home">
        <i class="fas fa-arrow-left me-2"></i>
        <span>返回</span>
      </button>
      
      <div class="announcement-admin-container">
        <div class="announcement-admin-actions">
          <button id="create-announcement-btn" class="btn btn-primary">
            <i class="fas fa-plus me-2"></i>新建公告
          </button>
        </div>
        
        <!-- 编辑器放在这里，初始状态为隐藏 -->
        <div class="announcement-editor" id="announcement-editor" style="display: none;">
          <h3 id="editor-title">新建公告</h3>
          <div class="form-group">
            <label for="announcement-title">标题</label>
            <input type="text" id="announcement-title" class="form-control">
          </div>
          <div class="form-group">
            <label for="announcement-type">类型</label>
            <select id="announcement-type" class="form-control">
              <option value="notice">通知</option>
              <option value="important">重要</option>
              <option value="update">更新</option>
              <option value="top">置顶</option>
            </select>
          </div>
          <div class="form-group form-check">
            <input type="checkbox" id="announcement-pinned" class="form-check-input">
            <label for="announcement-pinned" class="form-check-label">置顶公告</label>
          </div>
          <div class="form-group">
            <label>内容</label>
          <div class="editor-toolbar">
            <button type="button" data-command="bold"><i class="fas fa-bold"></i></button>
            <button type="button" data-command="italic"><i class="fas fa-italic"></i></button>
            <button type="button" data-command="underline"><i class="fas fa-underline"></i></button>
            <button type="button" data-command="insertUnorderedList"><i class="fas fa-list-ul"></i></button>
            <button type="button" data-command="insertOrderedList"><i class="fas fa-list-ol"></i></button>
            <button type="button" data-command="createLink"><i class="fas fa-link"></i></button>
            <button type="button" data-command="insertImage"><i class="fas fa-image"></i></button>
          </div>
            <div id="announcement-editor-content" class="editor-content"></div>
          </div>
          <div class="form-group">
            <button id="save-announcement-btn" class="btn btn-primary">保存</button>
            <button id="cancel-announcement-btn" class="btn btn-secondary">取消</button>
          </div>
        </div>
        
        <div id="admin-announcements-list" class="admin-announcements-list">
          <div class="text-center">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">加载中...</span>
            </div>
            <p>公告加载中...</p>
          </div>
        </div>
      </div>
    </div>
  `,


	// 订单录入页面
'order-entry': `
  <div class="order-entry-container">
    <div class="section">
      <h1 class="page-title">
        <i class="fas fa-clipboard-list me-2"></i>
        订单录入管理
      </h1>
      <button class="back-button" data-page="home">
        <i class="fas fa-arrow-left me-2"></i>
        <span>返回首页</span>
      </button>
      
      <!-- 搜索栏 -->
      <div class="order-search-box">
        <div class="input-group">
          <input type="text" 
                 id="order-search-input" 
                 class="form-control" 
                 placeholder="输入淘宝ID、商品名称或订单号搜索...">
          <button class="btn btn-primary" id="order-search-btn">
            <i class="fas fa-search"></i>
            <span>搜索</span>
          </button>
        </div>
      </div>
      
      <!-- 操作按钮 - 只保留添加按钮 -->
      <div class="order-actions">
        <button class="btn btn-success" id="add-order-btn">
          <i class="fas fa-plus-circle"></i>
          <span>添加订单</span>
        </button>
      </div>
      
      <!-- 表格容器 -->
      <div class="table-container">
        <div class="table-responsive">
          <table class="table" id="orders-table">
            <thead>
              <tr>
                <th style="width: 60px;">序号</th>
                <th>淘宝ID</th>
                <th>商品名称</th>
                <th>订单号</th>
                <th style="width: 100px;">价格(元)</th>
                <th style="width: 120px;">兑换状态</th>
                <th style="width: 140px;">操作</th>
              </tr>
            </thead>
            <tbody id="orders-body">
              <!-- 订单数据将通过JavaScript动态填充 -->
            </tbody>
          </table>
        </div>
      </div>
      
      <!-- 分页控件 -->
      <div class="pagination-container">
        <div id="pagination-controls"></div>
      </div>
    </div>
  </div>
  
  <!-- 订单编辑模态框 -->
  <div id="order-modal" class="modal">
    <div class="modal-content">
      <div class="modal-header">
        <h2 id="modal-title">添加订单</h2>
        <span class="close">&times;</span>
      </div>
      <div class="modal-body">
        <form id="order-form">
          <input type="hidden" id="order-id">
          
          <div class="form-group">
            <label for="taobao-id">
              <i class="fas fa-user me-1"></i>
              淘宝ID
            </label>
            <input type="text" 
                   id="taobao-id" 
                   class="form-control" 
                   placeholder="请输入淘宝用户ID" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="product-name">
              <i class="fas fa-box me-1"></i>
              商品名称
            </label>
            <input type="text" 
                   id="product-name" 
                   class="form-control" 
                   placeholder="请输入商品名称" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="order-number">
              <i class="fas fa-hashtag me-1"></i>
              订单号
            </label>
            <input type="text" 
                   id="order-number" 
                   class="form-control" 
                   placeholder="请输入订单号（唯一）" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="price">
              <i class="fas fa-yen-sign me-1"></i>
              价格(元)
            </label>
            <input type="number" 
                   id="price" 
                   class="form-control" 
                   step="0.01" 
                   min="0" 
                   placeholder="0.00" 
                   required>
          </div>
          
          <div class="form-group">
            <label for="redeemed">
              <i class="fas fa-exchange-alt me-1"></i>
              兑换状态
            </label>
            <select id="redeemed" class="form-control">
              <option value="false">未兑换</option>
              <option value="true">已兑换</option>
            </select>
          </div>
          
          <button type="submit" class="btn btn-primary">
            <i class="fas fa-save me-2"></i>
            保存订单
          </button>
        </form>
      </div>
    </div>
  </div>
`,

	// 兑换页面
	'exchange': `
	  <div class="section">
		<h1 class="page-title">兑换码</h1>
		<button class="back-button" data-page="home">
		  <i class="fas fa-arrow-left me-2"></i>
		  <span>返回</span>
		</button>
		
		<div class="exchange-container">
		  <div class="exchange-card">
			<h3><i class="fas fa-ticket-alt me-2"></i>兑换码</h3>
			<p>请输入兑换码进行兑换</p>
			<div class="input-group">
			  <input type="text" class="form-control" id="exchange-code" disabled>
			  <button class="btn btn-secondary" id="redeem-code-btn" disabled>
				<i class="fas fa-gift me-2"></i>兑换
			  </button>
			</div>
			<div class="exchange-hint">
			  <p>兑换码功能尚未开放</p>
			</div>
		  </div>
		  
		  <div class="exchange-divider">
			<span>或</span>
		  </div>
		  
		  <div class="exchange-card">
			<h3><i class="fas fa-coins me-2"></i>鸽屋积分兑换</h3>
			<p>请输入淘宝订单号兑换积分</p>
			<div class="input-group">
			  <input type="text" class="form-control" id="order-number-input">
			  <button class="btn btn-primary" id="redeem-order-btn">
				<i class="fas fa-exchange-alt me-2"></i>兑换
			  </button>
			</div>
			<div class="exchange-result" id="exchange-result"></div>
		  </div>
		</div>
	  </div>
	`,

  // 登录页面
  login: `
    <div class="auth-container">
      <h1 class="page-title">登录</h1>
      <button class="back-button" data-page="home">
        <i class="fas fa-arrow-left me-2"></i>
        <span>返回</span>
      </button>
      <div class="auth-form">
        <div class="form-group">
          <label for="login-username">用户名或邮箱</label>
          <input type="text" id="login-username" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="login-password">密码</label>
          <input type="password" id="login-password" class="form-control" required>
        </div>
        <button id="login-btn" class="auth-btn">登录</button>
        <div class="auth-footer">
          <span>没有账号？<a href="#" data-page="register">立即注册</a></span>
          <span class="forgot-password"><a href="#" data-page="forgot-password">忘记密码？</a></span>
        </div>
        <div id="login-error" class="error-message" style="display: none;"></div>
      </div>
    </div>
  `,

  // 注册页面
	register: `
	  <div class="auth-container">
		<h1 class="page-title">注册</h1>
		<button class="back-button" data-page="home">
		  <i class="fas fa-arrow-left me-2"></i>
		  <span>返回</span>
		</button>
		<div class="auth-form">
		  <div class="form-group">
			<label for="register-username">用户名</label>
			<input type="text" id="register-username" class="form-control" required maxlength="20">
			<div class="char-counter"><span id="username-counter">0</span>/20</div>
		  </div>
		  <div class="form-group">
			<label for="register-email">邮箱</label>
			<input type="email" id="register-email" class="form-control" required>
		  </div>
		  <div class="form-group">
			<label for="register-nickname">昵称</label>
			<input type="text" id="register-nickname" class="form-control" maxlength="20">
			<div class="char-counter"><span id="nickname-counter">0</span>/20</div>
		  </div>
		  <div class="form-group">
			<label for="register-password">密码</label>
			<input type="password" id="register-password" class="form-control" required maxlength="16">
			<div class="char-counter"><span id="password-counter">0</span>/16</div>
		  </div>
		  <div class="form-group">
			<label for="register-confirm-password">确认密码</label>
			<input type="password" id="register-confirm-password" class="form-control" required maxlength="16">
		  </div>
		  <div class="form-group">
			<label for="register-verification-code">验证码</label>
			<div class="verification-code-group">
			  <input type="text" id="register-verification-code" class="form-control" required>
			  <button id="send-verification-code" class="btn btn-outline-secondary">获取验证码</button>
			</div>
		  </div>
		  <button id="register-btn" class="auth-btn">注册</button>
		  <div class="auth-footer">
			<span>已有账号？<a href="#" data-page="login">立即登录</a></span>
		  </div>
		  <div id="register-error" class="error-message" style="display: none;"></div>
		</div>
	  </div>
	`,

  // 忘记密码页面
  'forgot-password': `
    <div class="auth-container">
      <h1 class="page-title">找回密码</h1>
      <button class="back-button" data-page="login">
        <i class="fas fa-arrow-left me-2"></i>
        <span>返回登录</span>
      </button>
      <div class="auth-form">
        <div class="form-group">
          <label for="forgot-email">注册邮箱</label>
          <input type="email" id="forgot-email" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="forgot-verification-code">验证码</label>
          <div class="verification-code-group">
            <input type="text" id="forgot-verification-code" class="form-control" required>
            <button id="send-reset-code" class="btn btn-outline-secondary">获取验证码</button>
          </div>
        </div>
        <button id="verify-code-btn" class="auth-btn">验证</button>
        <div id="forgot-error" class="error-message" style="display: none;"></div>
      </div>
    </div>
  `,

  // 重置密码页面
  'reset-password': `
    <div class="auth-container">
      <h1 class="page-title">重置密码</h1>
      <div class="auth-form">
        <div class="form-group">
          <label for="reset-new-password">新密码</label>
          <input type="password" id="reset-new-password" class="form-control" required>
        </div>
        <div class="form-group">
          <label for="reset-confirm-password">确认密码</label>
          <input type="password" id="reset-confirm-password" class="form-control" required>
        </div>
        <button id="reset-password-btn" class="auth-btn">重置密码</button>
        <div id="reset-error" class="error-message" style="display: none;"></div>
      </div>
    </div>
  `,

// 用户设置页面
'user-settings': `
  <div class="user-settings-container">
    <div class="settings-header">
      <h1 class="settings-title">
        <i class="fas fa-user-cog"></i>
        <span>用户设置</span>
      </h1>
    </div>
    
    <div class="settings-content">
      <!-- 用户概览卡片 -->
      <div class="user-overview-card">
        <div class="user-overview-bg"></div>
        <div class="user-overview-content">
          <div class="user-avatar-section">
            <div class="avatar-wrapper">
              <img id="settings-avatar" class="user-avatar-display" src="" alt="用户头像">
              <div class="avatar-upload-overlay">
                <i class="fas fa-camera"></i>
              </div>
            </div>
            <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
          </div>
          
          <div class="user-info-summary">
            <h2 id="settings-username" class="user-display-name"></h2>
            <p id="settings-email" class="user-email"></p>
            <div class="user-badges">
              <span class="badge-uid">UID: <span id="settings-uid"></span></span>
              <span id="settings-user-state"></span>
            </div>
          </div>
        </div>
      </div>

      <!-- 头像裁剪模态框 -->
      <div id="avatar-crop-section" class="avatar-crop-modal" style="display: none;">
        <div class="crop-modal-content">
          <h3>调整头像</h3>
          <div id="avatar-crop-container" class="crop-container"></div>
          <div class="crop-actions">
            <button id="cancel-avatar-btn" class="btn-secondary">
              <i class="fas fa-times"></i> 取消
            </button>
            <button id="save-avatar-btn" class="btn-primary">
              <i class="fas fa-check"></i> 保存
            </button>
          </div>
        </div>
      </div>

      <!-- 设置选项卡 -->
      <div class="settings-tabs">
        <div class="tab-nav">
          <button class="tab-btn active" data-tab="profile">
            <i class="fas fa-user"></i>
            <span>个人信息</span>
          </button>
          <button class="tab-btn" data-tab="points">
            <i class="fas fa-coins"></i>
            <span>积分信息</span>
          </button>
          <button class="tab-btn" data-tab="security">
            <i class="fas fa-shield-alt"></i>
            <span>安全设置</span>
          </button>
          <button class="tab-btn" data-tab="binding">
            <i class="fas fa-link"></i>
            <span>绑定管理</span>
          </button>
        </div>

        <!-- 个人信息选项卡 -->
        <div class="tab-content active" id="profile-tab">
          <div class="settings-card">
            <div class="card-header">
              <h3><i class="fas fa-id-card"></i> 基本信息</h3>
            </div>
            <div class="card-body">
              <div class="info-row">
                <label>用户名</label>
                <div class="info-value" id="settings-username-display"></div>
              </div>
              <div class="info-row">
                <label>邮箱</label>
                <div class="info-value" id="settings-email-display"></div>
              </div>
              <div class="form-group">
                <label for="settings-nickname">
                  设置昵称
                </label>
                <div class="input-wrapper">
                  <input type="text" id="settings-nickname" class="form-input" maxlength="20" placeholder="设置您的昵称">
                  <span class="char-counter"><span id="settings-nickname-counter">0</span>/20</span>
                </div>
              </div>
              <button id="save-profile-btn" class="btn-primary btn-block">
                <i class="fas fa-save"></i> 保存个人信息
              </button>
            </div>
          </div>
        </div>

        <!-- 积分信息选项卡 -->
        <div class="tab-content" id="points-tab">
          <div class="settings-card">
            <div class="card-header">
              <h3><i class="fas fa-chart-line"></i> 积分统计</h3>
            </div>
            <div class="card-body">
              <div class="points-grid">
                <div class="points-item">
                  <div class="points-icon">
                    <i class="fas fa-star"></i>
                  </div>
                  <div class="points-info">
                    <div class="points-label">总积分</div>
                    <div class="points-value" id="settings-total-points">0</div>
                  </div>
                </div>
                <div class="points-item">
                  <div class="points-icon">
                    <i class="fas fa-coins"></i>
                  </div>
                  <div class="points-info">
                    <div class="points-label">普通积分</div>
                    <div class="points-value" id="settings-points">0</div>
                  </div>
                </div>
                <div class="points-item">
                  <div class="points-icon">
                    <i class="fas fa-dove"></i>
                  </div>
                  <div class="points-info">
                    <div class="points-label">鸽屋积分</div>
                    <div class="points-value" id="settings-point2">0</div>
                  </div>
                </div>
				<div class="points-item">
				  <div class="points-icon">
					<i class="fas fa-gem"></i>
				  </div>
				  <div class="points-info">
					<div class="points-label">CREDIT点数</div>
					<div class="points-value" id="settings-credit">0</div>
				  </div>
				</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 安全设置选项卡 -->
        <div class="tab-content" id="security-tab">
          <div class="settings-card">
            <div class="card-header">
              <h3><i class="fas fa-lock"></i> 修改密码</h3>
            </div>
            <div class="card-body">
              <div class="form-group">
                <label for="current-password">
                  <i class="fas fa-key"></i> 当前密码
                </label>
                <input type="password" id="current-password" class="form-input" placeholder="请输入当前密码">
              </div>
              <div class="form-group">
                <label for="new-password">
                  <i class="fas fa-lock"></i> 新密码
                </label>
                <div class="input-wrapper">
                  <input type="password" id="new-password" class="form-input" maxlength="16" placeholder="请输入新密码">
                  <span class="char-counter"><span id="new-password-counter">0</span>/16</span>
                </div>
              </div>
              <div class="form-group">
                <label for="confirm-password">
                  <i class="fas fa-lock"></i> 确认新密码
                </label>
                <input type="password" id="confirm-password" class="form-input" maxlength="16" placeholder="请再次输入新密码">
              </div>
              <button id="save-password-btn" class="btn-primary btn-block">
                <i class="fas fa-save"></i> 更新密码
              </button>
            </div>
          </div>
        </div>

        <!-- 绑定管理选项卡 -->
        <div class="tab-content" id="binding-tab">
          <!-- 查分绑定卡片 -->
          <div class="settings-card" id="ccb-binding-section" style="display: none;">
            <div class="card-header">
              <h3><i class="fas fa-gamepad"></i> 查分绑定信息</h3>
            </div>
            <div class="card-body">
              <div class="binding-info">
                <div class="binding-item">
                  <i class="fas fa-server"></i>
                  <div>
                    <label>服务器</label>
                    <div class="binding-value" id="ccb-server-info">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-microchip"></i>
                  <div>
                    <label>KeyChip</label>
                    <div class="binding-value" id="ccb-keychip-info">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-id-badge"></i>
                  <div>
                    <label>游戏卡号</label>
                    <div class="binding-value" id="ccb-guid-info">-</div>
                  </div>
                </div>
              </div>
              <button id="ccb-unbind-settings-btn" class="btn-danger btn-block">
                <i class="fas fa-unlink"></i> 解绑查分信息
              </button>
            </div>
          </div>
          
          <!-- 无查分绑定提示 -->
          <div class="settings-card" id="no-binding-message" style="display: none;">
            <div class="card-body text-center">
              <i class="fas fa-gamepad empty-icon"></i>
              <h4>暂无查分绑定</h4>
              <p class="text-muted mt-2">前往游戏查分页面进行绑定</p>
              <button class="btn-primary mt-3" onclick="loadPage('ccb')">
                <i class="fas fa-link"></i> 前往绑定
              </button>
            </div>
          </div>
          
          <!-- 收货信息卡片 -->
          <div class="settings-card" id="shipping-binding-section" style="display: none;">
            <div class="card-header">
              <h3><i class="fas fa-truck"></i> 收货绑定信息</h3>
            </div>
            <div class="card-body">
              <div class="binding-info">
                <div class="binding-item">
                  <i class="fas fa-user"></i>
                  <div>
                    <label>收件人</label>
                    <div class="binding-value" id="shipping-name">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-phone"></i>
                  <div>
                    <label>联系电话</label>
                    <div class="binding-value" id="shipping-phone">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-map-marker-alt"></i>
                  <div>
                    <label>收货地址</label>
                    <div class="binding-value" id="shipping-address">-</div>
                  </div>
                </div>
                <div class="binding-item">
                  <i class="fas fa-shopping-cart"></i>
                  <div>
                    <label>淘宝ID</label>
                    <div class="binding-value" id="shipping-postal-code">-</div>
                  </div>
                </div>
              </div>
              <button id="unbind-shipping-btn" class="btn-danger btn-block">
                <i class="fas fa-unlink"></i> 解绑收货信息
              </button>
            </div>
          </div>
          
          <!-- 无收货信息提示 -->
          <div class="settings-card" id="no-shipping-message" style="display: none;">
            <div class="card-body text-center">
              <i class="fas fa-box-open empty-icon"></i>
              <h4>暂无收货绑定</h4>
              <p class="text-muted mt-2">需要先绑定收货信息才能使用积分商城</p>
              <button id="add-shipping-btn" class="btn-primary mt-3">
                <i class="fas fa-link"></i> 前往绑定
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
`,

    // 每日运势页面
	fortune: `
	  <div class="fortune-container">
		<h1 class="page-title">每日签到</h1>
		<button class="back-button" data-page="home">
		  <i class="fas fa-arrow-left me-2"></i>
		  <span>返回主页</span>
		</button>
		
		<div class="section fortune-section">
		  <div class="song-cover">
			<img id="cover-img" src="https://oss.am-all.com.cn/asset/img/main/music/dummy.jpg" alt="歌曲封面">
			<!-- 新增签筒动画元素 -->
			<div class="fortune-animation">
			  <img id="kuji-01" class="kuji-img" src="https://oss.am-all.com.cn/asset/img/other/dc/kuji/kuji01.png" alt="签筒">
			  <img id="kuji-02" class="kuji-img" src="https://oss.am-all.com.cn/asset/img/other/dc/kuji/kuji02.png" alt="抽签">
			</div>
		  </div>
		  
		  <div class="song-info">
			<div class="song-id-cat">
			  <div class="song-id">ID: <span id="song-id">？？？</span></div>
			  <div class="song-category" id="song-category">？？？</div>
			</div>
			
			<div class="song-title" id="song-title">？？？</div>
			<div class="song-artist" id="song-artist">？？？</div>
			
			<div class="difficulties">
			  <div class="difficulty-tag lev-bas"><span id="lev-bas"></span></div>
			  <div class="difficulty-tag lev-adv"><span id="lev-adv"></span></div>
			  <div class="difficulty-tag lev-exp"><span id="lev-exp"></span></div>
			  <div class="difficulty-tag lev-mas"><span id="lev-mas"></span></div>
			  <div class="difficulty-tag lev-ult"><span id="lev-ult"></span></div>
			</div>
			
			<!-- 新增吉凶显示 -->
			  <div class="fortune-luck-container">
				<div class="fortune-luck-label">今日运势</div>
				<div class="fortune-luck-value" id="fortune-luck">？？？</div>
			  </div>
		  </div>
		  
		    <!-- 新增宜不宜部分 -->
			<div class="fortune-recommendation">
			  <div class="recommend-item">
				<div class="recommend-label">宜：</div>
				<div id="lucky-action">?</div>
			  </div>
			  <div class="recommend-item">
				<div class="recommend-label">不宜：</div>
				<div id="unlucky-action">?</div>
			  </div>
			</div>
		  
		  <button id="draw-btn" class="fortune-btn">
			<i class="fas fa-star me-2"></i>
			<span>签到</span>
		  </button>
		  
		  <div id="fortune-hint" class="fortune-hint"></div>
		</div>
	  </div>
	`,


	// 帮助页面
    help: `
      <div class="game-detail">
        <h1 class="page-title">帮助中心</h1>
        <button class="back-button" data-page="home">
          <i class="fas fa-arrow-left me-2"></i>
          <span id="back-to-home">返回</span>
        </button>
        
        <div class="section">
          <div class="help-grid">
            ${[1, 2].map(i => `
              <div class="help-card" data-id="${i}">
                <div class="help-icon">
                  <i class="fas fa-${i === 1 ? 'download' : i === 2 ? 'tools' : i === 3 ? 'plug' : i === 4 ? 'question' : i === 5 ? 'cog' : 'database'}"></i>
                </div>
                <div class="help-title">${i === 1 ? '下载指南' : i === 2 ? '实用工具指南' : i === 3 ? '补丁工具指南' : i === 4 ? '常见问题' : i === 5 ? '设置说明' : '数据管理'}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `,

    'help-detail': `
      <div class="game-detail">
        <h1 class="page-title" id="help-detail-title">帮助详情</h1>
        <button class="back-button" data-page="help">
          <i class="fas fa-arrow-left me-2"></i>
          <span id="back-to-help">返回</span>
        </button>
        
        <div class="section">
          <div id="help-content">
            <!-- 内容将根据主题动态加载 -->
          </div>
        </div>
      </div>
    `,

    // 其他页面模板
    'sdhd-archive': `<div class="game-detail">准备中...</div>`,
    
    // 其他页面
    'data-center': `<div class="section"><h1>数据中心</h1><p>数据中心内容...</p></div>`,
	
	// 设置页面
settings: `
  <div class="settings-container">
    <h1 class="page-title" id="option-title">设置</h1>
    <button class="back-button" data-page="home">
      <i class="fas fa-arrow-left me-2"></i>
      <span id="back-to-home">返回</span>
    </button>
    
    <!-- 语言设置卡片 -->
    <div class="setting-card">
      <div class="setting-header">
        <i class="fas fa-language me-2"></i>
        <span id="lang-option">语言设置</span>
      </div>
      <div class="setting-body">
        <div class="form-group">
          <label for="language-select">界面语言</label>
          <select id="language-select" class="form-control">
            <option value="zh-cn">简体中文</option>
            <option value="en-us">English</option>
            <option value="ja-jp">日本語</option>
          </select>
        </div>
        <div class="setting-item">
          <div>
            <span id="option-item">记住语言偏好</span>
            <div class="setting-description" id="option-text">下次访问时自动使用您选择的语言</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="remember-language">
            <span class="slider"></span>
          </label>
        </div>
      </div>
    </div>
    
    <!-- 鼠标样式设置卡片 -->
    <div class="setting-card" id="cursor-settings-card">
      <div class="setting-header">
        <i class="fas fa-mouse-pointer me-2"></i>
        <span>鼠标样式</span>
      </div>
      <div class="setting-body">
        <!-- 移动端提示 -->
        <div class="cursor-mobile-hint">
          <i class="fas fa-info-circle me-2"></i>
          鼠标样式设置仅在桌面设备上生效
        </div>
        
        <div class="setting-description" style="margin-bottom: 15px;">
          选择您喜欢的鼠标指针样式，让浏览体验更加个性化
        </div>
        
        <!-- 鼠标样式预览容器 - 这里是关键 -->
        <div id="cursor-preview-container">
          <!-- JavaScript将在这里生成选项 -->
          <div class="text-center" style="padding: 20px; color: #999;">
            <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
            <p style="margin-top: 10px;">加载中...</p>
          </div>
        </div>
        
        <div class="setting-description" style="margin-top: 15px; font-size: 0.85rem; color: #94a3b8;">
          <i class="fas fa-info-circle me-1"></i>
          提示：自定义鼠标样式需要加载额外资源，首次使用可能需要几秒钟加载
        </div>
      </div>
    </div>
    
    <div class="settings-buttons">
      <button class="save-btn" id="save-settings">
        <i class="fas fa-save me-2"></i>
        <span id="option-save">保存设置</span>
      </button>
    </div>
  </div>
  
  <!-- 在页面底部添加初始化脚本 -->
  <script>
    // 页面加载后立即初始化鼠标设置
    setTimeout(function() {
      console.log('初始化鼠标设置界面...');
      
      const container = document.getElementById('cursor-preview-container');
      if (!container) {
        console.error('找不到鼠标预览容器');
        return;
      }
      
      const currentStyle = localStorage.getItem('cursorStyle') || 'default';
      
      // 鼠标样式配置
      const cursorStyles = {
        default: {
          name: '默认',
          description: '系统默认鼠标',
          icon: 'fas fa-mouse-pointer',
          value: 'default'
        },
        custom1: {
          name: '井盖',
          description: '个性化鼠标样式',
          icon: 'fas fa-circle',
          value: 'custom1'
        },
        custom2: {
          name: 'まひろ',
          description: '可爱风格鼠标',
          icon: 'fas fa-heart',
          value: 'custom2'
        }
      };
      
      // 创建预览卡片
      let html = '<div class="cursor-preview">';
      
      Object.entries(cursorStyles).forEach(([key, style]) => {
        const isActive = key === currentStyle;
        html += \`
          <div class="cursor-option \${isActive ? 'active' : ''}" data-cursor="\${key}">
            <div class="cursor-option-icon">
              <i class="\${style.icon}"></i>
            </div>
            <div class="cursor-option-name">\${style.name}</div>
            <div class="cursor-option-desc">\${style.description}</div>
          </div>
        \`;
      });
      
      html += '</div>';
      container.innerHTML = html;
      
      // 添加点击事件
      container.querySelectorAll('.cursor-option').forEach(option => {
        option.addEventListener('click', function(e) {
          const cursorType = this.dataset.cursor;
          
          // 更新UI
          document.querySelectorAll('.cursor-option').forEach(opt => {
            opt.classList.remove('active');
          });
          this.classList.add('active');
          
          // 保存设置
          localStorage.setItem('cursorStyle', cursorType);
          
          // 应用样式
          document.body.classList.remove('cursor-default', 'cursor-custom1', 'cursor-custom2');
          document.body.classList.add('cursor-' + cursorType);
          
          // 显示成功消息
          if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('鼠标样式已切换为: ' + cursorStyles[cursorType].name);
          }
        });
      });
      
      console.log('鼠标设置界面初始化完成');
    }, 100);
  </script>
`,
	
    // ICF Editor
    icfeditor: `
      <div class="game-detail">
        <div class="d-flex align-items-center">
          <h1 class="page-title me-2">ICF Editor</h1>
          <button id="icf-help-btn" class="btn btn-sm btn-circle btn-outline-secondary">
            <i class="fas fa-question"></i>
          </button>
        </div>
        <button class="back-button" data-page="tools">
          <i class="fas fa-arrow-left me-2"></i>
          <span id="back-to-home">返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载ICF编辑器...</p>
          </div>
          <iframe 
            src="icfemain.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

    //CHUNITHM 补丁工具主页面
    dllpatcher: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM 补丁工具</h1>
        <button class="back-button" data-page="home">
          <i class="fas fa-arrow-left me-2"></i>
          <span id="back-to-home">返回</span>
        </button>
        
        <div class="section">
          <h2 class="section-title">
            <i class="fas fa-plug"></i>
            <span>请选择游戏</span>
          </h2>
          
          <div class="patcher-container">
            <!-- CHUNITHM -->
            <div class="patcher-card" data-page="chuni">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuni.png" alt="CHUNITHM">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM
              </div>
            </div>
            
            <!-- CHUNITHM PLUS -->
            <div class="patcher-card" data-page="chuniplus">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuniplus.jpg" alt="CHUNITHM PLUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM PLUS
              </div>
            </div>
            
            <!-- CHUNITHM AIR -->
            <div class="patcher-card" data-page="chuniair">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuniair.png" alt="CHUNITHM AIR">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM AIR
              </div>
            </div>
            
            <!-- CHUNITHM STAR -->
            <div class="patcher-card" data-page="chunistar">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chunistar.png" alt="CHUNITHM STAR">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM STAR
              </div>
            </div>

            <!-- CHUNITHM AMAZON -->
            <div class="patcher-card" data-page="chuniamazon">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuniamazon.png" alt="CHUNITHM AMAZON">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM AMAZON
              </div>
            </div>

            <!-- CHUNITHM CRYSTAL -->
            <div class="patcher-card" data-page="chunicrystal">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chunicrystal.png" alt="CHUNITHM CRYSTAL">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM CRYSTAL
              </div>
            </div>

            <!-- CHUNITHM PARADISE -->
            <div class="patcher-card" data-page="chuniparadise">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chuniparadise.png" alt="CHUNITHM PARADISE">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM PARADISE
              </div>
            </div>

            <!-- CHUNITHM NEW -->
            <div class="patcher-card" data-page="chusan">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan.png" alt="CHUNITHM NEW">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM NEW
              </div>
            </div>

            <!-- CHUNITHM NEW PLUS -->
            <div class="patcher-card" data-page="chusan">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusanplus.png" alt="CHUNITHM NEW PLUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM NEW PLUS
              </div>
            </div>

            <!-- CHUNITHM SUN -->
            <div class="patcher-card" data-page="chusansun">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusansun.png" alt="CHUNITHM SUN">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM SUN
              </div>
            </div>

            <!-- CHUNITHM SUN PLUS -->
            <div class="patcher-card" data-page="chusansunplus">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusansunplus.png" alt="CHUNITHM SUN PLUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM SUN PLUS
              </div>
            </div>

            <!-- CHUNITHM LUMINOUS -->
            <div class="patcher-card" data-page="chusanlmn">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chulmn.png" alt="CHUNITHM LUMINOUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM LUMINOUS
              </div>
            </div>

            <!-- CHUNITHM LUMINOUS PLUS -->
            <div class="patcher-card" data-page="chusanlmnplus">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan_lmnp.png" alt="CHUNITHM LUMINOUS PLUS">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM LUMINOUS PLUS
              </div>
            </div>

            <!-- CHUNITHM VERSE -->
            <div class="patcher-card" data-page="chusanvrs">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan_vrs.png" alt="CHUNITHM VERSE">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM VERSE
              </div>
            </div>

            <!-- CHUNITHM X-VERSE -->
            <div class="patcher-card" data-page="chusanxvrs">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan_xvrs.png" alt="CHUNITHM X-VERSE">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                CHUNITHM XVERSE
              </div>
            </div>

            <!-- 中二节奏2025 -->
            <div class="patcher-card" data-page="chusan2025">
              <div class="patcher-card-image">
                <img src="https://oss.am-all.com.cn/asset/img/main/chusan2025.png" alt="中二节奏2025">
              </div>
              <div class="patcher-card-divider"></div>
              <div class="patcher-card-title">
                中二节奏2025
              </div>
            </div>

          </div>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,
    
    // CHUNITHM 页面
    chuni: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuni.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,
    
    // CHUNITHM PLUS 页面
    chuniplus: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM PLUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuniplus.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,
	
	// CHUNITHM AIR 页面
    chuniair: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM AIR 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuniair.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

	// CHUNITHM STAR 页面
    chunistar: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM STAR 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chunistar.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

	// CHUNITHM AMAZON 页面
    chuniamazon: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM AMAZON 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuniamazon.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM CRYSTAL 页面
    chunicrystal: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM CRYSTAL 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chunicrystal.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

	// CHUNITHM PARADISE 页面
    chuniparadise: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM PARADISE 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chuniparadise.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM NEW 页面
    chusan: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM NEW 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusan.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM NEW PLUS 页面
    chusanplus: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM NEW PLUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanplus.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM SUN 页面
    chusansun: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM SUN 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusansun.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM SUN PLUS 页面
    chusansunplus: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM SUN PLUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusansunplus.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM LUMINOUS 页面
    chusanlmn: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM LUMINOUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanlmn.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM LUMINOUS PLUS 页面
    chusanlmnplus: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM LUMINOUS PLUS 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanlmnplus.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // CHUNITHM VERSE 页面
    chusanvrs: `
      <div class="game-detail">
        <h1 class="page-title">CHUNITHM VERSE 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusanvrs.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

  // 中二节奏2025 页面
    chusan2025: `
      <div class="game-detail">
        <h1 class="page-title">中二节奏2025 补丁工具</h1>
        <button class="back-button" data-page="dllpatcher">
          <i class="fas fa-arrow-left me-2"></i>
          <span>返回</span>
        </button>
        
        <div class="section iframe-container">
          <div class="iframe-loader">
            <div class="spinner-border text-primary"></div>
            <p>正在加载...</p>
          </div>
          <iframe 
            src="patcher/chusan2025.html" 
            frameborder="0"
            class="icf-editor-iframe"
            onload="this.previousElementSibling.style.display='none'">
          </iframe>
        </div>
        
        <footer>
          <p>SEGAY FEIWU</p>
          <p>1145141919810</p>
        </footer>
      </div>
    `,

};