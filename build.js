var compiler = require('./compiler.js');

compiler.init({
    level      : 'advanced',
    path       : 'D:/dev/test/compiler/compilation_folder',
    compiler   : 'D:/dev/mjl2/tools/compiler.jar',
    formatting : 'pretty',
    original   : 'rename',
    warning    : 'quiet',
    callback   : function(error) {if (error !== null) {console.log(error)}}
});

compiler.addExterns('D:/dev/test/compiler/externs.js');

compiler.add('part1');
compiler.add('part2', ['part1']);
compiler.add('folder/part3', ['part1']);

compiler.run();


