module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module"
    },
    "rules": {
        "indent": [
            "error",
            "tab"
        ],/*,
        "quotes": [
            "error",
            "double"
        ],*/
			"indent": [2, "tab", {"SwitchCase": 1}],
        "semi": [
            "error",
            "always"
        ],
			"arrow-parens": [2, "always"],
    }
};
