const fs = require('node:fs')
const { join, sep } = require('node:path')
const { app, globalShortcut, Menu, Tray, BrowserWindow, ipcMain, screen, dialog } = require('electron')

process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true'
app.setAppUserModelId(app.getName())
if (!app.requestSingleInstanceLock()) {
    app.quit()
    process.exit(0)
}
process.env.DIST_ELECTRON = __dirname
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.PUBLIC = process.env.VITE_DEV_SERVER_URL ? join(process.env.DIST_ELECTRON, '../public') : process.env.DIST

app.on('window-all-closed', () => app.exit(0))
app.whenReady().then(async () => {
    let isAlwaysOnTop = false
    let win = new BrowserWindow({
        show: false, width: 500, height: 600, minWidth: 500, minHeight: 600,
        alwaysOnTop: true, minimizable: false, maximizable: false, movable: true, resizable: true,
        fullscreen: false, transparent: false, skipTaskbar: true, frame: false, hasShadow: true,
        webPreferences: {
	        preload: join(__dirname, 'preload.js'), webSecurity: false, spellcheck: false
        }
    })
    function showMainWindow() {
	    if (win.isVisible()) {
		    win.hide()
	    } else {
		    win.setAlwaysOnTop(true)
		    win.show()
		    win.focus()
		    win.webContents.executeJavaScript('try{window.inputFocus()} catch{}').catch(() => {})
		    const bounds = screen.getPrimaryDisplay().bounds
		    const w_bounds = win.getBounds()
		    const x = bounds.width - w_bounds.width - 5
		    const y = bounds.height - w_bounds.height - 60
		    win.setPosition(x, y, false)
	    }
    }
	ipcMain.handle('showMainWindow', async () => {
		showMainWindow()
	})
    ipcMain.handle('setAlwaysOnTop', (e, is) => {
	    isAlwaysOnTop = is
	    win.setAlwaysOnTop(isAlwaysOnTop)
    })
	platformIntegration(win)
	win.on('blur', () => {
		if (isAlwaysOnTop) return
		win.hide()
	})
    win.on('show', () => setTimeout(() => win.setOpacity(1), 50))
    win.on('hide', () => win.setOpacity(0))
    win.on('close', (e) => {
        e.preventDefault()
        e.returnValue = false
        win.hide()
    })

    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
    if (app.isPackaged) {
        win.loadFile(join(join(__dirname, '../dist'), 'index.html')).catch()
    } else {
        win.loadURL((process.env.VITE_DEV_SERVER_URL || '') + 'index.html').catch()
        win.webContents.openDevTools({ mode: 'detach' })
    }
    globalShortcut.register('CommandOrControl+Alt+Shift+Z', showMainWindow)

    function restart() {
        app.relaunch()
        app.exit(0)
    }

    const tray = new Tray(join(process.env.PUBLIC, 'favicon.ico'))
    tray.setContextMenu(Menu.buildFromTemplate([
        { label: '显示窗口', click: () => showMainWindow() },
        { type: 'separator' },
	    { label: '重载', click: () => win.reload() },
	    { type: 'separator' },
        { label: '重启', click: () => restart() },
        { label: '退出', click: () => app.exit(0) }
    ]))
    tray.setToolTip(`Desktop ChatAI Plus`)
    tray.on('double-click', () => showMainWindow())

    app.on('second-instance', () => showMainWindow())
    app.on('activate', () => showMainWindow())
    /** 取消注册热键 */
    app.on('will-quit', () => {
        try {
            globalShortcut.unregisterAll()
        } catch {
        }
    })
})


function platformIntegration(win) {
	
	ipcMain.handle('os:cwd', async () => process.cwd())
	
	ipcMain.handle('os:writeFile', async (e, path, data) => {
		try {
			if (!path || !data) return false
			let buf
			if (typeof data === 'string' || Buffer.isBuffer(data)) {
				buf = data
			} else if (data instanceof ArrayBuffer) {
				buf = Buffer.from(data)
			} else {
				buf = JSON.stringify(data, undefined, '\t')
			}
			fs.writeFileSync(path, buf)
			return true
		} catch {
			return false
		}
	})
	
	ipcMain.handle('os:readFile', async (e, path, encoding) => {
		if (!path || !fs.existsSync(path) || fs.statSync(path).isDirectory()) return ''
		if (!encoding || typeof encoding !== 'string') encoding = 'utf8'
		return fs.readFileSync(path, encoding)
	})
	
	ipcMain.handle('os:exists', async (e, path) => {
		return path && fs.existsSync(path)
	})
	
	ipcMain.handle('os:mkdir', async (e, path) => {
		if (!path) return false
		
		function mkdirp(dirpath) {
			if (!dirpath) return false
			try {
				if (sep === '/') {
					dirpath = dirpath.replace(/\\/g, '/')
				} else {
					dirpath = dirpath.replace(/\//g, '\\')
				}
				if (dirpath[0] === '\\' || dirpath[0] === '/') {
					dirpath = dirpath.slice(1)
				}
				dirpath.split(sep).reduce((prev, folder) => {
					const curr = process.platform === 'win32' && prev === sep ? folder : join(prev, folder)
					if (!fs.existsSync(curr)) {
						fs.mkdirSync(curr)
					}
					return curr
				}, sep)
				return true
			} catch {
				return false
			}
		}
		
		try {
			if (fs.existsSync(path)) {
				return true
			} else {
				return mkdirp(path)
			}
		} catch {
		
		}
		return false
	})
	
	ipcMain.handle('os:deleteFile', async (e, path) => {
		if (!path) return false
		try {
			if (fs.existsSync(path)) {
				if (fs.statSync(path).isDirectory()) {
					fs.rmdirSync(path, { recursive: true })
				} else {
					fs.unlinkSync(path)
				}
				return true
			}
		} catch {
		}
		return false
	})
	
	ipcMain.handle('os:exit', async () => app.exit(0))
	
	ipcMain.handle('os:relaunch', async () => {
		app.relaunch()
		app.exit(0)
	})
	
	ipcMain.handle('os:reload', async () => win?.reload())
	
	
	ipcMain.handle('os:showErrorBox', async (e, title, content) => {
		dialog.showErrorBox(title, content)
	})
	
	ipcMain.handle('os:showMessageBox', async (e, title, content, type = 'info', buttons = []) => {
		return dialog.showMessageBox({
			title,
			message: content,
			type,
			buttons,
		})
	})
	
	ipcMain.handle('os:showOpenDialog', async (e, opts) => {
		return dialog.showOpenDialog(opts)
	})
	
	ipcMain.handle('os:showSaveDialog', async (e, opts) => {
		return dialog.showSaveDialog(opts)
	})
	
	
}
