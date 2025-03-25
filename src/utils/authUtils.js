// src/utils/authUtils.js
import config from '../config/config';

class AuthUtils {
    async apiRequest(endpoint, method = 'GET', data = null, token = null) {
        try {
            const headers = {
                'Content-Type': 'application/json'
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }
            
            const options = {
                method,
                headers
            };
            
            if (data && (method === 'POST' || method === 'PUT')) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${config.API_URL}/${endpoint}`, options);
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Network response was not ok');
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    saveReturnUrl(url) {
        if (url && !url.includes('/login')) {
            localStorage.setItem('returnUrl', url);
        }
    }
    
    getAndClearReturnUrl() {
        const returnUrl = localStorage.getItem('returnUrl');
        localStorage.removeItem('returnUrl');
        return returnUrl || config.ROUTES.DASHBOARD;
    }
    
    saveAuthData(token, userData) {
        const now = new Date();
        const expiryTime = new Date(now.getTime() + config.AUTH.TOKEN_DURATION);

        localStorage.setItem(config.AUTH.TOKEN_KEY, token);
        localStorage.setItem(config.AUTH.USER_DATA_KEY, JSON.stringify(userData));
        localStorage.setItem(config.AUTH.TOKEN_EXPIRY_KEY, expiryTime.toISOString());
    }

    getUserData() {
        const userData = localStorage.getItem(config.AUTH.USER_DATA_KEY);
        return userData ? JSON.parse(userData) : null;
    }

    getToken() {
        return localStorage.getItem(config.AUTH.TOKEN_KEY);
    }
    
    isAuthenticated(currentPath) {
        const token = this.getToken();
        const expiryTime = localStorage.getItem(config.AUTH.TOKEN_EXPIRY_KEY);
        const userData = localStorage.getItem(config.AUTH.USER_DATA_KEY);

        if (!token || !expiryTime || !userData) {
            if (currentPath) {
                this.saveReturnUrl(currentPath);
            }
            return false;
        }

        if (new Date() > new Date(expiryTime)) {
            this.clearAuthData();
            if (currentPath) {
                this.saveReturnUrl(currentPath);
            }
            return false;
        }

        return true;
    }

    clearAuthData() {
        localStorage.removeItem(config.AUTH.TOKEN_KEY);
        localStorage.removeItem(config.AUTH.USER_DATA_KEY);
        localStorage.removeItem(config.AUTH.TOKEN_EXPIRY_KEY);
        localStorage.removeItem('returnUrl');
    }

    async login(username, password) {
        if (!username || !password) {
            throw new Error('Vui lòng nhập đầy đủ thông tin đăng nhập!');
        }

        const result = await this.apiRequest('auth/login', 'POST', {
            username,
            password
        });

        if (result && result.token && result.user) {
            this.saveAuthData(result.token, result.user);
            return result.user;
        }
        
        throw new Error('Đăng nhập thất bại!');
    }

    logout() {
        this.clearAuthData();
        return config.ROUTES.LOGIN;
    }
    
    async uploadImage(file) {
        // Validate file
        if (!file) {
            throw new Error('Không tìm thấy file');
        }
    
        if (file.size > config.UPLOAD.MAX_SIZE) {
            throw new Error(`Kích thước file không được vượt quá ${config.UPLOAD.MAX_SIZE / 1024 / 1024}MB`);
        }
    
        if (!config.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
            throw new Error('Định dạng file không được hỗ trợ');
        }
    
        try {
            // Convert file to base64 if needed
            const base64Image = await this.getImageAsBase64(file);
            
            // Cloudinary configuration
            const CLOUDINARY_CLOUD_NAME =  config.CLOUD_NAME || 'duv9pccwi';
            const CLOUDINARY_UPLOAD_PRESET =  config.UPLOAD_PRESET || 'poalupload';
            
            // Prepare form data
            const formData = new FormData();
            formData.append('file', base64Image);
            formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
            
            // Make request to Cloudinary
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );
    
            if (!response.ok) {
                throw new Error('Upload failed: ' + response.statusText);
            }
    
            const data = await response.json();
    
            if (!data.secure_url) {
                throw new Error('Invalid response from Cloudinary');
            }
    
            return {
                success: true,
                url: data.secure_url,
                public_id: data.public_id,
                metadata: {
                    name: data.original_filename,
                    size: data.bytes,
                    format: data.format,
                    width: data.width,
                    height: data.height
                }
            };
        } catch (error) {
            console.error('Image upload failed:', error);
            throw new Error('Không thể tải ảnh lên: ' + error.message);
        }
    }


    async getImageAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    validateImage(file) {
        const errors = [];

        if (!file) {
            errors.push('Không tìm thấy file');
        }

        if (file.size > config.UPLOAD.MAX_SIZE) {
            errors.push(`Kích thước file không được vượt quá ${config.UPLOAD.MAX_SIZE / 1024 / 1024}MB`);
        }

        if (!config.UPLOAD.ALLOWED_TYPES.includes(file.type)) {
            errors.push('Định dạng file không được hỗ trợ');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }
}

export default new AuthUtils();