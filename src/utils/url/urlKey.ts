/**
 * 提取 Markdown 中所有图片 URL 的路径 key
 * 示例：https://xxx.cn/blog/1.png → blog/1.png
 * @param mdContent Markdown 文本
 * @returns 路径 key 数组
 */
export function getMdImagePathKeys(mdContent: string): string[] {
  if (!mdContent) return []

  const keys: string[] = []
  // 解析标准 MD 图片 ![alt](url)
  const mdImgReg = /!\[(.*?)\]\((.*?)\)/g
  let match: RegExpExecArray | null
  while ((match = mdImgReg.exec(mdContent))) {
    const url = match[2]?.trim()
    if (url) keys.push(extractPathKey(url))
  }

  // 解析 HTML <img src> 图片
  const htmlImgReg = /<img\s+[^>]*src=(["'])(.*?)\1/gi
  while ((match = htmlImgReg.exec(mdContent))) {
    const url = match[2]?.trim()
    if (url) keys.push(extractPathKey(url))
  }

  // 数组去重
  return [...new Set(keys)]
}

/**
 * 截取 URL 域名后的路径部分
 * @param url 完整链接
 * @returns 路径 key
 */
function extractPathKey(url: string): string {
  try {
    const { pathname } = new URL(url)
    return pathname.startsWith('/') ? pathname.slice(1) : pathname
  } catch {
    return url
  }
}