// 系统通知的对象
export class SysNotify {
  // 通知主键ID
  id: number
  // 接收用户UID
  receiverUid: number
  // 所属模块 user/file/storage/system
  module: string
  // 消息类型
  notifyType: number
  // 消息优先级
  priority: number
  // 消息标题
  title: string
  // 消息内容
  content: string
  // 是否已读 0未读 1已读
  isRead: number
  // 消息产生时间
  notifyTime: string
  // 读取时间，可为空
  readTime?: string
  // 扩展JSON参数
  extraData?: string
  // 发送人UID，系统消息为null/0
  creatorUid?: number
  // 软删除 0正常 1删除
  delFlag: number
  // 记录创建时间
  createAt: string
  // 记录更新时间
  updateAt: string

  constructor(data?: Partial<SysNotify>) {
    this.id = data?.id ?? 0
    this.receiverUid = data?.receiverUid ?? 0
    this.module = data?.module ?? ''
    this.notifyType = data?.notifyType ?? 0
    this.priority = data?.priority ?? 0
    this.title = data?.title ?? ''
    this.content = data?.content ?? ''
    this.isRead = data?.isRead ?? 0
    this.notifyTime = data?.notifyTime ?? ''
    this.readTime = data?.readTime
    this.extraData = data?.extraData
    this.creatorUid = data?.creatorUid
    this.delFlag = data?.delFlag ?? 0
    this.createAt = data?.createAt ?? ''
    this.updateAt = data?.updateAt ?? ''
  }
}

export class SSEEvent {
  event: string
  time: string
  status: string
  data: any
  constructor(data?: Partial<SSEEvent>) {
    this.event = data?.event ?? ''
    this.time = data?.time ?? ''
    this.status = data?.status ?? ''
    this.data = data?.data ?? {}
  }

  public clear() {
    this.event = ''
    this.time = ''
    this.status = ''
    this.data = null
  }
}

export type NoticeType = 'warning' | 'error' | 'success' | 'notice' | 'unknown'

export interface FileUserInfo {
  userName: string
  uid: number
  userAlias: string
  userEmail: string
  groupName: string
  gid: number
  groupAlias: string
}

// 文件属性信息
export interface FileAttribute {
  name: string
  path: string
  permission: string
  modifyTime: string
  isDir: boolean
  totalBytes: number
  totalDirs: number
  totalFiles: number
  userInfo?: FileUserInfo
}
