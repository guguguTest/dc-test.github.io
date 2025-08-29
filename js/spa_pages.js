// 帮助内容数据
const helpContentData = {
  1: {
    title: "下载指南",
    content: `
      <h3>本站资源下载说明</h3>
      <ol>
        <li>如需下载资源，请从左侧菜单进入下载页面选择需要的资源进行下载。</li>
		<li>本站游戏资源提供最多不超过N-1的公开资源下载，如有新增资源请多关注首页公告。</li>
      </ol>
      
      <div class="warning mt-4">
        <strong><i class="fas fa-exclamation-circle me-2"></i> 注意：</strong>
        <span>目前所有资源仅提供百度网盘下载方式</span>
      </div>
    `
  },
  2: {
    title: "实用工具指南",
    content: `
      <h3>EvilLeaker系列工具</h3>
      <h4><strong>Segatools Editor</strong></h4>
	  <p>此工具可以方便快捷的修改所有游戏的segatools.ini，并且不需要您另行安装任何文本或代码编辑工具。</p>
	  <p>本工具自带备份功能，在您读取并加载segatools.ini后，软件会自动备份您所选择的文件，不用担心修改出现任何问题。</p>
	  <p>本工具同时具备自动更新功能，在您启动软件后如有新版本则会在日志区域显示新版本信息，如需下载更新请点击“帮助→更新”选项即可更新新版本。</p>
	  
	  <p><strong>软件使用指南</strong></p>
	  <p>1.双击SegatoolsEditor.exe启动软件</p>
	  <img src="https://oss.am-all.com.cn/asset/img/other/dc/software/sge-00.png" alt="00">
	  <hr>
	  <p>2.初次启动界面默认显示英文，请点击菜单栏“Language”切换为中文即可</p>
	  <ul>
        <li><strong>切换语言后软件会保存所选语言，下次启动后就会显示你所选择的语言。</strong></li>
		<li><strong>软件会在“C:/Users/用户名/Documents/evilleaker”文件夹下自动建立配置文件“sgEditor_config.json”</strong></li>
      </ul>
	  <img src="https://oss.am-all.com.cn/asset/img/other/dc/software/sge-01.png" alt="01">
	  <hr>
      <p>3.软件在启动后会自动检查是否有新版本并在下方日志区提示，如需更新软件，请点击菜单栏“帮助→更新”选项</p>
	  <img src="https://oss.am-all.com.cn/asset/img/other/dc/software/sge-02.png" alt="02">
	  <hr>
	  <p>4.按照下图步骤加载segatools.ini文件</p>
	  <ul>
		<li><strong>①点击“浏览文件”</strong></li>
		<li><strong>②选择需要修改的“segatools.ini”文件</strong></li>
		<li><strong>③点击“打开”</strong></li>
		<li><strong>④点击“加载配置”</strong></li>
	  </ul>
	  <img src="https://oss.am-all.com.cn/asset/img/other/dc/software/sge-03.png" alt="03">
	  <hr>
	  <p>5.点击“选择配置节”下拉菜单来选择需要修改的配置</p>
	  <ul>
		<li><strong>在读取完文件的同时，软件会自动备份当前你读取的segatools.ini</strong></li>
		<li><strong>备份路径为“C:/Users/用户名/Documents/evilleaker/ini_backup”文件夹中</strong></li>
	  </ul>
	  <img src="https://oss.am-all.com.cn/asset/img/other/dc/software/sge-04.png" alt="04">
	  <hr>
	  <p>6.点击相应的输入框来修改配置参数</p>
	  <ul>
		<li>①点击需要修改的值的输入框来修改参数</li>
		<li>②在修改完的同时，软件会自动保存文件，你也可以手动点击“保存配置”来保存文件</li>
		<li>③点击参数值框后的选项会切换当前值的有效性(相当于ini文件中的注释功能)，“有效”为取消注释激活配置，“无效”为注释掉配置使其不生效。</li>
	  </ul>
	  
	  
	  
	  
	  
	  
      <p>所有工具均可在<a href="#" data-page="tools">实用工具页面</a>下载</p>
    `
  }
};

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
      <div class="modal-content" style="max-width: 800px;">
        <span class="close">&times;</span>
        <h2 id="modal-title">新建下载项目</h2>
        <form id="download-form">
          <input type="hidden" id="download-id">
          
          <div class="form-row">
            <div class="form-group col-md-8">
              <label for="download-title">标题</label>
              <input type="text" id="download-title" class="form-control" required>
            </div>
            <div class="form-group col-md-4">
              <label for="download-category">分类</label>
              <select id="download-category" class="form-control" required>
                <option value="game">游戏下载</option>
                <option value="archive">存档下载</option>
                <option value="other">其他资源</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="download-page-id">页面ID</label>
              <input type="text" id="download-page-id" class="form-control" required>
              <small class="form-text text-muted">用于URL的唯一标识符（英文、数字、短横线）</small>
            </div>
            <div class="form-group col-md-6">
              <label for="download-status">状态</label>
              <select id="download-status" class="form-control">
                <option value="1">激活</option>
                <option value="0">禁用</option>
              </select>
            </div>
          </div>
          
          <!-- 新增：权限和积分设置 -->
          <div class="form-row">
            <div class="form-group col-md-4">
              <label for="download-access-level">访问权限</label>
              <select id="download-access-level" class="form-control">
                <option value="0">普通用户</option>
                <option value="1">初级用户</option>
                <option value="2">中级用户</option>
                <option value="3">高级用户</option>
                <option value="4">贵宾用户</option>
                <option value="5">管理员</option>
              </select>
            </div>
            <div class="form-group col-md-4">
              <label for="download-special-group">特殊用户组</label>
              <select id="download-special-group" class="form-control">
                <option value="">无</option>
                <option value="maimoller">maimoller</option>
              </select>
            </div>
            <div class="form-group col-md-4">
              <label for="download-required-points">所需积分</label>
              <input type="number" id="download-required-points" class="form-control" min="0" value="0">
              <small class="form-text text-muted">普通积分(非鸽屋积分)</small>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group col-md-4">
              <label for="download-version">版本</label>
              <input type="text" id="download-version" class="form-control">
            </div>
            <div class="form-group col-md-4">
              <label for="download-file-count">文件数</label>
              <input type="number" id="download-file-count" class="form-control" min="0">
            </div>
            <div class="form-group col-md-4">
              <label for="download-last-update">最后更新</label>
              <input type="date" id="download-last-update" class="form-control">
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group col-md-6">
              <label for="download-baidu-url">百度网盘链接</label>
              <input type="url" id="download-baidu-url" class="form-control">
            </div>
            <div class="form-group col-md-6">
              <label for="download-baidu-code">提取码</label>
              <input type="text" id="download-baidu-code" class="form-control">
            </div>
          </div>
          
          <div class="form-group">
            <label for="download-image-url">图片URL</label>
            <input type="url" id="download-image-url" class="form-control">
          </div>
          
          <div class="form-group">
            <label for="download-description">描述</label>
            <textarea id="download-description" class="form-control" rows="3"></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary">保存</button>
          <button type="button" class="btn btn-secondary" id="cancel-download-btn">取消</button>
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
	  <div class="section">
		<h1 class="page-title">订单录入</h1>
		<button class="back-button" data-page="home">
		  <i class="fas fa-arrow-left me-2"></i>
		  <span>返回</span>
		</button>
		
		<div class="order-search-box">
		  <div class="input-group">
			<input type="text" id="order-search-input" class="form-control" placeholder="搜索订单...">
			<button class="btn btn-primary" id="order-search-btn">
			  <i class="fas fa-search"></i>
			</button>
		  </div>
		</div>
		
		<div class="order-actions">
		  <button class="btn btn-success" id="add-order-btn">
			<i class="fas fa-plus me-2"></i>添加
		  </button>
		  <button class="btn btn-danger" id="delete-order-btn" disabled>
			<i class="fas fa-trash me-2"></i>删除
		  </button>
		  <button class="btn btn-warning" id="edit-order-btn" disabled>
			<i class="fas fa-edit me-2"></i>修改
		  </button>
		</div>
		
		<div class="table-responsive">
		  <table class="table table-hover" id="orders-table">
			<thead>
			  <tr>
				<th><input type="checkbox" id="select-all"></th>
				<th>ID</th>
				<th>淘宝ID</th>
				<th>商品名称</th>
				<th>订单号</th>
				<th>价格(元)</th>
				<th>兑换状态</th>
			  </tr>
			</thead>
			<tbody id="orders-body">
			  <!-- 订单数据将通过JavaScript动态填充 -->
			</tbody>
		  </table>
		</div>
		
		<div class="pagination-container">
		  <div id="pagination-controls"></div>
		</div>
	  </div>
	  
	  <!-- 订单编辑模态框 -->
	  <div class="modal" id="order-modal">
		<div class="modal-content">
		  <span class="close">&times;</span>
		  <h2 id="modal-title">添加订单</h2>
		  <form id="order-form">
			<input type="hidden" id="order-id">
			<div class="form-group">
			  <label for="taobao-id">淘宝ID</label>
			  <input type="text" id="taobao-id" class="form-control" required>
			</div>
			<div class="form-group">
			  <label for="product-name">商品名称</label>
			  <input type="text" id="product-name" class="form-control" required>
			</div>
			<div class="form-group">
			  <label for="order-number">订单号</label>
			  <input type="text" id="order-number" class="form-control" required>
			</div>
			<div class="form-group">
			  <label for="price">价格(元)</label>
			  <input type="number" id="price" class="form-control" step="0.01" required>
			</div>
			<div class="form-group">
			  <label for="redeemed">兑换状态</label>
			  <select id="redeemed" class="form-control">
				<option value="0">未兑换</option>
				<option value="1">已兑换</option>
			  </select>
			</div>
			<button type="submit" class="btn btn-primary">保存</button>
		  </form>
		</div>
	  </div>
	`,

	// 兑换页面
	'exchange': `
	  <div class="section">
		<h1 class="page-title">兑换</h1>
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
  <div class="section">
    <h1 class="page-title">用户设置</h1>
    
    <div class="user-settings-form">
      <!-- 头像设置 -->
      <div class="setting-section">
        <h3><i class="fas fa-image me-2"></i>头像设置</h3>
        <div class="d-flex flex-column align-items-center">
          <!-- 添加头像预览 -->
          <div class="avatar-preview-container mb-3">
            <img id="settings-avatar" class="user-avatar-large" src="" alt="用户头像">
          </div>
          
          <input type="file" id="avatar-upload" accept="image/*" style="display: none;">
          <button id="change-avatar-btn" class="btn btn-outline-primary mb-4">
            <i class="fas fa-upload me-2"></i>上传新头像
          </button>
          
          <div id="avatar-crop-section" style="display: none;">
            <h4>调整头像</h4>
            <div class="avatar-crop-container" id="avatar-crop-container"></div>
            <div class="d-flex justify-content-center mt-3">
              <button id="cancel-avatar-btn" class="btn btn-outline-secondary me-2">
                <i class="fas fa-times me-2"></i>取消
              </button>
              <button id="save-avatar-btn" class="btn btn-primary">
                <i class="fas fa-save me-2"></i>保存
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 个人信息设置 -->
      <div class="setting-section">
        <h3><i class="fas fa-user me-2"></i>个人信息</h3>
        <div class="form-group">
          <label>UID</label>
          <div id="settings-uid" class="form-control-static"></div>
        </div>
        <div class="form-group">
          <label>用户名</label>
          <div id="settings-username" class="form-control-static"></div>
        </div>
        <div class="form-group">
          <label>邮箱</label>
          <div id="settings-email" class="form-control-static"></div>
        </div>
        <div class="form-group">
          <label for="settings-nickname">昵称</label>
          <input type="text" id="settings-nickname" class="form-control" maxlength="20">
          <div class="char-counter"><span id="settings-nickname-counter">0</span>/20</div>
        </div>
        <div class="setting-actions">
          <button id="save-profile-btn" class="btn btn-primary">保存个人信息</button>
        </div>
      </div>

      <!-- 积分显示 -->
      <div class="setting-section">
        <h3><i class="fas fa-coins me-2"></i>积分</h3>
        <div class="form-group">
          <label>总积分</label>
          <div id="settings-total-points" class="form-control-static"></div>
        </div>
        <div class="form-group">
          <label>普通积分</label>
          <div id="settings-points" class="form-control-static"></div>
        </div>
        <div class="form-group">
          <label>鸽屋积分</label>
          <div id="settings-point2" class="form-control-static"></div>
        </div>
      </div>

      <!-- 查分绑定信息 - 修复后的卡片样式 -->
      <div class="setting-section" id="ccb-binding-section" style="display: none;">
        <h3><i class="fas fa-gamepad me-2"></i>查分绑定信息</h3>
        <div class="form-group">
          <label>服务器:</label>
          <div id="ccb-server-info" class="form-control-static"></div>
        </div>
        <div class="form-group">
          <label>KeyChip:</label>
          <div id="ccb-keychip-info" class="form-control-static"></div>
        </div>
        <div class="form-group">
          <label>游戏卡号:</label>
          <div id="ccb-guid-info" class="form-control-static"></div>
        </div>
        <div class="setting-actions">
          <button type="button" class="btn btn-danger" id="ccb-unbind-settings-btn">
            <i class="fas fa-unlink me-2"></i>解绑查分信息
          </button>
        </div>
      </div>

      <!-- 密码设置 -->
      <div class="setting-section">
        <h3><i class="fas fa-lock me-2"></i>修改密码</h3>
        <div class="form-group">
          <label for="current-password">当前密码</label>
          <input type="password" id="current-password" class="form-control">
        </div>
        <div class="form-group">
          <label for="new-password">新密码</label>
          <input type="password" id="new-password" class="form-control" maxlength="16">
          <div class="char-counter"><span id="new-password-counter">0</span>/16</div>
        </div>
        <div class="form-group">
          <label for="confirm-password">确认新密码</label>
          <input type="password" id="confirm-password" class="form-control" maxlength="16">
        </div>
        <div class="setting-actions">
          <button id="save-password-btn" class="btn btn-primary">保存密码</button>
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
		
		<div class="settings-buttons">
		  <button class="save-btn" id="save-settings">
			<i class="fas fa-save me-2"></i>
			<span id="option-save">保存设置</span>
		  </button>
		</div>
	  </div>
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

    // tools
    tools: `
      <div class="game-detail">
        <h1 class="page-title">实用工具</h1>
        <button class="back-button" data-page="home">
          <i class="fas fa-arrow-left me-2"></i>
          <span id="back-to-home">返回</span>
        </button>
        
        <div class="section">
          <div class="tool-grid-header">
            <h2 class="section-title">
              <i class="fas fa-tools"></i>
              <span>工具列表</span>
            </h2>
            <div class="search-box">
              <i class="fas fa-search"></i>
              <input type="text" placeholder="搜索...">
            </div>
          </div>

          <div class="tools-container">
            <div class="tool-card">
              <div class="tool-icon">
                <i class="fas fa-file-archive"></i>
              </div>
              <div class="tool-content">
                <h3 class="tool-title">Chunlocker v1.03</h3>
                <p class="tool-description">新版ChunithmUnlocker，使用更加便捷，支持多语言与在线更新。</p>
                <div class="tool-meta">
                  <span><i class="fas fa-history"></i> 最后更新: 2025/07/17</span>
                  <span><i class="fas fa-download"></i> 10.9MB</span>
                </div>
                <a href="https://oss.am-all.com.cn/download/software/chunlocker/Chunlocker.exe" class="tool-link" target="_blank" rel="noopener">下载</a>
              </div>
            </div>

            <div class="tool-card">
              <div class="tool-icon">
                <i class="fas fa-file-archive"></i>
              </div>
              <div class="tool-content">
                <h3 class="tool-title">Segatools Editor v1.02</h3>
                <p class="tool-description">使用此工具可以方便快捷的修改segatools.ini，无需另装各式文本编辑器。</p>
                <div class="tool-meta">
                  <span><i class="fas fa-history"></i> 最后更新: 2025/07/25</span>
                  <span><i class="fas fa-download"></i> 12MB</span>
                </div>
                <a href="https://oss.am-all.com.cn/download/software/sgeditor/SegatoolsEditor.exe" class="tool-link" target="_blank" rel="noopener">下载</a>
              </div>
            </div>

            <div class="tool-card">
              <div class="tool-icon">
                <i class="fas fa-file-archive"></i>
              </div>
              <div class="tool-content">
                <h3 class="tool-title">AllsUnlocker v1.00</h3>
                <p class="tool-description">可以解密ALLS格式软件(pack/app/opt)</p>
                <div class="tool-meta">
                  <span><i class="fas fa-history"></i> 最后更新: 2025/07/21</span>
                  <span><i class="fas fa-download"></i> 11.8MB</span>
                </div>
                <a href="https://oss.am-all.com.cn/download/software/allsunpacker/AllsUnpacker.exe" class="tool-link" target="_blank" rel="noopener">下载</a>
              </div>
            </div>

            <div class="tool-card">
              <div class="tool-icon">
                <i class="fas fa-file-archive"></i>
              </div>
              <div class="tool-content">
                <h3 class="tool-title">7zip</h3>
                <p class="tool-description">可提取HDD镜像中的数据</p>
                <div class="tool-meta">
                  <span><i class="fas fa-history"></i> 最后更新: 2025/07/10</span>
                  <span><i class="fas fa-download"></i> 1.54MB</span>
                </div>
                <a href="https://oss.am-all.com.cn/download/files/7-Zip.rar" class="tool-link" target="_blank" rel="noopener">下载</a>
              </div>
            </div>
            
            <div class="tool-card">
              <div class="tool-icon">
                <i class="fas fa-palette"></i>
              </div>
              <div class="tool-content">
                <h3 class="tool-title">Runtime</h3>
                <p class="tool-description">Windows运行时安装包，运行HDD所必要的系统组件。</p>
                <div class="tool-meta">
                  <span><i class="fas fa-browser"></i> 最后更新: 2025/07/10</span>
                  <span><i class="fas fa-download"></i> 180MB</span>
                </div>
                <a href="https://hitiko-my.sharepoint.com/:u:/p/evilleaker/EffD9kk4fiFEnJVcOrSgVI0B3gOx86gw9WBRLqdUIxvvjg" class="tool-link" target="_blank" rel="noopener">下载</a>
              </div>
            </div>
            
            <div class="tool-card">
              <div class="tool-icon">
                <i class="fas fa-database"></i>
              </div>
              <div class="tool-content">
                <h3 class="tool-title">MaiChartManager</h3>
                <p class="tool-description">可以管理某8键游戏Mod与游戏资源</p>
                <div class="tool-meta">
                  <span><i class="fas fa-browser"></i> 最后更新: 2025/07/10</span>
                  <span><i class="fas fa-download"></i> 1.05MB</span>
                </div>
                <a href="https://get.microsoft.com/installer/download/9P1JDKQ60G4G" class="tool-link" target="_blank" rel="noopener">下载</a>
              </div>
            </div>
          </div>

          <footer>
            <p>SEGAY FEIWU</p>
            <p>1145141919810</p>
          </footer>
        </div>
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