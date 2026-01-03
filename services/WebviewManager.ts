import { Webview } from '@tauri-apps/api/webview';
import { AIModel } from '../types';

interface TrackedWebview {
  webview: Webview;
  model: AIModel;
}

class WebviewManagerService {
  private webviews: Map<string, TrackedWebview> = new Map();

  async register(label: string, webview: Webview, model: AIModel) {
    // Close any existing webview for this model (enforce singleton per model)
    for (const [existingLabel, tracked] of this.webviews.entries()) {
      if (tracked.model === model && existingLabel !== label) {
        await this.close(existingLabel);
      }
    }
    this.webviews.set(label, { webview, model });
  }

  async close(label: string) {
    const tracked = this.webviews.get(label);
    if (tracked) {
      try {
        await tracked.webview.close();
      } catch {
        // Ignore close errors
      }
      this.webviews.delete(label);
    }
  }

  async reconcile(activeModels: AIModel[]) {
    const closePromises: Promise<void>[] = [];
    for (const [label, tracked] of this.webviews.entries()) {
      if (!activeModels.includes(tracked.model)) {
        closePromises.push(this.close(label));
      }
    }
    await Promise.all(closePromises);
  }

  async closeAll() {
    await Promise.all([...this.webviews.keys()].map(label => this.close(label)));
    this.webviews.clear();

    // Cleanup orphaned webviews
    try {
      const { getAllWebviews } = await import('@tauri-apps/api/webview');
      const all = await getAllWebviews();
      for (const wv of all) {
        if (wv.label.startsWith('emb-')) {
          await wv.close();
        }
      }
    } catch {
      // Ignore
    }
  }
}

export const WebviewManager = new WebviewManagerService();
