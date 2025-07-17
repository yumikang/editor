import * as path from 'path';
import { getTemplateWatcher } from './template-watcher';

const THEMES_PATH = path.join(process.cwd(), "../themes");
const DATA_PATH = path.join(process.cwd(), "app/data/themes");

let isInitialized = false;

export async function initializeServer(): Promise<void> {
  if (isInitialized) {
    return;
  }

  console.log('[ServerInit] Initializing CodeB WebCraft Studio server...');

  try {
    // 템플릿 감시 시작
    const watcher = getTemplateWatcher(THEMES_PATH, DATA_PATH);
    
    // 이벤트 리스너 등록
    watcher.on('templateAdded', (event) => {
      console.log(`[ServerInit] 🆕 New template detected: ${event.templateId}`);
    });
    
    watcher.on('templateRemoved', (event) => {
      console.log(`[ServerInit] 🗑️ Template removed: ${event.templateId}`);
    });
    
    watcher.on('templateModified', (event) => {
      console.log(`[ServerInit] 📝 Template modified: ${event.templateId}`);
    });
    
    watcher.on('watchingStarted', (data) => {
      console.log(`[ServerInit] ✅ Template watching started for ${data.knownTemplates.length} templates`);
    });

    // 감시 시작
    await watcher.startWatching();
    
    isInitialized = true;
    console.log('[ServerInit] ✅ Server initialization completed');
    
  } catch (error) {
    console.error('[ServerInit] ❌ Server initialization failed:', error);
  }
}

// 서버 종료 시 정리
export function cleanupServer(): void {
  if (!isInitialized) {
    return;
  }

  console.log('[ServerInit] Cleaning up server resources...');
  
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { stopGlobalWatcher } = require('./template-watcher');
    stopGlobalWatcher();
    
    isInitialized = false;
    console.log('[ServerInit] ✅ Server cleanup completed');
  } catch (error) {
    console.error('[ServerInit] ❌ Server cleanup failed:', error);
  }
}

// 프로세스 종료 시 정리
process.on('SIGINT', cleanupServer);
process.on('SIGTERM', cleanupServer);
process.on('exit', cleanupServer);