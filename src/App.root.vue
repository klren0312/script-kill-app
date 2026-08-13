<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useLocale, useTheme } from 'uview-pro'

const { darkMode, currentTheme } = useTheme()
const { currentLocale, locales } = useLocale()

onLaunch(() => {
  if (import.meta.env.DEV) {
    console.log('[App] darkMode:', darkMode.value)
    console.log('[App] theme:', currentTheme.value?.name)
    console.log('[App] locale:', currentLocale.value?.name)
  }
})
</script>

<template>
  <u-config-provider>
    <slot />
    <u-toast global />
  </u-config-provider>
</template>

<style lang="scss"></style>
