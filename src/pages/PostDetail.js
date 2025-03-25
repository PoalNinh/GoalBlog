import React, { useState, useEffect } from 'react';
import { ArrowLeft, Eye, Calendar, User } from 'lucide-react';
import authUtils from '../utils/authUtils';
import { useParams, useNavigate } from 'react-router-dom';

const PostDetail = () => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        fetchPost();
    }, [id]);

    const fetchPost = async () => {
        try {
            setLoading(true);
            const token = authUtils.getToken();
            const fetchedPost = await authUtils.apiRequest(`posts/${id}`, 'GET', null, token);
            setPost(fetchedPost);
        } catch (error) {
            console.error("Lỗi khi tải bài viết:", error);
            setError("Không thể tải bài viết. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6 text-center">
                <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
                    {error}
                </div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    if (!post) {
        return (
            <div className="p-6 text-center">
                <div className="bg-yellow-50 text-yellow-600 p-4 rounded-lg mb-4">
                    Không tìm thấy bài viết
                </div>
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className=" mx-auto p-6">
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-blue-500 hover:text-blue-700"
                >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Quay lại danh sách
                </button>
            </div>

            <article className="bg-white rounded-xl shadow-sm overflow-hidden">
                {post.Thumbnail && (
                    <div className="w-full h-64 bg-gray-100">
                        <img
                            src={post.Thumbnail}
                            alt={post.TieuDe}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://via.placeholder.com/800x400?text=Ảnh+không+có+sẵn';
                            }}
                        />
                    </div>
                )}

                <div className="p-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-3">{post.TieuDe}</h1>
                    
                    <div className="flex flex-wrap items-center text-sm text-gray-500 mb-6 gap-4">
                        <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(post.NgayDang).toLocaleDateString('vi-VN')}
                        </div>
                        
                        {post.TenTacGia && (
                            <div className="flex items-center">
                                <User className="h-4 w-4 mr-1" />
                                {post.TenTacGia}
                            </div>
                        )}
                        
                        <div className="flex items-center">
                            <Eye className="h-4 w-4 mr-1" />
                            {post.LuotXem} lượt xem
                        </div>
                        
                        {post.TenDanhMuc && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {post.TenDanhMuc}
                            </span>
                        )}
                    </div>
                    
                    {post.MoTaNgan && (
                        <div className="mb-6 italic text-gray-600 border-l-4 border-blue-500 pl-4 py-2">
                            {post.MoTaNgan}
                        </div>
                    )}
                    
                    <div 
                        className="prose max-w-none"
                        dangerouslySetInnerHTML={{ __html: post.NoiDung }}
                    />
                </div>
            </article>
        </div>
    );
};

export default PostDetail;