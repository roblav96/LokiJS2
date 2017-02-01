import {Calculator} from "./calculator";
;
export function getInstance() {
	return new Calculator();
}

module.exports = getInstance;
