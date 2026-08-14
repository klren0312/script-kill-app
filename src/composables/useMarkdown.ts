/**
 * Markdown 解析工具：将常见的 Markdown 语法转换为 HTML 字符串。
 *
 * 采用纯正则实现，不依赖 DOM API，可在 uni-app 所有平台（H5 / App / 小程序）安全运行。
 *
 * 支持的语法：
 * - 标题：# H1  ~  ###### H6
 * - 粗体：**bold**  /  __bold__
 * - 斜体：*italic*  /  _italic_
 * - 行内代码：`code`
 * - 链接：[text](url)
 * - 图片：![alt](url)
 * - 无序列表：- / * / + 前缀
 * - 有序列表：数字. 前缀
 * - 引用块：> 前缀
 * - 分割线：--- / *** / ___
 * - 段落：连续文本按双换行分段
 */

export interface ParseMarkdownOptions {
  /** 是否将结果包裹在外层 div 中（rich-text 用） */
  wrap?: boolean
}

/**
 * 将单行文本中的行内 markdown 语法转为 HTML。
 * 在块级元素解析之后调用。
 */
function parseInline(text: string): string {
  let html = text

  // 行内代码（最优先，避免被其他规则破坏）
  html = html.replace(/`([^`\n]+)`/g, '<code class="sk-md-code">$1</code>')

  // 粗体
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/__([^_\n]+)__/g, '<strong>$1</strong>')

  // 斜体
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
  html = html.replace(/_([^_\n]+)_/g, '<em>$1</em>')

  // 链接
  html = html.replace(/\[([^\]]*)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')

  // 图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')

  return html
}

/**
 * 将 markdown 文本转换为 HTML 字符串。
 */
export function parseMarkdown(src: string, options: ParseMarkdownOptions = {}): string {
  const { wrap = true } = options
  const lines = src.split('\n')
  const result: string[] = []

  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    // 空行 → 跳过（作为段落分隔符）
    if (line.trim() === '') {
      i++
      continue
    }

    // 标题
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      const level = headingMatch[1].length
      const content = parseInline(headingMatch[2].trim())
      result.push(`<h${level}>${content}</h${level}>`)
      i++
      continue
    }

    // 分割线
    if (/^(---|\*\*\*|___)$/.test(line.trim())) {
      result.push('<hr/>')
      i++
      continue
    }

    // 引用块（可能多行）
    if (/^>\s/.test(line)) {
      const quoteLines: string[] = []
      while (i < lines.length && /^>\s?/.test(lines[i])) {
        quoteLines.push(lines[i].replace(/^>\s?/, ''))
        i++
      }
      const content = parseInline(quoteLines.join('\n'))
      result.push(`<blockquote>${content}</blockquote>`)
      continue
    }

    // 无序列表（连续 - / * / + 前缀行）
    if (/^[-*+]\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^[-*+]\s+/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^[-*+]\s+/, '').trim())}</li>`)
        i++
      }
      result.push(`<ul>${items.join('')}</ul>`)
      continue
    }

    // 有序列表（连续 数字. 前缀行）
    if (/^\d+\.\s+/.test(line)) {
      const items: string[] = []
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push(`<li>${parseInline(lines[i].replace(/^\d+\.\s+/, '').trim())}</li>`)
        i++
      }
      result.push(`<ol>${items.join('')}</ol>`)
      continue
    }

    // 段落（连续非空行）
    const paraLines: string[] = [line]
    i++
    while (i < lines.length && lines[i].trim() !== '') {
      // 如果下一行是块级元素，停止当前段落
      const next = lines[i]
      if (/^(#{1,6}\s|---|\*\*\*|___|>|[-*+]\s|\d+\.\s)/.test(next)) {
        break
      }
      paraLines.push(next)
      i++
    }
    const paraContent = parseInline(paraLines.join(' ').trim())
    result.push(`<p>${paraContent}</p>`)
  }

  let html = result.join('\n')

  if (wrap) {
    html = `<div class="sk-md">${html}</div>`
  }

  return html
}
