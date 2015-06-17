var https = require('https');
var npmview = require('npmview');
var semver = require('semver');

var lookupPackageJson = function(userAndRepo, branch, cb) {
    var url = 'https://raw.githubusercontent.com/' + userAndRepo + '/' + branch + '/package.json';
    https.get(url, function(res) {
        var data = '';
        var notFound = false;
        res.on('data', function(d) {
            if (d.toString() === 'Not Found') {
                notFound = true;
            }
            data += d.toString();
        });

        res.on('end', function() {
            if (notFound) {
                console.log('could not fetch ' + url);
                return cb();
            }
            cb(null, data);
        });
    }).on('error', function(e) {

        cb(e);
    });
};

var getNpmModuleName = function(userAndRepo, branch, cb) {
    lookupPackageJson(userAndRepo, branch, function(err, result) {
        if (err) return cb(err);
        return cb(null, result);
    });
};

var getNpmMeta = function(name, cb) {
    npmview(name, function(err, latestVersion, meta) {
        if (err) return cb(err);
        return cb(null, meta);
    });
};

// returns the indexOf if the repo was found in the package.json/meta.repo || repository property
// or null if the property doesn't exist
var findBackLink = function(meta, githubOrigin) {
    var repo = getRepoFromNpmMeta(meta);
    if (repo != null) {
        var tmp = repo.indexOf(githubOrigin);
        return tmp;
    }
    console.log('backlink check: no repo or repository property for: ' + meta.name);
    return null;
};

var getVersionFromSemver = function(version, availableVersions) {
    var tmp = null;
    for (var i=0; i<availableVersions.length; i++) {
        var item = availableVersions[i];
        var result = semver.satisfies(item, version);
        if (!result) {
            break;
        }
        tmp = item;
    }
    return tmp;
};


var getRepoFromNpmMeta = function(meta) {
    var repo = meta.repository || meta.repo;
    if (typeof repo === 'string') {
        return repo;
    } else if (typeof repo.url === 'string') {
        return repo.url;
    } else {
        console.log('unkown repo or repository structure for ' + meta.name);
        return '';
    }
    return null;
};

var githubUrlFallback = function(userAndRepo, version) {
    if (version[0] === '~' || version[0] === '^') version = version.substr(1);
    return 'https+git://github.com/' + userAndRepo + '.git#' + version;
};

var executeCallback = function(name, version, cb) {
    return cb(null, {
        name: name,
        version: version
    });
};

var lookup = function(userAndRepo, originVersion, options, cb) {
    var version = originVersion;
    if (options.branch == null) options.branch = 'master';
    if (!isNaN(parseInt(version[0])) && options.semver) {
        version = options.semver + originVersion;
        console.log('set version to ' + version + ' for ' + userAndRepo);
    }

    if (!semver.validRange(version)) {
        return cb(new Error('invalid version for: ' + userAndRepo + '@' + version));
    }
    getNpmModuleName(userAndRepo, options.branch, function(err, jsonString) {
        if (err) return console.log(err);
        if (jsonString == null) {
            return executeCallback(userAndRepo, githubUrlFallback(userAndRepo, originVersion), cb);
        }
        var name = JSON.parse(jsonString).name;
        getNpmMeta(name, function(err, meta) {
            if (err) return cb(err);
            try {
                var backLinkFound = findBackLink(meta, userAndRepo);
                var versionResult = null;
                if (!options.skipBacklink && (backLinkFound == null || backLinkFound < 0)) {
                    var graph = userAndRepo + ' -> ' + meta.name + ' -> ' + getRepoFromNpmMeta(meta);
                    console.log('wrong backlink from npm: ' + graph);
                } else {
                    var tmp = getVersionFromSemver(version, meta.versions);
                    if (tmp == null) {
                        console.log('no satisfied version found for: '+version+ ' (run: npm info '+meta.name+')');
                    } else {
                        versionResult = tmp;
                    }
                }
                if (versionResult == null) {
                    versionResult = githubUrlFallback(userAndRepo, originVersion);
                }
                return executeCallback(name, versionResult, cb);
            } catch (e) {
                console.log(e);
                process.exit(1);
            }

        });
    });
};

module.exports = lookup;