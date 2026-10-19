/* LAMEN — contact form behaviour (homepage and contact.html).

   Enhances every <form data-lx-contact>:
     · accessible inline validation with clear messages;
     · if data-endpoint holds a URL, the form is POSTed there as JSON with
       loading, success and error states — success is shown only when the
       server answers with a 2xx status;
     · if no endpoint is configured (the current situation: this static
       site has no backend), the visitor is told plainly that the message
       has NOT been sent and is offered their email app (pre-filled) or a
       copy of the message instead.

   To connect a real backend later, set data-endpoint="https://…" on the
   form. Never place API keys or other secrets in this file. */
(() => {
  "use strict";

  const forms = document.querySelectorAll("form[data-lx-contact]");
  if (!forms.length) return;

  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const PHONE = /^\+?[0-9\s().-]{7,20}$/;

  const messageFor = (field) => {
    const v = field.value.trim();
    const label = field.dataset.label || "This field";
    if (field.required && !v) {
      if (field.tagName === "SELECT") return "Please choose a topic.";
      if (field.type === "email") return "Please enter your email address.";
      if (field.name === "name") return "Please enter your full name.";
      if (field.name === "message") return "Please tell us how we can help.";
      return label + " is required.";
    }
    if (!v) return "";
    if (field.type === "email" && !EMAIL.test(v))
      return "Please enter a valid email address, for example name@example.com.";
    if (field.type === "tel" && !PHONE.test(v))
      return "Please enter a valid phone number, including the country code (for example +93 …).";
    if (field.name === "name" && v.length < 2) return "Please enter your full name.";
    const min = Number(field.getAttribute("minlength") || 0);
    if (min && v.length < min)
      return "Please write at least " + min + " characters so we can help (" + v.length + " so far).";
    return "";
  };

  forms.forEach((form, formIndex) => {
    form.noValidate = true;
    const fields = [...form.querySelectorAll("input, select, textarea")].filter(
      (f) => f.type !== "hidden" && f.type !== "checkbox" && !f.closest("[data-lx-trap]"),
    );
    const submit = form.querySelector('[type="submit"]');
    const submitHTML = submit ? submit.innerHTML : "";
    const recipient = form.dataset.recipient || "info@lamen.af";

    // One error slot per field, linked for assistive technology.
    fields.forEach((field, i) => {
      const err = document.createElement("p");
      err.className = "lx-field-error";
      err.id = "lx-err-" + formIndex + "-" + i;
      err.hidden = true;
      field.insertAdjacentElement("afterend", err);
      const describedBy = (field.getAttribute("aria-describedby") || "").trim();
      field.setAttribute("aria-describedby", (describedBy + " " + err.id).trim());
    });

    let status = form.querySelector("[data-lx-status]");
    if (!status) {
      status = document.createElement("div");
      status.setAttribute("data-lx-status", "");
      (submit ? submit : form.lastElementChild).insertAdjacentElement("afterend", status);
    }
    status.className = "lx-form-status";
    status.setAttribute("role", "status");
    status.setAttribute("aria-live", "polite");
    status.hidden = true;
    status.tabIndex = -1;

    let attempted = false;
    const check = (field) => {
      const msg = messageFor(field);
      const err = document.getElementById(field.getAttribute("aria-describedby").split(" ").pop());
      field.setAttribute("aria-invalid", msg ? "true" : "false");
      field.classList.toggle("lx-invalid", !!msg);
      if (err) {
        err.textContent = msg;
        err.hidden = !msg;
      }
      return !msg;
    };
    fields.forEach((f) => {
      f.addEventListener("blur", () => {
        if (attempted || f.value.trim()) check(f);
      });
      f.addEventListener("input", () => {
        if (f.getAttribute("aria-invalid") === "true") check(f);
      });
    });

    const showStatus = (kind, title, body, actions = []) => {
      status.hidden = false;
      status.dataset.kind = kind;
      status.replaceChildren();
      const h = document.createElement("strong");
      h.textContent = title;
      const p = document.createElement("p");
      p.textContent = body;
      status.append(h, p);
      if (actions.length) {
        const row = document.createElement("div");
        row.className = "lx-form-status-actions";
        actions.forEach((a) => row.append(a));
        status.append(row);
      }
    };

    const values = () => {
      const data = {};
      fields.forEach((f) => (data[f.name] = f.value.trim()));
      const sel = form.querySelector("select[name='subject']");
      if (sel) data.subjectLabel = sel.options[sel.selectedIndex]?.text || data.subject;
      return data;
    };

    const composeText = (d) =>
      [
        "Name: " + (d.name || ""),
        "Email: " + (d.email || ""),
        d.phone ? "Phone: " + d.phone : "",
        d.branch ? "Preferred branch: " + d.branch : "",
        "Topic: " + (d.subjectLabel || ""),
        "",
        d.message || "",
      ]
        .filter((line, i) => line !== "" || i === 5)
        .join("\n");

    const setBusy = (busy) => {
      if (!submit) return;
      submit.disabled = busy;
      submit.setAttribute("aria-busy", String(busy));
      submit.classList.toggle("is-loading", busy);
      if (busy) {
        submit.replaceChildren();
        const spin = document.createElement("span");
        spin.className = "lx-spinner";
        spin.setAttribute("aria-hidden", "true");
        submit.append(spin, document.createTextNode(" Sending…"));
      } else submit.innerHTML = submitHTML;
    };

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      attempted = true;
      const results = fields.map(check);
      const firstBad = fields[results.indexOf(false)];
      if (firstBad) {
        status.hidden = true;
        firstBad.focus();
        return;
      }
      // Spam trap: real visitors never fill the hidden field.
      const trap = form.querySelector("[data-lx-trap] input");
      if (trap && trap.value) return;

      const d = values();
      const endpoint = (form.dataset.endpoint || "").trim();

      if (!endpoint) {
        const subject = "Website inquiry: " + (d.subjectLabel || "General");
        const mail = document.createElement("a");
        mail.className = "lx-status-btn";
        mail.href =
          "mailto:" + recipient +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(composeText(d));
        mail.textContent = "Open in your email app";
        const copy = document.createElement("button");
        copy.type = "button";
        copy.className = "lx-status-btn is-ghost";
        copy.textContent = "Copy message";
        copy.addEventListener("click", async () => {
          try {
            await navigator.clipboard.writeText(composeText(d));
            copy.textContent = "Copied";
          } catch {
            copy.textContent = "Copy not available";
          }
        });
        showStatus(
          "notice",
          "Your message has not been sent yet.",
          "Online sending isn’t connected on this website yet. Open your email app to send it to " +
            recipient + " (your details are filled in), or call +93 76 540 4040.",
          [mail, copy],
        );
        status.focus?.();
        return;
      }

      setBusy(true);
      status.hidden = true;
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      try {
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(d),
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error("HTTP " + res.status);
        form.reset();
        fields.forEach((f) => {
          f.removeAttribute("aria-invalid");
          f.classList.remove("lx-invalid");
        });
        attempted = false;
        showStatus(
          "success",
          "Thank you — your message has been sent.",
          "Our team will reply by email. For urgent questions, call +93 76 540 4040.",
        );
      } catch (err) {
        showStatus(
          "error",
          "We couldn’t send your message.",
          "Please check your connection and try again, or email " + recipient +
            " or call +93 76 540 4040.",
        );
      } finally {
        clearTimeout(timer);
        setBusy(false);
      }
    });
  });
})();
