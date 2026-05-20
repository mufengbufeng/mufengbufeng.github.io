/**
 * ========================================
 * 点击文字爆炸效果 - Click Text Explosion
 * ========================================
 */

(function() {
    const CONFIG = {
        // 可选的文字数组
        texts: [
            '', '', '', '', '',
            '❤', '', '', '', '',
            '', '', '', '', '',
            '', '', '', '', '',
            '', '', '', '', '',
            '✨', '', '', '', '',
            '', '', '', '', '',
            '⭐', '', '', '', ''
        ],
        // 文字大小范围
        fontSize: { min: 14, max: 24 },
        // 动画持续时间 (ms)
        duration: 1000,
        // 每次点击产生的文字数量
        count: 8
    };

    let lastClickTime = 0;
    const clickThrottle = 100; // 点击间隔限制

    function createExplosion(x, y) {
        const now = Date.now();
        if (now - lastClickTime < clickThrottle) return;
        lastClickTime = now;

        for (let i = 0; i < CONFIG.count; i++) {
            const text = document.createElement('span');
            const content = CONFIG.texts[Math.floor(Math.random() * CONFIG.texts.length)];
            const fontSize = Math.random() * (CONFIG.fontSize.max - CONFIG.fontSize.min) + CONFIG.fontSize.min;
            const angle = (Math.PI * 2 * i) / CONFIG.count;
            const velocity = 50 + Math.random() * 50;
            const tx = Math.cos(angle) * velocity;
            const ty = Math.sin(angle) * velocity - 50; // 稍微向上偏移

            text.textContent = content;
            text.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                font-size: ${fontSize}px;
                color: hsl(${Math.random() * 60 + 240}, 80%, 60%);
                pointer-events: none;
                z-index: 9999;
                user-select: none;
                white-space: nowrap;
                will-change: transform, opacity;
            `;

            document.body.appendChild(text);

            // 强制重绘
            text.getBoundingClientRect();

            // 应用动画
            text.style.transition = `all ${CONFIG.duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
            text.style.transform = `translate(${tx}px, ${ty}px) rotate(${Math.random() * 360}deg) scale(0)`;
            text.style.opacity = '0';

            setTimeout(() => text.remove(), CONFIG.duration);
        }
    }

    // 监听点击事件
    document.addEventListener('click', (e) => {
        // 排除一些不需要效果的元素
        if (e.target.closest('button, a, .copy-btn, .no-effect')) {
            return;
        }
        createExplosion(e.clientX, e.clientY);
    });

    // 导出配置，允许自定义
    window.ClickText = {
        config: CONFIG,
        setTexts: function(newTexts) {
            CONFIG.texts = newTexts;
        }
    };
})();
