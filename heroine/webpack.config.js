//Plugin
const MiniCssExtractPlugin = require("mini-css-extract-plugin");


// Webpack uses this to work with directories
const path = require('path');

// This is main configuration object.
// Here you write different options and tell Webpack what to do
module.exports = {

    devServer: {
        port: 3001,
        compress: true,
        contentBase: './',
        inline: true,
        hot: true,
        writeToDisk: true,
        liveReload: true,
    },

    // Path to your entry point. From this file Webpack will begin his work
    entry: './assets/src/js/main.js',

    // Path and filename of your result bundle.
    // Webpack will bundle all JavaScript into this file
    output: {
        path: path.join(__dirname, 'assets/dist'),
        filename: 'bundle.js',
        hotUpdateChunkFilename: '../hot/hot-update.js',
        hotUpdateMainFilename: '../hot/hot-update.json'
    },

    //Moduli compilazione
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules)/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    }
                }
            },
            {
                test: /\.(ttf|otf|eot|woff2?|png|jpe?g|gif|svg|ico)$/,
                include: path.resolve(__dirname, 'assets'),
                loader: 'url-loader',
                options: {
                    limit: 4096,
                },
            },
            {
                test: /\.glsl$/,
                loader: 'webpack-glsl-loader'
            },
            {
                // Apply rule for .sass, .scss or .css files
                test: /\.(sa|sc|c)ss$/,

                // Set loaders to transform files.
                // Loaders are applying from right to left(!)
                // The first loader will be applied after others
                use: [
                    {
                        // After all CSS loaders we use plugin to do his work.
                        // It gets all transformed CSS and extracts it into separate
                        // single bundled file
                        loader: MiniCssExtractPlugin.loader
                    },
                    {
                        // This loader resolves url() and @imports inside CSS
                        loader: "css-loader", options: { sourceMap: true }
                    },
                    {
                        // Then we apply postCSS fixes like autoprefixer and minifying
                        loader: "postcss-loader", options: { sourceMap: true }
                    },
                    {
                        // First we transform SASS to standard CSS
                        loader: "sass-loader",
                        options: {
                            implementation: require("sass"),
                            sourceMap: true
                        }
                    },
                ]
            }

        ]
    },

    plugins: [

        new MiniCssExtractPlugin({
            filename: "bundle.css"
        })

    ],
    devtool: 'source-map',
    mode : 'development',
    target: 'web',
    //Console log, not show module build
    stats: {
        modules: false
    }


};
