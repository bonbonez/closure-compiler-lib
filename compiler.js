var fs            = require('fs'),
    path          = require('path'),
    child_process = require('child_process'),

    compiler_jar_path     = path.join(__dirname, 'compiler.jar'),
    compilation_path      = __dirname,
    compilation_path_temp = path.join(__dirname, 'temp') + '/',
    slash_symbol          = '_Slash_',

    exec_options   = [],
    exec_options   = [],
    exec_ready     = false,

    files   = [],
    externs = [],
    errors  = [],

    original          = 'rename',
    compilation_level = 'SIMPLE_OPTIMIZATIONS',
    warning_level     = 'DEFAULT'
    formatting_type   = ''

    exec_callback = function() {};

exports.run = function() {

    if (checkErrors()) {
        return;
    }

    mkdirSyncRecursive(compilation_path_temp);

    exec_options.push('--compilation_level', compilation_level);

    if (formatting_type != '') {
        exec_options.push('--formatting', formatting_type);
    }

    exec_options.push('--module_output_path_prefix', compilation_path_temp)

    var i, file;

    for (i = 0; i < files.length; ++i) {

        file = files[i];
        exec_options.push('--js', getFilePath(file.name));
        exec_options.push('--module', generateModuleName(file.name, file.deps));
        exec_options.push('--module_wrapper', generateModuleWrapper(file.name));

    }

    for (i = 0; i < externs.length; ++i) {
        exec_options.push('--externs', externs[i]);
    }

    runCompiler();

};

function runCompiler() {

    var exec = buildExec();

    child_process.exec(exec, function(error) {
        if (error !== null) {
            exec_callback(error)
        } else {
            afterBuild();
        }
    });

};

function afterBuild() {

    switch (original) {
        case 'overwrite':
            overwriteOriginalFiles();
            break;

        case 'rename':
            renameOriginalFiles();
            break;
    }

    fs.rmdirSync(compilation_path_temp);

    exec_callback(null);
}

function overwriteOriginalFiles() {

    var i;

    for (i = 0; i < files.length; ++i) {
        fs.renameSync(getFilePathTemp(files[i].name), getFilePath(files[i].name));
    }

}

function renameOriginalFiles() {

    var i, file;

    for (i = 0; i < files.length; ++i) {

        file = files[i];

        fs.renameSync(getFilePath(file.name), getFilePath(file.name) + '.bak');
        fs.renameSync(getFilePathTemp(file.name), getFilePath(file.name));
    }
}

exports.init = function(config) {

    if (typeof config != 'undefined') {
        this.set(config);
    }

};

exports.set = function(config) {

    if (typeof config != 'undefined') {

        if (typeof config.path != 'undefined') {
            this.setCompilationPath(config.path);
        }

        if (typeof config.level != 'undefined') {
            this.setOptimizationLevel(config.level)
        }

        if (typeof config.compiler != 'undefined') {
            this.setCompilerPath(config.compiler);
        }

        if (typeof config.formatting != 'undefined') {
            this.setFormatting(config.formatting)
        }

        if (typeof config.original != 'undefined') {
            this.setOriginal(config.original);
        }

        if (typeof config.warning != 'undefined') {
            this.setWarning(config.warning);
        }

        if (typeof config.callback != 'undefined') {
            this.setExecCallback(config.callback);
        }

        return this;

    }

};

exports.add = function(file, deps) {

    var object = {};

    if (fileExists(getFilePath(file))) {

        object.name = cleanName(file);

        if (typeof deps != 'undefined') {
            object.deps = deps;
        }

        files.push(object);

    };

};

exports.addExterns = function(file) {

    if (path.existsSync(file)) {
        externs.push(file);
    }

};

exports.setCompilationPath = function(_compilation_path) {

    if (!path.existsSync(_compilation_path)) {
        errors.push('No such directory "' + _compilation_path+ '". Set existing directory with js files to compile.');
    }
    compilation_path      = _compilation_path;
    compilation_path_temp = path.join(_compilation_path, 'temp') + '/';

};

exports.setOptimizationLevel = function(level) {

    if (typeof level != 'undefined') {

        switch (level) {
            case 'simple':
            case 'SIMPLE_OPTIMIZATIONS':
                compilation_level = 'SIMPLE_OPTIMIZATIONS';
                break;

            case 'whitespace':
            case 'WHITESPACE_ONLY':
                compilation_level = 'WHITESPACE_ONLY';
                break;

            case 'advanced':
            case 'ADVANCED_OPTIMIZATIONS':
                compilation_level = 'ADVANCED_OPTIMIZATIONS';
                break;
        }

    }

};

exports.setFormatting = function(formatting) {

    if (typeof formatting != 'undefined') {

        switch (formatting) {
            case 'pretty':
            case 'PRETTY_PRINT':
                formatting_type = 'PRETTY_PRINT';
                break;

            case 'input_delimiter':
            case 'PRINT_INPUT_DELIMITER':
                formatting_type = 'PRINT_INPUT_DELIMITER';
                break;
        }

    }

};

exports.setOriginal = function(action) {

    if (typeof action != 'undefined') {

        switch (action) {
            case 'overwrite':
            case 'replace':
                original = 'overwrite';
                break;

            case 'rename':
                original  = 'rename';
                break;

        }

    }

};

exports.setWarning = function(warning) {

    if (typeof warning != 'undefined') {

        switch (warning) {
            case 'quiet':
            case 'QUIET':
                warning_level = 'QUIET';
                break;

            case 'verbose':
            case 'VERBOSE':
                warning_level = 'VERBOSE';
                break;

            default:
                warning_level = 'DEFAULT';
        }

    }

};

exports.setExecCallback = function(callback) {

    if (typeof callback != 'undefined' && callback.constructor === Function) {

        exec_callback = callback;

    }

};

exports.setCompilerPath = function(file) {

    if (fileExists(file)) {
        compiler_jar_path = file;
    }

};

exports.ready = function() {
    return exec_ready;
};

function fileExists(file) {

    if (!path.existsSync(file)) {
        errors.push('File "' + file + '" not found.');
        return false;
    }

    if (fs.statSync(file).isDirectory()) {
        errors.push('"' + file + '" is a directory.');
        return false
    }

    return true;

}



function buildExec() {

    var _return = 'java -jar ' + compiler_jar_path + ' ',
        i, l = exec_options.length;

    for (i = 0; i < l; ++i) {
        _return += exec_options[i] + ' ';
    }

    return _return;

}

function checkErrors() {

    if (compilation_path == '') {
        errors.push('You should specify the path where your js files lies.');
    }

    if (files.length == 0) {
        errors.push('You should add at least one file.');
    }

    if (errors.length > 0) {
        displayErrors();
        return;
    }

};

function displayErrors() {

    var i, l = errors.length;

    console.log('Please, set your compiler options correctly. Errors:');

    for (i = 0; i < l; ++i) {
        console.log(i + 1 + '. ' + errors[i]);
    }

}

function screenSlashes(file_path) {
    return file_path.replace(/([\\/]{1})/, slash_symbol);
}

function restoreSlashes(file_path) {
    return path.normalize(file_path.replace(slash_symbol, '/'));
}

function getFilePath(file) {
    return path.join(compilation_path, cleanName(file) + '.js');
}

function getFilePathTemp(file) {
    return path.join(compilation_path_temp, screenSlashes(cleanName(file) + '.js'))
}

function cleanName(file) {

    if (file.slice(file.length - 3) == '.js') {
        file = file.slice(0, file.length - 3);
    }

    return file;
}

function generateModuleName(name, deps) {

    name = screenSlashes(name);
    name += ':1';

    if (typeof deps != 'undefined') {
        name += ':' + deps.join(',');
    }

    return name;
}

function generateModuleWrapper(name) {

    return screenSlashes(name) + ":(function(){%s})()";

}

/* wrench.js node.js library functions */
function readdirSyncRecursive(a){var a=a.replace(/\/$/,""),e=function(b){var c=[],d,a;d=fs.readdirSync(b);a=d.filter(function(a){return fs.statSync(path.join(b,a)).isDirectory()});d=d.map(function(a){return path.join(b,a)});for(c=c.concat(d);a.length;)c=c.concat(e(path.join(b,a.shift())));return c};return e(a).map(function(b){return path.relative(a,b)})};
function mkdirSyncRecursive(b,d){try{fs.mkdirSync(b,d)}catch(c){if("ENOENT"==c.code){var a=b.lastIndexOf("/");0>a&&(a=b.lastIndexOf("\\"));if(0<a)a=b.substring(0,a),mkdirSyncRecursive(a,d),mkdirSyncRecursive(b,d);else throw c;}else if("EEXIST"!=c.code)throw c;}}