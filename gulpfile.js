// gulp4x配置

const {
    src,
    dest,
    watch,
    series,
    parallel,
    task
} = require('gulp');
const babel = require('gulp-babel');
const uglify = require('gulp-uglify')
const js = () => src(['src/**/*.js']).pipe(babel()).pipe(uglify()).pipe(dest(['dest/']));
// 导出后可以用 gulp js启动任务
//exports.js = js;

const css = () => src(['src/css/*.css']).pipe(dest('dest/css'));

const images = () => src('src/img/*.+(png| jpg | jpeg | gif | svg)','src/img/*/*.+(png| jpg | jpeg | gif | svg)').pipe(dest('dest/img'));

const html = () => src('src/**/*.html').pipe(dest('dest/'));


const del = require('del');
const clean = async () => {
    await del(['dest']);
}
exports.clean = clean;

// gulp-webserver 是gulp-connect的重写 弥补了gulp-connect不足，例如不能自动打开
// 功能和browserAsync类似
// webserver 保存后界面就会刷新
const gulpserver = require('gulp-webserver');
const webserver = () => {
    src("src",{
        allowEmpty: true
    }).pipe(gulpserver({
        open: true,
        port: 9999,
        livereload: true,
        host: '127.0.0.1',
        directoryListing: {
            enable: true,
            path: 'index.html'
        }
    }))
}

// 监听插件 如果不配置 会打开默认的3000端口 browser-sync和gulp-webserver类似 使用一个就好了
// 感觉用gulp-webserver比browser-sync要快
// const browserAsync = require("browser-sync").create();
const watchs = () => {
    // browserAsync.init({
    //     files: ['**'],
    //     port: 9999,
    //     server: {
    //         baseDir: ['web'],
    //         index: '/index.html',
    //     }
    // })
    watch('src/**/*.js',js)
    watch('src/css/*.css',css)
    watch('src/*.html',html)
}
exports.watchs = watchs;


const server = series(parallel(js,css,images),html,webserver,watchs);
// parallel 并发执行， series按顺序执行
// const server = series(clean,parallel(js,css,images),html,watchs);
//gulp 4 设置default任务，第二个参数不能直接用数组了 需要用到series
task("default",server);
