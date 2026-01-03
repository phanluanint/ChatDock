import { Webview } from '@tauri-apps/api/webview';

class WebviewManagerService {
  private activeWebviews: Map<string, Webview> = new Map();

  register(label: string, webview: Webview) {
    console.log(`[WebviewManager] Registering ${label}`);
    this.activeWebviews.set(label, webview);
  }

  unregister(label: string) {
    console.log(`[WebviewManager] Unregistering ${label}`);
    this.activeWebviews.delete(label);
  }

  async close(label: string) {
    const webview = this.activeWebviews.get(label);
    if (webview) {
      console.log(`[WebviewManager] Closing ${label}`);
      try {
        await webview.close();
      } catch (err) {
        console.warn(`[WebviewManager] Failed to close ${label}:`, err);
      }
      this.activeWebviews.delete(label);
    }
  }

  async closeAll() {
    console.log(`[WebviewManager] Closing ALL webviews (${this.activeWebviews.size} active)`);
    const promises: Promise<void>[] = [];

    for (const [label, webview] of this.activeWebviews.entries()) {
      promises.push(
        (async () => {
          try {
            await webview.close();
            console.log(`[WebviewManager] Closed ${label}`);
          } catch (err) {
            console.warn(`[WebviewManager] Failed to close ${label}:`, err);
          }
        })()
      );
    }

    await Promise.all(promises);
    this.activeWebviews.clear();

    // Fallback: check tauri global webviews just in case
    try {
      const { getAllWebviews } = await import('@tauri-apps/api/webview');
      const all = await getAllWebviews();
      for (const wv of all) {
        if (wv.label.startsWith('emb-')) { // Our convention
          console.log(`[WebviewManager] Found orphaned webview ${wv.label}, closing...`);
          await wv.close();
        }
      }
    } catch (e) {
      // ignore
    }
  }
}

export const WebviewManager = new WebviewManagerService();
