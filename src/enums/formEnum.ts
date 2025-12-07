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
  RAID_6 = 'RAID_6'
}

// ZFSPool 存储池的等级
export enum ZFSPoolGrade {
  RAID_Z1 = 'RAID_Z1'
}
