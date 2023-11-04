const { app, globalShortcut, Menu, Tray, BrowserWindow, ipcMain, screen } = require('electron')
const { enable, initialize } = require('@electron/remote/main')
const { join } = require('node:path')

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
    initialize()
    let CurrentPin = false
    let win = new BrowserWindow({
        show: false, width: 500, height: 600, minWidth: 500, minHeight: 600,
        alwaysOnTop: true, minimizable: false, maximizable: false, movable: true, resizable: true,
        fullscreen: false, transparent: false, skipTaskbar: true, frame: false, hasShadow: true,
        webPreferences: {
            nodeIntegration: true, contextIsolation: false, webSecurity: false, spellcheck: false
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
    ipcMain.on('onPin', (e, isPin) => {
        CurrentPin = isPin
	    win.setAlwaysOnTop(isPin)
    })
    enable(win.webContents)
	win.on('blur', () => {
		if (CurrentPin) return
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

