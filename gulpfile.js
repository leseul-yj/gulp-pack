const {
    src,
    dest,
    watch,
    series,
    parallel,
    task
} = require('gulp');
const babel = require('gulp-babel');

const js = () => src(['web/js/*.js','web/layui/*/*.js']).pipe(dest(['dest/js','dest/layui/*/*.js']));
exports.js = js;

const css = () => src(['web/css/*.css']).pipe(dest('dest/css'));
exports.css = css;

const images = () => src('web/img/*.+(png| jpg | jpeg | gif | svg)','web/img/*/*.+(png| jpg | jpeg | gif | svg)').pipe(dest('dest/img'));
exports.images = images;

const html = () => src('web/*.html').pipe(dest('dest/'));
exports.html = html;

// 监听插件
const browserAsync = require("browser-sync").create();
const watchs = () => {
    watch('web/js/*.js',js)
    watch('web/css/*.css',css)
    watch('web/*.html',html)
    browserAsync.init({
        server: {
            baseDir: '.dest'
        }
    })
}


const server = series(parallel(js,css,images),html,watchs);

const webserver = require("gulp-webserver");

const webserver = ()=>{
    src("/web").pipe(webserver({
        open: true,
        port: 9999
    }))
}

task("default",["watchs","server"])
