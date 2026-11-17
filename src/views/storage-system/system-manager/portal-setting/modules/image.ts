/**
 * 图片本地处理：读取文件 -> 等比缩放 -> 压缩为 dataURL
 * 用于门户设置中的背景图与标识，避免 localStorage 被原图撑爆
 */

export interface ProcessImageOptions {
  /** 最大宽度 */
  maxWidth: number
  /** 最大高度 */
  maxHeight: number
  /** 压缩质量（0-1），仅对 jpeg / webp 生效 */
  quality?: number
  /** 输出格式，auto 时按原图判断（保留透明通道） */
  format?: 'auto' | 'png' | 'jpeg'
  /** dataURL 最大字符数，超出则报错 */
  maxLength?: number
}

const DEFAULT_MAX_LENGTH = 2_400_000

/** 背景图处理参数：1920 × 1080 以内的 JPEG */
export const BACKGROUND_IMAGE_OPTIONS: ProcessImageOptions = {
  maxWidth: 1920,
  maxHeight: 1080,
  quality: 0.86,
  format: 'auto'
}

/** 标识处理参数：512 × 512 以内，保留透明通道 */
export const LOGO_IMAGE_OPTIONS: ProcessImageOptions = {
  maxWidth: 512,
  maxHeight: 256,
  quality: 0.92,
  format: 'auto'
}

/** 读取文件为 dataURL */
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(new Error('图片读取失败，请重试'))
    reader.readAsDataURL(file)
  })
}

/** 加载图片 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('图片解析失败，请更换图片'))
    image.src = src
  })
}

/** 计算缩放后的尺寸，只缩小不放大 */
function getTargetSize(width: number, height: number, maxWidth: number, maxHeight: number) {
  const ratio = Math.min(1, maxWidth / width, maxHeight / height)
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio))
  }
}

/**
 * 处理图片文件
 * @param file 原始文件
 * @param options 处理参数
 * @returns 可直接用于 img src 的 dataURL
 */
export async function processImageFile(
  file: File,
  options: ProcessImageOptions
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('请选择图片文件（JPG / PNG / WebP / GIF / SVG）')
  }

  const { maxWidth, maxHeight, quality = 0.86, format = 'auto', maxLength = DEFAULT_MAX_LENGTH } =
    options

  // 矢量图与动图不做画布处理，直接读取原文件
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    const dataUrl = await readAsDataURL(file)
    if (dataUrl.length > maxLength) {
      throw new Error('图片体积过大，请压缩后再选择')
    }
    return dataUrl
  }

  const objectUrl = URL.createObjectURL(file)

  try {
    const image = await loadImage(objectUrl)
    const { width, height } = getTargetSize(image.width, image.height, maxWidth, maxHeight)

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      throw new Error('当前浏览器不支持图片处理')
    }

    ctx.drawImage(image, 0, 0, width, height)

    const keepAlpha = format === 'auto' && /png|webp/i.test(file.type)
    const mime = format === 'auto' ? (keepAlpha ? 'image/png' : 'image/jpeg') : `image/${format}`
    const dataUrl = canvas.toDataURL(mime, quality)

    if (dataUrl.length > maxLength) {
      throw new Error('图片体积过大，请压缩后再选择')
    }

    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
