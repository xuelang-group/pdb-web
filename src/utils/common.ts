const map = '123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
export function uuid(): string {
  let ranStr = ''
  for (let i = 0; i < 19; i++) {
    ranStr += map[Math.floor(Math.random() * (48 + 9))]
  }
  return ranStr + new Date().getTime()
}
