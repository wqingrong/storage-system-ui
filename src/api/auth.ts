import request from '@/utils/http'

/**
 * 登录
 * @param params 登录参数
 * @returns 登录响应
 */
export function fetchLogin(params: Api.Auth.LoginParams) {
  return new Promise((resolve) => {
    return resolve({
      token:
        'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU3VwZXIiLCJhZG1pbiI6dHJ1ZSwicm9sZSI6InN1cGVyIn0.-Wl1-41Z-07-_l-8i664a_S745_C5U6O-35__M_w46_-DyMXS9-p5u56BW87Y_7p_O5_m_W23_XI0IK_--8452',
      refreshToken:
        'eyJhbGciOiJIUzUxMiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiU3VwZXIiLCJhZG1pbiI6dHJ1ZSwicm9sZSI6InN1cGVyIn0.T61-_77_0___n_4-i7XCFP_r__M5_we-B_J_MbNFP___n_-T--1Tb55_8H__9x-144M2x6--MO_Z3_CTn_E__c'
    })
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
