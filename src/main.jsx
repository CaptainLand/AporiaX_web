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

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <RootApp />
    </AuthProvider>
  </React.StrictMode>,
);
