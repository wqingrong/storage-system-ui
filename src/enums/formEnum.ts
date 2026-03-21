// 表单枚举

// 页面类型
export enum PageModeEnum {
  Add, // 新增
  Edit // 编辑
}

// 表格大小
export enum TableSizeEnum {
  DEFAULT = 'default',
  SMALL = 'small',
  LARGE = 'large'
}

// 普通的raid等级
export enum RaidGrade {
  RAID_0 = 'RAID_0',
  RAID_1 = 'RAID_1',
  RAID_5 = 'RAID_5',
  RAID_6 = 'RAID_6',
  RAID_Stripe = 'RAID_Stripe',
  RAID_Mirror = 'RAID_Mirror',
  RAID_Z1 = 'RAID_Z1',
  RAID_Z2 = 'RAID_Z2',
  RAID_Z3 = 'RAID_Z3'
}

// ZFSPool 存储池的等级
export enum ZFSPoolGrade {
  RAID_Z1 = 'RAID_Z1'
}

// 正则表达式的集合
export const REGULAR = {
  CREATE_DIR: /^[\u4e00-\u9fa5a-zA-Z0-9_.\- ]+$/
} as const
