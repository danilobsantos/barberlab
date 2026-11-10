import { randomBytes, scrypt, timingSafeEqual, createHash } from "node:crypto"

const KEY_LENGTH = 64
const SCRYPT_OPTIONS = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }

const deriveKey = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) => {
    scrypt(password, salt, KEY_LENGTH, SCRYPT_OPTIONS, (error, key) => {
      if (error) reject(error)
      else resolve(key as Buffer)
    })
  })

export async function hashPassword(password: string) {
  const salt = randomBytes(16)
  const hash = await deriveKey(password, salt)
  return `scrypt$16384$8$1$${salt.toString("base64url")}$${hash.toString("base64url")}`
}

export async function verifyPassword(password: string, encoded: string) {
  const [algorithm, cost, blockSize, parallelism, saltText, hashText] =
    encoded.split("$")
  if (
    algorithm !== "scrypt" ||
    cost !== "16384" ||
    blockSize !== "8" ||
    parallelism !== "1" ||
    !saltText ||
    !hashText
  ) {
    return false
  }

  try {
    const expected = Buffer.from(hashText, "base64url")
    const actual = await deriveKey(password, Buffer.from(saltText, "base64url"))
    return (
      expected.length === actual.length && timingSafeEqual(expected, actual)
    )
  } catch {
    return false
  }
}

export const hashPasswordResetToken = (token: string) =>
  createHash("sha256").update(token).digest("hex")
