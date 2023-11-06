
interface EE {
	fn: Function
	once: boolean
}

class Events {
	
	private readonly _events: Record<string, EE[]> = {}
	
	addListener(event: string, fn: Function, once: boolean = false): this {
		if (!event || !fn) return this
		const listener = { fn, once }
		if (!this._events[event]) {
			this._events[event] = [listener]
		} else {
			const e = this._events[event]
			e.push(listener)
		}
		return this
	}
	
	clear(event: string): this {
		if (this._events[event]) {
			this._events[event] = []
			delete this._events[event]
		}
		return this
	}
	
	get eventNames() {
		return Object.keys(this._events)
	}
	
	emit(event: string, ...args: any): void {
		const e = this._events[event]
		if (!e) return
		const ev = Array.isArray(e) ? e : [ e ]
		for (const item of ev) {
			try {
				if (item.once) {
					this.removeListener(event)
				}
				item.fn(...args)
			} catch {
			}
		}
	}
	
	removeListener(event: string): this {
		const e = this._events[event]
		if (!e) return
		delete this._events[event]
		return this
	}
	
	on(event: string, fn: Function): this {
		return this.addListener(event, fn, false)
	}
	
	once(event: string, fn: Function): this {
		return this.addListener(event, fn, true)
	}
	
	off(event: string): this {
		return this.removeListener(event)
	}
}

export const events = new Events()
