import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authUtils from '../utils/authUtils';
import { toast } from 'react-toastify';
import { Card, CardContent } from '../components/ui/card';
import { Eye, EyeOff, Lock, User, Edit, BarChart, Users, FileText } from 'lucide-react';

const LoginPage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    useEffect(() => {
        // Kiểm tra đã đăng nhập chưa
        if (authUtils.isAuthenticated()) {
            const returnUrl = authUtils.getAndClearReturnUrl();
            navigate(returnUrl);
        }
    }, [navigate]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.username || !formData.password) {
            toast.error('Vui lòng nhập đầy đủ thông tin đăng nhập!');
            return;
        }

        setLoading(true);
        try {
            // Gọi API đăng nhập
            const result = await authUtils.apiRequest('auth/login', 'POST', {
                username: formData.username,
                password: formData.password
            });
            
            if (result && result.token && result.user) {
                // Lưu token JWT và thông tin user
                authUtils.saveAuthData(result.token, result.user);
                toast.success(`Chào mừng ${result.user.name || formData.username} đến với Goal Blog!`);
                
                // Chuyển hướng sau khi đăng nhập
                setTimeout(() => {
                    const returnUrl = authUtils.getAndClearReturnUrl();
                    navigate(returnUrl);
                }, 1000);
            } else {
                throw new Error('Đăng nhập thất bại!');
            }
        } catch (error) {
            toast.error(error.message || 'Đăng nhập thất bại!');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#1a365d] to-[#2c5282]" 
             style={{backgroundImage: 'url(/background-blog.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundBlendMode: 'overlay'}}>
            <div className="w-full max-w-md mx-4">
                <Card className="shadow-lg border border-gray-100">
                    <CardContent className="p-8">
                        <div className="text-center mb-6">
                            <div className="flex items-center justify-center mb-2">
                                <div className="ml-2 bg-[#2c5282] text-white px-3 py-2 rounded-lg font-bold text-xl">
                                    Goal Blog
                                </div>
                            </div>
                            <p className="text-gray-600">Hệ thống quản lý nội dung blog</p>
                        </div>

                        {location.state?.from && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-100 text-blue-700 rounded-lg">
                                Bạn cần đăng nhập để truy cập trang {location.state.from}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <label
                                    htmlFor="username"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Tên đăng nhập
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="username"
                                        name="username"
                                        type="text"
                                        required
                                        placeholder="Nhập tên đăng nhập"
                                        className="w-full h-11 pl-10 rounded-lg border border-gray-200 focus:border-[#2c5282] focus:ring-2 focus:ring-blue-100 transition-colors outline-none"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="password"
                                    className="block text-sm font-medium text-gray-700"
                                >
                                    Mật khẩu
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        required
                                        placeholder="Nhập mật khẩu"
                                        className="w-full h-11 pl-10 pr-12 rounded-lg border border-gray-200 focus:border-[#2c5282] focus:ring-2 focus:ring-blue-100 transition-colors outline-none"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                    <button
                                        type="button"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
                                        onClick={() => setShowPassword(!showPassword)}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full h-11 bg-[#2c5282] hover:bg-[#1a365d] text-white rounded-lg font-medium transition-colors flex items-center justify-center disabled:opacity-70"
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </button>
                        </form>
                        
                        {/* Features */}
                        <div className="mt-8 pt-6 border-t border-gray-200">
                            <p className="text-center text-sm text-gray-600 mb-4">Chức năng hệ thống</p>
                            <div className="flex justify-center space-x-8">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                                        <Edit className="h-5 w-5 text-[#2c5282]" />
                                    </div>
                                    <p className="mt-2 text-xs">Quản lý bài viết</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                                        <Users className="h-5 w-5 text-[#2c5282]" />
                                    </div>
                                    <p className="mt-2 text-xs">Quản lý nhân viên</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                                        <BarChart className="h-5 w-5 text-[#2c5282]" />
                                    </div>
                                    <p className="mt-2 text-xs">Thống kê & báo cáo</p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Support */}
                        <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                            <p>Dành cho quản trị viên và cộng tác viên viết bài</p>
                            <p className="mt-2 flex items-center justify-center"><FileText className="h-4 w-4 mr-1" /> Cổng quản lý nội dung Goal Blog</p>
                        </div>
                        
                        {/* Footer */}
                        <div className="flex justify-between mt-4 text-xs text-gray-500">
                            <a href="#" className="hover:text-[#2c5282]">Trợ giúp</a>
                            <a href="#" className="hover:text-[#2c5282]">Hướng dẫn sử dụng</a>
                            <a href="#" className="hover:text-[#2c5282]">Liên hệ</a>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="text-center mt-4 text-white text-sm">
                    © 2025 Goal Blog CMS. All rights reserved.
                </div>
            </div>
        </div>
    );
};

export default LoginPage;