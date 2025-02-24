import { defineConfig } from 'wxt';
import { CONTENT_SCRIPT_MATCHES } from "./utils/Matches";
// See https://wxt.dev/api/config.html
export default defineConfig({
  extensionApi: 'chrome',
  modules: ['@wxt-dev/module-react'],
  manifest: {
    permissions: ["activeTab", "scripting", "tabs", "storage", "desktopCapture", "tabCapture"],
    action: {},
    host_permissions: [CONTENT_SCRIPT_MATCHES],
  },
  runner: {
    startUrls: ["https://www.youtube.com/watch?v=uKWrCAWyLnE"],
  },
});
