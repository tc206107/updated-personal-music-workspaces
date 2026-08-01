/* 管理密码配置：HMAC 形式仅存盐与哈希，不存明文。
   修改密码请在 admin.html 登录后使用「修改密码」，或手动替换 HASH。 */
const ADMIN_CONFIG = {
  SALT: "tc-salt-2026",
  HASH: "f4bdaa75cef8ff76c8eb9ceb5b67d1c1775a5abd19d75fbc38b8fce6d756e0fc"
};