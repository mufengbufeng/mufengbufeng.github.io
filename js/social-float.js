(function() {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    var config = window.socialFloatConfig || {};
    if (!config.enable) return;

    // Create Button
    var btn = document.createElement('div');
    btn.className = 'social-float-btn';
    btn.title = config.title || '联系我';
    var btnIcon = config.icon || 'iconfont icon-user-fill';
    btn.innerHTML = '<i class="' + btnIcon + '" style="font-size: 24px;"></i>'; 
    document.body.appendChild(btn);

    // Create Overlay
    var overlay = document.createElement('div');
    overlay.className = 'social-modal-overlay';
    document.body.appendChild(overlay);

    // Create Modal Content
    var itemsHtml = '';
    if (config.items && config.items.length > 0) {
      config.items.forEach(function(item) {
        var content = '';
        var iconHtml = item.icon ? '<i class="' + item.icon + '"></i>' : '';
        var textHtml = '<span>' + (item.text || '') + '</span>';
        
        if (item.link) {
          content = '<a href="' + item.link + '" target="_blank" rel="noopener">' + iconHtml + ' ' + textHtml + '</a>';
        } else {
          content = '<span>' + iconHtml + ' ' + textHtml + '</span>';
        }
        itemsHtml += '<div class="social-item">' + content + '</div>';
      });
    }

    // Create Modal
    var modal = document.createElement('div');
    modal.className = 'social-modal';
    modal.innerHTML = '<h3>' + (config.title || '关注我') + '</h3>' + itemsHtml;
    document.body.appendChild(modal);

    // Events
    function toggleModal() {
      var isActive = modal.classList.contains('active');
      if (isActive) {
        modal.classList.remove('active');
        overlay.classList.remove('active');
      } else {
        modal.classList.add('active');
        overlay.classList.add('active');
      }
    }

    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      toggleModal();
    });

    overlay.addEventListener('click', toggleModal);
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        toggleModal();
      }
    });
  });
})();
