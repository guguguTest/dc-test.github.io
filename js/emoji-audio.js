// 表情音频功能补丁 - 直接在控制台运行或添加到页面底部
// 这个补丁会覆盖原有的函数，立即启用音频功能
(function() {
    console.log('===== 表情音频功能补丁开始加载 =====');
    
    // 保存原始函数（如果需要的话）
    window.originalOpenAddEmojiPackModal = window.openAddEmojiPackModal;
    
    // 重写打开添加表情包弹窗函数
    window.openAddEmojiPackModal = function() {
        console.log('打开表情包弹窗 - 音频增强版');
        
        // 重置状态
        window.currentEmojiPack = null;
        window.uploadedFiles = [];
        window.uploadedAudios = [];
        window.folderCreated = false;
        window.currentFolderName = '';
        window.coverImageUrl = null;
        window.isAudioPack = false;
        
        // 移除旧弹窗
        let oldModal = document.getElementById('emoji-pack-modal');
        if (oldModal) {
            oldModal.remove();
        }
        
        // 创建新弹窗
        const modal = createEnhancedEmojiPackModal();
        document.body.appendChild(modal);
        
        // 初始化
        setTimeout(() => {
            resetModalForm();
            modal.classList.add('show');
        }, 100);
    };
    
    // 创建增强版的表情包弹窗
    function createEnhancedEmojiPackModal() {
        const modal = document.createElement('div');
        modal.id = 'emoji-pack-modal';
        modal.className = 'emoji-pack-modal';
        modal.innerHTML = `
            <div class="emoji-pack-modal-content">
                <div class="emoji-pack-modal-header">
                    <h3 class="emoji-pack-modal-title">添加表情包</h3>
                    <button class="emoji-pack-modal-close" onclick="closeEmojiPackModal()">&times;</button>
                </div>
                <div class="emoji-pack-modal-body">
                    <div class="emoji-form-group">
                        <label class="emoji-form-label">表情包名称</label>
                        <input type="text" id="emoji-pack-name" class="emoji-form-input" placeholder="输入表情包名称">
                    </div>
                    
                    <!-- 音频功能选项 - 醒目设计 -->
                    <div class="emoji-form-group" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <label class="emoji-form-label" style="display: flex; align-items: center; margin-bottom: 10px; cursor: pointer;">
                            <input type="checkbox" id="is-audio-pack" onchange="toggleAudioPackOption()" style="margin-right: 10px; width: 20px; height: 20px; cursor: pointer;">
                            <span style="font-size: 18px; color: white; font-weight: bold;">
                                <i class="fas fa-music" style="margin-right: 8px;"></i>
                                启用音频表情包功能
                            </span>
                        </label>
                        <small class="emoji-form-hint" style="color: #fff; opacity: 0.9;">
                            <i class="fas fa-info-circle"></i> 
                            勾选后可为每个表情添加对应的音效文件（支持 .m4a .mp3 .wav 格式）
                        </small>
                    </div>
                    
                    <div class="emoji-form-group">
                        <label class="emoji-form-label">文件夹名称（英文或数字）</label>
                        <div class="emoji-folder-input-group">
                            <input type="text" id="emoji-folder-name" class="emoji-form-input" placeholder="例如: emoji_01">
                            <button type="button" id="create-folder-btn" class="emoji-form-btn" onclick="createEmojiFolder()">创建文件夹</button>
                        </div>
                        <small class="emoji-form-hint">请先创建文件夹后再上传图片</small>
                        <div id="folder-status" style="margin-top: 5px; display: none;"></div>
                    </div>
                    
                    <div class="emoji-form-group">
                        <label class="emoji-form-label">表情包封面</label>
                        <div class="emoji-upload-area disabled" id="cover-upload-area">
                            <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
                            <div class="emoji-upload-text">请先创建文件夹</div>
                            <div class="emoji-upload-hint">创建文件夹后才能上传</div>
                        </div>
                        <input type="file" id="emoji-pack-cover" accept="image/*" style="display: none;">
                    </div>
                    
                    <div class="emoji-form-group">
                        <label class="emoji-form-label">上传表情图片</label>
                        <div class="emoji-upload-area disabled" id="images-upload-area">
                            <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                            <div class="emoji-upload-text">请先创建文件夹</div>
                            <div class="emoji-upload-hint">创建文件夹后才能上传</div>
                        </div>
                        <input type="file" id="emoji-pack-images" accept="image/*" multiple style="display: none;">
                    </div>
                    
                    <!-- 音频上传区域 -->
                    <div class="emoji-form-group" id="audio-upload-section" style="display: none;">
                        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 15px; border-radius: 8px;">
                            <label class="emoji-form-label" style="color: white; font-size: 16px; margin-bottom: 10px;">
                                <i class="fas fa-headphones"></i> 上传音频文件
                            </label>
                            <div style="background: rgba(255,255,255,0.95); color: #333; padding: 12px; border-radius: 6px; margin-bottom: 10px;">
                                <strong>使用说明：</strong><br>
                                • 音频文件将按上传顺序与表情图片一一对应<br>
                                • 第1个音频→第1个表情，第2个音频→第2个表情<br>
                                • 支持 .m4a .mp3 .wav 格式
                            </div>
                        </div>
                        <div class="emoji-upload-area disabled" id="audio-upload-area" style="margin-top: 10px;">
                            <div class="emoji-upload-icon"><i class="fas fa-file-audio"></i></div>
                            <div class="emoji-upload-text">请先创建文件夹并上传图片</div>
                            <div class="emoji-upload-hint">点击选择音频文件</div>
                        </div>
                        <input type="file" id="emoji-pack-audios" accept="audio/*,.m4a,.mp3,.wav" multiple style="display: none;">
                    </div>
                    
                    <div id="emoji-upload-progress" class="emoji-upload-progress" style="display: none;">
                        <div class="emoji-progress-bar">
                            <div id="emoji-progress-fill" class="emoji-progress-fill" style="width: 0;"></div>
                        </div>
                        <div id="emoji-progress-text" class="emoji-progress-text">上传中 0%</div>
                    </div>
                    
                    <div id="emoji-preview-grid" class="emoji-preview-grid"></div>
                </div>
                <div class="emoji-pack-modal-footer">
                    <button class="emoji-modal-btn cancel" onclick="closeEmojiPackModal()">取消</button>
                    <button class="emoji-modal-btn save" onclick="saveEmojiPack()">保存</button>
                </div>
            </div>
        `;
        return modal;
    }
    
    // 重置表单
    function resetModalForm() {
        const packNameInput = document.getElementById('emoji-pack-name');
        const folderNameInput = document.getElementById('emoji-folder-name');
        const audioCheckbox = document.getElementById('is-audio-pack');
        
        if (packNameInput) packNameInput.value = '';
        if (folderNameInput) {
            folderNameInput.value = '';
            folderNameInput.disabled = false;
        }
        if (audioCheckbox) {
            audioCheckbox.checked = false;
        }
        
        const createBtn = document.getElementById('create-folder-btn');
        if (createBtn) {
            createBtn.disabled = false;
            createBtn.textContent = '创建文件夹';
        }
        
        const folderStatus = document.getElementById('folder-status');
        if (folderStatus) folderStatus.style.display = 'none';
        
        const previewGrid = document.getElementById('emoji-preview-grid');
        if (previewGrid) previewGrid.innerHTML = '';
        
        const audioUploadSection = document.getElementById('audio-upload-section');
        if (audioUploadSection) {
            audioUploadSection.style.display = 'none';
        }
    }
    
    // 切换音频功能
    window.toggleAudioPackOption = function() {
        const checkbox = document.getElementById('is-audio-pack');
        if (!checkbox) return;
        
        const isAudioPack = checkbox.checked;
        window.isAudioPack = isAudioPack;
        
        const audioUploadSection = document.getElementById('audio-upload-section');
        if (audioUploadSection) {
            if (isAudioPack) {
                audioUploadSection.style.display = 'block';
                // 如果已经上传了图片，启用音频上传
                if (window.folderCreated && window.uploadedFiles && window.uploadedFiles.length > 0) {
                    enableAudioUploadArea();
                }
            } else {
                audioUploadSection.style.display = 'none';
            }
        }
        
        console.log('音频表情包选项已切换:', isAudioPack);
    };
    
    // 创建文件夹（增强版）
    window.createEmojiFolder = async function() {
        const folderNameInput = document.getElementById('emoji-folder-name');
        const folderName = folderNameInput.value.trim();
        
        if (!folderName) {
            alert('请输入文件夹名称');
            return;
        }
        
        if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) {
            alert('文件夹名称只能包含英文、数字、下划线和横线');
            return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) {
            alert('请先登录');
            return;
        }
        
        const createBtn = document.getElementById('create-folder-btn');
        createBtn.disabled = true;
        createBtn.textContent = '创建中...';
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/emoji/create-folder`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ 
                    folder_name: folderName,
                    create_sounds_folder: window.isAudioPack || false
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                window.folderCreated = true;
                window.currentFolderName = folderName;
                
                folderNameInput.disabled = true;
                createBtn.disabled = true;
                createBtn.textContent = '已创建';
                
                const statusDiv = document.getElementById('folder-status');
                statusDiv.innerHTML = `✔ 文件夹 "${folderName}" 已创建${window.isAudioPack ? '（含音频文件夹）' : ''}`;
                statusDiv.style.display = 'block';
                statusDiv.style.color = '#28a745';
                
                // 启用上传区域
                enableUploadAreas();
                
                alert('文件夹创建成功，现在可以上传图片了');
            } else {
                throw new Error(result.error || '创建文件夹失败');
            }
        } catch (error) {
            createBtn.disabled = false;
            createBtn.textContent = '创建文件夹';
            alert(error.message || '创建文件夹失败');
        }
    };
    
    // 启用上传区域
    function enableUploadAreas() {
        const coverArea = document.getElementById('cover-upload-area');
        const imagesArea = document.getElementById('images-upload-area');
        const coverInput = document.getElementById('emoji-pack-cover');
        const imagesInput = document.getElementById('emoji-pack-images');
        
        if (!window.currentFolderName || !window.folderCreated) {
            return;
        }
        
        // 启用封面上传
        if (coverArea) {
            coverArea.classList.remove('disabled');
            coverArea.innerHTML = `
                <div class="emoji-upload-icon"><i class="fas fa-image"></i></div>
                <div class="emoji-upload-text">点击上传封面图片</div>
                <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/jacket/</div>
            `;
            coverArea.onclick = () => coverInput.click();
            coverInput.onchange = function() { handleCoverUpload(this); };
        }
        
        // 启用表情上传
        if (imagesArea) {
            imagesArea.classList.remove('disabled');
            imagesArea.innerHTML = `
                <div class="emoji-upload-icon"><i class="fas fa-cloud-upload-alt"></i></div>
                <div class="emoji-upload-text">点击或拖拽上传表情图片</div>
                <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/</div>
            `;
            imagesArea.onclick = () => imagesInput.click();
            imagesInput.onchange = function() { 
                handleImagesUpload(this);
                // 上传图片后，如果启用了音频功能，激活音频上传
                if (window.isAudioPack) {
                    setTimeout(enableAudioUploadArea, 500);
                }
            };
        }
    }
    
    // 启用音频上传区域
    window.enableAudioUploadArea = function() {
        if (!window.isAudioPack) return;
        
        const audioArea = document.getElementById('audio-upload-area');
        const audioInput = document.getElementById('emoji-pack-audios');
        
        if (!audioArea || !audioInput) return;
        
        audioArea.classList.remove('disabled');
        audioArea.innerHTML = `
            <div class="emoji-upload-icon" style="color: #f5576c;"><i class="fas fa-music"></i></div>
            <div class="emoji-upload-text" style="color: #333;">点击上传音频文件</div>
            <div class="emoji-upload-hint" style="color: #28a745;">将上传到: ${window.currentFolderName}/sounds/</div>
            <div style="margin-top: 10px; color: #666;">已上传 ${window.uploadedFiles ? window.uploadedFiles.length : 0} 个表情</div>
        `;
        audioArea.style.background = '#f0fff0';
        audioArea.style.borderColor = '#28a745';
        audioArea.style.cursor = 'pointer';
        
        audioArea.onclick = () => audioInput.click();
        audioInput.onchange = function() { handleAudiosUpload(this); };
    };
    
    // 处理音频上传
    window.handleAudiosUpload = async function(input) {
        const files = Array.from(input.files);
        if (files.length === 0) return;
        
        if (!window.folderCreated || !window.currentFolderName) {
            alert('请先创建文件夹');
            input.value = '';
            return;
        }
        
        if (!window.uploadedFiles || window.uploadedFiles.length === 0) {
            alert('请先上传表情图片');
            input.value = '';
            return;
        }
        
        if (files.length !== window.uploadedFiles.length) {
            if (!confirm(`音频文件数量(${files.length})与图片数量(${window.uploadedFiles.length})不一致。是否继续？`)) {
                input.value = '';
                return;
            }
        }
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const progressDiv = document.getElementById('emoji-upload-progress');
        const progressFill = document.getElementById('emoji-progress-fill');
        const progressText = document.getElementById('emoji-progress-text');
        
        if (progressDiv) progressDiv.style.display = 'block';
        
        let uploaded = 0;
        const total = files.length;
        
        window.uploadedAudios = []; // 清空音频数组
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const formData = new FormData();
            formData.append('audio', file);
            
            try {
                const url = `${API_BASE_URL}/api/admin/emoji/upload-audio?folder_name=${encodeURIComponent(window.currentFolderName)}`;
                
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
                
                const result = await response.json();
                
                if (response.ok && result.success) {
                    window.uploadedAudios.push({
                        index: i,
                        file_name: result.file_name || file.name,
                        file_path: result.url
                    });
                    
                    // 更新对应的表情数据
                    if (window.uploadedFiles[i]) {
                        window.uploadedFiles[i].audio_path = result.url;
                    }
                } else {
                    console.error(`上传音频 ${file.name} 失败:`, result.error);
                }
            } catch (error) {
                console.error(`上传音频 ${file.name} 失败:`, error);
            }
            
            uploaded++;
            const progress = Math.round((uploaded / total) * 100);
            if (progressFill) progressFill.style.width = progress + '%';
            if (progressText) progressText.textContent = `上传音频中 ${progress}% (${uploaded}/${total})`;
        }
        
        // 重新渲染预览
        if (window.renderUploadedEmojis) {
            window.renderUploadedEmojis();
        }
        
        alert(`成功上传 ${window.uploadedAudios.length} 个音频文件`);
        
        setTimeout(() => {
            if (progressDiv) progressDiv.style.display = 'none';
            if (progressFill) progressFill.style.width = '0%';
        }, 2000);
        
        input.value = '';
    };
    
    // 确保保存函数包含音频数据
    const originalSaveEmojiPack = window.saveEmojiPack;
    window.saveEmojiPack = async function() {
        const packName = document.getElementById('emoji-pack-name').value;
        const folderName = window.currentFolderName || document.getElementById('emoji-folder-name').value;
        const coverUrl = window.coverImageUrl;
        const isAudioPack = document.getElementById('is-audio-pack').checked;
        
        if (!packName || !folderName) {
            alert('请填写表情包名称和文件夹名称');
            return;
        }
        
        if (!window.uploadedFiles || window.uploadedFiles.length === 0) {
            alert('请上传至少一个表情图片');
            return;
        }
        
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const data = {
            pack_name: packName,
            folder_name: folderName,
            cover_image: coverUrl,
            is_audio_pack: isAudioPack,
            emojis: window.uploadedFiles // 这里已包含 audio_path
        };
        
        console.log('保存表情包数据:', data);
        
        try {
            const url = window.currentEmojiPack 
                ? `${API_BASE_URL}/api/admin/emoji/packs/${window.currentEmojiPack.id}`
                : `${API_BASE_URL}/api/admin/emoji/packs`;
            
            const response = await fetch(url, {
                method: window.currentEmojiPack ? 'PUT' : 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                closeEmojiPackModal();
                if (window.loadEmojiPacksList) {
                    window.loadEmojiPacksList();
                }
                alert(window.currentEmojiPack ? '表情包更新成功' : '表情包添加成功');
            } else {
                const error = await response.json();
                alert(error.error || '操作失败');
            }
        } catch (error) {
            console.error('保存表情包失败:', error);
            alert('保存失败');
        }
    };
    
    console.log('===== 表情音频功能补丁加载完成 =====');
    console.log('现在可以点击"添加表情包"按钮使用音频功能了');
})();