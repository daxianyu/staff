export function openUrlWithFallback(url: string) {
  // 尝试正常打开
  const win = window.open(url, '_blank');
  if (win) {
    win.focus();
    return;
  }

  // 被拦截，弹出自定义提示
  showCopyDialog(url);
}

function showCopyDialog(url: string) {
  // 避免重复弹窗
  if (document.getElementById('copy-url-dialog')) return;

  const dialog = document.createElement('div');
  dialog.id = 'copy-url-dialog';
  dialog.style.position = 'fixed';
  dialog.style.left = '0';
  dialog.style.top = '0';
  dialog.style.width = '100vw';
  dialog.style.height = '100vh';
  dialog.style.background = 'rgba(0,0,0,0.5)';
  dialog.style.zIndex = '9999';
  dialog.style.display = 'flex';
  dialog.style.alignItems = 'center';
  dialog.style.justifyContent = 'center';

  dialog.innerHTML = `
    <div style="background:#fff;padding:32px 24px;border-radius:12px;max-width:90vw;box-shadow:0 2px 16px #0002;text-align:center;">
      <div style="font-size:16px;font-weight:600;margin-bottom:12px;">浏览器拦截了新页面弹窗</div>
      <div style="font-size:14px;color:#666;margin-bottom:16px;">请手动复制下方链接，在新标签页打开：</div>
      <input id="copy-url-input" value="${url}" readonly style="width:90%;padding:8px;border:1px solid #ddd;border-radius:6px;font-size:14px;margin-bottom:16px;" />
      <br/>
      <button id="copy-url-btn" style="background:#2563eb;color:#fff;padding:6px 18px;border:none;border-radius:6px;font-size:14px;cursor:pointer;">复制链接</button>
      <button id="close-url-btn" style="margin-left:16px;background:#eee;color:#333;padding:6px 18px;border:none;border-radius:6px;font-size:14px;cursor:pointer;">关闭</button>
    </div>
  `;

  document.body.appendChild(dialog);

  // 复制按钮
  dialog.querySelector('#copy-url-btn')?.addEventListener('click', () => {
    const input = dialog.querySelector('#copy-url-input') as HTMLInputElement;
    input.select();
    document.execCommand('copy');
    (dialog.querySelector('#copy-url-btn') as HTMLButtonElement).innerText = '已复制';
  });

  // 关闭按钮
  dialog.querySelector('#close-url-btn')?.addEventListener('click', () => {
    document.body.removeChild(dialog);
  });
}
