(function () {
  var widget = document.querySelector('.appoint-x-inline-widget');
  if (!widget) return;
  var url = widget.getAttribute('data-url');
  var iframe = document.createElement('iframe');
  iframe.src = url;
  iframe.style.width = '100%';
  iframe.style.height = '100%';
  iframe.style.border = 'none';
  widget.appendChild(iframe);
})();