export const blobToBinary = async (blob: Blob) => {
	const buffer = await blob.arrayBuffer();

	return new Uint8Array(buffer);
};

export const isUrl = (string: string) => {
	const regexp =
		/(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)? (\/|\/([\w#!:.?+=&%@!\-\/]))?/;

	return regexp.test(string);
};
