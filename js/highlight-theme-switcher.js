/* global Fluid */

// 代码高亮主题切换器
(function() {
  'use strict';

  // 高亮主题配置
  const HIGHLIGHT_THEMES = {
    light: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github.min.css',
    dark: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css'
  };

  let currentTheme = '';
  let highlightStyleElement = null;

  // 检测当前主题
  function getCurrentTheme() {
    const userScheme = document.documentElement.getAttribute('data-user-color-scheme');
    if (userScheme) {
      return userScheme;
    }
    
    // 检查系统偏好
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  }

  // 加载高亮主题 - 现在使用静态CSS文件，无需动态加载
  function loadHighlightTheme(theme) {
    if (currentTheme === theme) return;
    
    // 注释掉动态加载，现在使用静态CSS
    // 移除旧的样式
    // if (highlightStyleElement) {
    //   highlightStyleElement.remove();
    // }
    
    // 创建新的样式链接
    // highlightStyleElement = document.createElement('link');
    // highlightStyleElement.rel = 'stylesheet';
    // highlightStyleElement.href = HIGHLIGHT_THEMES[theme];
    // highlightStyleElement.id = 'highlight-theme-css';
    
    // 添加到head
    // document.head.appendChild(highlightStyleElement);
    
    currentTheme = theme;
    
    // 直接重新高亮所有代码块（不需要等待CSS加载）
    setTimeout(function() {
      highlightCodeBlocks();
    }, 100);
  }

  // 高亮代码块的通用函数
  function highlightCodeBlocks() {
    if (!window.hljs) return;
    
    // 处理标准的代码块
    document.querySelectorAll('pre code').forEach(function(block) {
      if (!block.classList.contains('hljs')) {
        hljs.highlightElement(block);
      }
    });
    
    // 处理Hexo生成的特殊结构
    document.querySelectorAll('figure.highlight td.code pre').forEach(function(pre) {
      if (pre.classList.contains('hljs')) return; // 已经处理过了
      
      // 获取语言信息
      const figure = pre.closest('figure.highlight');
      const classList = Array.from(figure.classList);
      let language = '';
      
      for (let cls of classList) {
        if (cls !== 'highlight') {
          language = cls;
          break;
        }
      }
      
      // 语言名称映射
      const languageMap = {
        'c#': 'csharp',
        'cs': 'csharp',
        'javascript': 'javascript',
        'js': 'javascript',
        'python': 'python',
        'py': 'python',
        'java': 'java',
        'cpp': 'cpp',
        'c++': 'cpp',
        'html': 'html',
        'css': 'css',
        'json': 'json',
        'xml': 'xml',
        'yaml': 'yaml',
        'yml': 'yaml',
        'bash': 'bash',
        'shell': 'bash',
        'sql': 'sql',
        'typescript': 'typescript',
        'ts': 'typescript'
      };
      
      const mappedLang = languageMap[language.toLowerCase()] || language;
      
      if (mappedLang && hljs.getLanguage(mappedLang)) {
        try {
          const result = hljs.highlight(pre.textContent, { language: mappedLang });
          pre.innerHTML = result.value;
          pre.className = `hljs language-${mappedLang}`;
        } catch (e) {
          console.warn('Failed to highlight code block:', e);
        }
      }
    });
  }

  // 初始化
  function init() {
    const theme = getCurrentTheme();
    loadHighlightTheme(theme);
    
    // 初始化时也要高亮代码块
    setTimeout(highlightCodeBlocks, 100);
    
    // 监听主题变化
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'data-user-color-scheme') {
          const newTheme = getCurrentTheme();
          loadHighlightTheme(newTheme);
        }
      });
    });
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-user-color-scheme']
    });
    
    // 监听系统主题变化
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', function() {
        if (!document.documentElement.getAttribute('data-user-color-scheme')) {
          const newTheme = getCurrentTheme();
          loadHighlightTheme(newTheme);
        }
      });
    }
  }

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 注册到 Fluid 事件系统
  if (window.Fluid && window.Fluid.events) {
    Fluid.events.registerRefreshCallback(function() {
      const theme = getCurrentTheme();
      loadHighlightTheme(theme);
      setTimeout(highlightCodeBlocks, 100);
    });
  }
  
  // 当highlight.js加载完成后，确保立即高亮代码块
  if (window.hljs) {
    highlightCodeBlocks();
  } else {
    // 如果hljs还没加载，等待加载完成
    const checkHljs = setInterval(function() {
      if (window.hljs) {
        clearInterval(checkHljs);
        highlightCodeBlocks();
      }
    }, 100);
  }

})();