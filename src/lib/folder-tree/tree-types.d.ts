export interface TreeItem {
	name?: string;
	path: string;
	children?: TreeItem[];
	open?: boolean;

	// To allow custom keys
	[key: string]: any;
}

export type TreeData = TreeItem[];
