<script lang="ts">
	/**
	 * refs:
	 * 	- https://github.com/touchifyapp/svelte-codemirror-editor/issues/35
	 * 	- https://github.com/touchifyapp/svelte-codemirror-editor/issues/2
	 * 	- https://github.com/codemirror/legacy-modes
	 * 	- https://github.com/touchifyapp/svelte-codemirror-editor/blob/main/src/lib/CodeMirror.svelte
	 * 	- https://github.com/hackmdio/CodeMirror/pull/5
	 * 	- https://github.com/kkeisuke/plantuml-editor/blob/master/src/lib/codemirror/mode/plantuml/plantuml.js
	*/

	import CodeMirror from 'svelte-codemirror-editor';

	import { StreamLanguage } from '@codemirror/language';
	import { simpleMode } from '@codemirror/legacy-modes/mode/simple-mode'; // Import legacy defineSimpleMode

	const plantumlMode = {
		start: [
			{ regex: /^'.*/, token: 'comment' },
			{ regex: /"(?:[^\\]|\\.)*?(?:"|$)/, token: 'string' },
			{
				regex: /\b(abstract|actor|agent|class|component|database|enum|interface|node|note|object|participant|partition|rectangle|state|static|storage|usecase)\b/,
				token: 'keyword',
			},
			{ regex: /\b(true|false)\b/, token: 'keyword' },
			{
				regex: /\b(activate|again|allow_mixing|also|alt|as|autonumber|bottom|box|break|caption|center|create|critical|deactivate|destroy|direction|down|else|end|endfooter|endheader|endif|endlegend|endwhile|entity|footbox|footer|fork|group)\b/,
				token: 'atom',
			},
			{ regex: /!define/, token: 'atom' },
			{ regex: /[a-zA-Z$][\w$]*/, token: 'variable' },
			{ regex: /[{[(]/, indent: true },
			{ regex: /[}\])]/, dedent: true },
			{ regex: /\/'/, token: 'comment', next: 'comment' },
		],
		comment: [
			{ regex: /.*?'\//, token: 'comment', next: 'start' },
			{ regex: /.*/, token: 'comment' },
		],
	};

	let classes = "";
	export { classes as class };
	export let value: string | null | undefined = "";
</script>

<style>
	/* your styles go here */
</style>

<CodeMirror
	bind:value
	class="{classes}"
	extensions={[StreamLanguage.define(simpleMode(plantumlMode))]}
	styles={{
		"&": {
				maxWidth: "100%",
		},
	}}
/>
