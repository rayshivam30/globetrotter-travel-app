declare module 'jsonwebtoken' {
  // Minimal typings to satisfy TS in this project
  export interface SignOptions { expiresIn?: string | number }
  export function sign(payload: any, secretOrPrivateKey: string, options?: SignOptions): string
  export function verify(token: string, secretOrPublicKey: string): any
  const _default: any
  export default _default
}
