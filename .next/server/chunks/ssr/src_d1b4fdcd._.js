module.exports = {

"[project]/src/constants/mock-api.ts [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

////////////////////////////////////////////////////////////////////////////////
// 🛑 Nothing in here has anything to do with Nextjs, it's just a fake database
////////////////////////////////////////////////////////////////////////////////
__turbopack_context__.s({
    "delay": ()=>delay,
    "fakeProducts": ()=>fakeProducts
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$faker$2d$js$2f$faker$2f$dist$2f$chunk$2d$TVFJBHBT$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__a__as__faker$3e$__ = __turbopack_context__.i("[project]/node_modules/@faker-js/faker/dist/chunk-TVFJBHBT.js [app-rsc] (ecmascript) <export a as faker>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$match$2d$sorter$2f$dist$2f$match$2d$sorter$2e$esm$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/match-sorter/dist/match-sorter.esm.js [app-rsc] (ecmascript)"); // For filtering
;
;
const delay = (ms)=>new Promise((resolve)=>setTimeout(resolve, ms));
const fakeProducts = {
    records: [],
    // Initialize with sample data
    initialize () {
        const sampleProducts = [];
        function generateRandomProductData(id) {
            const categories = [
                'Electronics',
                'Furniture',
                'Clothing',
                'Toys',
                'Groceries',
                'Books',
                'Jewelry',
                'Beauty Products'
            ];
            return {
                id,
                name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$faker$2d$js$2f$faker$2f$dist$2f$chunk$2d$TVFJBHBT$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__a__as__faker$3e$__["faker"].commerce.productName(),
                description: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$faker$2d$js$2f$faker$2f$dist$2f$chunk$2d$TVFJBHBT$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__a__as__faker$3e$__["faker"].commerce.productDescription(),
                created_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$faker$2d$js$2f$faker$2f$dist$2f$chunk$2d$TVFJBHBT$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__a__as__faker$3e$__["faker"].date.between({
                    from: '2022-01-01',
                    to: '2023-12-31'
                }).toISOString(),
                price: parseFloat(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$faker$2d$js$2f$faker$2f$dist$2f$chunk$2d$TVFJBHBT$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__a__as__faker$3e$__["faker"].commerce.price({
                    min: 5,
                    max: 500,
                    dec: 2
                })),
                photo_url: `https://api.slingacademy.com/public/sample-products/${id}.png`,
                category: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$faker$2d$js$2f$faker$2f$dist$2f$chunk$2d$TVFJBHBT$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__a__as__faker$3e$__["faker"].helpers.arrayElement(categories),
                updated_at: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$faker$2d$js$2f$faker$2f$dist$2f$chunk$2d$TVFJBHBT$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__$3c$export__a__as__faker$3e$__["faker"].date.recent().toISOString()
            };
        }
        // Generate remaining records
        for(let i = 1; i <= 20; i++){
            sampleProducts.push(generateRandomProductData(i));
        }
        this.records = sampleProducts;
    },
    // Get all products with optional category filtering and search
    async getAll ({ categories = [], search }) {
        let products = [
            ...this.records
        ];
        // Filter products based on selected categories
        if (categories.length > 0) {
            products = products.filter((product)=>categories.includes(product.category));
        }
        // Search functionality across multiple fields
        if (search) {
            products = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$match$2d$sorter$2f$dist$2f$match$2d$sorter$2e$esm$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["matchSorter"])(products, search, {
                keys: [
                    'name',
                    'description',
                    'category'
                ]
            });
        }
        return products;
    },
    // Get paginated results with optional category filtering and search
    async getProducts ({ page = 1, limit = 10, categories, search }) {
        await delay(1000);
        const categoriesArray = categories ? categories.split('.') : [];
        const allProducts = await this.getAll({
            categories: categoriesArray,
            search
        });
        const totalProducts = allProducts.length;
        // Pagination logic
        const offset = (page - 1) * limit;
        const paginatedProducts = allProducts.slice(offset, offset + limit);
        // Mock current time
        const currentTime = new Date().toISOString();
        // Return paginated response
        return {
            success: true,
            time: currentTime,
            message: 'Sample data for testing and learning purposes',
            total_products: totalProducts,
            offset,
            limit,
            products: paginatedProducts
        };
    },
    // Get a specific product by its ID
    async getProductById (id) {
        await delay(1000); // Simulate a delay
        // Find the product by its ID
        const product = this.records.find((product)=>product.id === id);
        if (!product) {
            return {
                success: false,
                message: `Product with ID ${id} not found`
            };
        }
        // Mock current time
        const currentTime = new Date().toISOString();
        return {
            success: true,
            time: currentTime,
            message: `Product with ID ${id} found`,
            product
        };
    }
};
// Initialize sample products
fakeProducts.initialize();
}),
"[project]/src/features/overview/components/area-graph.tsx [app-rsc] (client reference proxy) <module evaluation>": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "AreaGraph": ()=>AreaGraph
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const AreaGraph = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call AreaGraph() from the server but AreaGraph is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/features/overview/components/area-graph.tsx <module evaluation>", "AreaGraph");
}),
"[project]/src/features/overview/components/area-graph.tsx [app-rsc] (client reference proxy)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "AreaGraph": ()=>AreaGraph
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-server-dom-turbopack-server.js [app-rsc] (ecmascript)");
;
const AreaGraph = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$server$2d$dom$2d$turbopack$2d$server$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["registerClientReference"])(function() {
    throw new Error("Attempted to call AreaGraph() from the server but AreaGraph is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.");
}, "[project]/src/features/overview/components/area-graph.tsx", "AreaGraph");
}),
"[project]/src/features/overview/components/area-graph.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$overview$2f$components$2f$area$2d$graph$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__$3c$module__evaluation$3e$__ = __turbopack_context__.i("[project]/src/features/overview/components/area-graph.tsx [app-rsc] (client reference proxy) <module evaluation>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$overview$2f$components$2f$area$2d$graph$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__ = __turbopack_context__.i("[project]/src/features/overview/components/area-graph.tsx [app-rsc] (client reference proxy)");
;
__turbopack_context__.n(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$overview$2f$components$2f$area$2d$graph$2e$tsx__$5b$app$2d$rsc$5d$__$28$client__reference__proxy$29$__);
}),
"[project]/src/app/dashboard/overview/@area_stats/page.tsx [app-rsc] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "default": ()=>AreaStats
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$mock$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/constants/mock-api.ts [app-rsc] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$overview$2f$components$2f$area$2d$graph$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/features/overview/components/area-graph.tsx [app-rsc] (ecmascript)");
;
;
;
async function AreaStats() {
    await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$constants$2f$mock$2d$api$2e$ts__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["delay"])(1000);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$features$2f$overview$2f$components$2f$area$2d$graph$2e$tsx__$5b$app$2d$rsc$5d$__$28$ecmascript$29$__["AreaGraph"], {}, void 0, false, {
        fileName: "[project]/src/app/dashboard/overview/@area_stats/page.tsx",
        lineNumber: 6,
        columnNumber: 10
    }, this);
}
}),

};

//# sourceMappingURL=src_d1b4fdcd._.js.map