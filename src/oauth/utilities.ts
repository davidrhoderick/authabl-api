import { compareSync, hashSync } from "bcrypt-edge";

export const hashPassword = async (password: string) => {
  try {
    const hashedPassword = hashSync(password, 8);
    return hashedPassword;
  } catch (error) {
    console.error("Error hashing password:", error);
    throw error;
  }
};

export const verifyPassword = async (
  password: string,
  hashedPassword: string
) => {
  try {
    const isMatch = await compareSync(password, hashedPassword);
    return isMatch;
  } catch (error) {
    console.error("Error verifying password:", error);
    throw error;
  }
};
