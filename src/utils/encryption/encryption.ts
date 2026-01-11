import CryptoJS from 'crypto-js'

/**
 * 完全兼容 Go 的固定密钥加密器
 * 密钥派生：SHA256(固定密钥) -> 32字节
 * IV派生：MD5(固定密钥) -> 前16字节
 * 加密模式：AES-256-CBC + PKCS7填充
 */
export const Encryption = {
  // 兼容 Go 的固定密钥加密器
  createGoCompatibleEncryptor(fixedKey: string) {
    // 1. 使用 SHA256 哈希固定密钥为32字节（与Go一致）
    const keyHash = CryptoJS.SHA256(fixedKey)

    // 2. 使用 MD5 哈希固定密钥，取前16字节作为IV（与Go一致）
    const ivHash = CryptoJS.MD5(fixedKey)
    // CryptoJS.MD5 返回的是WordArray，我们需要取前16字节（128位）
    const iv = CryptoJS.lib.WordArray.create(ivHash.words.slice(0, 4)) // 4 words = 16 bytes

    return {
      encrypt(text: string) {
        // 明确指定密钥、IV、模式和填充
        const encrypted = CryptoJS.AES.encrypt(text, keyHash, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        })
        // 只返回密文部分（不包含salt和iv，因为IV是固定的）
        return encrypted.toString()
      },

      decrypt(encryptedText: string) {
        const decrypted = CryptoJS.AES.decrypt(encryptedText, keyHash, {
          iv: iv,
          mode: CryptoJS.mode.CBC,
          padding: CryptoJS.pad.Pkcs7
        })
        return decrypted.toString(CryptoJS.enc.Utf8)
      }
    }
  }
}

// 加密
export const aesEncrypt = (text: string) => {
  return Encryption.createGoCompatibleEncryptor('storage-system').encrypt(text)
}

// 解密
export const aseDecrypt = (text: string) => {
  return Encryption.createGoCompatibleEncryptor('storage-system').decrypt(text)
}
