'use strict';

var debug = require('debug')('dirve:generate'),
    colors = require('colors'),
    path = require('path'),
    fs = require('fs'),
    inquirer = require('inquirer'),
    Metalsmith = require('metalsmith'),
    ejs = require('ejs'),
    localPath = path.join(__dirname, 'node_modules');

// prepend ./node_modules to NODE_PATH
process.env.NODE_PATH = process.env.NODE_PATH ?
    localPath + ':' + process.env.NODE_PATH : localPath;

function log(type, msg, color) {
    var LOG_TYPE = {
        error: 'ERROR',
        log: 'INFO'
    }
    var COLOR = {
        error: 'red',
        log: 'green'
    }
    console[type](`[${LOG_TYPE[type][COLOR[type]]}] ${type}`);
}

function required(input) {
    if (input) {
        return true
    }
    return false
}

exports.name = 'generate';
exports.usage = '[options]'
exports.desc = 'generate dirve template';
exports.register = function (commander) {
    commander
        .option('-d --dest [dest]', 'destination')
        .action(function () {
            var args = Array.prototype.slice.call(arguments),
                options = args.pop(),
                opts = {
                    dest: options.dest
                }
            inquirer.prompt([
                {
                    type: 'list',
                    name: 'platform',
                    choices: ['client'],
                    default: 'client'
                },
                {
                    type: 'list',
                    name: 'lib',
                    choices: ['angular', 'vue'],
                    when: function(answers) {
                        return answers.platform === 'client'
                    }
                },
                {
                    type: 'list',
                    name: 'type',
                    choices: ['component', 'controller'],
                    when: function(answers) {
                        return answers.lib === 'angular'
                    }
                },
                {
                    type: 'list',
                    name: 'type',
                    choices: ['component', 'page'],
                    when: function(answers) {
                        return answers.lib === 'vue'
                    }
                },
                {
                    type: 'confirm',
                    name: 'isSub',
                    default: false,
                    message: 'page is subrouter ?',
                    when: function(answers) {
                        return answers.lib === 'vue' && answers.type === 'page'
                    }
                },
                {
                    type: 'input',
                    name: 'filename',
                    validate: required
                },
                {
                    type: 'input',
                    name: 'className',
                    validate: required
                },
                {
                    type: 'input',
                    name: 'componentName',
                    validate: required,
                    when: function(answers) {
                        return answers.type === 'component' && answers.lib === 'angular'
                    }
                },
                {
                    type: 'input',
                    name: 'moduleName',
                    default: '[Module.]Controller[.Action.Params]',
                    validate: function(input) {
                        if (!input) return false
                        return input !== '[Module.]Controller[.Action.Params]'
                    },
                    when: function(answers) {
                        return answers.type === 'controller'
                    }
                }
            ]).then(meta => {
                var dest = path.join(process.cwd(), opts.dest || '', meta.filename)
                var doIt = function() {
                    generate(path.resolve(__dirname, `./template/${meta.platform}/${meta.lib}/${meta.type}`), dest, meta).then(re => {
                        log('log', `[${meta.type}] generate in ${dest}`)
                    })
                }
                try {
                    fs.accessSync(dest, fs.constants.R_OK | fs.constants.W_OK)
                    throw new Error(`folder [${dest}] not empty`)
                } catch (err) {
                    doIt()
                }
            }).catch(err => {
                log('error', err)
            })
        });
};

function template(files, metalsmith, done) {
    var metadata = metalsmith.metadata();
    Object.keys(files).forEach(file => {
        var str = files[file].contents.toString()
        files[file].contents = ejs.render(str, metadata, {
            delimiter: '$'
        })
        var newFileName = file.replace('__file__', metadata.filename)
        if (newFileName !== file) {
            files[newFileName] = files[file]
            delete files[file]
        }
    })
    done()
}

function generate(src, dest, meta) {
    return new Promise((resolve, reject) => {
        var ms = Metalsmith(__dirname).source(src)
        if (!meta.isSub) {
            ms.ignore('.sub')
        }
        ms
        .metadata(JSON.parse(JSON.stringify(meta)))
        .destination(dest)
        .use(template)
        .build(function(err) {
            if (err) {
                reject(err)
            } else {
                resolve()
            }
        })
    }).catch(err => {
        log('error', err)
    })
}
