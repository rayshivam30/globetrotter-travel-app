import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this-in-production"

export const authHelpers = {
  hashPassword: async (password: string): Promise<string> => {
    return await bcrypt.hash(password, 12)
  },

  comparePassword: async (password: string, hash: string): Promise<boolean> => {
    return await bcrypt.compare(password, hash)
  },

  generateToken: (userId: number, isAdmin: boolean = false): string => {
    return jwt.sign({ userId, isAdmin }, JWT_SECRET, { expiresIn: "7d" })
  },

  verifyToken: (token: string): { userId: number; isAdmin?: boolean } | null => {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number; isAdmin?: boolean }
    } catch {
      return null
    }
  },
}
