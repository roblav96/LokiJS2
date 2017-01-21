module.exports = function (config) {
    config.set({
        browsers: ['Chrome'],
        files: [
            {pattern: 'spec/**/*.spec.js', watched: false}
        ],
        frameworks: ['jasmine'],
        preprocessors: {
            'spec/**/*.spec.js': ['webpack']
        },
        webpack: {
            module: {
                loaders: [
                    {
                        test: /(\.js)$/,
                        loader: 'babel',
                        exclude: /(node_modules|bower_components)/
                    }
                ]
            },
            watch: true
        },
        webpackServer: {
            noInfo: true
        }
    });
};