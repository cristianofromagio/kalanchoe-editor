import { Command } from '@tauri-apps/api/shell';
import {
	readDir,
	BaseDirectory,
	createDir,
	writeFile,
	readTextFile,
	writeBinaryFile
} from '@tauri-apps/api/fs';
import { resolveResource, desktopDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { nanoid } from 'nanoid';
import { blobToBinary } from './utils';

const dataFileName = 'data.json';
const dir = BaseDirectory.Desktop;

const _checkDataFolder = async () => {
	try {
		const files = await readDir('data', {
			dir: dir
		});

		const fileNames = files.map(({ name }) => name);

		return fileNames.includes(dataFileName);
	} catch (e) {
		return false;
	}
};

const _createDatabase = async () => {
	try {
		await createDir('data', {
			dir: dir,
			recursive: true
		});

		await writeFile(
			{
				contents: '[]',
				path: `./data/${dataFileName}`
			},
			{
				dir: dir
			}
		);
	} catch (e) {
		console.log(e);
	}
};

export const initStorage = async () => {
	const hasDataFolder = await _checkDataFolder();

	if (!hasDataFolder) {
		await _createDatabase();
	}
};

export const getStoredPosts = async () => {
	try {
		const res = await readTextFile(`data/${dataFileName}`, {
			dir: dir
		});
		return JSON.parse(res);
	} catch (e) {
		return [];
	}
};

export const saveImage = async (blob: Blob, extension: string) => {
	const desktopPath = await desktopDir();
	const bin = await blobToBinary(blob);

	const fileName = `${nanoid()}.${extension}`;

	await writeBinaryFile(
		{
			contents: bin,
			path: `./data/${fileName}`
		},
		{
			dir: dir
		}
	);

	return convertFileSrc(await join(desktopPath, 'data', fileName));
};

export const saveState = async (data: string) => {
	await writeFile(
		{
			contents: data,
			path: `./data/${dataFileName}`
		},
		{
			dir: dir
		}
	);
};

export const generateDiagram = async (data: string) => {
	// # $1 -> tauri resources path (from `tauri.conf.json`)
	// # $2 -> output directory path
	// # $3 -> output file name
	// # $4 -> plantuml string content

	// const resourcePath = await resourceDir();
	const plantUmlPath = await resolveResource('resources/plantuml.jar');
	const desktopPath = await desktopDir();

	// TODO: ensure `data/temp` exists
	// const plantUmlPath = await join(resourcePath, 'plantuml.jar');
	const outputFilePath = await join(desktopPath, 'data', 'temp', 'template_diagram.svg');
	// const command = Command.sidecar('binaries/scripts/piped_generate_diagram', [
	// 	resourcePath,
	// 	outputDirPath,
	// 	"template_diagram",
	// 	data,
	// ]);

	// need to remove `\\?\` appended to the path, see here: https://github.com/tauri-apps/tauri/issues/5850
	// const pipedCommand = `{ echo -e "${data.replaceAll("\"", "\\\"")}"; } | java -jar "${plantUmlPath.replace("\\\\?\\","")}" -pipe > "${outputFilePath}"`;
	// const pipedCommand = `{ echo -e "${data}"; } | java -jar "${plantUmlPath.replace("\\\\?\\","")}" -tsvg -stdrpt:1 -failfast2 -pipe > "${outputFilePath}"`;
	const pipedCommand = `java -jar "${plantUmlPath.replace("\\\\?\\","")}" -tsvg -stdrpt:1 -charset utf-8 -failfast2 -pipe > "${outputFilePath}" <<'EOF'
	${data}
EOF`; // this needs to be "not-indented" otherwise throws error "bash: line xx: warning: here-document at line 1 delimited by end-of-file (wanted `EOF')"

	console.log(pipedCommand);

	const output = await new Command('bash', ["-c", `${ pipedCommand }`]).execute();
	console.log(output.code);
	console.log(output.signal);
	console.log(output.stdout);
	console.log(output.stderr);

	if (output.code == 0 && !output.stderr) {
		return { imagePath: outputFilePath, error: { message: '', code: output.code } };
	}

	return { imagePath: '', error: { message: output.stderr, code: output.code } };
};
