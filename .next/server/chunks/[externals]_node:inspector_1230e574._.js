module.exports = {

"[externals]/node:inspector [external] (node:inspector, cjs, async loader)": ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "server/chunks/[externals]_node:inspector_10d23a46._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[externals]/node:inspector [external] (node:inspector, cjs)");
    });
});
}),

};