/* Set endpoint to an HTTPS error collector you control; never put secrets here.
   The collector must allow this site's origin and alert the maintainer. */
(function () {
  "use strict";
  var endpoint = "";
  var allowed = ["build", "render", "download", "library-load", "unhandled-error", "unhandled-rejection"];
  var sent = Object.create(null);
  function report(operation) {
    if (allowed.indexOf(operation) === -1) return;
    // Never transmit exception messages, URLs, form contents or QR payloads.
    console.error("QRAVIXO operation failed: " + operation);
    if (!endpoint || sent[operation]) return;
    var target;
    try { target = new URL(endpoint); } catch (_) { return; }
    if (target.protocol !== "https:" || target.username || target.password) return;
    sent[operation] = true;
    fetch(target.href, {
      method: "POST",
      credentials: "omit",
      referrerPolicy: "no-referrer",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ app: "qravixo", operation: operation, release: "handoff-1" })
    }).then(function (response) {
      if (!response.ok) console.warn("QRAVIXO error reporting was not accepted.");
    }).catch(function () { console.warn("QRAVIXO error reporting is unavailable."); });
  }
  window.QravixoMonitoring = Object.freeze({ report: report });
  window.addEventListener("error", function () { report("unhandled-error"); });
  window.addEventListener("unhandledrejection", function () { report("unhandled-rejection"); });
})();
