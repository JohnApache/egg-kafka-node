'use strict';

const isString = data => typeof data === 'string';

const isTsFile = filepath => filepath.endsWith('.ts');
const isJsFile = filepath => filepath.endsWith('.js');
const requireTsFile = filepath => {
  if (!filepath || !isString(filepath)) return;
  require('ts-node/register');
  return require(filepath);
};

const requireFile = filepath => {
  if (!filepath || !isString(filepath)) return;
  if (isJsFile(filepath)) {
    return require(filepath);
  }
  if (isTsFile(filepath)) {
    return requireTsFile(filepath);
  }
  return;
};


module.exports = {
  isString,
  requireFile,
};
