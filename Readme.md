# github2npm-repo

This tool will lookup a GitHub repository in the style of `user/repo` for
the npm module name. This is done be parsing the __package.json__ in the __master__ branch.
It also checks if the npm module have a backlink to the
GitHub repository via the `repo` or `repository` property in the __package.json__

You can use this tool to get all your dependencies if you using a GitHub based endpoint package manager.
For instance [bower](http://bower.io/) or [component](component.github.io).

##### Fallback
If no module is not in the npm registry or no satisfied version was found it will fallback
to [GitHub URL dependency](https://docs.npmjs.com/files/package.json#git-urls-as-dependencies) for npm. __Note:__ npm will not support semver in this case!
The fallback (GitHub URL) doesn't use a semver, this feature needs a query to the GitHUB API with an authentication.
(This feature will maybe come in the next version)


### Install

`npm install github2npm-repo -g`

### Usage CLI

  Usage: cli [options] <github/repo> <version>

  Options:

    -h, --help             output usage information
    -s, --semver <^|~>     force to use semver if the given version is fixed version
    -b, --branch <branch>  set the branch where to lookup the package.json for the npm module, default: master
    -s, --skip-backlink    do not verify if the backlink in the package.json on the npm registry is fine

Example:

`github2npm-repo component/dom ~1.0.0`

Result would be:

```json
{
    "name": "component-dom",
    "version": "1.0.8"
}
```

### Usage API

###### lookup(githubRepo, version, options, callback)

- `githubRepo` - GitHub repo __<USERNAME>/<REPONAME>__
- `version` - a valid semantiv version
- `options` - options object: `options.semver`, `options.branch` and `options.skipBacklink`, see CLI
- `callback(err, result)` - callback with an error and the result as json object

Example:

```javascript
var lookup = require('github2npm-repo');
lookup('component/dom', '~1.0.0', {}, function(err, result) {
    console.log(err);
    console.log(result);
})
```