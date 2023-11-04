/// <reference types="vite-plugin-electron/electron-env" />
import { rmSync } from 'node:fs'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import pkg from './package.json'
import electronPath from 'electron'
import { spawn } from 'node:child_process'

export default defineConfig(() => {
    rmSync('dist-electron', { recursive: true, force: true })
    return {
        plugins: [
            vue(),
            electron([
                {
                    entry: 'electron/index.js',
                    onstart() {
                        if (process.electronApp) {
                            process.electronApp.removeAllListeners()
                            process.electronApp.kill()
                        }
                        process.electronApp = spawn(electronPath as any, ['.', '--no-sandbox'])
                        process.electronApp.once('exit', process.exit)
                        //  解决中文乱码问题
                        process.electronApp.stdout?.on('data', (data) => {
                            const str = data.toString().trim()
                            str && console.log(str)
                        })
                        process.electronApp.stderr?.on('data', (data) => {
                            const str = data.toString().trim()
                            str && console.error(str)
                        })
                    },
                    vite: {
                        build: {
                            sourcemap: false,
                            minify: true,
                            outDir: 'dist-electron',
                            target: 'node18',
                            chunkSizeWarningLimit: Infinity,
                            reportCompressedSize: false,
                            rollupOptions: {
                                external: Object.keys('dependencies' in pkg ? pkg.dependencies : {})
                            }
                        }
                    }
                }
            ]),
            renderer()
        ],
        resolve: {
            alias: {
                '@': __dirname + '/src'
            }
        },
        server: {
            host: '0.0.0.0',
            port: 1420,
            strictPort: true
        },
        envPrefix: ['VITE_', 'TAURI_'],
        clearScreen: false
    }
})
