const toggleDebugPanel = () => {
    const debugPanel = document.getElementById("debugPanel");
    debugPanel.style.display = debug ? "block" : "none";
};

toggleDebugPanel();