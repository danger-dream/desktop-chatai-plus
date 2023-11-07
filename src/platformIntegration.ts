interface IPlatformIntegration {
	cwd(): Promise<string>
	writeFile(path: string, data: any): Promise<boolean>
	writeJSONFile(path: string, data: any, beautify?: boolean): Promise<boolean>
	
	readFile(path: string): Promise<any>
	readJSONFile(path: string): Promise<any>
	
	exists(path: string): Promise<boolean>
	mkdir(path: string): Promise<boolean>
	deleteFile(path: string): Promise<boolean>
	
	invokeMainFunction(channel: string, ...args: any[]): Promise<any>
	
	exit(): Promise<void>
	relaunch(): Promise<void>
	reload(): Promise<void>
	
	showErrorBox(title: string, content: string): Promise<void>
	showMessageBox(title: string, content: string, type: "none" | "info" | "error" | "question" | "warning", buttons?: string[]): Promise<{response:number}>
	showOpenDialog(opts?: any): Promise<string[]>
	showSaveDialog(opts?: any): Promise<string>
}

const electron = (window as Record<string, any>).__electron_

class ElectronIntegration implements IPlatformIntegration {
	
	cwd(): Promise<string> {
		return electron.cwd()
	}
	
	writeFile(path: string, data: any): Promise<boolean> {
		return electron.writeFile(path, data)
	}
	
	writeJSONFile(path: string, data: any, beautify: boolean = true): Promise<boolean> {
		return electron.writeFile(path, typeof data === 'string' ? data : (beautify ? JSON.stringify(data, undefined, '\t'): JSON.stringify(data)))
	}
	
	readFile(path: string): Promise<any> {
		return electron.readFile(path)
	}
	
	async readJSONFile(path: string): Promise<any> {
		return JSON.parse(await electron.readFile(path))
	}
	
	exists(path: string): Promise<boolean> {
		return electron.exists(path)
	}
	
	mkdir(path: string): Promise<boolean> {
		return electron.mkdir(path)
	}
	
	deleteFile(path: string): Promise<boolean> {
		return electron.deleteFile(path)
	}
	
	invokeMainFunction(channel: string, ...args: any[]): Promise<any> {
		return electron.invokeMainFunction(channel, ...args)
	}
	
	async exit(): Promise<void> {
		await electron.exit()
	}
	
	async relaunch(): Promise<void> {
		await electron.relaunch()
	}
	
	async reload(): Promise<void> {
		await electron.reload()
	}
	
	showErrorBox(title: string, content: string): Promise<void> {
		return electron.showErrorBox(title, content)
	}
	
	showMessageBox(title: string, content: string, type?: "none" | "info" | "error" | "question" | "warning", buttons?: string[]): Promise<{response:number}> {
		return electron.showMessageBox(title, content, type, buttons)
	}
	
	showOpenDialog(opts?: any): Promise<string[]> {
		return electron.showOpenDialog(opts)
	}
	showSaveDialog(opts?: any): Promise<string> {
		return electron.showSaveDialog(opts)
	}
}

export default new ElectronIntegration()
