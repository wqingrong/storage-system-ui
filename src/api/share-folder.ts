import request from '@utils/http'

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
