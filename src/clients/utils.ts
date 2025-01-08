import type { Client, ClientMetadata, ClientValue } from "./types";

export const combineClientMetadata = ({
	value,
	metadata,
}: {
	value: ClientValue;
	metadata: ClientMetadata;
}): Client => ({ ...value, ...metadata });

export const splitClientMetadata = (
	client: Client,
): { value: string; options: { metadata: ClientMetadata } } => {
	const { name, secret, ...value } = client;

	return {
		value: JSON.stringify(value),
		options: { metadata: { name, secret } },
	};
};
