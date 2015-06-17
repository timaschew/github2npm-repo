#!/usr/bin/env node
var program = require('commander');
var lookup = require('./index');

program
  .usage('[options] <github/repo> <version>')
  .option('-s, --semver <^|~>', 'force to use semver if the given version is fixed version')
  .option('-b, --branch <branch>', 'set the branch where to lookup the package.json for the npm module, default: master', 'master')
  .option('-s, --skip-backlink', 'do not verify if the backlink in the package.json on the npm registry is fine')
  .parse(process.argv);

if (program.args.length <= 1) {
    console.log(program.help());
    return;
}

var userAndRepo = program.args[0];
var version =  program.args[1];
var options = {
    semver: program.semver,
    branch: program.branch,
    skipBacklink: program.skipBacklink
};

lookup(userAndRepo, version, options, function(err, result) {
    if (err) {
        console.log(err);
        process.exit(1);
    }
    console.log(JSON.stringify(result, null, 4));
});