import { onMounted, ref } from 'vue'

/**
 * 真实状态栏高度（px）。env(safe-area-inset-top) 在 Android 上恒为 0（状态栏不属于安全区 inset），
 * 导致自定义导航标题被状态栏遮挡；这里用 uni 的系统信息拿到准确高度兜底。
 */
export function useSafeTop() {
  const statusBarHeight = ref(0)
  onMounted(() => {
    try {
      statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
    }
    catch {
      statusBarHeight.value = 0
    }
  })
  return { statusBarHeight }
}
