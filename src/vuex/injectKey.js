export const storeKey = 'store'
import {inject} from 'vue'
// vue 内部已经将这个些api导出来了
export function useStore(injectKey = null) {
    return inject(injectKey !== null ? injectKey : storeKey)
}