import type { App } from 'vue'
import { setupEnhanceCodeDirective } from "./enhanceCode"
import { setupPermissionDirective } from './permission'

export function setupGlobDirectives(app: App) {
    setupEnhanceCodeDirective(app)
    setupPermissionDirective(app)
}