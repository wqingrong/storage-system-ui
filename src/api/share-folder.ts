import request from '@utils/http'
import { Api } from '@/typings/api'
import { NFSShareFolderConfig } from '@/entity/share-folder'

export function fetchGetShareFolderList() {
  return request.get<Api.Sys.ShareFolderList>({
    url: '/shareFolder/getShareFolderList'
  })
}

export function fetchGetSambaShareConfig(params: any) {
  return request.get<Api.Sys.SambaShareFolderConfig>({
    url: '/shareFolder/getSambaShareConfig',
    params
  })
}

export function fetchNewShareFolder(data: Api.Dto.NewShareFolderDto) {
  return request.post<Api.Dto.NewShareFolderDto>({
    url: '/shareFolder/newShareFolder',
    data
  })
}

export function fetchEditSambaShare(data: Api.Sys.SambaShareFolderConfig) {
  return request.post<Api.Sys.SambaShareFolderConfig>({
    url: '/shareFolder/editSambaShare',
    data
  })
}

export function fetchDeleteShare(data: Api.Sys.ShareFolder) {
  return request.post<Api.Sys.ShareFolder>({
    url: '/shareFolder/delShareFolder',
    data
  })
}

export function fetchSetNfsShareConfig(data: any) {
  return request.post<NFSShareFolderConfig>({
    url: '/shareFolder/setNFSShareConfig',
    data
  })
}

export function fetchDeleteNfsShareConfigs(data: NFSShareFolderConfig[]) {
  return request.post<NFSShareFolderConfig[]>({
    url: '/shareFolder/delNFSShareConfigs',
    data
  })
}
