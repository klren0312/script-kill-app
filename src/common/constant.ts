export const APP_INFO: {
  name: string
  version: string
  buildTime: string
  platform: string
} = {
  name: '剧本杀工坊',
  version: '1.0.0',
  buildTime: '2026-08-13',
  platform: getPlatform(),
}

function getPlatform() {
  const sysPlatform = uni.getSystemInfoSync().platform
  if (sysPlatform) {
    return sysPlatform
  }
  // #ifdef H5
  return 'H5'
  // #endif
  // #ifdef MP-WEIXIN
  return '微信小程序'
  // #endif
  // #ifdef MP-ALIPAY
  return '支付宝小程序'
  // #endif
  // #ifdef APP-PLUS
  return 'App'
  // #endif
  // #ifdef APP-HARMONY
  return 'HarmonyOS'
  // #endif
  return '未知平台'
}
