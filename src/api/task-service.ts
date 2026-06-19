import request from '@utils/http'

export function fetchSubmitCancelTask(params: any) {
  return request.get<any>({
    url: '/task/submitCancelTask',
    params
  })
}

export function fetchSubmitDeleteDirectory(data: any) {
  return request.post<any>({
    url: '/task/submitDeleteDirectory',
    data
  })
}

export function fetchGetFileAttribute(params: any) {
  return request.get<any>({
    url: '/task/computeFileAttribute',
    params
  })
}
