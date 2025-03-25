import React, { useState, useEffect } from 'react';
import { Pencil, Save, Loader2, X, KeyRound, Shield, Camera } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';

const Profile = () => {
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [changePassword, setChangePassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false); 
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [userData, setUserData] = useState(null);
    const [imageFile, setImageFile] = useState(null);
    const [formData, setFormData] = useState({
        hoVaTen: '',
        chucVu: '',
        phong: '',
        email: '',
        image: '',
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            setLoading(true);
            const localUser = authUtils.getUserData();
            
            if (!localUser || !localUser.id) {
                toast.error('Phiên đăng nhập đã hết hạn');
                return;
            }
            
            const token = authUtils.getToken();
            const response = await authUtils.apiRequest(`employees/${localUser.id}`, 'GET', null, token);
            
            if (!response) {
                throw new Error('Không tìm thấy thông tin người dùng');
            }

            setUserData(response);
            setFormData({
                hoVaTen: response.HoVaTen || '',
                chucVu: response.ChucVu || '',
                phong: response.Phong || '',
                email: response.Email || '',
                image: response.Image || '',
            });
        } catch (error) {
            console.error('Error fetching user data:', error);
            toast.error('Không thể tải thông tin người dùng');
        } finally {
            setLoading(false);
        }
    };
    
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5000000) {
            toast.error('Kích thước ảnh không được vượt quá 5MB');
            return;
        }
        
        setImageFile(file);
        
        // Preview
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData(prev => ({
                ...prev,
                image: reader.result
            }));
        };
        reader.readAsDataURL(file);
    };
    
    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handlePasswordChange = (e) => {
        setPasswordData({
            ...passwordData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;

        try {
            setIsSubmitting(true);
            
            // Upload ảnh nếu có
            let imageUrl = formData.image;
            if (imageFile) {
                try {
                    toast.info('Đang tải ảnh lên...', { autoClose: false, toastId: 'uploadingImage' });
                    const uploadResult = await authUtils.uploadImage(imageFile);
                    if (uploadResult.success) {
                        imageUrl = uploadResult.url;
                    }
                    toast.dismiss('uploadingImage');
                } catch (error) {
                    console.error('Error uploading image:', error);
                    toast.dismiss('uploadingImage');
                    toast.error('Không thể tải ảnh lên, nhưng vẫn tiếp tục lưu thông tin khác');
                }
            }
            
            const token = authUtils.getToken();
            const updatedData = {
                hoVaTen: formData.hoVaTen,
                chucVu: formData.chucVu,
                phong: formData.phong,
                email: formData.email,
                image: imageUrl
            };
            
            await authUtils.apiRequest(`employees/${userData.NhanVienID}`, 'PUT', updatedData, token);

            // Cập nhật userData với thông tin mới
            const updatedUserData = { ...userData, ...updatedData };
            setUserData(updatedUserData);
            
            // Lưu thông tin user mới vào localStorage
            const localUser = authUtils.getUserData();
            authUtils.saveAuthData(authUtils.getToken(), {
                ...localUser,
                name: formData.hoVaTen
            });

            toast.success('Cập nhật thông tin thành công');
            setEditing(false);
            setImageFile(null);
        } catch (error) {
            console.error('Update profile error:', error);
            toast.error('Cập nhật thông tin thất bại');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePasswordSubmit = async () => {
        if (isChangingPassword) return;
        
        // Validation
        if (!passwordData.currentPassword) {
            toast.error('Vui lòng nhập mật khẩu hiện tại');
            return;
        }
        
        if (!passwordData.newPassword) {
            toast.error('Vui lòng nhập mật khẩu mới');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Mật khẩu mới không khớp');
            return;
        }

        try {
            setIsChangingPassword(true);
            
            const token = authUtils.getToken();
            
            // API endpoint để đổi mật khẩu
            await authUtils.apiRequest(`employees/${userData.NhanVienID}`, 'PUT', {
                password: passwordData.newPassword,
                currentPassword: passwordData.currentPassword
            }, token);
            
            toast.success('Đổi mật khẩu thành công');
            setChangePassword(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error) {
            console.error('Password change error:', error);
            toast.error(error.message || 'Đổi mật khẩu thất bại');
        } finally {
            setIsChangingPassword(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-screen">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin"></div>
                    <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-blue-300 rounded-full animate-pulse"></div>
                </div>
                <p className="mt-4 text-gray-600 font-medium">Đang tải thông tin...</p>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Profile Sidebar */}
                        <div className="md:col-span-1">
                            <div className="flex flex-col items-center">
                                <div className="relative group">
                                    {formData.image ? (
                                        <img 
                                            src={formData.image}
                                            alt="Profile" 
                                            className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md"
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(formData.hoVaTen || userData?.Username)}&background=4F46E5&color=fff`;
                                            }}
                                        />
                                    ) : (
                                        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-4xl font-semibold border-4 border-white shadow-md">
                                            {formData.hoVaTen?.[0]?.toUpperCase() || userData?.Username?.[0]?.toUpperCase() || '?'}
                                        </div>
                                    )}
                                    {editing && (
                                        <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={handleImageChange}
                                                disabled={isSubmitting}
                                            />
                                            <Camera className="h-8 w-8 text-white" />
                                        </label>
                                    )}
                                </div>
                                <h3 className="mt-6 text-xl font-semibold text-gray-800">
                                    {formData.hoVaTen || userData?.Username}
                                </h3>
                                <p className="text-gray-500 mt-1">
                                    {formData.chucVu}
                                </p>
                                
                                <div className="mt-4 flex gap-2">
                                    <button
                                        onClick={() => setChangePassword(true)}
                                        disabled={isSubmitting}
                                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <KeyRound className="w-4 h-4 mr-2" />
                                        Đổi mật khẩu
                                    </button>
                                </div>
                                
                                {userData?.PhanQuyen === 'Admin' && (
                                    <div className="mt-4 flex items-center bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full">
                                        <Shield className="w-4 h-4 mr-1.5" />
                                        <span className="text-sm font-medium">Quản trị viên</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Content */}
                        <div className="md:col-span-3">
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    Thông tin cá nhân
                                </h2>
                                <button
                                    onClick={() => editing ? handleSubmit() : setEditing(true)}
                                    disabled={isSubmitting}
                                    className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${editing
                                            ? 'bg-green-500 hover:bg-green-600 text-white'
                                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                                        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    {editing ? (
                                        <>
                                            {isSubmitting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Đang lưu...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    Lưu
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <Pencil className="w-4 h-4 mr-2" />
                                            Chỉnh sửa
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Họ và tên
                                    </label>
                                    <input
                                        type="text"
                                        name="hoVaTen"
                                        value={formData.hoVaTen}
                                        onChange={handleInputChange}
                                        disabled={!editing || isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        disabled={!editing || isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Chức vụ
                                    </label>
                                    <input
                                        type="text"
                                        name="chucVu"
                                        value={formData.chucVu}
                                        onChange={handleInputChange}
                                        disabled={!editing || isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phòng
                                    </label>
                                    <input
                                        type="text"
                                        name="phong"
                                        value={formData.phong}
                                        onChange={handleInputChange}
                                        disabled={!editing || isSubmitting}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors disabled:bg-gray-50"
                                    />
                                </div>
                                
                                <div className="sm:col-span-2 mt-2">
                                    <div className="text-sm text-gray-500">
                                        Tên đăng nhập: <span className="font-medium text-gray-700">{userData?.Username}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Change Password Modal */}
            {changePassword && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg max-w-md w-full">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold text-gray-800">Đổi mật khẩu</h3>
                            <button
                                onClick={() => !isChangingPassword && setChangePassword(false)}
                                disabled={isChangingPassword}
                                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    disabled={isChangingPassword}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu mới <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    disabled={isChangingPassword}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                    required
                                 />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Xác nhận mật khẩu mới <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    disabled={isChangingPassword}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-4 border-t flex justify-end space-x-2">
                            <button
                                onClick={() => setChangePassword(false)}
                                disabled={isChangingPassword}
                                className={`px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors ${isChangingPassword ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handlePasswordSubmit}
                                disabled={isChangingPassword}
                                className={`px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors flex items-center ${isChangingPassword ? 'opacity-50 cursor-not-allowed' : ''
                                    }`}
                            >
                                {isChangingPassword ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Đang xử lý...
                                    </>
                                ) : (
                                    'Xác nhận'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default Profile;
