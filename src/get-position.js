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
    let inBlockComment = false;
    let inBracket = false;
    for (let i = 0; i < codeBlock.length; i += 1) {
        const line = codeBlock[i];
        if (!inBlockComment && !inBracket) {
            if (line.match(/\/*/)) inBlockComment = true;
            if (line.match(/{/)) inBracket = true;
        } else if (inBlockComment) {
            if (line.match(/\/\*\//)) inBlockComment = false;
        } else if (inBracket) {
            if (line.match(/}/)) inBracket = false;
        }
        if (inBracket || inBlockComment) {
            candidate = i + 1;
        } else if (isRequire(line) && (
            !placeWithExternals ||
            (placeWithExternals && !isLocalRequire(line))
           )
        ) {
            candidate = i + 1;
        } else if (!isCommentOrEmpty(line)) {
            break;
        }
    }
    return candidate;
};
