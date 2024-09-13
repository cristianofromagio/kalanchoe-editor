<script lang="ts">
	import { convertFileSrc } from '@tauri-apps/api/tauri';
	import { Pane, Splitpanes } from 'svelte-splitpanes';
	import { panzoom, type Options } from 'svelte-pan-zoom';
	import CodeMirror from 'svelte-codemirror-editor';

	import { copyDiagramToClipboard, generateDiagram, runJavaCommand } from '../../shared/storage.js';
	import { writable, get } from 'svelte/store';
	// import { onDestroy } from 'svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	import { onDestroy, onMount } from 'svelte';
	import type * as Monaco from 'monaco-editor/esm/vs/editor/editor.api';
	import { PUmlExtension } from '@sinm/monaco-plantuml';
	import PUmlWorker from '@sinm/monaco-plantuml/lib/puml.worker?worker';

	let editor: Monaco.editor.IStandaloneCodeEditor;
	let monaco: typeof Monaco;
	let editorContainer: HTMLElement;

	type PlantUMLError = {
		message: string,
		code: number | null
	}

	let diagramContent = `@startuml\n\n@enduml`;

	let isImageLoaded = true;
	let errorData: PlantUMLError;

	let imageSource = writable("plantuml-greetings.svg"); // from 'static' folder
	let imagePathSource = writable('');
	let doLoadImage = loadImageForCanvas(get(imageSource));
	const unsubscribe = imageSource.subscribe((newImageSource) => {
		doLoadImage = loadImageForCanvas(newImageSource);
		console.log(newImageSource);
	});

	function loadImageForCanvas(imagePath: string) {
		return new Promise<Options>((resolve, reject) => {
			if (imagePath && imagePath === "ERROR_OP") {
				reject();
				return;
			}

			const loadImage = new Image();
			loadImage.onload = () =>
				resolve({
					width: loadImage.width,
					height: loadImage.height,
					padding: 50,
					friction: 0,
					render,
				});
			loadImage.src = imagePath;

			function render(ctx: CanvasRenderingContext2D) {
				ctx.drawImage(loadImage, 0, 0)
			}
		})
	}

	const pipeGenerateDiagram = async (val: string) => {
		isImageLoaded = false;

		if (!val) {
			return;
		}

		let { imagePath, error } = await generateDiagram(val);
		if (error.message !== '') {
			isImageLoaded = true;
			errorData = error;
			imageSource.update((old) => 'ERROR_OP');
			return;
		}

		if (imagePath && imagePath !== '') {
			isImageLoaded = true;
			let newPath = convertFileSrc(imagePath)+"?t="+Date.now();
			imageSource.update((old) => newPath);
			imagePathSource.update((old) => imagePath);
		}
	};

	let plantUmlDisposer: Monaco.IDisposable;
	onMount(async () => {
		// Import our 'monaco.ts' file here
		// (onMount() will only be executed in the browser, which is what we want)
		monaco = (await import('$lib/monaco')).default;

		// Your monaco instance is ready, let's display some code!
	 	editor = monaco.editor.create(editorContainer, {
				automaticLayout: false,
				minimap: {enabled: false},
				lineNumbers: "on",
				lineNumbersMinChars: 2,
				glyphMargin: false,
				folding: true,
				theme: 'github',
				language: 'plantuml'
		});

		// relative
		const worker = new PUmlWorker();
		const extension = new PUmlExtension(worker);
	 	plantUmlDisposer = extension.active(editor);

		const model = monaco.editor.createModel(
				"@startuml\n\n@enduml",
				'plantuml'
		);
		editor.setModel(model);
		editor.onDidChangeModelContent(() => {
      diagramContent = editor.getValue();
    });

		window.onresize = function () {
			// editor.layout();
			manuallyRunResizeWatcher(editorContainer, editor.layout.bind(editor));
			console.log('window resized');
		};

		manuallyRunResizeWatcher(editorContainer, editor.layout.bind(editor));
		// installResizeWatcher(editorContainer, editor.layout.bind(editor), 1500)
	});

	onDestroy(() => {
		monaco?.editor.getModels().forEach((model) => model.dispose());
		editor?.dispose();

		// when destroyed
		plantUmlDisposer.dispose();

		unsubscribe();
	});

	function installResizeWatcher(el: any, fn: any, interval: any){
		let offset = {width: el.offsetWidth, height: el.offsetHeight}
		setInterval(() => {
			console.log('runned interval');
			let newOffset = {width: el.offsetWidth, height: el.offsetHeight}
			if(offset.height != newOffset.height || offset.width != newOffset.width){
				offset = newOffset
				fn()
			}
		}, interval);
	}

	let offset: any;
	const manuallyRunResizeWatcher = (el: any, fn: any) => {
		if (!offset) {
			offset = {width: el.offsetWidth, height: el.offsetHeight}
		}

		let newOffset = {width: el.offsetWidth, height: el.offsetHeight}
		if(offset.height != newOffset.height || offset.width != newOffset.width) {
			offset = newOffset
			fn()
		}
	}
	function handlePanelResized() {
		manuallyRunResizeWatcher(editorContainer, editor.layout.bind(editor));
	}
</script>

<Splitpanes on:resized={handlePanelResized}>
	<Pane minSize={20} class="flex overflow-scroll relative">

		<!-- <CodeMirror bind:value={diagramContent} class="flex flex-grow w-100"/> -->
		<!-- <CodeMirror bind:value={diagramContent} class="flex flex-grow w-100"/> -->
		<div class="editor-container flex flex-1 w-100" bind:this={editorContainer}></div>

		<button
			disabled={diagramContent === '' || !isImageLoaded}
			on:click={() => pipeGenerateDiagram(diagramContent)}
			type="button"
			class="absolute inline-flex items-center disabled:cursor-not-allowed disabled:bg-slate-500 bottom-2 right-6 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
			{#if !isImageLoaded}
				<svg aria-hidden="true" role="status" class="inline w-4 h-4 me-2 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
					<path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"/>
					<path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"/>
				</svg>
			{/if}

			Generate diagram
		</button>
		<!-- <button on:click={() => runJavaCommand(diagramContent)}>
			Run Java Command
		</button> -->
	</Pane>
	<Pane minSize={20} class="flex bg-blue-100">
		{#if isImageLoaded}
			{#await doLoadImage}
				<LoadingSpinner/>
			{:then panzoomOptions}
				<canvas use:panzoom={panzoomOptions} />
					<button
						disabled={get(imagePathSource) === ''}
						on:click={() => copyDiagramToClipboard(get(imagePathSource))}
						type="button"
						class="absolute inline-flex items-center disabled:cursor-not-allowed disabled:bg-slate-500 bottom-7 right-8 rounded-md bg-indigo-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
						Copy image file
					</button>
			{:catch error}

				<!-- <div class="flex m-auto rounded border-l-4 border-red-400 bg-red-50 p-4">
					<div class="flex">
						<div class="flex-shrink-0">
							<svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
								<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
							</svg>
						</div>
						<div class="ml-3">
							<h3 class="text-sm font-medium text-red-800">
								There were 2 errors with your submission
							</h3>
							<div class="mt-2 text-sm text-red-700">
								<pre><code>{errorMessage}</code></pre>
							</div>
						</div>
					</div>
				</div> -->

				<div class="flex m-auto">
					<div role="alert">
						<div class="flex justify-between border-l-4 border-red-600 bg-red-200 text-red-600 font-bold px-4 py-2">
							<div class="flex items-center">
								<div class="me-2">
									<svg class="h-5 w-5 text-red-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
										<path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
									</svg>
								</div>
								<span>PlantUML Error</span>
							</div>

							<code>CODE={errorData.code}</code>
						</div>
						<div class="border-l-4 border-red-600 bg-red-100 px-4 py-3 text-red-600">
							<pre><code>{errorData.message}</code></pre>
						</div>
					</div>
				</div>
			{/await}

		{:else}
				<LoadingSpinner/>
		{/if}
	</Pane>
</Splitpanes>

<style>
	canvas {
		box-sizing: border-box;
		width: 100%;
		height: 100%;
		margin: 0;
		padding: 0;
		user-select: none;
		touch-action: none;
		overscroll-behavior: none;
		-webkit-user-select: none; /* disable selection/Copy of UIWebView */
		-webkit-touch-callout: none; /* disable the IOS popup when long-press on a link */
	}

	.editor-container {
		resize: vertical; overflow: hidden;
	}
</style>
