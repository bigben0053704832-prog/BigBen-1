// 全局变量
let uploadedVideos = [];
const maxFileSize = 100 * 1024 * 1024; // 100MB
const allowedFormats = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv', 'video/webm', 'video/mkv'];

// DOM 元素
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const previewSection = document.getElementById('previewSection');
const videoGrid = document.getElementById('videoGrid');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// 初始化事件监听器
document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
});

function initializeEventListeners() {
    // 文件输入变化事件
    fileInput.addEventListener('change', handleFileSelect);
    
    // 拖拽事件
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // 防止页面默认拖拽行为
    document.addEventListener('dragover', preventDefault);
    document.addEventListener('drop', preventDefault);
}

function preventDefault(e) {
    e.preventDefault();
}

function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = e.dataTransfer.files;
    processFiles(files);
}

function handleFileSelect(e) {
    const files = e.target.files;
    processFiles(files);
}

function processFiles(files) {
    if (files.length === 0) return;
    
    const validFiles = [];
    const errors = [];
    
    // 验证文件
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const validation = validateFile(file);
        
        if (validation.valid) {
            validFiles.push(file);
        } else {
            errors.push(`${file.name}: ${validation.error}`);
        }
    }
    
    // 显示错误信息
    if (errors.length > 0) {
        showError(errors.join('\n'));
    }
    
    // 处理有效文件
    if (validFiles.length > 0) {
        uploadFiles(validFiles);
    }
}

function validateFile(file) {
    // 检查文件类型
    if (!allowedFormats.includes(file.type)) {
        return {
            valid: false,
            error: '不支持的文件格式'
        };
    }
    
    // 检查文件大小
    if (file.size > maxFileSize) {
        return {
            valid: false,
            error: `文件大小超过限制 (${formatFileSize(maxFileSize)})`
        };
    }
    
    return { valid: true };
}

function uploadFiles(files) {
    showProgress();
    
    let completedFiles = 0;
    const totalFiles = files.length;
    
    files.forEach((file, index) => {
        // 模拟上传进度
        simulateUpload(file, (progress) => {
            const overallProgress = ((completedFiles + progress / 100) / totalFiles) * 100;
            updateProgress(overallProgress);
        }, () => {
            // 上传完成
            completedFiles++;
            addVideoToPreview(file);
            
            if (completedFiles === totalFiles) {
                hideProgress();
                showPreviewSection();
            }
        });
    });
}

function simulateUpload(file, onProgress, onComplete) {
    let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            onComplete();
        }
        onProgress(progress);
    }, 100);
}

function addVideoToPreview(file) {
    const videoId = 'video_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const videoUrl = URL.createObjectURL(file);
    
    const videoData = {
        id: videoId,
        file: file,
        url: videoUrl,
        name: file.name,
        size: file.size
    };
    
    uploadedVideos.push(videoData);
    
    const videoCard = createVideoCard(videoData);
    videoGrid.appendChild(videoCard);
}

function createVideoCard(videoData) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.setAttribute('data-video-id', videoData.id);
    
    card.innerHTML = `
        <video class="video-preview" preload="metadata">
            <source src="${videoData.url}" type="${videoData.file.type}">
            您的浏览器不支持视频播放。
        </video>
        <div class="video-info">
            <div class="video-name" title="${videoData.name}">${truncateFileName(videoData.name, 30)}</div>
            <div class="video-size">${formatFileSize(videoData.size)}</div>
            <div class="video-actions">
                <button class="action-btn play-btn" onclick="playVideo('${videoData.id}')">
                    ▶️ 播放
                </button>
                <button class="action-btn delete-btn" onclick="deleteVideo('${videoData.id}')">
                    🗑️ 删除
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function playVideo(videoId) {
    const videoData = uploadedVideos.find(v => v.id === videoId);
    if (!videoData) return;
    
    // 创建全屏播放器
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        cursor: pointer;
    `;
    
    const video = document.createElement('video');
    video.style.cssText = `
        max-width: 90%;
        max-height: 90%;
        border-radius: 10px;
    `;
    video.src = videoData.url;
    video.controls = true;
    video.autoplay = true;
    
    modal.appendChild(video);
    document.body.appendChild(modal);
    
    // 点击背景关闭
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            document.body.removeChild(modal);
        }
    });
    
    // ESC键关闭
    const handleEsc = (e) => {
        if (e.key === 'Escape') {
            document.body.removeChild(modal);
            document.removeEventListener('keydown', handleEsc);
        }
    };
    document.addEventListener('keydown', handleEsc);
}

function deleteVideo(videoId) {
    if (!confirm('确定要删除这个视频吗？')) return;
    
    // 从数组中移除
    const index = uploadedVideos.findIndex(v => v.id === videoId);
    if (index !== -1) {
        URL.revokeObjectURL(uploadedVideos[index].url);
        uploadedVideos.splice(index, 1);
    }
    
    // 从DOM中移除
    const card = document.querySelector(`[data-video-id="${videoId}"]`);
    if (card) {
        card.remove();
    }
    
    // 如果没有视频了，隐藏预览区域
    if (uploadedVideos.length === 0) {
        hidePreviewSection();
    }
}

function showProgress() {
    uploadProgress.style.display = 'block';
    updateProgress(0);
}

function hideProgress() {
    setTimeout(() => {
        uploadProgress.style.display = 'none';
    }, 500);
}

function updateProgress(percentage) {
    const percent = Math.round(percentage);
    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '%';
}

function showPreviewSection() {
    previewSection.style.display = 'block';
}

function hidePreviewSection() {
    previewSection.style.display = 'none';
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.style.display = 'flex';
    
    // 5秒后自动隐藏
    setTimeout(() => {
        hideError();
    }, 5000);
}

function hideError() {
    errorMessage.style.display = 'none';
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function truncateFileName(fileName, maxLength) {
    if (fileName.length <= maxLength) return fileName;
    
    const extension = fileName.split('.').pop();
    const nameWithoutExt = fileName.substring(0, fileName.lastIndexOf('.'));
    const truncatedName = nameWithoutExt.substring(0, maxLength - extension.length - 4) + '...';
    
    return truncatedName + '.' + extension;
}

// 清理资源
window.addEventListener('beforeunload', () => {
    uploadedVideos.forEach(video => {
        URL.revokeObjectURL(video.url);
    });
});