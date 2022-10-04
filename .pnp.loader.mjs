import { URL as URL$1, fileURLToPath, pathToFileURL } from 'url';
import fs from 'fs';
import path from 'path';
import moduleExports, { Module } from 'module';
import assert from 'assert';

const npath = Object.create(path);
const ppath = Object.create(path.posix);
npath.cwd = () => process.cwd();
ppath.cwd = () => toPortablePath(process.cwd());
ppath.resolve = (...segments) => {
  if (segments.length > 0 && ppath.isAbsolute(segments[0])) {
    return path.posix.resolve(...segments);
  } else {
    return path.posix.resolve(ppath.cwd(), ...segments);
  }
};
const contains = function(pathUtils, from, to) {
  from = pathUtils.normalize(from);
  to = pathUtils.normalize(to);
  if (from === to)
    return `.`;
  if (!from.endsWith(pathUtils.sep))
    from = from + pathUtils.sep;
  if (to.startsWith(from)) {
    return to.slice(from.length);
  } else {
    return null;
  }
};
npath.fromPortablePath = fromPortablePath;
npath.toPortablePath = toPortablePath;
npath.contains = (from, to) => contains(npath, from, to);
ppath.contains = (from, to) => contains(ppath, from, to);
const WINDOWS_PATH_REGEXP = /^([a-zA-Z]:.*)$/;
const UNC_WINDOWS_PATH_REGEXP = /^\/\/(\.\/)?(.*)$/;
const PORTABLE_PATH_REGEXP = /^\/([a-zA-Z]:.*)$/;
const UNC_PORTABLE_PATH_REGEXP = /^\/unc\/(\.dot\/)?(.*)$/;
function fromPortablePath(p) {
  if (process.platform !== `win32`)
    return p;
  let portablePathMatch, uncPortablePathMatch;
  if (portablePathMatch = p.match(PORTABLE_PATH_REGEXP))
    p = portablePathMatch[1];
  else if (uncPortablePathMatch = p.match(UNC_PORTABLE_PATH_REGEXP))
    p = `\\\\${uncPortablePathMatch[1] ? `.\\` : ``}${uncPortablePathMatch[2]}`;
  else
    return p;
  return p.replace(/\//g, `\\`);
}
function toPortablePath(p) {
  if (process.platform !== `win32`)
    return p;
  p = p.replace(/\\/g, `/`);
  let windowsPathMatch, uncWindowsPathMatch;
  if (windowsPathMatch = p.match(WINDOWS_PATH_REGEXP))
    p = `/${windowsPathMatch[1]}`;
  else if (uncWindowsPathMatch = p.match(UNC_WINDOWS_PATH_REGEXP))
    p = `/unc/${uncWindowsPathMatch[1] ? `.dot/` : ``}${uncWindowsPathMatch[2]}`;
  return p;
}

const builtinModules = new Set(Module.builtinModules || Object.keys(process.binding(`natives`)));
const isBuiltinModule = (request) => request.startsWith(`node:`) || builtinModules.has(request);
function readPackageScope(checkPath) {
  const rootSeparatorIndex = checkPath.indexOf(npath.sep);
  let separatorIndex;
  do {
    separatorIndex = checkPath.lastIndexOf(npath.sep);
    checkPath = checkPath.slice(0, separatorIndex);
    if (checkPath.endsWith(`${npath.sep}node_modules`))
      return false;
    const pjson = readPackage(checkPath + npath.sep);
    if (pjson) {
      return {
        data: pjson,
        path: checkPath
      };
    }
  } while (separatorIndex > rootSeparatorIndex);
  return false;
}
function readPackage(requestPath) {
  const jsonPath = npath.resolve(requestPath, `package.json`);
  if (!fs.existsSync(jsonPath))
    return null;
  return JSON.parse(fs.readFileSync(jsonPath, `utf8`));
}

const [major, minor] = process.versions.node.split(`.`).map((value) => parseInt(value, 10));
const HAS_CONSOLIDATED_HOOKS = major > 16 || major === 16 && minor >= 12;
const HAS_UNFLAGGED_JSON_MODULES = major > 17 || major === 17 && minor >= 5 || major === 16 && minor >= 15;
const HAS_JSON_IMPORT_ASSERTION_REQUIREMENT = major > 17 || major === 17 && minor >= 1 || major === 16 && minor > 14;

async function tryReadFile$1(path2) {
  try {
    return await fs.promises.readFile(path2, `utf8`);
  } catch (error) {
    if (error.code === `ENOENT`)
      return null;
    throw error;
  }
}
function tryParseURL(str, base) {
  try {
    return new URL$1(str, base);
  } catch {
    return null;
  }
}
let entrypointPath = null;
function setEntrypointPath(file) {
  entrypointPath = file;
}
function getFileFormat(filepath) {
  const ext = path.extname(filepath);
  switch (ext) {
    case `.mjs`: {
      return `module`;
    }
    case `.cjs`: {
      return `commonjs`;
    }
    case `.wasm`: {
      throw new Error(
        `Unknown file extension ".wasm" for ${filepath}`
      );
    }
    case `.json`: {
      if (HAS_UNFLAGGED_JSON_MODULES)
        return `json`;
      throw new Error(
        `Unknown file extension ".json" for ${filepath}`
      );
    }
    case `.js`: {
      const pkg = readPackageScope(filepath);
      if (!pkg)
        return `commonjs`;
      return pkg.data.type ?? `commonjs`;
    }
    default: {
      if (entrypointPath !== filepath)
        return null;
      const pkg = readPackageScope(filepath);
      if (!pkg)
        return `commonjs`;
      if (pkg.data.type === `module`)
        return null;
      return pkg.data.type ?? `commonjs`;
    }
  }
}

async function getFormat$1(resolved, context, defaultGetFormat) {
  const url = tryParseURL(resolved);
  if ((url == null ? void 0 : url.protocol) !== `file:`)
    return defaultGetFormat(resolved, context, defaultGetFormat);
  const format = getFileFormat(fileURLToPath(url));
  if (format) {
    return {
      format
    };
  }
  return defaultGetFormat(resolved, context, defaultGetFormat);
}

async function getSource$1(urlString, context, defaultGetSource) {
  const url = tryParseURL(urlString);
  if ((url == null ? void 0 : url.protocol) !== `file:`)
    return defaultGetSource(urlString, context, defaultGetSource);
  return {
    source: await fs.promises.readFile(fileURLToPath(url), `utf8`)
  };
}

async function load$1(urlString, context, nextLoad) {
  var _a;
  const url = tryParseURL(urlString);
  if ((url == null ? void 0 : url.protocol) !== `file:`)
    return nextLoad(urlString, context, nextLoad);
  const filePath = fileURLToPath(url);
  const format = getFileFormat(filePath);
  if (!format)
    return nextLoad(urlString, context, nextLoad);
  if (HAS_JSON_IMPORT_ASSERTION_REQUIREMENT && format === `json` && ((_a = context.importAssertions) == null ? void 0 : _a.type) !== `json`) {
    const err = new TypeError(`[ERR_IMPORT_ASSERTION_TYPE_MISSING]: Module "${urlString}" needs an import assertion of type "json"`);
    err.code = `ERR_IMPORT_ASSERTION_TYPE_MISSING`;
    throw err;
  }
  return {
    format,
    source: await fs.promises.readFile(filePath, `utf8`),
    shortCircuit: true
  };
}

const ArrayIsArray = Array.isArray;
const JSONStringify = JSON.stringify;
const ObjectGetOwnPropertyNames = Object.getOwnPropertyNames;
const ObjectPrototypeHasOwnProperty = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);
const RegExpPrototypeExec = (obj, string) => RegExp.prototype.exec.call(obj, string);
const RegExpPrototypeSymbolReplace = (obj, ...rest) => RegExp.prototype[Symbol.replace].apply(obj, rest);
const StringPrototypeEndsWith = (str, ...rest) => String.prototype.endsWith.apply(str, rest);
const StringPrototypeIncludes = (str, ...rest) => String.prototype.includes.apply(str, rest);
const StringPrototypeLastIndexOf = (str, ...rest) => String.prototype.lastIndexOf.apply(str, rest);
const StringPrototypeIndexOf = (str, ...rest) => String.prototype.indexOf.apply(str, rest);
const StringPrototypeReplace = (str, ...rest) => String.prototype.replace.apply(str, rest);
const StringPrototypeSlice = (str, ...rest) => String.prototype.slice.apply(str, rest);
const StringPrototypeStartsWith = (str, ...rest) => String.prototype.startsWith.apply(str, rest);
const SafeMap = Map;
const JSONParse = JSON.parse;

function createErrorType(code, messageCreator, errorType) {
  return class extends errorType {
    constructor(...args) {
      super(messageCreator(...args));
      this.code = code;
      this.name = `${errorType.name} [${code}]`;
    }
  };
}
const ERR_PACKAGE_IMPORT_NOT_DEFINED = createErrorType(
  `ERR_PACKAGE_IMPORT_NOT_DEFINED`,
  (specifier, packagePath, base) => {
    return `Package import specifier "${specifier}" is not defined${packagePath ? ` in package ${packagePath}package.json` : ``} imported from ${base}`;
  },
  TypeError
);
const ERR_INVALID_MODULE_SPECIFIER = createErrorType(
  `ERR_INVALID_MODULE_SPECIFIER`,
  (request, reason, base = void 0) => {
    return `Invalid module "${request}" ${reason}${base ? ` imported from ${base}` : ``}`;
  },
  TypeError
);
const ERR_INVALID_PACKAGE_TARGET = createErrorType(
  `ERR_INVALID_PACKAGE_TARGET`,
  (pkgPath, key, target, isImport = false, base = void 0) => {
    const relError = typeof target === `string` && !isImport && target.length && !StringPrototypeStartsWith(target, `./`);
    if (key === `.`) {
      assert(isImport === false);
      return `Invalid "exports" main target ${JSONStringify(target)} defined in the package config ${pkgPath}package.json${base ? ` imported from ${base}` : ``}${relError ? `; targets must start with "./"` : ``}`;
    }
    return `Invalid "${isImport ? `imports` : `exports`}" target ${JSONStringify(
      target
    )} defined for '${key}' in the package config ${pkgPath}package.json${base ? ` imported from ${base}` : ``}${relError ? `; targets must start with "./"` : ``}`;
  },
  Error
);
const ERR_INVALID_PACKAGE_CONFIG = createErrorType(
  `ERR_INVALID_PACKAGE_CONFIG`,
  (path, base, message) => {
    return `Invalid package config ${path}${base ? ` while importing ${base}` : ``}${message ? `. ${message}` : ``}`;
  },
  Error
);

function filterOwnProperties(source, keys) {
  const filtered = /* @__PURE__ */ Object.create(null);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (ObjectPrototypeHasOwnProperty(source, key)) {
      filtered[key] = source[key];
    }
  }
  return filtered;
}

const packageJSONCache = new SafeMap();
function getPackageConfig(path, specifier, base, readFileSyncFn) {
  const existing = packageJSONCache.get(path);
  if (existing !== void 0) {
    return existing;
  }
  const source = readFileSyncFn(path);
  if (source === void 0) {
    const packageConfig2 = {
      pjsonPath: path,
      exists: false,
      main: void 0,
      name: void 0,
      type: "none",
      exports: void 0,
      imports: void 0
    };
    packageJSONCache.set(path, packageConfig2);
    return packageConfig2;
  }
  let packageJSON;
  try {
    packageJSON = JSONParse(source);
  } catch (error) {
    throw new ERR_INVALID_PACKAGE_CONFIG(
      path,
      (base ? `"${specifier}" from ` : "") + fileURLToPath(base || specifier),
      error.message
    );
  }
  let { imports, main, name, type } = filterOwnProperties(packageJSON, [
    "imports",
    "main",
    "name",
    "type"
  ]);
  const exports = ObjectPrototypeHasOwnProperty(packageJSON, "exports") ? packageJSON.exports : void 0;
  if (typeof imports !== "object" || imports === null) {
    imports = void 0;
  }
  if (typeof main !== "string") {
    main = void 0;
  }
  if (typeof name !== "string") {
    name = void 0;
  }
  if (type !== "module" && type !== "commonjs") {
    type = "none";
  }
  const packageConfig = {
    pjsonPath: path,
    exists: true,
    main,
    name,
    type,
    exports,
    imports
  };
  packageJSONCache.set(path, packageConfig);
  return packageConfig;
}
function getPackageScopeConfig(resolved, readFileSyncFn) {
  let packageJSONUrl = new URL("./package.json", resolved);
  while (true) {
    const packageJSONPath2 = packageJSONUrl.pathname;
    if (StringPrototypeEndsWith(packageJSONPath2, "node_modules/package.json")) {
      break;
    }
    const packageConfig2 = getPackageConfig(
      fileURLToPath(packageJSONUrl),
      resolved,
      void 0,
      readFileSyncFn
    );
    if (packageConfig2.exists) {
      return packageConfig2;
    }
    const lastPackageJSONUrl = packageJSONUrl;
    packageJSONUrl = new URL("../package.json", packageJSONUrl);
    if (packageJSONUrl.pathname === lastPackageJSONUrl.pathname) {
      break;
    }
  }
  const packageJSONPath = fileURLToPath(packageJSONUrl);
  const packageConfig = {
    pjsonPath: packageJSONPath,
    exists: false,
    main: void 0,
    name: void 0,
    type: "none",
    exports: void 0,
    imports: void 0
  };
  packageJSONCache.set(packageJSONPath, packageConfig);
  return packageConfig;
}

/**
  @license
  Copyright Node.js contributors. All rights reserved.

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to
  deal in the Software without restriction, including without limitation the
  rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
  sell copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
  FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS
  IN THE SOFTWARE.
*/
function throwImportNotDefined(specifier, packageJSONUrl, base) {
  throw new ERR_PACKAGE_IMPORT_NOT_DEFINED(
    specifier,
    packageJSONUrl && fileURLToPath(new URL(".", packageJSONUrl)),
    fileURLToPath(base)
  );
}
function throwInvalidSubpath(subpath, packageJSONUrl, internal, base) {
  const reason = `request is not a valid subpath for the "${internal ? "imports" : "exports"}" resolution of ${fileURLToPath(packageJSONUrl)}`;
  throw new ERR_INVALID_MODULE_SPECIFIER(
    subpath,
    reason,
    base && fileURLToPath(base)
  );
}
function throwInvalidPackageTarget(subpath, target, packageJSONUrl, internal, base) {
  if (typeof target === "object" && target !== null) {
    target = JSONStringify(target, null, "");
  } else {
    target = `${target}`;
  }
  throw new ERR_INVALID_PACKAGE_TARGET(
    fileURLToPath(new URL(".", packageJSONUrl)),
    subpath,
    target,
    internal,
    base && fileURLToPath(base)
  );
}
const invalidSegmentRegEx = /(^|\\|\/)((\.|%2e)(\.|%2e)?|(n|%6e|%4e)(o|%6f|%4f)(d|%64|%44)(e|%65|%45)(_|%5f)(m|%6d|%4d)(o|%6f|%4f)(d|%64|%44)(u|%75|%55)(l|%6c|%4c)(e|%65|%45)(s|%73|%53))(\\|\/|$)/i;
const patternRegEx = /\*/g;
function resolvePackageTargetString(target, subpath, match, packageJSONUrl, base, pattern, internal, conditions) {
  if (subpath !== "" && !pattern && target[target.length - 1] !== "/")
    throwInvalidPackageTarget(match, target, packageJSONUrl, internal, base);
  if (!StringPrototypeStartsWith(target, "./")) {
    if (internal && !StringPrototypeStartsWith(target, "../") && !StringPrototypeStartsWith(target, "/")) {
      let isURL = false;
      try {
        new URL(target);
        isURL = true;
      } catch {
      }
      if (!isURL) {
        const exportTarget = pattern ? RegExpPrototypeSymbolReplace(patternRegEx, target, () => subpath) : target + subpath;
        return exportTarget;
      }
    }
    throwInvalidPackageTarget(match, target, packageJSONUrl, internal, base);
  }
  if (RegExpPrototypeExec(
    invalidSegmentRegEx,
    StringPrototypeSlice(target, 2)
  ) !== null)
    throwInvalidPackageTarget(match, target, packageJSONUrl, internal, base);
  const resolved = new URL(target, packageJSONUrl);
  const resolvedPath = resolved.pathname;
  const packagePath = new URL(".", packageJSONUrl).pathname;
  if (!StringPrototypeStartsWith(resolvedPath, packagePath))
    throwInvalidPackageTarget(match, target, packageJSONUrl, internal, base);
  if (subpath === "")
    return resolved;
  if (RegExpPrototypeExec(invalidSegmentRegEx, subpath) !== null) {
    const request = pattern ? StringPrototypeReplace(match, "*", () => subpath) : match + subpath;
    throwInvalidSubpath(request, packageJSONUrl, internal, base);
  }
  if (pattern) {
    return new URL(
      RegExpPrototypeSymbolReplace(patternRegEx, resolved.href, () => subpath)
    );
  }
  return new URL(subpath, resolved);
}
function isArrayIndex(key) {
  const keyNum = +key;
  if (`${keyNum}` !== key)
    return false;
  return keyNum >= 0 && keyNum < 4294967295;
}
function resolvePackageTarget(packageJSONUrl, target, subpath, packageSubpath, base, pattern, internal, conditions) {
  if (typeof target === "string") {
    return resolvePackageTargetString(
      target,
      subpath,
      packageSubpath,
      packageJSONUrl,
      base,
      pattern,
      internal);
  } else if (ArrayIsArray(target)) {
    if (target.length === 0) {
      return null;
    }
    let lastException;
    for (let i = 0; i < target.length; i++) {
      const targetItem = target[i];
      let resolveResult;
      try {
        resolveResult = resolvePackageTarget(
          packageJSONUrl,
          targetItem,
          subpath,
          packageSubpath,
          base,
          pattern,
          internal,
          conditions
        );
      } catch (e) {
        lastException = e;
        if (e.code === "ERR_INVALID_PACKAGE_TARGET") {
          continue;
        }
        throw e;
      }
      if (resolveResult === void 0) {
        continue;
      }
      if (resolveResult === null) {
        lastException = null;
        continue;
      }
      return resolveResult;
    }
    if (lastException === void 0 || lastException === null)
      return lastException;
    throw lastException;
  } else if (typeof target === "object" && target !== null) {
    const keys = ObjectGetOwnPropertyNames(target);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (isArrayIndex(key)) {
        throw new ERR_INVALID_PACKAGE_CONFIG(
          fileURLToPath(packageJSONUrl),
          base,
          '"exports" cannot contain numeric property keys.'
        );
      }
    }
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key === "default" || conditions.has(key)) {
        const conditionalTarget = target[key];
        const resolveResult = resolvePackageTarget(
          packageJSONUrl,
          conditionalTarget,
          subpath,
          packageSubpath,
          base,
          pattern,
          internal,
          conditions
        );
        if (resolveResult === void 0)
          continue;
        return resolveResult;
      }
    }
    return void 0;
  } else if (target === null) {
    return null;
  }
  throwInvalidPackageTarget(
    packageSubpath,
    target,
    packageJSONUrl,
    internal,
    base
  );
}
function patternKeyCompare(a, b) {
  const aPatternIndex = StringPrototypeIndexOf(a, "*");
  const bPatternIndex = StringPrototypeIndexOf(b, "*");
  const baseLenA = aPatternIndex === -1 ? a.length : aPatternIndex + 1;
  const baseLenB = bPatternIndex === -1 ? b.length : bPatternIndex + 1;
  if (baseLenA > baseLenB)
    return -1;
  if (baseLenB > baseLenA)
    return 1;
  if (aPatternIndex === -1)
    return 1;
  if (bPatternIndex === -1)
    return -1;
  if (a.length > b.length)
    return -1;
  if (b.length > a.length)
    return 1;
  return 0;
}
function packageImportsResolve({
  name,
  base,
  conditions,
  readFileSyncFn
}) {
  if (name === "#" || StringPrototypeStartsWith(name, "#/") || StringPrototypeEndsWith(name, "/")) {
    const reason = "is not a valid internal imports specifier name";
    throw new ERR_INVALID_MODULE_SPECIFIER(name, reason, fileURLToPath(base));
  }
  let packageJSONUrl;
  const packageConfig = getPackageScopeConfig(base, readFileSyncFn);
  if (packageConfig.exists) {
    packageJSONUrl = pathToFileURL(packageConfig.pjsonPath);
    const imports = packageConfig.imports;
    if (imports) {
      if (ObjectPrototypeHasOwnProperty(imports, name) && !StringPrototypeIncludes(name, "*")) {
        const resolveResult = resolvePackageTarget(
          packageJSONUrl,
          imports[name],
          "",
          name,
          base,
          false,
          true,
          conditions
        );
        if (resolveResult != null) {
          return resolveResult;
        }
      } else {
        let bestMatch = "";
        let bestMatchSubpath;
        const keys = ObjectGetOwnPropertyNames(imports);
        for (let i = 0; i < keys.length; i++) {
          const key = keys[i];
          const patternIndex = StringPrototypeIndexOf(key, "*");
          if (patternIndex !== -1 && StringPrototypeStartsWith(
            name,
            StringPrototypeSlice(key, 0, patternIndex)
          )) {
            const patternTrailer = StringPrototypeSlice(key, patternIndex + 1);
            if (name.length >= key.length && StringPrototypeEndsWith(name, patternTrailer) && patternKeyCompare(bestMatch, key) === 1 && StringPrototypeLastIndexOf(key, "*") === patternIndex) {
              bestMatch = key;
              bestMatchSubpath = StringPrototypeSlice(
                name,
                patternIndex,
                name.length - patternTrailer.length
              );
            }
          }
        }
        if (bestMatch) {
          const target = imports[bestMatch];
          const resolveResult = resolvePackageTarget(
            packageJSONUrl,
            target,
            bestMatchSubpath,
            bestMatch,
            base,
            true,
            true,
            conditions
          );
          if (resolveResult != null) {
            return resolveResult;
          }
        }
      }
    }
  }
  throwImportNotDefined(name, packageJSONUrl, base);
}

const pathRegExp = /^(?![a-zA-Z]:[\\/]|\\\\|\.{0,2}(?:\/|$))((?:node:)?(?:@[^/]+\/)?[^/]+)\/*(.*|)$/;
const isRelativeRegexp = /^\.{0,2}\//;
function tryReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, `utf8`);
  } catch (err) {
    if (err.code === `ENOENT`)
      return void 0;
    throw err;
  }
}
async function resolvePrivateRequest(specifier, issuer, context, nextResolve) {
  const resolved = packageImportsResolve({
    name: specifier,
    base: pathToFileURL(issuer),
    conditions: new Set(context.conditions),
    readFileSyncFn: tryReadFile
  });
  if (resolved instanceof URL) {
    return { url: resolved.href, shortCircuit: true };
  } else {
    if (resolved.startsWith(`#`))
      throw new Error(`Mapping from one private import to another isn't allowed`);
    return resolve$1(resolved, context, nextResolve);
  }
}
async function resolve$1(originalSpecifier, context, nextResolve) {
  const { findPnpApi } = moduleExports;
  if (!findPnpApi || isBuiltinModule(originalSpecifier))
    return nextResolve(originalSpecifier, context, nextResolve);
  let specifier = originalSpecifier;
  const url = tryParseURL(specifier, isRelativeRegexp.test(specifier) ? context.parentURL : void 0);
  if (url) {
    if (url.protocol !== `file:`)
      return nextResolve(originalSpecifier, context, nextResolve);
    specifier = fileURLToPath(url);
  }
  const { parentURL, conditions = [] } = context;
  const issuer = parentURL ? fileURLToPath(parentURL) : process.cwd();
  const pnpapi = findPnpApi(issuer) ?? (url ? findPnpApi(specifier) : null);
  if (!pnpapi)
    return nextResolve(originalSpecifier, context, nextResolve);
  if (specifier.startsWith(`#`))
    return resolvePrivateRequest(specifier, issuer, context, nextResolve);
  const dependencyNameMatch = specifier.match(pathRegExp);
  let allowLegacyResolve = false;
  if (dependencyNameMatch) {
    const [, dependencyName, subPath] = dependencyNameMatch;
    if (subPath === ``) {
      const resolved = pnpapi.resolveToUnqualified(`${dependencyName}/package.json`, issuer);
      if (resolved) {
        const content = await tryReadFile$1(resolved);
        if (content) {
          const pkg = JSON.parse(content);
          allowLegacyResolve = pkg.exports == null;
        }
      }
    }
  }
  const result = pnpapi.resolveRequest(specifier, issuer, {
    conditions: new Set(conditions),
    extensions: allowLegacyResolve ? void 0 : []
  });
  if (!result)
    throw new Error(`Resolving '${specifier}' from '${issuer}' failed`);
  const resultURL = pathToFileURL(result);
  if (url) {
    resultURL.search = url.search;
    resultURL.hash = url.hash;
  }
  if (!parentURL)
    setEntrypointPath(fileURLToPath(resultURL));
  return {
    url: resultURL.href,
    shortCircuit: true
  };
}

const binding = process.binding(`fs`);
const originalfstat = binding.fstat;
const ZIP_MASK = 4278190080;
const ZIP_MAGIC = 704643072;
binding.fstat = function(...args) {
  const [fd, useBigint, req] = args;
  if ((fd & ZIP_MASK) === ZIP_MAGIC && useBigint === false && req === void 0) {
    try {
      const stats = fs.fstatSync(fd);
      return new Float64Array([
        stats.dev,
        stats.mode,
        stats.nlink,
        stats.uid,
        stats.gid,
        stats.rdev,
        stats.blksize,
        stats.ino,
        stats.size,
        stats.blocks
      ]);
    } catch {
    }
  }
  return originalfstat.apply(this, args);
};

const resolve = resolve$1;
const getFormat = HAS_CONSOLIDATED_HOOKS ? void 0 : getFormat$1;
const getSource = HAS_CONSOLIDATED_HOOKS ? void 0 : getSource$1;
const load = HAS_CONSOLIDATED_HOOKS ? load$1 : void 0;

export { getFormat, getSource, load, resolve };
