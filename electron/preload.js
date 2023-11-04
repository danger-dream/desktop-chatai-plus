const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('__electron_', {
	cwd: async () => {
		return await ipcRenderer.invoke('os:cwd')
	},
	writeFile: async (path, data) => {
		return await ipcRenderer.invoke('os:writeFile', path, data)
	},
	readFile: async (path, encoding = 'utf8') => {
		return await ipcRenderer.invoke('os:readFile', path, encoding)
	},
	readJSONFile: async (path) => {
		return await ipcRenderer.invoke('os:readJSONFile', path)
	},
	exists: async (path) => {
		return await ipcRenderer.invoke('os:exists', path)
	},
	mkdir: async (path) => {
		return await ipcRenderer.invoke('os:mkdir', path)
	},
	deleteFile: async (path) => {
		return await ipcRenderer.invoke('os:deleteFile', path)
	},
	exit: async () => {
		return await ipcRenderer.invoke('os:exit')
	},
	relaunch: async () => {
		return await ipcRenderer.invoke('os:relaunch')
	},
	reload: async () => {
		return await ipcRenderer.invoke('os:reload')
	},
	showErrorBox: async (title, content) => {
		return await ipcRenderer.invoke('os:showErrorBox', title, content)
	},
	showMessageBox: async (title, content, type = '', buttons = []) => {
		return await ipcRenderer.invoke('os:showMessageBox', title, content, type, buttons)
	},
	showOpenDialog: async (opts = {}) => {
		return await ipcRenderer.invoke('os:showOpenDialog', opts)
	},
	showSaveDialog: async (opts = {}) => {
		return await ipcRenderer.invoke('os:showSaveDialog', opts)
	},
	invokeMainFunction: async (name, ...args) => {
		return await ipcRenderer.invoke(name, ...args)
	}
})
