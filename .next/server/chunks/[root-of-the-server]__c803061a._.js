module.exports = {

"[project]/.next-internal/server/app/api/auth/signin/route/actions.js [app-rsc] (server actions loader, ecmascript)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
}}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)": ((__turbopack_context__) => {

var { m: module, e: exports } = __turbopack_context__;
{
const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}}),
"[project]/src/config/api.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

// API Configuration
__turbopack_context__.s({
    "API_CONFIG": ()=>API_CONFIG,
    "buildApiUrl": ()=>buildApiUrl,
    "getApiEndpoint": ()=>getApiEndpoint
});
const API_CONFIG = {
    // Base URL for the backend API - point to actual backend server
    // For client-side requests, always use Next.js API routes to avoid CORS issues
    // For server-side requests, use the direct backend URL
    BASE_URL: (()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // Server-side: use direct backend URL
        return process.env.BACKEND_URL || 'http://device.grhog.mn';
    })(),
    // API endpoints
    ENDPOINTS: {
        AUTH: {
            SIGNIN: '/auth/signin',
            SIGNOUT: '/auth/signout',
            REFRESH: '/auth/refresh',
            VALIDATE: '/auth/validate',
            STATUS: '/auth/status'
        },
        BINS: '/bins',
        CLIENTS: '/clients',
        BIN_USAGES: '/bin-usages',
        CLEARINGS: '/clearings',
        DASHBOARD: {
            ACTIVE_BINS: '/dashboard/active-bins',
            ACTIVE_CARDS: '/dashboard/active-cards',
            CURRENT_USAGE: '/dashboard/current-usage',
            TOTAL_HOUSEHOLDS: '/dashboard/household-count',
            AVERAGE_BIN_FILLING: '/dashboard/average-bin-filling',
            COLLECTION_TRENDS: '/dashboard/collection-trends',
            BIN_STATUS_DISTRIBUTION: '/dashboard/bin-status-distribution',
            DAILY_USAGE_TREND: '/dashboard/daily-usage-trend',
            LOCATION_STATS: '/dashboard/location-stats',
            GET_DISTRICT: '/dashboard/getDistrict',
            GET_KHOROO: '/dashboard/getKhoroo',
            CLIENT_TYPE_COUNTS: '/dashboard/client-type-counts',
            ALL_BINS: '/dashboard/all-bins',
            CLIENT_ACTIVITY_CHANGE: '/dashboard/client-activity-change'
        },
        ANALYTICS: {
            BIN_STATISTICS: '/analytics/bin-statistics',
            USAGE_STATISTICS: '/analytics/usage-statistics',
            PENETRATION_ANALYSIS: '/analytics/penetration-analysis',
            CLEARING_EFFICIENCY: '/analytics/clearing-efficiency'
        },
        STATISTICS: {
            BINS: {
                TOTAL_BINS: '/bins/total-bins',
                AVERAGE_FILL_LEVEL: '/bins/average-fill-level',
                AVERAGE_BATTERY: '/bins/average-battery',
                WARNING_BINS: '/bins/warning-bins'
            },
            CARDS: {
                TOTAL_CARDS: '/cards/total-cards',
                TOTAL_ACCESS: '/cards/total-access',
                ACTIVITY_RATE: '/cards/activity-rate'
            },
            TRANSACTIONS: {
                TODAY_USAGE: '/transactions/today-usage',
                TODAY_AVERAGE: '/transactions/today-average',
                ACTIVE_BINS_TODAY: '/transactions/active-bins-today',
                OVERALL_AVERAGE: '/transactions/overall-average'
            }
        },
        CLIENT_ACTIVITY: '/clients',
        TEST: '/test',
        USERS: '/users'
    },
    // Request configuration
    REQUEST_CONFIG: {
        headers: {
            'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 seconds
    }
};
const buildApiUrl = (endpoint)=>{
    return `${API_CONFIG.BASE_URL}${endpoint}`;
};
const getApiEndpoint = (path)=>{
    const endpoint = API_CONFIG.ENDPOINTS[path];
    if (typeof endpoint === 'string') {
        return endpoint;
    }
    return path;
};
}),
"[project]/src/app/api/auth/signin/route.ts [app-route] (ecmascript)": ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s({
    "POST": ()=>POST
});
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/config/api.ts [app-route] (ecmascript)");
;
;
async function POST(request) {
    try {
        const body = await request.json();
        console.log('Auth request received:', {
            username: body.username,
            passwordLength: body.password?.length
        });
        // Validate request body
        if (!body.username || !body.password) {
            console.error('Missing username or password');
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Username and password are required'
            }, {
                status: 400
            });
        }
        const backendUrl = process.env.BACKEND_URL || 'http://device.grhog.mn';
        console.log('Attempting to authenticate with backend:', `${backendUrl}${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["API_CONFIG"].ENDPOINTS.AUTH.SIGNIN}`);
        const response = await fetch(`${backendUrl}${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$config$2f$api$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["API_CONFIG"].ENDPOINTS.AUTH.SIGNIN}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: body.username,
                password: body.password
            })
        });
        console.log('Backend response status:', response.status);
        console.log('Backend response headers:', Object.fromEntries(response.headers.entries()));
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Backend authentication failed:', {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText
            });
            // Return more specific error messages
            if (response.status === 401) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Invalid username or password'
                }, {
                    status: 401
                });
            } else if (response.status === 403) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Access forbidden'
                }, {
                    status: 403
                });
            } else if (response.status === 404) {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: 'Authentication endpoint not found'
                }, {
                    status: 404
                });
            } else {
                return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                    error: `Backend error: ${response.status} ${response.statusText}`
                }, {
                    status: response.status
                });
            }
        }
        // The AuthController returns a JSON object with token and user data
        const authResponse = await response.json();
        console.log('Authentication successful, response received:', authResponse ? 'Yes' : 'No');
        if (!authResponse || !authResponse.token) {
            console.error('No valid response received from backend');
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'No valid response received from backend'
            }, {
                status: 500
            });
        }
        // Create response with cookie set for middleware authentication
        const nextResponse = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json(authResponse);
        nextResponse.cookies.set('auth-token', 'authenticated', {
            httpOnly: true,
            secure: ("TURBOPACK compile-time value", "development") === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/'
        });
        return nextResponse;
    } catch (error) {
        console.error('Auth route error:', error);
        // Check if it's a network error
        if (error instanceof TypeError && error.message.includes('fetch')) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Cannot connect to backend server. Please check if the backend is running.'
            }, {
                status: 503
            });
        }
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Authentication failed due to server error'
        }, {
            status: 500
        });
    }
}
}),

};

//# sourceMappingURL=%5Broot-of-the-server%5D__c803061a._.js.map