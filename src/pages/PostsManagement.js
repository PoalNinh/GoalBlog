import React, { useState, useEffect, useRef } from 'react';
import { Plus, Pencil, Trash2, Search, Filter, Eye, ArrowLeft, Save, X, Image, Copy, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { ToastContainer, toast } from 'react-toastify';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import 'react-toastify/dist/ReactToastify.css';
import authUtils from '../utils/authUtils';

const PostsManagement = () => {
    const [posts, setPosts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('list'); // list, edit, create
    const [currentPost, setCurrentPost] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');
    const [totalPosts, setTotalPosts] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [thumbnailPreview, setThumbnailPreview] = useState('');
    const quillRef = useRef(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [activeTab, setActiveTab] = useState('content'); // content, seo, settings
    const [showScrollTop, setShowScrollTop] = useState(false);
    const contentRef = useRef(null);
    const [formData, setFormData] = useState({
        tieuDe: '',
        tieuDeKhongDau: '',
        moTaNgan: '',
        noiDung: '',
        thumbnail: '',
        metaKeywords: '',
        metaTitle: '',
        danhMucID: '',
        noIndex: false,
        canonicalURL: '',
        trangThai: 1 // 0: Bản nháp, 1: Công khai, 2: Ẩn
    });
    const [slugExists, setSlugExists] = useState(false);
    const [checkingSlug, setCheckingSlug] = useState(false);
    const handleViewBySlug = (slug) => {
        window.open(`/posts/view/${slug}`, '_blank');
    };
    const quillModules = {
        toolbar: [
            [{ header: [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ list: 'ordered' }, { list: 'bullet' }],
            [{ indent: '-1' }, { indent: '+1' }],
            [{ align: [] }],
            ['link', 'image'],
            ['clean']
        ]
    };

    const quillFormats = [
        'header',
        'bold', 'italic', 'underline', 'strike',
        'list', 'bullet', 'indent',
        'link', 'image', 'align'
    ];
    // Hàm kiểm tra trùng lặp slug
    const checkSlugExists = async (slug) => {
        if (!slug) return;

        // Bỏ qua kiểm tra nếu đang chỉnh sửa và slug không thay đổi
        if (viewMode === 'edit' && currentPost && currentPost.TieuDeKhongDau === slug) {
            setSlugExists(false);
            return false;
        }

        try {
            setCheckingSlug(true);
            const token = authUtils.getToken();
            const response = await authUtils.apiRequest(`posts/check-slug?slug=${slug}`, 'GET', null, token);
            const exists = response.exists;
            setSlugExists(exists);
            return exists;
        } catch (error) {
            console.error("Error checking slug:", error);
            return false;
        } finally {
            setCheckingSlug(false);
        }
    };
    // Hàm tạo SEO từ tiêu đề
    const generateSeoFromTitle = (title) => {
        if (!title) return '';
        return title.trim();
    };

    // Hàm tạo keywords từ tiêu đề
    const generateKeywordsFromTitle = (title) => {
        if (!title) return '';
        const words = title.split(' ').filter(word => word.length > 3);
        return words.slice(0, 5).join(', ');
    };

    // Hàm tạo slug từ tiêu đề
    const generateSlug = (text) => {
        if (!text) return '';

        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[đĐ]/g, 'd')
            .replace(/[^a-zA-Z0-9\s]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    // Fetch bài viết và danh mục
    useEffect(() => {
        fetchPosts();
        fetchCategories();
    }, [page, categoryFilter, searchTerm]);
    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 300) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);
    // Hàm cuộn về đầu trang
    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    const renderTabButtons = () => {
        const tabs = [
            { id: 'content', label: 'Nội dung' },
            { id: 'seo', label: 'SEO & URL' },
            { id: 'settings', label: 'Cài đặt' }
        ];

        return (
            <div >
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium ${activeTab === tab.id
                                ? 'bg-blue-50 border-blue-200 text-blue-600'
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        );
    };
    const renderFixedNav = () => (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
            <div className="container mx-auto px-4 py-2 flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <button
                        type="button"
                        onClick={() => setViewMode('list')}
                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                        <ArrowLeft className="h-4 w-4 mr-1" />
                        Quay lại
                    </button>
                    <span className="text-sm font-medium text-gray-500">
                        {viewMode === 'create' ? 'Thêm bài viết mới' : 'Chỉnh sửa bài viết'}
                    </span>
                </div>

                <div className="flex items-center space-x-2">
                    {/* Tab Nội dung */}
                    {activeTab === 'content' && (
                        <div className="space-y-6">
                            {renderTabButtons()}
                            {/* Nội dung tab */}
                        </div>
                    )}

                    {/* Tab SEO & URL */}
                    {activeTab === 'seo' && (
                        <div className="space-y-6">
                            {renderTabButtons()}
                            {/* Nội dung tab */}
                        </div>
                    )}

                    {/* Tab Cài đặt */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            {renderTabButtons()}
                            {/* Nội dung tab */}
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={() => setPreviewMode(!previewMode)}
                        className="px-3 py-1.5 border border-blue-300 bg-blue-50 rounded-lg text-sm font-medium text-blue-700 hover:bg-blue-100 flex items-center"
                    >
                        <Eye className="h-4 w-4 mr-1" />
                        {previewMode ? 'Chỉnh sửa' : 'Xem trước'}
                    </button>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                        disabled={loading}
                    >
                        {loading ? (
                            <div className="flex items-center">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                                Đang lưu...
                            </div>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-1" />
                                Lưu
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
    const fetchPosts = async () => {
        try {
            setLoading(true);
            const token = authUtils.getToken();

            let url = `posts?limit=${limit}&offset=${(page - 1) * limit}`;
            if (searchTerm) url += `&search=${searchTerm}`;
            if (categoryFilter) url += `&category=${categoryFilter}`;

            const response = await authUtils.apiRequest(url, 'GET', null, token);
            setPosts(response.posts || []);
            setTotalPosts(response.total || 0);
        } catch (error) {
            console.error("Error fetching posts:", error);
            toast.error("Không thể tải danh sách bài viết");
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const token = authUtils.getToken();
            const response = await authUtils.apiRequest('categories', 'GET', null, token);
            setCategories(response || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
            toast.error("Không thể tải danh mục");
        }
    };

    const handleCreateNew = () => {
        setViewMode('create');
        setCurrentPost(null);
        setFormData({
            tieuDe: '',
            tieuDeKhongDau: '',
            moTaNgan: '',
            noiDung: '',
            thumbnail: '',
            metaKeywords: '',
            metaTitle: '',
            danhMucID: '',
            noIndex: false,
            canonicalURL: '',
            trangThai: 1
        });
        setThumbnailPreview('');
        setThumbnailFile(null);
        setActiveTab('content');
        setPreviewMode(false);
    };

    const handleEdit = async (postId) => {
        try {
            setLoading(true);
            const token = authUtils.getToken();
            const post = await authUtils.apiRequest(`posts/${postId}`, 'GET', null, token);

            setCurrentPost(post);
            setFormData({
                tieuDe: post.TieuDe || '',
                tieuDeKhongDau: post.TieuDeKhongDau || '',
                moTaNgan: post.MoTaNgan || '',
                noiDung: post.NoiDung || '',
                thumbnail: post.Thumbnail || '',
                metaKeywords: post.MetaKeywords || '',
                metaTitle: post.MetaTitle || '',
                danhMucID: post.DanhMucID || '',
                noIndex: post.NoIndex || false,
                canonicalURL: post.CanonicalURL || '',
                trangThai: post.TrangThai !== undefined ? post.TrangThai : 1
            });

            setThumbnailPreview(post.Thumbnail || '');
            setViewMode('edit');
            setActiveTab('content');
            setPreviewMode(false);
        } catch (error) {
            console.error("Error fetching post details:", error);
            toast.error("Không thể tải thông tin bài viết");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (postId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) return;

        try {
            setLoading(true);
            const token = authUtils.getToken();
            await authUtils.apiRequest(`posts/${postId}`, 'DELETE', null, token);

            toast.success("Xóa bài viết thành công");
            fetchPosts();
        } catch (error) {
            console.error("Error deleting post:", error);
            toast.error("Không thể xóa bài viết");
        } finally {
            setLoading(false);
        }
    };

    const handleThumbnailChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Kích thước ảnh không được vượt quá 5MB");
            return;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            toast.error("Chỉ chấp nhận định dạng ảnh: JPG, PNG, GIF, WEBP");
            return;
        }

        setThumbnailFile(file);

        // Preview
        const reader = new FileReader();
        reader.onload = () => {
            setThumbnailPreview(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // Cập nhật hàm handleInputChange để kiểm tra slug
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newFormData = {
            ...formData,
            [name]: type === 'checkbox' ? checked : value
        };

        // Tự động sinh SEO khi tiêu đề thay đổi
        if (name === 'tieuDe') {
            newFormData.metaTitle = newFormData.metaTitle || value;
            newFormData.metaKeywords = newFormData.metaKeywords || generateKeywordsFromTitle(value);
            newFormData.tieuDeKhongDau = newFormData.tieuDeKhongDau || generateSlug(value);
        }

        // Kiểm tra trùng lặp slug khi thay đổi tieuDeKhongDau
        if (name === 'tieuDeKhongDau') {
            checkSlugExists(value);
        }

        setFormData(newFormData);
    };
    const handleSubmit = async () => {
        // Validation
        if (!formData.tieuDe || !formData.moTaNgan || !formData.noiDung || !formData.danhMucID) {
            toast.error("Vui lòng điền đầy đủ thông tin bắt buộc");
            return;
        }

        // Đảm bảo có tieuDeKhongDau
        if (!formData.tieuDeKhongDau) {
            formData.tieuDeKhongDau = generateSlug(formData.tieuDe);
        }

        // Kiểm tra trùng lặp slug
        const slugDuplicated = await checkSlugExists(formData.tieuDeKhongDau);
        if (slugDuplicated) {
            toast.error("URL này đã tồn tại. Vui lòng chọn một URL khác.");
            setActiveTab('seo');
            return;
        }
        try {
            setLoading(true);
            const token = authUtils.getToken();

            // Đảm bảo có tieuDeKhongDau
            if (!formData.tieuDeKhongDau) {
                formData.tieuDeKhongDau = generateSlug(formData.tieuDe);
            }

            // Upload thumbnail if selected
            let thumbnailUrl = formData.thumbnail;
            if (thumbnailFile) {
                try {
                    const uploadResult = await authUtils.uploadImage(thumbnailFile);
                    if (uploadResult.success) {
                        thumbnailUrl = uploadResult.url;
                    }
                } catch (error) {
                    console.error("Error uploading thumbnail:", error);
                    toast.error("Không thể tải ảnh thumbnail lên");
                    setLoading(false);
                    return;
                }
            }

            const postData = {
                ...formData,
                thumbnail: thumbnailUrl
            };

            if (viewMode === 'create') {
                // Create new post
                const result = await authUtils.apiRequest('posts', 'POST', postData, token);
                toast.success("Thêm bài viết thành công");
            } else {
                // Update existing post
                const result = await authUtils.apiRequest(`posts/${currentPost.BaiVietID}`, 'PUT', postData, token);
                toast.success("Cập nhật bài viết thành công");
            }

            setViewMode('list');
            fetchPosts();
        } catch (error) {
            console.error("Error saving post:", error);
            toast.error(viewMode === 'create' ? "Không thể thêm bài viết" : "Không thể cập nhật bài viết");
        } finally {
            setLoading(false);
        }
    };

    const generateSEO = () => {
        setFormData({
            ...formData,
            metaTitle: formData.tieuDe,
            metaKeywords: generateKeywordsFromTitle(formData.tieuDe),
            tieuDeKhongDau: generateSlug(formData.tieuDe)
        });
        toast.success("Đã tạo SEO tự động");
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success("Đã sao chép vào clipboard");
    };

    const PostPreview = () => (
        <div className="p-6">
            <div className="mb-4 p-3 bg-gray-100 rounded-lg text-sm">
                <div className="mb-2 text-gray-500">URL của bài viết:</div>
                <div className="text-blue-600 font-medium flex items-center">
                    <span>https://yourdomain.com/{formData.tieuDeKhongDau || 'ten-bai-viet'}</span>
                    <button
                        onClick={() => copyToClipboard(`https://yourdomain.com/${formData.tieuDeKhongDau || 'ten-bai-viet'}`)}
                        className="ml-2 p-1 text-gray-500 hover:text-blue-500"
                        title="Sao chép URL"
                    >
                        <Copy className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="border-b pb-4 mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">{formData.tieuDe}</h1>
                    <p className="mt-2 text-gray-600">{formData.moTaNgan}</p>
                </div>

                {thumbnailPreview && (
                    <div className="mb-6">
                        <img
                            src={thumbnailPreview}
                            alt={formData.tieuDe}
                            className="w-full h-auto max-h-96 object-cover rounded-lg"
                        />
                    </div>
                )}

                <div
                    className="prose max-w-none"
                    dangerouslySetInnerHTML={{ __html: formData.noiDung }}
                />
            </div>
        </div>
    );

    // Render UI dạng danh sách bài viết
    const renderPostsList = () => (
        <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
                <div className="flex flex-1 gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm bài viết..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Tất cả danh mục</option>
                        {categories.map(cat => (
                            <option key={cat.DanhMucID} value={cat.DanhMucID}>
                                {cat.TenDanhMuc}
                            </option>
                        ))}
                    </select>
                </div>

                <button
                    onClick={handleCreateNew}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Thêm bài viết
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bài viết</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">URL</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Danh mục</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đăng</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lượt xem</th>
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
                        ) : posts.length > 0 ? (
                            posts.map((post) => (
                                <tr key={post.BaiVietID} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 flex-shrink-0">
                                                {post.Thumbnail ? (
                                                    <img
                                                        src={post.Thumbnail}
                                                        alt={post.TieuDe}
                                                        className="h-10 w-10 rounded object-cover"
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://via.placeholder.com/150?text=No+Image';
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded bg-gray-200 flex items-center justify-center">
                                                        <Image className="h-5 w-5 text-gray-400" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">{post.TieuDe}</div>
                                                <div className="text-sm text-gray-500">{post.TenTacGia}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <span className="text-blue-500 hover:underline cursor-pointer truncate max-w-[150px]">
                                                {post.TieuDeKhongDau || 'N/A'}
                                            </span>
                                            <button
                                                onClick={() => copyToClipboard(`https://yourdomain.com/${post.TieuDeKhongDau}`)}
                                                className="ml-2 text-gray-400 hover:text-blue-500"
                                                title="Sao chép URL"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                            {post.TenDanhMuc}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(post.NgayDang).toLocaleDateString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {post.LuotXem}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => handleViewBySlug(post.TieuDeKhongDau)}
                                                className="text-green-600 hover:text-green-900"
                                                title="Xem"
                                            >
                                                <Eye className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(post.BaiVietID)}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Chỉnh sửa"
                                            >
                                                <Pencil className="h-5 w-5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(post.BaiVietID)}
                                                className="text-red-600 hover:text-red-900"
                                                title="Xóa"
                                            >
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="px-4 py-4 text-center text-gray-500">
                                    Không có bài viết nào
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPosts > limit && (
                <div className="flex justify-between items-center mt-4">
                    <div className="text-sm text-gray-500">
                        Hiển thị {(page - 1) * limit + 1} - {Math.min(page * limit, totalPosts)} trong {totalPosts} bài viết
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
                            disabled={page * limit >= totalPosts}
                            onClick={() => setPage(page + 1)}
                            className={`px-3 py-1 rounded ${page * limit >= totalPosts ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                        >
                            Sau
                        </button>
                    </div>
                </div>
            )}
        </div>
    );

    // Render UI form chỉnh sửa/thêm mới bài viết
    const renderPostForm = () => (
        <div className="bg-white rounded-xl shadow-sm" ref={contentRef}>
            {renderFixedNav()}


            {previewMode ? (
                <PostPreview />
            ) : (
                <>
                    <div className="border-b">
                        <nav className="flex -mb-px">
                            <button
                                onClick={() => setActiveTab('content')}
                                className={`py-4 px-6 font-medium text-sm ${activeTab === 'content'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Nội dung
                            </button>
                            <button
                                onClick={() => setActiveTab('seo')}
                                className={`py-4 px-6 font-medium text-sm ${activeTab === 'seo'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                SEO & URL
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`py-4 px-6 font-medium text-sm ${activeTab === 'settings'
                                    ? 'border-b-2 border-blue-500 text-blue-600'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Cài đặt
                            </button>
                        </nav>
                    </div>

                    <div className="p-6">
                        {/* Tab Nội dung */}
                        {activeTab === 'content' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="tieuDe"
                                        value={formData.tieuDe}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Mô tả ngắn <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="moTaNgan"
                                            value={formData.moTaNgan}
                                            onChange={handleInputChange}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Danh mục <span className="text-red-500">*</span>
                                        </label>
                                        <select
                                            name="danhMucID"
                                            value={formData.danhMucID}
                                            onChange={handleInputChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {categories.map(cat => (
                                                <option key={cat.DanhMucID} value={cat.DanhMucID}>
                                                    {cat.TenDanhMuc}
                                                </option>
                                            ))}
                                        </select>

                                        <div className="mt-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Ảnh thumbnail
                                            </label>
                                            <div className="mt-1 flex flex-col items-center">
                                                {thumbnailPreview && (
                                                    <div className="mb-3 relative">
                                                        <img
                                                            src={thumbnailPreview}
                                                            alt="Thumbnail preview"
                                                            className="h-32 w-full object-cover rounded-lg"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                setThumbnailPreview('');
                                                                setThumbnailFile(null);
                                                                setFormData({ ...formData, thumbnail: '' });
                                                            }}
                                                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                )}
                                                <label className="w-full flex justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                                    <span className="text-sm text-gray-600">Chọn ảnh</span>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={handleThumbnailChange}
                                                    />
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nội dung <span className="text-red-500">*</span>
                                    </label>
                                    <ReactQuill
                                        ref={quillRef}
                                        theme="snow"
                                        value={formData.noiDung}
                                        onChange={(value) => setFormData({ ...formData, noiDung: value })}
                                        modules={quillModules}
                                        formats={quillFormats}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Tab SEO & URL */}
                        {activeTab === 'seo' && (
                            <div className="space-y-6">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                                    <h3 className="text-blue-800 font-medium mb-2">SEO tự động</h3>
                                    <p className="text-blue-700 text-sm mb-3">
                                        Hệ thống có thể tự động tạo các thông tin SEO dựa trên tiêu đề bài viết
                                    </p>
                                    <button
                                        type="button"
                                        onClick={generateSEO}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm flex items-center"
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Tạo SEO tự động
                                    </button>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Slug URL <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type="text"
                                                name="tieuDeKhongDau"
                                                value={formData.tieuDeKhongDau}
                                                onChange={handleInputChange}
                                                className={`w-full px-3 py-2 border ${slugExists ? 'border-red-300 bg-red-50' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                                                placeholder="ten-bai-viet"
                                                required
                                            />
                                            {checkingSlug && (
                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                    <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const slug = generateSlug(formData.tieuDe);
                                                setFormData({ ...formData, tieuDeKhongDau: slug });
                                                checkSlugExists(slug);
                                            }}
                                            className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                                            title="Tạo URL từ tiêu đề"
                                        >
                                            <RefreshCw className="h-5 w-5" />
                                        </button>
                                    </div>
                                    {slugExists && (
                                        <p className="mt-1 text-sm text-red-600">
                                            URL này đã tồn tại. Vui lòng chọn một URL khác.
                                        </p>
                                    )}
                                    <p className="mt-1 text-sm text-gray-500">
                                        URL của bài viết:
                                        <span className="ml-1 text-blue-600 flex items-center">
                                            https://yourdomain.com/{formData.tieuDeKhongDau || 'ten-bai-viet'}
                                            <button
                                                onClick={() => copyToClipboard(`https://yourdomain.com/${formData.tieuDeKhongDau || 'ten-bai-viet'}`)}
                                                className="ml-2 text-gray-400 hover:text-blue-500"
                                                title="Sao chép URL"
                                            >
                                                <Copy className="h-4 w-4" />
                                            </button>
                                        </span>
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề SEO
                                    </label>
                                    <input
                                        type="text"
                                        name="metaTitle"
                                        value={formData.metaTitle}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <div className="mt-1 flex justify-between">
                                        <p className="text-sm text-gray-500">
                                            {formData.metaTitle?.length || 0} ký tự
                                        </p>
                                        <p className={`text-sm ${(formData.metaTitle?.length || 0) > 60 ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {(formData.metaTitle?.length || 0) > 60 ? 'Tốt' : 'Nên dài hơn 60 ký tự'}
                                        </p>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Meta Keywords
                                    </label>
                                    <input
                                        type="text"
                                        name="metaKeywords"
                                        value={formData.metaKeywords}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="keyword1, keyword2, keyword3"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Canonical URL
                                    </label>
                                    <input
                                        type="text"
                                        name="canonicalURL"
                                        value={formData.canonicalURL}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="noIndex"
                                        name="noIndex"
                                        checked={formData.noIndex}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="noIndex" className="ml-2 block text-sm text-gray-700">
                                        Không cho phép Google index (noindex)
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Tab Cài đặt */}
                        {activeTab === 'settings' && (
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Trạng thái
                                    </label>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer ${formData.trangThai === 0 ? 'bg-gray-100 border-gray-400' : 'hover:bg-gray-50'}`}
                                            onClick={() => setFormData({ ...formData, trangThai: 0 })}
                                        >
                                            <div className="flex items-center mb-2">
                                                <input
                                                    type="radio"
                                                    checked={formData.trangThai === 0}
                                                    onChange={() => { }}
                                                    className="h-4 w-4 text-blue-600"
                                                />
                                                <span className="ml-2 font-medium">Bản nháp</span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Lưu bài viết nhưng không hiển thị
                                            </p>
                                        </div>

                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer ${formData.trangThai === 1 ? 'bg-green-50 border-green-400' : 'hover:bg-gray-50'}`}
                                            onClick={() => setFormData({ ...formData, trangThai: 1 })}
                                        >
                                            <div className="flex items-center mb-2">
                                                <input
                                                    type="radio"
                                                    checked={formData.trangThai === 1}
                                                    onChange={() => { }}
                                                    className="h-4 w-4 text-green-600"
                                                />
                                                <span className="ml-2 font-medium">Công khai</span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Hiển thị bài viết cho mọi người
                                            </p>
                                        </div>

                                        <div
                                            className={`border rounded-lg p-4 cursor-pointer ${formData.trangThai === 2 ? 'bg-yellow-50 border-yellow-400' : 'hover:bg-gray-50'}`}
                                            onClick={() => setFormData({ ...formData, trangThai: 2 })}
                                        >
                                            <div className="flex items-center mb-2">
                                                <input
                                                    type="radio"
                                                    checked={formData.trangThai === 2}
                                                    onChange={() => { }}
                                                    className="h-4 w-4 text-yellow-600"
                                                />
                                                <span className="ml-2 font-medium">Ẩn</span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                Lưu và ẩn tạm thời
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Các cài đặt bổ sung có thể thêm vào đây */}
                            </div>
                        )}

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setViewMode('list')}
                                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center"
                            >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Quay lại
                            </button>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Đang xử lý...
                                    </div>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {viewMode === 'create' ? 'Thêm bài viết' : 'Cập nhật'}
                                    </>
                                )}
                            </button>
                            {showScrollTop && (
                                <button
                                    onClick={scrollToTop}
                                    className="fixed bottom-6 right-6 p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 z-50"
                                    aria-label="Về đầu trang"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );

    return (
        <div className="p-6">
            {viewMode === 'list' ? renderPostsList() : renderPostForm()}
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default PostsManagement;