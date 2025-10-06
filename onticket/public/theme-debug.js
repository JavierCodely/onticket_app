// Debug script to check theme application
(function() {
  console.log('=== THEME DEBUG ===');
  console.log('HTML classes:', document.documentElement.className);
  console.log('localStorage color-theme:', localStorage.getItem('color-theme'));
  console.log('localStorage theme:', localStorage.getItem('theme'));

  // Check computed CSS variables
  const styles = getComputedStyle(document.documentElement);
  console.log('--primary:', styles.getPropertyValue('--primary'));
  console.log('--success:', styles.getPropertyValue('--success'));
  console.log('--destructive:', styles.getPropertyValue('--destructive'));
})();
