import { Command } from '@tauri-apps/api/shell';
import {
	readDir,
	BaseDirectory,
	createDir,
	writeFile,
	readTextFile,
	writeBinaryFile,
	readBinaryFile
} from '@tauri-apps/api/fs';
import { resolveResource, desktopDir, join } from '@tauri-apps/api/path';
import { convertFileSrc } from '@tauri-apps/api/tauri';
import { nanoid } from 'nanoid';
import { blobToBinary } from './utils';
import { writeImageBase64 } from "tauri-plugin-clipboard-api";
// import { tempdir } from '@tauri-apps/api/os';


const dataFileName = 'data.json';
const dir = BaseDirectory.Desktop;

// export const runJavaCommand = async () => {
// 	try {
// 		// Create a new Command instance to run the Java command
// 		const command = new Command('java', ['-version']);

// 		// Execute the command and wait for the output
// 		const output = await command.execute();

// 		console.log('Command Output:', output);

// 		// Show the output to the user
// 		alert(`Java version: ${output.stdout}`);
// 	} catch (error) {
// 		console.error('Error running Java command:', error);
// 		alert('Failed to run Java command. Please ensure Java is installed and accessible in your PATH.');
// 	}
// };

export const runJavaCommand = async (data: string) => {

// 	let data = `@startuml
// Actor1 -> Actor2
// @enduml`;

    try {

			// // Get the path for a temporary directory
      // const tempDirPath = await tempdir();

      // // Create a temporary file path for the input data
      // const tempInputFilePath = await join(tempDirPath, 'temp_input_data.txt');

      // Write the data to the temporary input file
      await writeFile("C:\\Users\\Cristiano\\Desktop\\data\\temp\\temp_input_data.txt", data);

      // Configure the Java command with all parameters
      const command = new Command('plantuml-java', [
        '-jar',
        'C:\\Users\\Cristiano\\Desktop\\data\\temp\\plantuml-mit-1.2024.6.jar',
        '-tsvg',
        '-stdrpt:1',
        '-charset',
        'utf-8',
        '-failfast2',
        'C:\\Users\\Cristiano\\Desktop\\data\\temp\\temp_input_data.txt'
      ], { encoding: 'utf8' });

			// const command = new Command('plantuml-java', [
      //   '-jar',
      //   'C:\\Users\\Cristiano\\Desktop\\data\\temp\\plantuml-1.2024.5.jar',
      //   'C:\\Users\\Cristiano\\Desktop\\data\\temp\\temp_input_data_2.txt'
      // ], { encoding: 'utf8' });

      // Execute the command and capture output/
      const output = await command.execute();
			// const outputBinary = new TextEncoder().encode(output.stdout);

      // // Save the output to a file
      // await writeBinaryFile(
      //   'C:\\Users\\Cristiano\\Desktop\\data\\temp\\template_diagram.png',
      //   outputBinary
      // );

      console.log('SVG saved successfully:', output);
      alert('SVG file has been generated and saved.');

    } catch (error) {
      console.error('Error running Java command:', error);
      alert('Failed to run Java command. Please ensure Java is installed and accessible in your PATH.');
    }
};

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

	let outputFormat = "png";

	// const resourcePath = await resourceDir();
	// const plantUmlPath = await join(resourcePath, 'plantuml.jar');
	const plantUmlPath = await resolveResource('resources/plantuml-mit-1.2024.6.jar');
	const desktopPath = await desktopDir();

	// TODO: ensure `data/temp` exists
	const sourceFilePath = await join(desktopPath, 'data', 'temp', 'template_diagram.txt');
	const outputFilePath = await join(desktopPath, 'data', 'temp', 'template_diagram.' + outputFormat);

	// need to remove `\\?\` appended to the path, see here: https://github.com/tauri-apps/tauri/issues/5850
	// const pipedCommand = `{ echo -e "${data.replaceAll("\"", "\\\"")}"; } | java -jar "${plantUmlPath.replace("\\\\?\\","")}" -pipe > "${outputFilePath}"`;
	// const pipedCommand = `{ echo -e "${data}"; } | java -jar "${plantUmlPath.replace("\\\\?\\","")}" -tsvg -stdrpt:1 -failfast2 -pipe > "${outputFilePath}"`;

	// 	const pipedCommand = `java -jar "${plantUmlPath.replace("\\\\?\\","")}" -tsvg -stdrpt:1 -charset utf-8 -failfast2 -pipe > "${outputFilePath}" <<'EOF'
// 	${data}
// EOF`; // this needs to be "not-indented" otherwise throws error "bash: line xx: warning: here-document at line 1 delimited by end-of-file (wanted `EOF')"
// 	console.log(pipedCommand);
// 	const output = await new Command('bash', ["-c", `${ pipedCommand }`]).execute();

	await writeFile(sourceFilePath, data);

	const command = new Command('plantuml-java', [
		'-DPLANTUML_LIMIT_SIZE=10000',
		'-jar',
		plantUmlPath,
		(outputFormat == "png") ? '-tpng' : '-tsvg',
		(outputFormat == "png") ? '-Sdpi=150' : '',
		'-stdrpt:1',
		'-charset',
		'utf-8',
		'-failfast2',
		sourceFilePath
	], { encoding: 'utf8' });

	const output = await command.execute();
	console.log(output.code);
	console.log(output.signal);
	console.log(output.stdout);
	console.log(output.stderr);

	console.log(outputFilePath);

	if (output.code == 0 && (!output.stderr || output.stderr == '')) {
		return { imagePath: outputFilePath, error: { message: '', code: output.code } };
	}

	return { imagePath: '', error: { message: output.stderr, code: output.code } };
};

export const copyDiagramToClipboard = async (filePath: string) => {
  try {
    // Read the file as binary data
    const binaryData = await readBinaryFile(filePath, { dir: BaseDirectory.Desktop });

    // Convert binary data to a base64 string
    const base64String = arrayBufferToBase64(binaryData);

    // Copy the image to the clipboard using the clipboard API
    await writeImageBase64(base64String);

		alert('Image copied to clipboard!');
    console.log('Image copied to clipboard!');
  } catch (error) {
    alert('Failed to copy image to clipboard: ' + error);
    console.error('Failed to copy image to clipboard:', error);
  }
};

// Helper function to convert ArrayBuffer to a base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
