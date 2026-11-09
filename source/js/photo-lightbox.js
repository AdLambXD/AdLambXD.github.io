(function () {
  function initLightbox() {
    var items = document.querySelectorAll('.photo-item');
    if (!items.length) return;
    if (document.querySelector('dialog.photo-lightbox')) return;

    var dialog = document.createElement('dialog');
    dialog.className = 'photo-lightbox';
    dialog.innerHTML = '<button class="lb-close" type="button" aria-label="关闭">×</button><img alt="">';
    document.body.appendChild(dialog);

    var image = dialog.querySelector('img');
    var close = dialog.querySelector('.lb-close');

    items.forEach(function (item) {
      item.addEventListener('click', function (event) {
        event.preventDefault();
        var img = item.querySelector('img');
        image.src = item.getAttribute('href');
        image.alt = img ? img.alt : '';
        if (typeof dialog.showModal === 'function') {
          dialog.showModal();
        } else {
          window.open(item.getAttribute('href'), '_blank');
        }
      });
    });

    close.addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) dialog.close();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && dialog.open) dialog.close();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLightbox);
  } else {
    initLightbox();
  }
  window.addEventListener('pjax:complete', initLightbox);
})();
