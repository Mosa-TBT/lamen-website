(() => {
  const dialog = document.createElement("dialog");
  dialog.className = "lamen-achievements";
  dialog.id = "lamen-achievements";
  dialog.setAttribute("aria-labelledby", "achievement-title");
  dialog.innerHTML = `<header class="achievement-head"><div><small>MILESTONES THAT MATTER</small><h2 id="achievement-title">LAMEN achievements</h2></div><button class="achievement-close" aria-label="Close achievements">×</button></header><div class="achievement-content"><p class="achievement-intro">A selection of institutional milestones documented on LAMEN’s official website. Explore the published certificate and original announcements below.</p><article class="achievement-feature"><a href="assets/lamen-iso-certificate.jpeg" target="_blank" rel="noopener" aria-label="Open published ISO certificate at full size"><img src="assets/lamen-iso-certificate.jpeg" alt="ISO 9001:2015 certificate published by LAMEN" loading="lazy"></a><div><span class="achievement-label">QUALITY MANAGEMENT</span><h3>ISO 9001:2015<br>certification</h3><p>LAMEN’s achievement page publishes a certificate for its quality management system, covering microfinancial services and related customer support.</p><div class="achievement-facts"><span>Certificate issued<strong>30 December 2025</strong></span><span>Certificate number<strong>25123001</strong></span></div><a class="achievement-link" href="https://lamen.af/Achievement.html" target="_blank" rel="noopener">View LAMEN’s published certificate ↗</a></div></article><div class="achievement-grid"><article class="achievement-tile"><span class="achievement-label">SECTOR MEMBERSHIP</span><h3>Afghanistan Microfinance Association</h3><p>LAMEN’s official video gallery shares its receipt of an AMA membership certificate.</p><a class="achievement-link" href="https://www.youtube.com/watch?v=m3noiz_vNvo" target="_blank" rel="noopener">Watch the official announcement ↗</a></article><article class="achievement-tile"><span class="achievement-label">INSTITUTIONAL MILESTONE</span><h3>Financing operations inaugurated</h3><p>The official gallery documents the inauguration of LAMEN’s financing operations.</p><a class="achievement-link" href="https://www.youtube.com/watch?v=oPLyMpNEnFY" target="_blank" rel="noopener">Watch the inauguration ↗</a></article></div><p class="achievement-note">Sources: LAMEN’s Achievement and Gallery pages. Certificate details are transcribed from the published document; this page does not independently verify certification status.</p></div>`;
  document.body.append(dialog);
  let previousOverflow = "",
    opener = null;
  document.querySelectorAll("[data-achievements]").forEach((button) => {
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", dialog.id);
    button.addEventListener("click", () => {
      opener = button;
      previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = "hidden";
      dialog.querySelector(".achievement-close").focus();
    });
  });
  dialog.querySelector(".achievement-close").onclick = () => dialog.close();
  dialog.addEventListener("close", () => {
    document.body.style.overflow = previousOverflow;
    if (opener) opener.focus();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog) {
      const b = dialog.getBoundingClientRect();
      if (
        e.clientX < b.left ||
        e.clientX > b.right ||
        e.clientY < b.top ||
        e.clientY > b.bottom
      )
        dialog.close();
    }
  });
})();
