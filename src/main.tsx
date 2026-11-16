import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource/spectral/500";
import "@fontsource/spectral/700";
import "@fontsource/spectral/800";
import "@fontsource-variable/public-sans";
import "@fontsource/caveat/600";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

// Offline copy for the home-screen app (see public/sw.js). Only in the built site: in
// development it would serve stale files.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then(() => navigator.serviceWorker.ready)
      .then(() => {
        // Browsers only fetch a font the first time it's used, so a heading weight never seen
        // online would be missing offline. Fetch the Latin ones now so they get saved too.
        document.fonts.forEach((face) => {
          // Browsers write the Latin range as "U+0-FF, …".
          if (face.status === "unloaded" && /^U\+0+-0*FF\b/i.test(face.unicodeRange)) face.load().catch(() => {});
        });
      })
      .catch(() => {
        // No offline copy; the site works the same online.
      });
  });
}
