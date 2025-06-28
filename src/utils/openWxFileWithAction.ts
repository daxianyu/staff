export function openWxFileWithAction(url: string) {
    showWxFileActionDialog(url);
  }
  
  function showWxFileActionDialog(url: string) {
    if (document.getElementById('wx-file-action-dialog')) return;
    const dialog = document.createElement('div');
    dialog.id = 'wx-file-action-dialog';
    dialog.className = 'fixed inset-0 flex items-center justify-center z-[9999]';
    dialog.style.background = 'rgba(0,0,0,0.5)';
    dialog.innerHTML = `
      <div class="bg-white rounded-lg p-6 max-w-xs w-full text-center">
        <div class="font-bold text-lg mb-2">请选择操作</div>
        <div class="mb-4 text-gray-700 text-sm">你想如何处理该文件？</div>
        <div class="flex gap-3 mb-2">
          <button id="wx-file-preview-btn" class="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">预览</button>
          <button id="wx-file-download-btn" class="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">下载</button>
        </div>
        <button id="wx-file-cancel-btn" class="mt-2 w-full px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300">取消</button>
      </div>
    `;
    document.body.appendChild(dialog);
    // 预览
    dialog.querySelector('#wx-file-preview-btn')?.addEventListener('click', () => {
      document.body.removeChild(dialog);
      wx.miniProgram.navigateTo({ url: '/pages/preview/index?url=' + encodeURIComponent(url) });
    });
    // 下载
    dialog.querySelector('#wx-file-download-btn')?.addEventListener('click', () => {
      document.body.removeChild(dialog);
      wx.miniProgram.navigateTo({ url: '/pages/copy/index?url=' + encodeURIComponent(url) });
    });
    // 取消
    dialog.querySelector('#wx-file-cancel-btn')?.addEventListener('click', () => {
      document.body.removeChild(dialog);
    });
  }
  