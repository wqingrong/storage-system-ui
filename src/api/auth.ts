import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return request.post<Api.Auth.LoginResponse>({
    url: '/api/auth/login',
    params
    // showSuccessMessage: true // 显示成功消息
    // showErrorMessage: false // 不显示错误消息
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
      userName: 'Super',
      roles: ['R_SUPER'],
      buttons: ['B_CODE1', 'B_CODE2', 'B_CODE3'],
      email: 'art.design@gmail.com'
    })
  })
}
