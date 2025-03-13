$(document).ready(() => {
  toastr.options = {
    "closeButton": true,
    "progressBar": true,
    "positionClass": "toast-bottom-right",
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": "5000",
    "extendedTimeOut": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
  }
  
  initTooltips();
});

// Function to initialize tooltips
function initTooltips() {
  const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
  const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
}

function copyToClipboard(text, element) {
  navigator.clipboard.writeText(text)
      .then(() => {

          element.tooltip('dispose');

          element.tooltip({
              title: 'Copiado!',
              trigger: 'manual'
          });

          element.tooltip('show');

          setTimeout(() => {
              element.tooltip('dispose');

              element.tooltip({
                  title: 'Copiar enlace',
                  trigger: 'manual'
              });

              element.tooltip('show');
          }, 2000);
      });
}