import request from '@utils/http'

export function fetchSubmitCancelTask() {
  return request.get<any>({
    url: '/task/submitCancelTask'
  })
}

export function fetchSubmitDeleteDirectory(data: any) {
  return request.post<any>({
    url: '/task/submitDeleteDirectory',
    data
  })
}
