(() => {
  const all = window.LAMEN_GALLERY || [],
    track = document.querySelector(".gallery-track");
  const dialog = document.getElementById("gallery-viewer"),
    content = document.getElementById("media-content");
  let filtered = [],
    current = 0,
    type = "all",
    region = "all",
    raf = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const categories = [...new Set(all.map((item) => item.category))];
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    document.getElementById("gallery-category").append(option);
  });
  function show(item) {
    document.getElementById("media-title").textContent = item.title;
    const source = document.getElementById("media-source");
    source.href = item.source || item.src;
    source.textContent =
      item.type === "video" && item.youtube
        ? "Watch on YouTube ↗"
        : "Original source ↗";
    content.replaceChildren();
    let media;
    if (item.youtube) {
      media = document.createElement("iframe");
      media.src = "https://www.youtube-nocookie.com/embed/" + item.youtube;
      media.title = item.title;
      media.allow = "fullscreen; picture-in-picture; encrypted-media";
      media.referrerPolicy = "strict-origin-when-cross-origin";
      media.allowFullscreen = true;
    } else if (item.type === "video") {
      media = document.createElement("video");
      media.src = item.src;
      media.controls = true;
      media.playsInline = true;
      media.preload = "metadata";
      if (item.poster) media.poster = item.poster;
    } else {
      media = document.createElement("img");
      media.src = item.src;
      media.alt = item.title;
    }
    content.append(media);
    dialog.showModal();
    document.body.style.overflow = "hidden";
  }
  dialog.addEventListener("close", () => {
    content.replaceChildren();
    document.body.style.overflow = "";
  });
  document.getElementById("media-close").onclick = () => dialog.close();
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
  function update() {
    raf = 0;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closest = Infinity;
    [...track.children].forEach((card, index) => {
      const distance = card.offsetLeft + card.offsetWidth / 2 - center;
      if (Math.abs(distance) < closest) {
        closest = Math.abs(distance);
        current = index;
      }
      const amount = Math.max(-1, Math.min(1, distance / 500));
      card.style.setProperty("--rotate", -amount * 16 + "deg");
      card.style.setProperty("--scale", 1 - Math.abs(amount) * 0.12);
      card.style.setProperty("--opacity", 1 - Math.abs(amount) * 0.25);
    });
    [...track.children].forEach((card, index) =>
      card.classList.toggle("is-current", index === current),
    );
    document.getElementById("gallery-count").textContent = filtered.length
      ? String(current + 1).padStart(2, "0") +
        " / " +
        String(filtered.length).padStart(2, "0")
      : "0 / 0";
    document.querySelector(".gallery-progress span").style.width =
      filtered.length ? ((current + 1) / filtered.length) * 100 + "%" : "0%";
  }
  function go(index) {
    if (!filtered.length) return;
    current = (index + filtered.length) % filtered.length;
    const card = track.children[current];
    track.scrollTo({
      left: card.offsetLeft - (track.clientWidth - card.offsetWidth) / 2,
      behavior: reduced.matches ? "instant" : "smooth",
    });
  }
  function render() {
    filtered = all.filter(
      (item) =>
        (type === "all" || item.type === type) &&
        (region === "all" || item.category === region),
    );
    track.replaceChildren();
    current = 0;
    filtered.forEach((item, index) => {
      const card = document.createElement("button");
      card.type = "button";
      card.className = "gallery-card";
      card.setAttribute("aria-label", "Open " + item.title);
      const img = document.createElement("img");
      img.src = item.poster || item.src;
      img.alt = "";
      img.loading = index < 3 ? "eager" : "lazy";
      img.decoding = "async";
      card.append(img);
      const tag = document.createElement("span");
      tag.className = "gallery-media-tag";
      tag.textContent = item.type === "video" ? "▶ FILM" : "PHOTOGRAPH";
      card.append(tag);
      if (item.type === "video") {
        const play = document.createElement("span");
        play.className = "gallery-play";
        play.textContent = "▶";
        play.setAttribute("aria-hidden", "true");
        card.append(play);
      }
      const caption = document.createElement("span");
      caption.className = "gallery-card-caption";
      const small = document.createElement("small");
      small.textContent = item.category;
      const title = document.createElement("strong");
      title.textContent = item.title;
      caption.append(small, title);
      card.append(caption);
      card.onclick = () => show(item);
      card.addEventListener("focus", () => go(index));
      track.append(card);
    });
    track.scrollLeft = 0;
    requestAnimationFrame(update);
    document.getElementById("gallery-empty").hidden = filtered.length > 0;
    document
      .querySelectorAll(".gallery-control-buttons button")
      .forEach((b) => (b.disabled = !filtered.length));
  }
  track.addEventListener(
    "scroll",
    () => {
      if (!raf) raf = requestAnimationFrame(update);
    },
    { passive: true },
  );
  track.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        const atStart = track.scrollLeft <= 1,
          atEnd = track.scrollLeft >= track.scrollWidth - track.clientWidth - 1;
        if ((e.deltaY < 0 && atStart) || (e.deltaY > 0 && atEnd)) return;
        e.preventDefault();
        track.scrollLeft += e.deltaY * (e.deltaMode === 1 ? 18 : 1);
      }
    },
    { passive: false },
  );
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      go(current + (e.key === "ArrowRight" ? 1 : -1));
    }
  });
  document.getElementById("gallery-prev").onclick = () => go(current - 1);
  document.getElementById("gallery-next").onclick = () => go(current + 1);
  document.querySelectorAll("[data-gallery-filter]").forEach(
    (button) =>
      (button.onclick = () => {
        type = button.dataset.galleryFilter;
        document
          .querySelectorAll("[data-gallery-filter]")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        render();
      }),
  );
  document.getElementById("gallery-category").onchange = (e) => {
    region = e.target.value;
    render();
  };
  window.addEventListener("resize", () => {
    update();
    go(current);
  });
  render();
})();
