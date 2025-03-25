import React, { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, ArrowLeft, Save, Search } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import authUtils from '../utils/authUtils';

const CategoriesManagement = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // list, edit, create
  const [currentCategory, setCurrentCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    tenDanhMuc: '',
    moTa: '',
    danhMucChaID: '',
    thuTu: 0
  });

  // Modules và formats cho React Quill (mô tả danh mục)
  const quillModules = {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      ['link'],
      ['clean']
    ]
  };

  const quillFormats = [
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link'
  ];



  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const token = authUtils.getToken();
      const response = await authUtils.apiRequest('categories', 'GET', null, token);
      setCategories(response || []);
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setViewMode('create');
    setCurrentCategory(null);
    setFormData({
      tenDanhMuc: '',
      moTa: '',
      danhMucChaID: '',
      thuTu: 0
    });
  };

  const handleEdit = async (categoryId) => {
    try {
      setLoading(true);
      const token = authUtils.getToken();
      const category = await authUtils.apiRequest(`categories/${categoryId}`, 'GET', null, token);
      
      setCurrentCategory(category);
      setFormData({
        tenDanhMuc: category.TenDanhMuc || '',
        moTa: category.MoTa || '',
        danhMucChaID: category.DanhMucChaID || '',
        thuTu: category.ThuTu || 0
      });
      
      setViewMode('edit');
    } catch (error) {
      toast.error("Không thể tải thông tin danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    
    try {
      setLoading(true);
      const token = authUtils.getToken();
      await authUtils.apiRequest(`categories/${categoryId}`, 'DELETE', null, token);
      
      toast.success("Xóa danh mục thành công");
      fetchCategories();
    } catch (error) {
      toast.error(error.message || "Không thể xóa danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseInt(value, 10) : value
    });
  };

  const handleSubmit = async () => {
    if (!formData.tenDanhMuc) {
      toast.error("Vui lòng nhập tên danh mục");
      return;
    }

    try {
      setLoading(true);
      const token = authUtils.getToken();
      
      if (viewMode === 'create') {
        await authUtils.apiRequest('categories', 'POST', formData, token);
        toast.success("Thêm danh mục thành công");
      } else {
        await authUtils.apiRequest(`categories/${currentCategory.DanhMucID}`, 'PUT', formData, token);
        toast.success("Cập nhật danh mục thành công");
      }
      
      setViewMode('list');
      fetchCategories();
    } catch (error) {
      toast.error(viewMode === 'create' ? "Không thể thêm danh mục" : "Không thể cập nhật danh mục");
    } finally {
      setLoading(false);
    }
  };

  // Lọc danh mục theo từ khóa tìm kiếm
  const filteredCategories = categories.filter(category => 
    category.TenDanhMuc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Render UI dạng danh sách danh mục
  const renderCategoriesList = () => (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Tìm kiếm danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <button
          onClick={handleCreateNew}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
        >
          <Plus className="h-5 w-5 mr-2" />
          Thêm danh mục
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên danh mục</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục cha</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số bài viết</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thứ tự</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center">
                  <div className="flex justify-center">
                    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </td>
              </tr>
            ) : filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <tr key={category.DanhMucID} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.DanhMucID}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{category.TenDanhMuc}</div>
                        <div className="text-sm text-gray-500">{category.DanhMucSlug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.DanhMucChaID ? 
                      categories.find(c => c.DanhMucID === category.DanhMucChaID)?.TenDanhMuc || 'N/A' 
                      : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.SoBaiViet || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                    {category.ThuTu || 0}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(category.DanhMucID)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.DanhMucID)}
                        className="text-red-600 hover:text-red-900"
                        disabled={category.SoBaiViet > 0}
                        title={category.SoBaiViet > 0 ? "Không thể xóa danh mục có bài viết" : ""}
                      >
                        <Trash2 className={`h-5 w-5 ${category.SoBaiViet > 0 ? 'opacity-50 cursor-not-allowed' : ''}`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                  Không có danh mục nào
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render UI form chỉnh sửa/thêm mới danh mục
  const renderCategoryForm = () => (
    <div className="bg-white rounded-xl shadow-sm">
      <div className="p-6 border-b">
        <h2 className="text-xl font-semibold text-gray-800">
          {viewMode === 'create' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
        </h2>
      </div>

      <div className="p-6">
        <div className="space-y-6 max-w-2xl mx-auto">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tên danh mục <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="tenDanhMuc"
              value={formData.tenDanhMuc}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Danh mục cha
            </label>
            <select
              name="danhMucChaID"
              value={formData.danhMucChaID}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Không có</option>
              {categories
                .filter(c => currentCategory ? c.DanhMucID !== currentCategory.DanhMucID : true)
                .map(category => (
                <option key={category.DanhMucID} value={category.DanhMucID}>
                  {category.TenDanhMuc}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Thứ tự
            </label>
            <input
              type="number"
              name="thuTu"
              value={formData.thuTu}
              onChange={handleInputChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <ReactQuill
              theme="snow"
              value={formData.moTa}
              onChange={(value) => setFormData({ ...formData, moTa: value })}
              modules={quillModules}
              formats={quillFormats}
              className="bg-white"
            />
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
              'Thêm danh mục'
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
      {viewMode === 'list' ? renderCategoriesList() : renderCategoryForm()}
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default CategoriesManagement;