<script setup lang="ts">
import { computed } from 'vue'
import { parseMarkdown } from '@/composables/useMarkdown'

const props = defineProps<{
  source: string
  /** 可选：渲染后额外应用 CSS 类名 */
  class?: string
  /** 可选：注入 root 节点的 text-color（rich-text scoped 不可达，用内联 style 兜底） */
  color?: string
}>()

const html = computed(() => {
  const parsed = parseMarkdown(props.source)
  if (props.color) {
    return parsed.replace('<div class="sk-md">', `<div class="sk-md" style="color:${props.color}">`)
  }
  return parsed
})
</script>

<template>
  <rich-text :nodes="html" class="sk-markdown" :class="props.class" />
</template>

<style lang="scss">
.sk-markdown {
  .sk-md {
    font-size: 26rpx;
    line-height: 1.75;
    color: #d8d8e8;
    word-break: break-word;

    h1, h2, h3, h4, h5, h6 {
      color: #edeDF5;
      font-weight: 600;
      margin: 0.5em 0 0.3em;
      line-height: 1.4;
    }
    h1 { font-size: 36rpx; }
    h2 { font-size: 32rpx; }
    h3 { font-size: 28rpx; }
    h4 { font-size: 26rpx; }
    h5 { font-size: 24rpx; }
    h6 { font-size: 22rpx; }

    p {
      margin: 0.5em 0;
    }

    strong {
      color: #edeDF5;
      font-weight: 700;
    }

    em {
      font-style: italic;
    }

    code {
      padding: 2rpx 8rpx;
      font-size: 22rpx;
      font-family: 'Monaco', 'Consolas', monospace;
      background: rgba(255, 255, 255, 0.08);
      border-radius: 4rpx;
      color: #c084fc;
    }

    a {
      color: #60a5fa;
      text-decoration: underline;
    }

    ul, ol {
      padding-left: 1em;
      margin: 0.5em 0;
    }

    li {
      margin: 0.25em 0;
    }

    blockquote {
      padding: 0.5em 1em;
      margin: 0.5em 0;
      border-left: 4rpx solid #a855f7;
      background: rgba(168, 85, 247, 0.08);
      color: #b8b8c8;
    }

    hr {
      border: none;
      border-top: 1rpx solid rgba(255, 255, 255, 0.08);
      margin: 1em 0;
    }
  }
}
</style>
