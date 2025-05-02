function showFloatingScore(seriesIndex, points) {
    const seriesContainers = document.querySelectorAll(".series-container");
    const container = seriesContainers[seriesIndex];
    if (!container) return;
  
    const floating = document.createElement("div");
    floating.innerText = `+${points}`;
    floating.className = "floating-score";
    container.appendChild(floating);
  
    requestAnimationFrame(() => {
      floating.style.transform = "translateY(-40px)";
      floating.style.opacity = "0";
    });
  
    setTimeout(() => container.removeChild(floating), 1000);
  }