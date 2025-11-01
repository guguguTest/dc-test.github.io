// scanner-functions.js - 扫码识别功能模块

// 扫码相关的全局变量
let scanStream = null;
let scanVideoElement = null;
let isScanning = false;
let scanInterval = null;

// 初始化扫码功能
function initScanner() {
    // 创建扫码模态框
    createScanModal();
}

// 创建扫码模态框
function createScanModal() {
    const modalHTML = `
        <div id="scan-modal" class="scan-modal">
            <div class="scan-modal-content">
                <div class="scan-modal-header">
                    <h2 class="scan-modal-title">
                        <i class="fas fa-camera"></i>
                        扫描卡片
                    </h2>
                    <button class="scan-modal-close" onclick="closeScanModal()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="scan-tips">
                    <div class="scan-tips-title">
                        <i class="fas fa-info-circle"></i>
                        扫描提示
                    </div>
                    <ul class="scan-tips-list">
                        <li>将卡片平放在摄像头前</li>
                        <li>确保ACCESS CODE区域清晰可见</li>
                        <li>保持卡片稳定，系统会自动识别</li>
                    </ul>
                </div>
                
                <div class="scan-status scanning" id="scan-status">
                    <i class="fas fa-spinner fa-spin"></i> 准备摄像头...
                </div>
                
                <div class="scan-video-container">
                    <video id="scan-video" autoplay playsinline></video>
                    <div class="scan-overlay">
                        <div class="scan-frame">
                            <div class="scan-line"></div>
                            <div class="scan-frame-corner-bl"></div>
                            <div class="scan-frame-corner-br"></div>
                        </div>
                    </div>
                </div>
                
                <div class="scan-result" id="scan-result" style="display: none;">
                    <div class="scan-result-label">识别到的卡号:</div>
                    <div class="scan-result-text" id="scan-result-text">-</div>
                </div>
                
                <div class="scan-actions">
                    <button class="scan-action-btn secondary" onclick="closeScanModal()">取消</button>
                    <button class="scan-action-btn primary" id="confirm-scan-btn" onclick="confirmScanResult()" disabled>
                        确认使用
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // 移除已存在的模态框
    const existingModal = document.getElementById('scan-modal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 打开扫码窗口
async function openScanModal() {
    const modal = document.getElementById('scan-modal');
    if (!modal) {
        createScanModal();
    }
    
    modal.classList.add('active');
    scanVideoElement = document.getElementById('scan-video');
    
    try {
        // 请求摄像头权限
        const constraints = {
            video: {
                facingMode: 'environment', // 优先使用后置摄像头
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        };
        
        scanStream = await navigator.mediaDevices.getUserMedia(constraints);
        scanVideoElement.srcObject = scanStream;
        
        // 等待视频准备就绪
        scanVideoElement.onloadedmetadata = () => {
            updateScanStatus('scanning', '将卡片对准扫描框，正在识别中...');
            startAutoScanning();
        };
        
    } catch (error) {
        console.error('无法访问摄像头:', error);
        updateScanStatus('error', '无法访问摄像头，请检查权限设置');
    }
}

// 关闭扫码窗口
function closeScanModal() {
    const modal = document.getElementById('scan-modal');
    modal.classList.remove('active');
    
    // 停止扫描
    stopAutoScanning();
    
    // 停止摄像头
    if (scanStream) {
        scanStream.getTracks().forEach(track => track.stop());
        scanStream = null;
    }
    
    // 重置状态
    isScanning = false;
    const resultDiv = document.getElementById('scan-result');
    if (resultDiv) {
        resultDiv.style.display = 'none';
    }
}

// 开始自动扫描
function startAutoScanning() {
    if (isScanning) return;
    
    isScanning = true;
    
    // 每1秒尝试识别一次
    scanInterval = setInterval(() => {
        captureAndRecognize();
    }, 1000);
}

// 停止自动扫描
function stopAutoScanning() {
    if (scanInterval) {
        clearInterval(scanInterval);
        scanInterval = null;
    }
    isScanning = false;
}

// 捕获并识别
async function captureAndRecognize() {
    if (!scanVideoElement || !isScanning) return;
    
    try {
        // 创建canvas捕获当前帧
        const canvas = document.createElement('canvas');
        canvas.width = scanVideoElement.videoWidth;
        canvas.height = scanVideoElement.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(scanVideoElement, 0, 0);
        
        // 转换为图片数据
        canvas.toBlob(async (blob) => {
            if (!blob) return;
            
            // 使用Tesseract.js进行OCR识别
            const { data: { text } } = await Tesseract.recognize(
                blob,
                'eng',
                {
                    logger: () => {} // 禁用日志输出
                }
            );
            
            // 提取20位数字
            const numbers = extractAccessCode(text);
            
            if (numbers) {
                // 识别成功
                stopAutoScanning();
                updateScanStatus('success', '识别成功！');
                displayScanResult(numbers);
            }
        }, 'image/png');
        
    } catch (error) {
        console.error('识别失败:', error);
    }
}

// 从识别文本中提取ACCESS CODE (20位数字)
function extractAccessCode(text) {
    // 移除所有空格和换行
    const cleaned = text.replace(/[\s\n\r]/g, '');
    
    // 尝试匹配20位连续数字
    const patterns = [
        /(\d{20})/,                          // 20位连续数字
        /(\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{4})/, // 带空格的格式
        /(\d{5}\s*\d{4}\s*\d{4}\s*\d{4}\s*\d{3})/  // 另一种格式
    ];
    
    for (const pattern of patterns) {
        const match = cleaned.match(pattern);
        if (match) {
            const numbers = match[1].replace(/\D/g, '');
            if (numbers.length === 20) {
                return numbers;
            }
        }
    }
    
    // 尝试在原始文本中查找
    const allDigits = text.replace(/\D/g, '');
    
    // 查找最长的数字序列
    if (allDigits.length >= 20) {
        // 查找是否有20位连续数字
        for (let i = 0; i <= allDigits.length - 20; i++) {
            const candidate = allDigits.substr(i, 20);
            // 简单验证：不应该全是相同的数字
            if (!/^(\d)\1{19}$/.test(candidate)) {
                return candidate;
            }
        }
    }
    
    return null;
}

// 更新扫描状态
function updateScanStatus(type, message) {
    const statusDiv = document.getElementById('scan-status');
    if (!statusDiv) return;
    
    statusDiv.className = `scan-status ${type}`;
    
    let icon = '<i class="fas fa-spinner fa-spin"></i>';
    if (type === 'success') {
        icon = '<i class="fas fa-check-circle"></i>';
    } else if (type === 'error') {
        icon = '<i class="fas fa-exclamation-circle"></i>';
    }
    
    statusDiv.innerHTML = `${icon} ${message}`;
}

// 显示扫描结果
function displayScanResult(accessCode) {
    const resultDiv = document.getElementById('scan-result');
    const resultText = document.getElementById('scan-result-text');
    const confirmBtn = document.getElementById('confirm-scan-btn');
    
    if (resultDiv && resultText) {
        resultDiv.style.display = 'block';
        resultText.textContent = accessCode;
        
        // 格式化显示（每4位加一个空格）
        const formatted = accessCode.match(/.{1,4}/g).join(' ');
        resultText.textContent = formatted;
        
        // 保存识别结果
        window.scannedAccessCode = accessCode;
        
        // 启用确认按钮
        if (confirmBtn) {
            confirmBtn.disabled = false;
        }
    }
}

// 确认扫描结果
function confirmScanResult() {
    if (window.scannedAccessCode) {
        const guidInput = document.getElementById('guid-input');
        if (guidInput) {
            guidInput.value = window.scannedAccessCode;
            
            // 触发input事件以便验证
            guidInput.dispatchEvent(new Event('input', { bubbles: true }));
        }
        
        closeScanModal();
        
        // 显示成功提示
        if (typeof showSuccessMessage === 'function') {
            showSuccessMessage('卡号已自动填入');
        }
    }
}

// 将函数暴露到全局作用域
window.openScanModal = openScanModal;
window.closeScanModal = closeScanModal;
window.confirmScanResult = confirmScanResult;
