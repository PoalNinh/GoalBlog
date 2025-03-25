import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import authUtils from '../utils/authUtils';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PostView = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPostBySlug = async () => {
      try {
        setLoading(true);
        const token = authUtils.getToken();
        const response = await authUtils.apiRequest(`posts/slug/${slug}`, 'GET', null, token);
        setPost(response);
      } catch (error) {
        console.error("Error fetching post:", error);
        setError(error.message || "Không thể tải bài viết");
        toast.error("Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchPostBySlug();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-64">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="p-6">
        <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-red-800">
          <h2 className="text-lg font-medium mb-2">Lỗi</h2>
          <p>{error || "Không tìm thấy bài viết"}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 text-sm flex items-center"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Quay lại
          </button>
        </div>

        <div className="border-b pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{post.TieuDe}</h1>
              <p className="mt-2 text-gray-600">{post.MoTaNgan}</p>
            </div>
            <div className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 text-sm font-medium">
              {post.TenDanhMuc}
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-500 flex items-center">
            <span className="mr-4">Tác giả: {post.TenTacGia}</span>
            <span className="mr-4">Ngày đăng: {new Date(post.NgayDang).toLocaleDateString('vi-VN')}</span>
            <span>Lượt xem: {post.LuotXem}</span>
          </div>
        </div>

        {post.Thumbnail && (
          <div className="mb-6">
            <img
              src={post.Thumbnail}
              alt={post.TieuDe}
              className="w-full h-auto max-h-96 object-cover rounded-lg"
            />
          </div>
        )}

        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: post.NoiDung }}
        />
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PostView;