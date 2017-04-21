const _ = require('lodash');
const isRequire = require('./is-require');

function isCommentOrEmpty(line) {
    return _.isEmpty(line) || line.match(/^\s*\/\//) || line.match(/^\s*["']use strict["']/);
}

function isLocalRequire(line) {
    return line.match(/require\([\s]?['|"][.|/]/) || line.match(/^import.*from\s['|"][.|/]/);
}

module.exports = function(codeBlock, placeWithExternals) {
    let candidate = 0;
    let requiresStarted = false;
    for (let i = 0; i < codeBlock.length; i += 1) {
        const line = codeBlock[i];
        if (isRequire(line) && (
            !placeWithExternals ||
            (placeWithExternals && !isLocalRequire(line))
           )
        ) {
            requiresStarted = true;
            candidate = i + 1;
        } else if (!isCommentOrEmpty(line)) {
            break;
        } else if (isCommentOrEmpty(line) && !requiresStarted) {
            candidate = i + 1;
        }
    }
    return candidate;
};
