const path = require('path');

module.exports = {
    entry: path.resolve(__dirname, 'src/index.ts'),
    devtool: 'inline-source-map',
    target: 'node',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                loader: 'ts-loader',
                exclude: /node_modules/
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    "externals": {
        "levelup": "require('levelup')",
        "leveldown": "require('leveldown')",
        "formidable": "require('formidable')"
    }
};