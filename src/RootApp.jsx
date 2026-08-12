import App from "./App.jsx";
import DesktopAuthorizePage from "./desktop/DesktopAuthorizePage.jsx";

const BASE_URL = import.meta.env.BASE_URL || "/";
const BASE_PATH = BASE_URL === "/" ? "" : BASE_URL.replace(/\/$/, "");

function relativePathname(pathname) {
  if (BASE_PATH && pathname.startsWith(BASE_PATH)) {
    return pathname.slice(BASE_PATH.length) || "/";
  }
  return pathname;
}

export default function RootApp() {
  const path = relativePathname(window.location.pathname);
  if (path.startsWith("/authorize/desktop")) return <DesktopAuthorizePage />;
  return <App />;
}
