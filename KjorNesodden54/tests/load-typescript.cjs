const { readFileSync } = require('node:fs');
const { join } = require('node:path');
const { runInNewContext } = require('node:vm');
const ts = require('typescript');
module.exports = function load(relativePath, dependencies = {}, globals = {}) {
  const source = readFileSync(join(__dirname, relativePath), 'utf8');
  const exported = {};
  const code = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022,
  } }).outputText;
  runInNewContext(code, {
    exports: exported,
    require(name) {
      if (!(name in dependencies)) throw new Error(`Unexpected dependency ${name}`);
      return dependencies[name];
    },
    ...globals,
  });
  return exported;
};
