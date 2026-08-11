// 仪表盘的实体类变量数据结构
export type BuildType = 'release' | 'beta' | 'dev'

export interface VersionView {
  /** 语义化版本 主.次.补丁，升级比对核心 */
  version: string
  /** 产品名称 */
  productName: string
  /** 硬件型号，升级时用来做固件兼容性校验 */
  productModel: string
  /** 序列号,唯一表示 */
  serial: string
  /** 版本别名，给人看 */
  versionAlias: string
  /** 构建类型 */
  buildType: BuildType
  /** 编译时间 */
  buildTime: string
}
