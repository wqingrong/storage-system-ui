import request from '@/utils/http'

/**
 * 登录
 * @param data 登录参数
 * @returns 登录响应
 */
export function fetchLogin(data: any) {
  return request.post<any>({
    url: '/user/login',
    data
  })
}

export function fetchLogout() {
  return request.post<any>({
    url: '/user/logout'
  })
}

/**
 * 获取用户信息
 * @returns 用户信息
 */
export function fetchGetUserInfo() {
  return new Promise((resolve, reject) => {
    resolve({
      userId: '1',
      userName: 'user1',
      roles: ['R_SUPER'],
      buttons: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
      email: 'art.design@gmail.com'
    })
  })
}
