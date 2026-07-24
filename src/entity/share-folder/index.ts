type NfsPerm = 'ro' | 'rw'
type NfsSyncMode = 'sync' | 'async'
type NfsSquashMode = 'root_squash' | 'no_root_squash' | 'all_squash'

export class SysUser {
  userName: string
  userAlias: string
  groupName: string
  groupAlias: string
  uid: number
  gid: number

  constructor() {
    this.userName = ''
    this.userAlias = ''
    this.groupName = ''
    this.groupAlias = ''
    this.uid = 0
    this.gid = 0
  }
}

export class NFSShareFolderConfig {
  folderPath: string
  ClientAddress: string
  perm: NfsPerm
  syncMode: NfsSyncMode
  Squash: NfsSquashMode
  noSubtreeCheck: boolean
  insecure: boolean
  squashUser: SysUser

  constructor() {
    this.folderPath = ''
    this.ClientAddress = ''
    this.perm = 'ro'
    this.syncMode = 'sync'
    this.Squash = 'no_root_squash'
    this.noSubtreeCheck = false
    this.insecure = false
    this.squashUser = new SysUser()
  }
}
