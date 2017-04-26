const _ = require('lodash');
const isRequire = require('./is-require');

function isCommentOrEmpty(line) {
    return _.isEmpty(line) ||
    line.match(/^\s*\/\//) ||
    line.match(/^\s*["']use strict["']/);
}

function isLocalRequire(line) {
    return line.match(/require\([\s]?['|"][.|/]/) || line.match(/^import.*from\s['|"][.|/]/);
}

function isInBracketOrComment(line, context) {
    let { inBlockComment, inBracket } = context;
    if (!inBlockComment && !inBracket) {
        if (line.match(/\/\*/)) {
            inBlockComment = true;
        }
        if (line.match(/import.*{/)) {
            inBracket = true;
        }
    }
    if (inBlockComment && line.match(/\*\//)) {
        inBlockComment = false;
    }
    if (inBracket && line.match(/}/)) {
        inBracket = false;
    }
    return {
        inBlockComment,
        inBracket,
    };
}

module.exports = function(codeBlock, placeWithExternals) {
    let candidate = 0;
    let context = {
        inBlockComment: false,
        inBracket: false,
    };
    let requiresStarted = false;
    for (let i = 0; i < codeBlock.length; i += 1) {
        const line = codeBlock[i];
        context = isInBracketOrComment(line, context);

        // If we're in a comment or bracket, the candidate is
        // 2 positions out (to account for the closing tag)
        if (context.inBlockComment || context.inBracket) {
            candidate = i + 2;

        // If the current line is an import bump the candidate up
        // if we're not in the appropriate section for the new import.
        // Also, mark that the require section has started
        } else if (isRequire(line) && (
            !placeWithExternals ||
            (placeWithExternals && !isLocalRequire(line))
           )
        ) {
            requiresStarted = true;
            candidate = i + 1;

        // If the requires section hasn't started yet and we're at a
        // comment, bump candidate up
        } else if (isCommentOrEmpty(line) && !requiresStarted) {
            candidate = i + 1;

        // If the requires section has started and we're not on a
        // require anymore, we're done
        } else if (!isCommentOrEmpty(line) && requiresStarted) {
            break;
        }
    }
    return candidate;
};
