import { Webview } from '@tauri-apps/api/webview';
import { AIModel } from '../types';

interface TrackedWebview {
  webview: Webview;
  model: AIModel;
}

class WebviewManagerService {
  private activeWebviews: Map<string, TrackedWebview> = new Map();

  async register(label: string, webview: Webview, model: AIModel) {
    console.log(`[WebviewManager] Registering ${label} for model ${model}`);

    // Enforce singleton: Close any other existing webviews for this model
    for (const [existingLabel, tracked] of this.activeWebviews.entries()) {
      if (tracked.model === model && existingLabel !== label) {
        console.log(`[WebviewManager] Found conflict: ${existingLabel} already exists for ${model}. Closing it to enforce singleton.`);
        await this.close(existingLabel);
      }
    }

    this.activeWebviews.set(label, { webview, model });
  }

  unregister(label: string) {
    console.log(`[WebviewManager] Unregistering ${label}`);
    this.activeWebviews.delete(label);
  }

  async close(label: string) {
    const tracked = this.activeWebviews.get(label);
    if (tracked) {
      console.log(`[WebviewManager] Closing ${label}`);
      try {
        await tracked.webview.close();
      } catch (err) {
        console.warn(`[WebviewManager] Failed to close ${label}:`, err);
      }
      this.activeWebviews.delete(label);
    }
  }

  /**
   * Ensures only webviews for the currently active models remain open.
   * Closes any webview whose model is NOT in the activeModels list.
   */
  async reconcile(activeModels: AIModel[]) {
    console.log(`[WebviewManager] Reconciling: Active models are [${activeModels.join(', ')}]`);
    const promises: Promise<void>[] = [];

    for (const [label, tracked] of this.activeWebviews.entries()) {
      if (!activeModels.includes(tracked.model)) {
        console.log(`[WebviewManager] Label ${label} (Model ${tracked.model}) is no longer active. Closing...`);
        promises.push(this.close(label));
      }
    }

    await Promise.all(promises);
  }

  async closeAll() {
    console.log(`[WebviewManager] Closing ALL webviews (${this.activeWebviews.size} active)`);
    const promises: Promise<void>[] = [];

    for (const label of this.activeWebviews.keys()) {
      promises.push(this.close(label));
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
