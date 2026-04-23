export function generatePrivateToken(length = 7) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let index = 0; index < length; index += 1) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }

  return result;
}
