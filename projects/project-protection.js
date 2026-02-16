(() => {
  // Lightweight deterrent only. This does not provide real source-code security.
  const blockContextMenu = (event) => {
    event.preventDefault();
  };

  const isDevtoolsShortcut = (event) => {
    const key = String(event.key || '').toLowerCase();
    const ctrlOrMeta = event.ctrlKey || event.metaKey;

    if (key === 'f12') return true;

    if (ctrlOrMeta && event.shiftKey && ['i', 'j', 'c', 'k', 'p'].includes(key)) {
      return true;
    }

    if (event.metaKey && event.altKey && ['i', 'j', 'c', 'k', 'p'].includes(key)) {
      return true;
    }

    if (ctrlOrMeta && key === 'u') {
      return true;
    }

    return false;
  };

  const blockDevtoolsShortcuts = (event) => {
    if (!isDevtoolsShortcut(event)) return;
    event.preventDefault();
    event.stopPropagation();
  };

  document.addEventListener('contextmenu', blockContextMenu, { capture: true });
  document.addEventListener('keydown', blockDevtoolsShortcuts, true);
})();
