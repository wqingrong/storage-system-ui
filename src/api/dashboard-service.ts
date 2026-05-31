import request from '@utils/http'
import { Api } from '@/typings/api'

export function fetchGetGeneralView() {
  return request.get<Api.Dashboard.GeneralView>({
    url: '/dashboard/getGeneralView',
    loading: true
  })
}
