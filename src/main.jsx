import React from "react";
import { createRoot } from "react-dom/client";
import RootApp from "./RootApp.jsx";
import { AuthProvider } from "./auth/AuthProvider.jsx";
import "./styles.css";
import "./aporiax-theme.css";
import "./product-hero.css";
import "./blue-accent.css";
import "./nav-polish.css";
import "./auth/auth.css";
import "./account/account.css";
import "./light-site.css";

const assetBase = import.meta.env.BASE_URL || "/";
document.documentElement.style.setProperty("--ax-logo-mask", `url("${assetBase}aporiax-logo-clean.png")`);
document.documentElement.style.setProperty("--ax-icon", `url("${assetBase}aporiax-icon.png")`);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  </React.StrictMode>,
);
