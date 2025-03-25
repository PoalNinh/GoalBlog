const config = {
    API_URL: process.env.REACT_APP_API_URL || 'https://api.toolapp.name.vn/api',
    IMGBB_API_KEY: process.env.REACT_APP_IMGBB_API_KEY,
    
    ROUTES: {
        LOGIN: '/',
        DASHBOARD: '/dashboard',
        PROFILE: '/profile',
        POSTS: '/posts',
        CATEGORIES: '/categories',
        EMPLOYEES: '/employees'
    },
    
    AUTH: {
        TOKEN_KEY: 'authToken',
        USER_DATA_KEY: 'userData',
        TOKEN_EXPIRY_KEY: 'tokenExpiry',
        TOKEN_DURATION: 24 * 60 * 60 * 1000 // 1 ngày
    },
    
    UPLOAD: {
        MAX_SIZE: 5 * 1024 * 1024, // 5MB
        ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
        IMGBB_URL: 'https://api.imgbb.com/1/upload'
    }
};

export default config;