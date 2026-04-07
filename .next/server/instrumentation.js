/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "instrumentation";
exports.ids = ["instrumentation"];
exports.modules = {

/***/ "(instrument)/./node_modules/.pnpm/@opentelemetry+instrumentation@0.57.2_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/node sync recursive":
/*!*********************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/@opentelemetry+instrumentation@0.57.2_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/node/ sync ***!
  \*********************************************************************************************************************************************************************/
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = "(instrument)/./node_modules/.pnpm/@opentelemetry+instrumentation@0.57.2_@opentelemetry+api@1.9.0/node_modules/@opentelemetry/instrumentation/build/esm/platform/node sync recursive";
module.exports = webpackEmptyContext;

/***/ }),

/***/ "(instrument)/./node_modules/.pnpm/require-in-the-middle@7.5.2/node_modules/require-in-the-middle sync recursive":
/*!*************************************************************************************************!*\
  !*** ./node_modules/.pnpm/require-in-the-middle@7.5.2/node_modules/require-in-the-middle/ sync ***!
  \*************************************************************************************************/
/***/ ((module) => {

function webpackEmptyContext(req) {
	var e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = "(instrument)/./node_modules/.pnpm/require-in-the-middle@7.5.2/node_modules/require-in-the-middle sync recursive";
module.exports = webpackEmptyContext;

/***/ }),

/***/ "(instrument)/./src/instrumentation.ts":
/*!********************************!*\
  !*** ./src/instrumentation.ts ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   onRequestError: () => (/* binding */ onRequestError),\n/* harmony export */   register: () => (/* binding */ register)\n/* harmony export */ });\n/* harmony import */ var _sentry_nextjs__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @sentry/nextjs */ \"(instrument)/./node_modules/.pnpm/@sentry+nextjs@9.19.0_@opentelemetry+context-async-hooks@1.30.1_@opentelemetry+api@1.9._df73ae4cd616a396673610a09c62ac6e/node_modules/@sentry/nextjs/build/cjs/index.server.js\");\n/* harmony import */ var _sentry_nextjs__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_sentry_nextjs__WEBPACK_IMPORTED_MODULE_0__);\n\nconst sentryOptions = {\n    // Sentry DSN\n    dsn: \"\",\n    // Enable Spotlight in development\n    spotlight: \"development\" === 'development',\n    // Adds request headers and IP for users, for more info visit\n    sendDefaultPii: true,\n    // Adjust this value in production, or use tracesSampler for greater control\n    tracesSampleRate: 1,\n    // Setting this option to true will print useful information to the console while you're setting up Sentry.\n    debug: false\n};\nasync function register() {\n    if (false) {}\n}\nconst onRequestError = _sentry_nextjs__WEBPACK_IMPORTED_MODULE_0__.captureRequestError;\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKGluc3RydW1lbnQpLy4vc3JjL2luc3RydW1lbnRhdGlvbi50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7O0FBQXlDO0FBRXpDLE1BQU1DLGdCQUF5RDtJQUM3RCxhQUFhO0lBQ2JDLEtBQUtDLEVBQWtDO0lBRXZDLGtDQUFrQztJQUNsQ0csV0FBV0gsa0JBQXlCO0lBRXBDLDZEQUE2RDtJQUM3REksZ0JBQWdCO0lBRWhCLDRFQUE0RTtJQUM1RUMsa0JBQWtCO0lBRWxCLDJHQUEyRztJQUMzR0MsT0FBTztBQUNUO0FBRU8sZUFBZUM7SUFDcEIsSUFBSSxLQUF3QyxFQUFFLEVBVTdDO0FBQ0g7QUFFTyxNQUFNSSxpQkFBaUJkLCtEQUEwQixDQUFDIiwic291cmNlcyI6WyIvaG9tZS9hYi9kZXYvZ3Job2cvR1JIT0cvc3JjL2luc3RydW1lbnRhdGlvbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBTZW50cnkgZnJvbSAnQHNlbnRyeS9uZXh0anMnO1xuXG5jb25zdCBzZW50cnlPcHRpb25zOiBTZW50cnkuTm9kZU9wdGlvbnMgfCBTZW50cnkuRWRnZU9wdGlvbnMgPSB7XG4gIC8vIFNlbnRyeSBEU05cbiAgZHNuOiBwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TRU5UUllfRFNOLFxuXG4gIC8vIEVuYWJsZSBTcG90bGlnaHQgaW4gZGV2ZWxvcG1lbnRcbiAgc3BvdGxpZ2h0OiBwcm9jZXNzLmVudi5OT0RFX0VOViA9PT0gJ2RldmVsb3BtZW50JyxcblxuICAvLyBBZGRzIHJlcXVlc3QgaGVhZGVycyBhbmQgSVAgZm9yIHVzZXJzLCBmb3IgbW9yZSBpbmZvIHZpc2l0XG4gIHNlbmREZWZhdWx0UGlpOiB0cnVlLFxuXG4gIC8vIEFkanVzdCB0aGlzIHZhbHVlIGluIHByb2R1Y3Rpb24sIG9yIHVzZSB0cmFjZXNTYW1wbGVyIGZvciBncmVhdGVyIGNvbnRyb2xcbiAgdHJhY2VzU2FtcGxlUmF0ZTogMSxcblxuICAvLyBTZXR0aW5nIHRoaXMgb3B0aW9uIHRvIHRydWUgd2lsbCBwcmludCB1c2VmdWwgaW5mb3JtYXRpb24gdG8gdGhlIGNvbnNvbGUgd2hpbGUgeW91J3JlIHNldHRpbmcgdXAgU2VudHJ5LlxuICBkZWJ1ZzogZmFsc2Vcbn07XG5cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWdpc3RlcigpIHtcbiAgaWYgKCFwcm9jZXNzLmVudi5ORVhUX1BVQkxJQ19TRU5UUllfRElTQUJMRUQpIHtcbiAgICBpZiAocHJvY2Vzcy5lbnYuTkVYVF9SVU5USU1FID09PSAnbm9kZWpzJykge1xuICAgICAgLy8gTm9kZS5qcyBTZW50cnkgY29uZmlndXJhdGlvblxuICAgICAgU2VudHJ5LmluaXQoc2VudHJ5T3B0aW9ucyk7XG4gICAgfVxuXG4gICAgaWYgKHByb2Nlc3MuZW52Lk5FWFRfUlVOVElNRSA9PT0gJ2VkZ2UnKSB7XG4gICAgICAvLyBFZGdlIFNlbnRyeSBjb25maWd1cmF0aW9uXG4gICAgICBTZW50cnkuaW5pdChzZW50cnlPcHRpb25zKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IG9uUmVxdWVzdEVycm9yID0gU2VudHJ5LmNhcHR1cmVSZXF1ZXN0RXJyb3I7XG4iXSwibmFtZXMiOlsiU2VudHJ5Iiwic2VudHJ5T3B0aW9ucyIsImRzbiIsInByb2Nlc3MiLCJlbnYiLCJORVhUX1BVQkxJQ19TRU5UUllfRFNOIiwic3BvdGxpZ2h0Iiwic2VuZERlZmF1bHRQaWkiLCJ0cmFjZXNTYW1wbGVSYXRlIiwiZGVidWciLCJyZWdpc3RlciIsIk5FWFRfUFVCTElDX1NFTlRSWV9ESVNBQkxFRCIsIk5FWFRfUlVOVElNRSIsImluaXQiLCJvblJlcXVlc3RFcnJvciIsImNhcHR1cmVSZXF1ZXN0RXJyb3IiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(instrument)/./src/instrumentation.ts\n");

/***/ }),

/***/ "async_hooks":
/*!******************************!*\
  !*** external "async_hooks" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("async_hooks");

/***/ }),

/***/ "child_process":
/*!********************************!*\
  !*** external "child_process" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ "crypto":
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("crypto");

/***/ }),

/***/ "diagnostics_channel":
/*!**************************************!*\
  !*** external "diagnostics_channel" ***!
  \**************************************/
/***/ ((module) => {

"use strict";
module.exports = require("diagnostics_channel");

/***/ }),

/***/ "events":
/*!*************************!*\
  !*** external "events" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("events");

/***/ }),

/***/ "fs":
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ "module":
/*!*************************!*\
  !*** external "module" ***!
  \*************************/
/***/ ((module) => {

"use strict";
module.exports = require("module");

/***/ }),

/***/ "node:child_process":
/*!*************************************!*\
  !*** external "node:child_process" ***!
  \*************************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:child_process");

/***/ }),

/***/ "node:diagnostics_channel":
/*!*******************************************!*\
  !*** external "node:diagnostics_channel" ***!
  \*******************************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:diagnostics_channel");

/***/ }),

/***/ "node:fs":
/*!**************************!*\
  !*** external "node:fs" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:fs");

/***/ }),

/***/ "node:http":
/*!****************************!*\
  !*** external "node:http" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:http");

/***/ }),

/***/ "node:https":
/*!*****************************!*\
  !*** external "node:https" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:https");

/***/ }),

/***/ "node:inspector":
/*!*********************************!*\
  !*** external "node:inspector" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:inspector");

/***/ }),

/***/ "node:net":
/*!***************************!*\
  !*** external "node:net" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:net");

/***/ }),

/***/ "node:os":
/*!**************************!*\
  !*** external "node:os" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:os");

/***/ }),

/***/ "node:path":
/*!****************************!*\
  !*** external "node:path" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:path");

/***/ }),

/***/ "node:readline":
/*!********************************!*\
  !*** external "node:readline" ***!
  \********************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:readline");

/***/ }),

/***/ "node:stream":
/*!******************************!*\
  !*** external "node:stream" ***!
  \******************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:stream");

/***/ }),

/***/ "node:tls":
/*!***************************!*\
  !*** external "node:tls" ***!
  \***************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:tls");

/***/ }),

/***/ "node:util":
/*!****************************!*\
  !*** external "node:util" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:util");

/***/ }),

/***/ "node:worker_threads":
/*!**************************************!*\
  !*** external "node:worker_threads" ***!
  \**************************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:worker_threads");

/***/ }),

/***/ "node:zlib":
/*!****************************!*\
  !*** external "node:zlib" ***!
  \****************************/
/***/ ((module) => {

"use strict";
module.exports = require("node:zlib");

/***/ }),

/***/ "os":
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ "path":
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("path");

/***/ }),

/***/ "perf_hooks":
/*!*****************************!*\
  !*** external "perf_hooks" ***!
  \*****************************/
/***/ ((module) => {

"use strict";
module.exports = require("perf_hooks");

/***/ }),

/***/ "process":
/*!**************************!*\
  !*** external "process" ***!
  \**************************/
/***/ ((module) => {

"use strict";
module.exports = require("process");

/***/ }),

/***/ "tty":
/*!**********************!*\
  !*** external "tty" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("tty");

/***/ }),

/***/ "url":
/*!**********************!*\
  !*** external "url" ***!
  \**********************/
/***/ ((module) => {

"use strict";
module.exports = require("url");

/***/ }),

/***/ "util":
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ }),

/***/ "worker_threads":
/*!*********************************!*\
  !*** external "worker_threads" ***!
  \*********************************/
/***/ ((module) => {

"use strict";
module.exports = require("worker_threads");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("./webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@15.4.8_@babel+core@7.27.1_@opentelemetry+api@1.9.0_react-dom@19.0.0_react@19.0.0__react@19.0.0","vendor-chunks/@opentelemetry+api@1.9.0","vendor-chunks/@sentry+core@9.19.0","vendor-chunks/@sentry+node@9.19.0","vendor-chunks/@opentelemetry+semantic-conventions@1.33.0","vendor-chunks/@opentelemetry+semantic-conventions@1.28.0","vendor-chunks/@sentry+nextjs@9.19.0_@opentelemetry+context-async-hooks@1.30.1_@opentelemetry+api@1.9._df73ae4cd616a396673610a09c62ac6e","vendor-chunks/@opentelemetry+core@1.30.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+sdk-trace-base@1.30.1_@opentelemetry+api@1.9.0","vendor-chunks/@sentry+opentelemetry@9.19.0_@opentelemetry+api@1.9.0_@opentelemetry+context-async-hook_98e602e94b69e9494d7efc07b4204c1e","vendor-chunks/minimatch@9.0.5","vendor-chunks/@opentelemetry+resources@1.30.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-http@0.57.2_@opentelemetry+api@1.9.0","vendor-chunks/semver@7.7.2","vendor-chunks/@opentelemetry+instrumentation@0.57.2_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-pg@0.51.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-mongodb@0.52.0_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-graphql@0.47.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-amqplib@0.46.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-undici@0.10.1_@opentelemetry+api@1.9.0","vendor-chunks/resolve@1.22.10","vendor-chunks/resolve@1.22.8","vendor-chunks/@opentelemetry+instrumentation-express@0.47.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-hapi@0.45.2_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-redis-4@0.46.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-fs@0.19.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-mysql@0.45.1_@opentelemetry+api@1.9.0","vendor-chunks/color-convert@2.0.1","vendor-chunks/@fastify+otel@https+++codeload.github.com+getsentry+fastify-otel+tar.gz+ae3088d65e286bd_c29c1e17bf697a682932ef1697fd8c7d","vendor-chunks/debug@4.4.0","vendor-chunks/@opentelemetry+instrumentation-mongoose@0.46.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-mysql2@0.45.2_@opentelemetry+api@1.9.0","vendor-chunks/require-in-the-middle@7.5.2","vendor-chunks/@opentelemetry+instrumentation-knex@0.44.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-kafkajs@0.7.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+context-async-hooks@1.30.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+api-logs@0.57.2","vendor-chunks/@opentelemetry+instrumentation-connect@0.43.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-koa@0.47.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-tedious@0.18.1_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-ioredis@0.47.1_@opentelemetry+api@1.9.0","vendor-chunks/chalk@3.0.0","vendor-chunks/@opentelemetry+instrumentation-dataloader@0.16.1_@opentelemetry+api@1.9.0","vendor-chunks/@prisma+instrumentation@6.7.0_@opentelemetry+api@1.9.0","vendor-chunks/@opentelemetry+instrumentation-generic-pool@0.43.1_@opentelemetry+api@1.9.0","vendor-chunks/is-core-module@2.16.1","vendor-chunks/forwarded-parse@2.1.2","vendor-chunks/import-in-the-middle@1.13.2","vendor-chunks/@opentelemetry+instrumentation-lru-memoizer@0.44.1_@opentelemetry+api@1.9.0","vendor-chunks/brace-expansion@2.0.1","vendor-chunks/color-name@1.1.4","vendor-chunks/ansi-styles@4.3.0","vendor-chunks/stacktrace-parser@0.1.11","vendor-chunks/@opentelemetry+sql-common@0.40.1_@opentelemetry+api@1.9.0","vendor-chunks/ms@2.1.3","vendor-chunks/shimmer@1.2.1","vendor-chunks/@opentelemetry+redis-common@0.36.2","vendor-chunks/supports-color","vendor-chunks/supports-color@7.2.0","vendor-chunks/function-bind@1.1.2","vendor-chunks/path-parse@1.0.7","vendor-chunks/@swc+helpers@0.5.15","vendor-chunks/balanced-match@1.0.2","vendor-chunks/module-details-from-path@1.0.4","vendor-chunks/has-flag","vendor-chunks/has-flag@4.0.0","vendor-chunks/hasown@2.0.2"], () => (__webpack_exec__("(instrument)/./src/instrumentation.ts")));
module.exports = __webpack_exports__;

})();