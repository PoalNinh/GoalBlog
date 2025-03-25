import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, UserCircle, ArrowLeft, Save, X, Lock } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list');
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const [formData, setFormData] = useState({
    hoVaTen: '',
    username: '',
    password: '',
    email: '',
    chucVu: '',
    phong: '',
    phanQuyen: 'User',
    quyenXem: true,
    quyenThem: false,
    quyenSua: false,
    quyenXoa: false,
    trangThai: true
  });

  // Các phòng ban
  const departments = [
    'Marketing', 
    'Nội dung', 
    'Kỹ thuật', 
    'Thiết kế', 
    'Kinh doanh', 
    'Chăm sóc khách hàng'
  ];

  // Các chức vụ
  const positions = [
    'Biên tập viên',
    'Trưởng nhóm',
    'Quản lý',
    'Giám đốc',
    'Nhân viên',
    'Thiết kế viên',
    'Lập trình viên',
    'Nhân viên marketing'
  ];

  // Lấy thông tin người dùng hiện tại khi component mount
  useEffect(() => {
    const getUserInfo = async () => {
      try {
        const userData = authUtils.getUserData();
        
        if (userData && userData.PhanQuyen !== 'Admin') {
          // Nếu không phải admin, chuyển hướng hoặc hiển thị thông báo
          toast.error("Bạn không có quyền truy cập trang này");
          // Có thể thêm code chuyển hướng ở đây
          return;
        }
        
        setCurrentUser(userData);
      } catch (error) {
        console.error("Error getting user data:", error);
      }
    };
    
    getUserInfo();
  }, []);

  // Fetch nhân viên
  useEffect(() => {
    if (currentUser && currentUser.PhanQuyen === 'Admin') {
      fetchEmployees();
    }
  }, [page, roleFilter, departmentFilter, searchTerm, currentUser]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const token = authUtils.getToken();
      
      let url = `employees?limit=${limit}&offset=${(page-1)*limit}`;
      if (searchTerm) url += `&search=${searchTerm}`;
      if (roleFilter) url += `&role=${roleFilter}`;
      if (departmentFilter) url += `&department=${departmentFilter}`;
      
      const response = await authUtils.apiRequest(url, 'GET', null, token);
      setEmployees(response || []);
      setTotalEmployees(response.length || 0);
    } catch (error) {
      console.error("Error fetching employees:", error);
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setViewMode('create');
    setCurrentEmployee(null);
    setFormData({
      hoVaTen: '',
      username: '',
      password: '',
      email: '',
      chucVu: '',
      phong: '',
      phanQuyen: 'User',
      quyenXem: true,
      quyenThem: false,
      quyenSua: false,
      quyenXoa: false,
      trangThai: true
    });
    setAvatarPreview('');
    setAvatarFile(null);
    setShowPassword(true);
  };

  const handleEdit = async (employeeId) => {
    try {
      setLoading(true);
      const token = authUtils.getToken();
      const employee = await authUtils.apiRequest(`employees/${employeeId}`, 'GET', null, token);
      
      setCurrentEmployee(employee);
      setFormData({
        hoVaTen: employee.HoVaTen || '',
        username: employee.Username || '',
        password: '',
        email: employee.Email || '',
        chucVu: employee.ChucVu || '',
        phong: employee.Phong || '',
        phanQuyen: employee.PhanQuyen || 'User',
        quyenXem: employee.QuyenXem || false,
        quyenThem: employee.QuyenThem || false,
        quyenSua: employee.QuyenSua || false,
        quyenXoa: employee.QuyenXoa || false,
        trangThai: employee.TrangThai !== undefined ? employee.TrangThai : true
      });
      
      setAvatarPreview(employee.Image || '');
      setViewMode('edit');
      setShowPassword(false);
    } catch (error) {
      console.error("Error fetching employee details:", error);
      toast.error("Không thể tải thông tin nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (employeeId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhân viên này?')) return;
    
    try {
      setLoading(true);
      const token = authUtils.getToken();
      const response = await authUtils.apiRequest(`employees/${employeeId}`, 'DELETE', null, token);
      
      toast.success(response.message || "Xóa nhân viên thành công");
      fetchEmployees();
    } catch (error) {
      console.error("Error deleting employee:", error);
      if (error.response?.status === 403) {
        toast.error("Không thể xóa nhân viên. Bạn có thể vô hiệu hóa tài khoản thay vì xóa.");
      } else {
        toast.error(error.response?.data?.message || "Không thể xóa nhân viên");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Kích thước ảnh không được vượt quá 2MB");
      return;
    }
    
    setAvatarFile(file);
    
    // Preview
    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const validateForm = () => {
    // Validation
    if (!formData.hoVaTen.trim()) {
      toast.error("Vui lòng nhập họ và tên");
      return false;
    }
    
    if (!formData.username.trim()) {
      toast.error("Vui lòng nhập tên đăng nhập");
      return false;
    }
    
    if (viewMode === 'create' && !formData.password) {
      toast.error("Vui lòng nhập mật khẩu");
      return false;
    }
    
    if (!formData.email.trim()) {
      toast.error("Vui lòng nhập email");
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Email không hợp lệ");
      return false;
    }
    
    if (!formData.chucVu.trim()) {
      toast.error("Vui lòng chọn chức vụ");
      return false;
    }
    
    if (!formData.phong.trim()) {
      toast.error("Vui lòng chọn phòng ban");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
  
    try {
      setLoading(true);
      const token = authUtils.getToken();
      
      // Upload avatar if selected
      let imageUrl = currentEmployee?.Image || ''; // Sử dụng trường Image từ nhân viên hiện tại nếu có
      if (avatarFile) {
        try {
          const uploadResult = await authUtils.uploadImage(avatarFile);
          if (uploadResult && uploadResult.success) {
            imageUrl = uploadResult.url;
          } else {
            throw new Error("Không thể tải ảnh lên");
          }
        } catch (error) {
          console.error("Error uploading avatar:", error);
          toast.error("Không thể tải ảnh đại diện lên: " + error.message);
          setLoading(false);
          return;
        }
      } else if (avatarPreview && avatarPreview.startsWith('data:')) {
        // Nếu có avatarPreview là dạng base64 nhưng không có file, 
        // có thể upload trực tiếp chuỗi base64
        try {
          const blob = await fetch(avatarPreview).then(r => r.blob());
          const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });
          const uploadResult = await authUtils.uploadImage(file);
          if (uploadResult && uploadResult.success) {
            imageUrl = uploadResult.url;
          }
        } catch (error) {
          console.error("Error uploading avatar from preview:", error);
          toast.error("Không thể tải ảnh đại diện lên từ preview");
          setLoading(false);
          return;
        }
      }
      
      const employeeData = {
        ...formData,
        image: imageUrl // Đảm bảo trường này đúng với tên trường trong cơ sở dữ liệu của bạn
      };
      
      // Remove password if empty in edit mode
      if (viewMode === 'edit' && !employeeData.password) {
        delete employeeData.password;
      }
      
      if (viewMode === 'create') {
        // Create new employee
        const result = await authUtils.apiRequest('employees', 'POST', employeeData, token);
        toast.success("Thêm nhân viên thành công");
      } else {
        // Update existing employee
        const result = await authUtils.apiRequest(`employees/${currentEmployee.NhanVienID}`, 'PUT', employeeData, token);
        toast.success("Cập nhật nhân viên thành công");
      }
      
      setViewMode('list');
      fetchEmployees();
    } catch (error) {
      console.error("Error saving employee:", error);
      if (error.response?.status === 403) {
        toast.error("Bạn không có quyền thực hiện thao tác này");
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error(viewMode === 'create' ? "Không thể thêm nhân viên" : "Không thể cập nhật nhân viên");
      }
    } finally {
      setLoading(false);
    }
  };

  // Không hiển thị nội dung nếu không phải admin
  if (currentUser && currentUser.PhanQuyen !== 'Admin') {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-red-100 text-red-800 p-4 rounded-lg max-w-md text-center">
          <h2 className="text-xl font-semibold mb-2">Không có quyền truy cập</h2>
          <p>Bạn không có quyền quản lý nhân viên. Vui lòng liên hệ quản trị viên nếu cần trợ giúp.</p>
        </div>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    );
  }

  // Render danh sách nhân viên
  const renderEmployeeList = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Tìm kiếm nhân viên..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả quyền</option>
            <option value="User">User</option>
            <option value="Editor">Editor</option>
            <option value="Admin">Admin</option>
          </select>
          
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tất cả phòng ban</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Thêm nhân viên
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nhân viên</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phòng ban / Chức vụ</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quyền hạn</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : employees.length > 0 ? (
              employees.map((employee) => (
                <tr key={employee.NhanVienID} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0">
                        {employee.Image ? (
                          <img
                            src={employee.Image}
                            alt={employee.HoVaTen}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://via.placeholder.com/40?text=User';
                            }}
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <UserCircle className="h-6 w-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.HoVaTen}</div>
                        <div className="text-sm text-gray-500">{employee.Email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.Phong}</div>
                    <div className="text-sm text-gray-500">{employee.ChucVu}</div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${employee.PhanQuyen === 'Admin' ? 'bg-purple-100 text-purple-800' : 
                        employee.PhanQuyen === 'Editor' ? 'bg-blue-100 text-blue-800' : 
                        'bg-green-100 text-green-800'}`}>
                      {employee.PhanQuyen}
                    </span>
                    <div className="mt-1 text-xs text-gray-500">
                      {[
                        employee.QuyenXem ? 'Xem' : null,
                        employee.QuyenThem ? 'Thêm' : null,
                        employee.QuyenSua ? 'Sửa' : null,
                        employee.QuyenXoa ? 'Xóa' : null
                      ].filter(Boolean).join(', ')}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${employee.TrangThai ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {employee.TrangThai ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(employee.NhanVienID)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(employee.NhanVienID)}
                        className="text-red-600 hover:text-red-900"
                        disabled={employee.NhanVienID === currentUser?.NhanVienID}
                        title={employee.NhanVienID === currentUser?.NhanVienID ? "Không thể xóa tài khoản hiện tại" : ""}
                      >
                        <Trash2 className={`h-5 w-5 ${employee.NhanVienID === currentUser?.NhanVienID ? 'opacity-30 cursor-not-allowed' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="px-4 py-4 text-center text-gray-500">
                  Không có nhân viên nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalEmployees > limit && (
        <div className="flex justify-between items-center mt-4">
          <div className="text-sm text-gray-500">
            Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, totalEmployees)} trong {totalEmployees} nhân viên
          </div>
          <div className="flex space-x-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className={`px-3 py-1 rounded ${page === 1 ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Trước
            </button>
            <button
              disabled={page * limit >= totalEmployees}
              onClick={() => setPage(page + 1)}
              className={`px-3 py-1 rounded ${page * limit >= totalEmployees ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // Render form thêm/sửa nhân viên
  const renderEmployeeForm = () => (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          {viewMode === 'create' ? 'Thêm nhân viên mới' : 'Chỉnh sửa thông tin nhân viên'}
        </h2>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="hoVaTen"
                  value={formData.hoVaTen}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên đăng nhập <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={viewMode === 'edit'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {viewMode === 'create' ? 'Mật khẩu' : 'Đổi mật khẩu'} {viewMode === 'create' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={viewMode === 'create'}
                    placeholder={viewMode === 'edit' ? 'Để trống nếu không thay đổi' : ''}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    <Lock className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phòng ban <span className="text-red-500">*</span>
                </label>
                <select
                  name="phong"
                  value={formData.phong}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn phòng ban</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Chức vụ <span className="text-red-500">*</span>
                </label>
                <select
                  name="chucVu"
                  value={formData.chucVu}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Chọn chức vụ</option>
                  {positions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Phân quyền và quyền hạn
              </label>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phân quyền hệ thống
                </label>
                <select
                  name="phanQuyen"
                  value={formData.phanQuyen}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={viewMode === 'edit' && currentEmployee?.NhanVienID === currentUser?.NhanVienID}
                >
                  <option value="User">User</option>
                  <option value="Editor">Editor</option>
                  <option value="Admin">Admin</option>
                </select>
                {viewMode === 'edit' && currentEmployee?.NhanVienID === currentUser?.NhanVienID && (
                  <p className="mt-1 text-xs text-red-500">Không thể thay đổi quyền của tài khoản đang sử dụng</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="flex items-center">
                 <input
                   type="checkbox"
                   id="quyenXem"
                   name="quyenXem"
                   checked={formData.quyenXem}
                   onChange={handleInputChange}
                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                   disabled={viewMode === 'edit' && currentEmployee?.NhanVienID === currentUser?.NhanVienID}
                 />
                 <label htmlFor="quyenXem" className="ml-2 block text-sm text-gray-700">
                   Quyền xem
                 </label>
               </div>
               
               <div className="flex items-center">
                 <input
                   type="checkbox"
                   id="quyenThem"
                   name="quyenThem"
                   checked={formData.quyenThem}
                   onChange={handleInputChange}
                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                   disabled={viewMode === 'edit' && currentEmployee?.NhanVienID === currentUser?.NhanVienID}
                 />
                 <label htmlFor="quyenThem" className="ml-2 block text-sm text-gray-700">
                   Quyền thêm
                 </label>
               </div>
               
               <div className="flex items-center">
                 <input
                   type="checkbox"
                   id="quyenSua"
                   name="quyenSua"
                   checked={formData.quyenSua}
                   onChange={handleInputChange}
                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                   disabled={viewMode === 'edit' && currentEmployee?.NhanVienID === currentUser?.NhanVienID}
                 />
                 <label htmlFor="quyenSua" className="ml-2 block text-sm text-gray-700">
                   Quyền sửa
                 </label>
               </div>
               
               <div className="flex items-center">
                 <input
                   type="checkbox"
                   id="quyenXoa"
                   name="quyenXoa"
                   checked={formData.quyenXoa}
                   onChange={handleInputChange}
                   className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                   disabled={viewMode === 'edit' && currentEmployee?.NhanVienID === currentUser?.NhanVienID}
                 />
                 <label htmlFor="quyenXoa" className="ml-2 block text-sm text-gray-700">
                   Quyền xóa
                 </label>
               </div>
             </div>
           </div>
         </div>

         <div className="space-y-6">
           <div>
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Ảnh đại diện
             </label>
             <div className="mt-1 flex flex-col items-center">
               {avatarPreview ? (
                 <div className="mb-3 relative">
                   <img
                     src={avatarPreview}
                     alt="Avatar preview"
                     className="h-32 w-32 object-cover rounded-full"
                   />
                   <button
                     type="button"
                     onClick={() => {
                       setAvatarPreview('');
                       setAvatarFile(null);
                     }}
                     className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                   >
                     <X className="h-4 w-4" />
                   </button>
                 </div>
               ) : (
                 <div className="mb-3 h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                   <UserCircle className="h-16 w-16 text-gray-400" />
                 </div>
               )}
               <label className="w-full flex justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                 <span className="text-sm text-gray-600">Chọn ảnh</span>
                 <input
                   type="file"
                   className="hidden"
                   accept="image/*"
                   onChange={handleAvatarChange}
                 />
               </label>
             </div>
           </div>

           <div className="mt-6">
             <label className="block text-sm font-medium text-gray-700 mb-1">
               Trạng thái
             </label>
             <select
               name="trangThai"
               value={formData.trangThai.toString()}
               onChange={(e) => setFormData({...formData, trangThai: e.target.value === 'true'})}
               className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
               disabled={viewMode === 'edit' && currentEmployee?.NhanVienID === currentUser?.NhanVienID}
             >
               <option value="true">Hoạt động</option>
               <option value="false">Vô hiệu hóa</option>
             </select>
             {viewMode === 'edit' && currentEmployee?.NhanVienID === currentUser?.NhanVienID && (
               <p className="mt-1 text-xs text-red-500">Không thể vô hiệu hóa tài khoản đang sử dụng</p>
             )}
           </div>

           {viewMode === 'edit' && (
             <div className="mt-6">
               <p className="text-sm text-gray-500">
                 Ngày tạo: {currentEmployee?.NgayTao ? new Date(currentEmployee.NgayTao).toLocaleDateString('vi-VN') : 'N/A'}
               </p>
             </div>
           )}
         </div>
       </div>

       <div className="mt-6 flex justify-end gap-2">
         <button
           type="button"
           onClick={() => setViewMode('list')}
           className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
         >
           Hủy
         </button>
         <button
           type="button"
           onClick={handleSubmit}
           className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
           disabled={loading}
         >
           {loading ? (
             <div className="flex items-center">
               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
               Đang xử lý...
             </div>
           ) : viewMode === 'create' ? (
             'Thêm nhân viên'
           ) : (
             'Cập nhật'
           )}
         </button>
       </div>
     </div>
   </div>
 );

 return (
   <div className="p-6">
     {viewMode === 'list' ? renderEmployeeList() : renderEmployeeForm()}
     <ToastContainer position="top-right" autoClose={3000} />
   </div>
 );
};

export default EmployeeManagement;
