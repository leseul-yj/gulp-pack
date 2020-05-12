const {
    src,
    dest,
    watch
} = require('gulp');
const babel = require('gulp-babel');

const js = () => src(['web/js/*.js','web/layui/*/*.js']).pipe(dest(['dest/js','web/layui/*/*.js']));
exports.js = js;

const css = () => src(['web/css/*css']).pipe(dest('dest/css'));
exports.css = css;

const images = () => src('web/img/*.+(png| jpg | jpeg | gif | svg)','web/img/*/*.+(png| jpg | jpeg | gif | svg)').pipe(dest('dest/img'));
exports.images = images;

const html = () => src('web/*.html').pipe(dest('dest/'));
exports.html = html;

// 监听插件
const browserAsync = require("browser-sync").create();
const watchs = () => {
    browserAsync.init({
        server: {
            baseDir: '.dests'
        }
    })
}
exports.watchs = watchs;
