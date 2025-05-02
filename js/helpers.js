// Disable pinch zoom on touch devices
document.addEventListener('touchmove', function (event) {
    if (event.scale !== 1) {
      event.preventDefault();
    }
  }, { passive: false });
  
  // Disable zoom with Ctrl + mouse wheel
  document.addEventListener('wheel', function (event) {
    if (event.ctrlKey) {
      event.preventDefault();
    }
  }, { passive: false });