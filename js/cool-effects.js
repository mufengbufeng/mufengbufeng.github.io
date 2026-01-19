/**
 * ========================================
 * 炫酷效果增强脚本 - Cool Effects
 * ========================================
 */

(function() {
    'use strict';

    // ============ 配置项 ============
    const CONFIG = {
        // 粒子效果配置
        particles: {
            enabled: true,
            count: 80,
            color: '102, 126, 234', // RGB
            size: 2,
            speed: 0.5,
            linkDistance: 150,
            linkOpacity: 0.3
        },
        // 点击波纹效果
        ripple: {
            enabled: true,
            duration: 600,
            color: 'rgba(102, 126, 234, 0.3)'
        },
        // 滚动显示动画
        scrollReveal: {
            enabled: true,
            threshold: 0.1,
            distance: 50
        },
        // 鼠标跟随光晕（已禁用）
        mouseGlow: {
            enabled: false,
            size: 200,
            opacity: 0.15,
            color: '102, 126, 234'
        },
        // 星空背景
        stars: {
            enabled: true,
            count: 50
        }
    };

    // ============ 粒子系统 ============
    class ParticleSystem {
        constructor(canvas) {
            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');
            this.particles = [];
            this.mouse = { x: null, y: null };
            this.resize();
            this.init();
            this.bindEvents();
        }

        resize() {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }

        init() {
            this.particles = [];
            for (let i = 0; i < CONFIG.particles.count; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: (Math.random() - 0.5) * CONFIG.particles.speed,
                    vy: (Math.random() - 0.5) * CONFIG.particles.speed,
                    size: Math.random() * CONFIG.particles.size + 1
                });
            }
        }

        bindEvents() {
            window.addEventListener('resize', () => {
                this.resize();
                this.init();
            });

            window.addEventListener('mousemove', (e) => {
                this.mouse.x = e.clientX;
                this.mouse.y = e.clientY;
            });

            window.addEventListener('mouseout', () => {
                this.mouse.x = null;
                this.mouse.y = null;
            });
        }

        update() {
            this.particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // 边界反弹
                if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

                // 鼠标交互
                if (this.mouse.x !== null) {
                    const dx = this.mouse.x - p.x;
                    const dy = this.mouse.y - p.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 100) {
                        const force = (100 - dist) / 100;
                        p.vx -= (dx / dist) * force * 0.5;
                        p.vy -= (dy / dist) * force * 0.5;
                    }
                }
            });
        }

        draw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // 绘制连线
            this.ctx.strokeStyle = `rgba(${CONFIG.particles.color}, ${CONFIG.particles.linkOpacity})`;
            this.ctx.lineWidth = 0.5;

            for (let i = 0; i < this.particles.length; i++) {
                const p1 = this.particles[i];

                // 绘制粒子
                this.ctx.fillStyle = `rgba(${CONFIG.particles.color}, 0.8)`;
                this.ctx.beginPath();
                this.ctx.arc(p1.x, p1.y, p1.size, 0, Math.PI * 2);
                this.ctx.fill();

                // 绘制连线
                for (let j = i + 1; j < this.particles.length; j++) {
                    const p2 = this.particles[j];
                    const dx = p1.x - p2.x;
                    const dy = p1.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONFIG.particles.linkDistance) {
                        const opacity = (1 - dist / CONFIG.particles.linkDistance) * CONFIG.particles.linkOpacity;
                        this.ctx.strokeStyle = `rgba(${CONFIG.particles.color}, ${opacity})`;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(p2.x, p2.y);
                        this.ctx.stroke();
                    }
                }

                // 鼠标连线
                if (this.mouse.x !== null) {
                    const dx = this.mouse.x - p1.x;
                    const dy = this.mouse.y - p1.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < CONFIG.particles.linkDistance) {
                        const opacity = (1 - dist / CONFIG.particles.linkDistance) * CONFIG.particles.linkOpacity;
                        this.ctx.strokeStyle = `rgba(${CONFIG.particles.color}, ${opacity})`;
                        this.ctx.beginPath();
                        this.ctx.moveTo(p1.x, p1.y);
                        this.ctx.lineTo(this.mouse.x, this.mouse.y);
                        this.ctx.stroke();
                    }
                }
            }
        }

        animate() {
            this.update();
            this.draw();
            requestAnimationFrame(() => this.animate());
        }
    }

    // ============ 点击波纹效果 ============
    function initRippleEffect() {
        if (!CONFIG.ripple.enabled) return;

        document.addEventListener('click', (e) => {
            const ripple = document.createElement('div');
            ripple.style.cssText = `
                position: fixed;
                width: 20px;
                height: 20px;
                background: radial-gradient(circle, ${CONFIG.ripple.color}, transparent);
                border-radius: 50%;
                pointer-events: none;
                z-index: 9999;
                left: ${e.clientX - 10}px;
                top: ${e.clientY - 10}px;
                animation: rippleExpand ${CONFIG.ripple.duration}ms ease-out forwards;
            `;
            document.body.appendChild(ripple);

            setTimeout(() => ripple.remove(), CONFIG.ripple.duration);
        });

        // 添加波纹动画样式
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rippleExpand {
                0% {
                    transform: scale(1);
                    opacity: 0.5;
                }
                100% {
                    transform: scale(20);
                    opacity: 0;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // ============ 滚动显示动画 ============
    function initScrollReveal() {
        if (!CONFIG.scrollReveal.enabled) return;

        const observerOptions = {
            threshold: 0.05, // 降低阈值，更早触发
            rootMargin: '100px 0px -50px 0px' // 增加底部边距，提前触发
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('scroll-revealed');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // 只对首页卡片应用动画，不影响文章页内容
        const elements = document.querySelectorAll('.index-card');
        elements.forEach((el, index) => {
            // 只对前几个元素设置初始隐藏状态，减少初始样式设置
            if (index < 10) {
                el.style.opacity = '0';
                el.style.transform = `translateY(20px)`; // 减少移动距离
            }
            // 减少过渡时间和延迟
            el.style.transition = `all 0.3s ease-out ${Math.min(index * 0.03, 0.15)}s`;
            observer.observe(el);
        });

        // 添加显示后的样式
        const style = document.createElement('style');
        style.textContent = `
            .scroll-revealed {
                opacity: 1 !important;
                transform: translateY(0) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // ============ 鼠标跟随光晕 ============
    function initMouseGlow() {
        if (!CONFIG.mouseGlow.enabled) return;

        const glow = document.createElement('div');
        glow.className = 'mouse-glow';
        glow.style.cssText = `
            position: fixed;
            width: ${CONFIG.mouseGlow.size}px;
            height: ${CONFIG.mouseGlow.size}px;
            background: radial-gradient(circle, rgba(${CONFIG.mouseGlow.color}, ${CONFIG.mouseGlow.opacity}) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9998;
            transform: translate(-50%, -50%);
            transition: opacity 0.3s ease;
            opacity: 0;
        `;
        document.body.appendChild(glow);

        let targetX = 0, targetY = 0;
        let currentX = 0, currentY = 0;

        document.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;
            glow.style.opacity = '1';
        });

        document.addEventListener('mouseout', () => {
            glow.style.opacity = '0';
        });

        function animate() {
            currentX += (targetX - currentX) * 0.1;
            currentY += (targetY - currentY) * 0.1;
            glow.style.left = currentX + 'px';
            glow.style.top = currentY + 'px';
            requestAnimationFrame(animate);
        }
        animate();
    }

    // ============ 星空背景 ============
    function initStarBackground() {
        if (!CONFIG.stars.enabled) return;

        const container = document.createElement('div');
        container.className = 'stars-bg';
        document.body.appendChild(container);

        for (let i = 0; i < CONFIG.stars.count; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            star.style.cssText = `
                left: ${Math.random() * 100}%;
                top: ${Math.random() * 100}%;
                --duration: ${2 + Math.random() * 3}s;
                animation-delay: ${Math.random() * 2}s;
            `;
            container.appendChild(star);
        }
    }

    // ============ 导航栏滚动效果 ============
    function initNavbarScroll() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) return;

        let lastScroll = 0;

        window.addEventListener('scroll', () => {
            const currentScroll = window.pageYOffset;

            // 添加滚动状态类
            if (currentScroll > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }

            // 滚动时隐藏/显示导航栏
            if (currentScroll > lastScroll && currentScroll > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }

            lastScroll = currentScroll;
        }, { passive: true });
    }

    // ============ 平滑滚动 ============
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function(e) {
                const href = this.getAttribute('href');
                if (href === '#' || href === '#!') return;

                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    // ============ 打字机效果增强（已禁用，使用主题自带效果） ============
    function enhanceTypingEffect() {
        // 已禁用，使用主题自带的打字机效果
    }

    // ============ 数字滚动动画 ============
    function animateNumber(element, target, duration = 2000) {
        const start = 0;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用 easeOutQuart 缓动函数
            const easeProgress = 1 - Math.pow(1 - progress, 4);
            const current = Math.floor(start + (target - start) * easeProgress);

            element.textContent = current.toLocaleString();

            if (progress < 1) {
                requestAnimationFrame(update);
            }
        }

        requestAnimationFrame(update);
    }

    // ============ 页面加载动画 ============
    function initPageLoadAnimation() {
        // 禁用 body 隐藏，避免页面加载问题
        // 只为首页标题添加简单动画
        if (document.querySelector('.page-index')) {
            const titles = document.querySelectorAll('.index-header');
            titles.forEach((title, index) => {
                title.style.opacity = '0';
                title.style.animation = `fadeInUp 0.6s ease forwards ${index * 0.1}s`;
            });
        }
    }

    // ============ 代码块行号美化 ============
    function enhanceCodeBlock() {
        document.querySelectorAll('.highlight-wrapper').forEach(wrapper => {
            // 添加行号背景
            const lineNumbers = wrapper.querySelector('.line-numbers');
            if (lineNumbers) {
                lineNumbers.style.background = 'rgba(102, 126, 234, 0.05)';
            }
        });
    }

    // ============ 卡片3D倾斜效果（已禁用，避免干扰） ============
    function initCard3DEffect() {
        // 已禁用
    }

    // ============ 初始化所有效果 ============
    function init() {
        // 创建粒子画布
        if (CONFIG.particles.enabled) {
            const canvas = document.createElement('canvas');
            canvas.id = 'particles-canvas';
            canvas.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: -1;
            `;
            document.body.appendChild(canvas);

            const particleSystem = new ParticleSystem(canvas);
            particleSystem.animate();
        }

        // 初始化其他效果
        initRippleEffect();
        initScrollReveal();
        initMouseGlow();
        initStarBackground();
        initNavbarScroll();
        initSmoothScroll();
        enhanceTypingEffect();
        initPageLoadAnimation();
        enhanceCodeBlock();
        initCard3DEffect();

        // 页面加载完成后执行
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(initScrollReveal, 100);
            });
        } else {
            setTimeout(initScrollReveal, 100);
        }
    }

    // 启动
    init();

    // 导出到全局，方便调试
    window.CoolEffects = {
        CONFIG,
        init,
        animateNumber
    };

})();
