var sass = require('node-sass');
var Vow = require('vow');
var colors = require('colors');
var path = require('path');
var fs = require('fs');

colors.setTheme({
    debug: 'blue',
    error: 'red'
});

module.exports = require('enb/techs/css').buildFlow()
    .name('enb-sass')
    .defineOption('prependedFiles')
    .defineOption('sourceSuffixes')
    .defineOption('target')
    .defineOption('sassSettings')
    .useFileList(this._sourceSuffixes || ['css', 'scss'])
    .target('target', this._target || '?.css')
    .builder(function (sourceFiles) {
        var that = this;
        var deferred = Vow.defer();
        var settings = this._sassSettings || {
            outputStyle: 'normal',
            sourceComments: 'none',
            includePaths: []
        };

        console.log(sourceFiles);

        if (this._prependedFiles) {
            sourceFiles = this._prependedFiles.concat(sourceFiles);
        }

        settings.data = sourceFiles
            .filter(function (file) {
                return path.basename(file.name).indexOf('_') !== 0;
            })
            .map(function (file) {
                var fileDir = path.dirname(file.name);
                if (settings.includePaths.indexOf(fileDir) === -1) {
                    settings.includePaths.push(fileDir);
                }

                return that._processUrls(
                    fs.readFileSync(file.fullname, {
                        encoding: 'utf-8'
                    }),
                    file.fullname
                )
            }).join('\n');

        settings.success = function (cssResult) {
            deferred.resolve(cssResult);
        };

        settings.error = function (err) {
            console.log('SASS failed:'.error, err.debug);
            deferred.reject(err.debug);
        };

        sass.render(settings);
        return deferred.promise();
    })
    .methods({
        _processUrls: function (data, filename) {
            return this._getCssPreprocessor()._processUrls(data, filename);
        }
    })
    .createTech();
