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
