import type { User, UserMetadata, UserValue } from "./types";

export const combineUserMetadata = ({
  id,
  value,
  metadata,
}: {
  id: string;
  value: UserValue;
  metadata: UserMetadata;
}): User & { password: string } => ({ ...value, ...metadata, id });

export const splitUserMetadata = (
  user: User & { password: string },
): { value: string; options: { metadata: UserMetadata } } => {
  const { password, ...metadata } = user;

  return {
    value: JSON.stringify({ password }),
    options: { metadata },
  };
};
