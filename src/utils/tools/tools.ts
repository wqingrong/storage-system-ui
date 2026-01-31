/**
 * 深度对比两个对象的所有字段值是否完全相同（支持嵌套/数组/特殊值）
 * @param {*} obj1 - 第一个值（对象/数组/基本类型）
 * @param {*} obj2 - 第二个值
 * @returns {boolean} 是否完全相同
 */
export function deepEqual(obj1: any, obj2: any) {
  // 1. 基本类型/引用地址相同：直接对比
  if (obj1 === obj2) {
    return true
  }

  // 2. 处理 NaN（NaN !== NaN，需特殊判断）
  if (obj1 !== obj1 && obj2 !== obj2) {
    return true
  }

  // 3. 排除非对象/数组类型（null 也排除）
  if (typeof obj1 !== 'object' || obj1 === null || typeof obj2 !== 'object' || obj2 === null) {
    return false
  }

  // 4. 处理 Date 对象（对比时间戳）
  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime()
  }

  // 5. 处理数组
  if (obj1 instanceof Array && obj2 instanceof Array) {
    // 长度不同直接返回 false
    if (obj1.length !== obj2.length) return false
    // 递归对比每个元素
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false
    }
    return true
  }

  // 6. 处理普通对象（非数组/Date）
  if (obj1 instanceof Object && obj2 instanceof Object) {
    const keys1 = Object.keys(obj1)
    const keys2 = Object.keys(obj2)

    // 键数量不同返回 false
    if (keys1.length !== keys2.length) return false

    // 递归对比每个键的值
    for (const key of keys1) {
      if (!keys2.includes(key) || !deepEqual(obj1[key], obj2[key])) {
        return false
      }
    }
    return true
  }

  // 其他情况（如不同类型的对象）
  return false
}
