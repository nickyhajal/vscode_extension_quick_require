const _ = require('lodash');
const isRequire = require('./is-require');

function isComment(line) {
    return (
        line.match(/^\s*\/\//) ||
        line.match(/^\s*["']use strict["']/) ||
        line.match(/^\s*(\/\/|\/\*)/)
    );
}

function isCommentOrEmpty(line) {
    return _.isEmpty(line) || isComment(line);
}

function isLocalRequire(line) {
    return (
        line.match(/require\([\s]?['|"][.|/]/) ||
        line.match(/^import.*from\s['|"][.|/]/)
    );
}

function isTypeDefinition(line) {
    const parts = line.split(' ');
    return parts[0] === 'import' && parts[1] === 'type' && parts[2] !== 'from';
}

function isInBracketOrComment(line, context) {
    let { inBlockComment, inBracket } = context;

    // If we haven't been in a comment or bracket,
    // check if we are
    if (!inBlockComment && !inBracket) {
        if (line.match(/\/\*/)) {
            inBlockComment = true;
        }
        if (line.match(/import.*{/)) {
            inBracket = true;
        }
    }

    // Check if the bracket or comment ends
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
        if (
            context.inBlockComment ||
            (context.inBracket && !isTypeDefinition(line))
        ) {
            candidate = i + 2;

        // If the current line is an import bump the candidate up
        // if we're not in the appropriate section for the new import.
        // Also, mark that the require section has started
        } else if (
            isRequire(line) &&
            ((!placeWithExternals ||
                (placeWithExternals && !isLocalRequire(line))) &&
                !isTypeDefinition(line))
        ) {
            requiresStarted = true;
            candidate = i + 1;

        // If the requires section hasn't started yet and we're at a
        // comment, bump candidate up
        } else if (isComment(line) && !requiresStarted) {
            candidate = i + 1;

        // If the requires section has started and we're not on a
        // require anymore, we're done
        } else if (!isCommentOrEmpty(line) && requiresStarted) {
            break;
        }
    }
    return candidate;
};
