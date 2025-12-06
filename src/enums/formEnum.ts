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
  RAID0 = 'RAID0',
  RAID1 = 'RAID1',
  RAID5 = 'RAID5',
  RAID6 = 'RAID6'
}

// ZFSPool 存储池的等级
export enum ZFSPoolGrade {
  RAID_Z1 = 'RAID_Z1'
}
