/* global window */

export class Plugin {

	static construct() {
		let global;
		try {
			global = Function('return this')() || (42, eval)('this');
		} catch (e) {
			global = window;
		}
		let sym = Symbol.for("LokiJsModules");
		if (global[sym] === undefined) {
			global[sym] = {
				modules: {},
				lokiTmp: {},
				loki: null
			};
		}
		this._plugin = global[sym];
	}

	static initialize(loki) {
		this._plugin.loki = loki;
		let keys = Object.keys(this._plugin.lokiTmp);
		for (let i = 0; i < keys.length; i++) {
			this._plugin.loki[keys[i]] = this._plugin.lokiTmp[keys[i]];
		}
	}

	static register(name, module, addToLoki = false) {
		this._plugin.modules[name] = module;
		if (addToLoki) {
			if (this._plugin.loki === null) {
				this._plugin.lokiTmp[name] = module;
			} else {
				this._plugin.loki[name] = module;
			}
		}
	}

	static load(name) {
		return this._plugin.modules[name];
	}
}

Plugin.construct();
