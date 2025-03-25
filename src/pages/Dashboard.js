import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis,
    CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
    FileText, Users, BookOpen, TrendingUp, 
    Clock, Award, Loader2, Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Button } from "../components/ui/button";
import { DatePicker } from "../components/ui/datepicker";
import authUtils from '../utils/authUtils';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const StatCardSkeleton = () => (
    <Card className="animate-pulse">
        <CardContent className="p-4">
            <div className="flex items-start justify-between">
                <div className="space-y-2">
                    <div className="h-3 w-20 bg-gray-200 rounded"></div>
                    <div className="h-6 w-24 bg-gray-300 rounded"></div>
                    <div className="h-3 w-28 bg-gray-200 rounded"></div>
                </div>
                <div className="bg-gray-300 rounded-lg p-2 w-8 h-8"></div>
            </div>
        </CardContent>
    </Card>
);

const ChartSkeleton = ({ height = "h-72" }) => (
    <Card>
        <CardHeader>
            <div className="h-5 w-36 bg-gray-200 rounded animate-pulse"></div>
        </CardHeader>
        <CardContent>
            <div className={`${height} bg-gray-100 rounded-lg animate-pulse flex items-center justify-center`}>
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
        </CardContent>
    </Card>
);

const StatCard = ({ title, value, icon: Icon, color, percentageChange }) => (
    <Card className="transition-transform duration-200 hover:scale-[1.02]">
        <CardContent className="p-4">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
                    <h3 className="text-xl font-bold text-gray-800">{value}</h3>
                    {percentageChange !== undefined && (
                        <p className={`text-xs mt-1 flex items-center ${percentageChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            <span className={`mr-1 ${percentageChange > 0 ? 'rotate-0' : 'rotate-180'}`}>↑</span>
                            {Math.abs(percentageChange)}% so với tháng trước
                        </p>
                    )}
                </div>
                <div className={`${color} rounded-lg p-2`}>
                    <Icon className="w-4 h-4 text-white" />
                </div>
            </div>
        </CardContent>
    </Card>
);

const Dashboard = () => {
    const [timeFilter, setTimeFilter] = useState('30d');
    const [chartType, setChartType] = useState('line');
    const [dateRange, setDateRange] = useState({
        start: new Date(new Date().setDate(new Date().getDate() - 30)),
        end: new Date()
    });
    const [stats, setStats] = useState({
        totalPosts: 0,
        totalEmployees: 0,
        totalCategories: 0,
        postGrowth: 0,
        viewGrowth: 0
    });
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState({
        latestPosts: [],
        mostViewedPosts: [],
        postsByCategory: [],
        postsByMonth: [],
        topAuthors: [],
        growthStats: {}
    });

    const handleTimeFilterChange = (value) => {
        setTimeFilter(value);
        const end = new Date();
        let start = new Date();

        switch (value) {
            case '7d':
                start.setDate(end.getDate() - 7);
                break;
            case '30d':
                start.setDate(end.getDate() - 30);
                break;
            case '90d':
                start.setDate(end.getDate() - 90);
                break;
            case '1y':
                start.setFullYear(end.getFullYear() - 1);
                break;
            default:
                start.setDate(end.getDate() - 30);
        }

        setDateRange({ start, end });
    };

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
              const token = authUtils.getToken();
            const result = await authUtils.apiRequest('statistics', 'GET' , null, token);
            
            if (result) {
                setDashboardData({
                    latestPosts: result.latestPosts || [],
                    mostViewedPosts: result.mostViewedPosts || [],
                    postsByCategory: result.postsByCategory || [],
                    postsByMonth: result.postsByMonth || [],
                    topAuthors: result.topAuthors || [],
                    growthStats: result.growthStats || {}
                });

                // Tính toán % tăng trưởng
                const postGrowth = result.growthStats?.BaiVietThangTruoc > 0 
                    ? ((result.growthStats.BaiVietThangNay - result.growthStats.BaiVietThangTruoc) / 
                       result.growthStats.BaiVietThangTruoc) * 100 
                    : 0;
                    
                const viewGrowth = result.growthStats?.LuotXemThangTruoc > 0 
                    ? ((result.growthStats.LuotXemThangNay - result.growthStats.LuotXemThangTruoc) / 
                       result.growthStats.LuotXemThangTruoc) * 100 
                    : 0;

                setStats({
                    totalPosts: result.totalPosts || 0,
                    totalEmployees: result.totalEmployees || 0,
                    totalCategories: result.totalCategories || 0,
                    postGrowth: parseFloat(postGrowth.toFixed(1)),
                    viewGrowth: parseFloat(viewGrowth.toFixed(1))
                });
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const resetFilters = () => {
        setDateRange({
            start: new Date(new Date().setDate(new Date().getDate() - 30)),
            end: new Date()
        });
        setTimeFilter('30d');
    };

    // Chuyển đổi dữ liệu cho biểu đồ
    const prepareChartData = () => {
        // Dữ liệu posts theo tháng cho biểu đồ
        const postsMonthlyData = dashboardData.postsByMonth.map(item => ({
            date: `${item.Thang}/${item.Nam}`,
            posts: item.SoBaiViet,
            views: item.TongLuotXem
        }));

        // Dữ liệu danh mục cho biểu đồ
        const categoryData = dashboardData.postsByCategory.map(item => ({
            name: item.TenDanhMuc,
            value: item.SoBaiViet
        }));

        // Dữ liệu tác giả cho biểu đồ
        const authorData = dashboardData.topAuthors.map(item => ({
            name: item.HoVaTen,
            posts: item.SoBaiViet,
            views: item.TongLuotXem
        }));

        return {
            postsMonthlyData,
            categoryData,
            authorData
        };
    };

    const chartData = prepareChartData();

    const statCards = [
        {
            title: 'Tổng bài viết',
            value: stats.totalPosts,
            icon: FileText,
            color: 'bg-blue-500'
        },
        {
            title: 'Tổng nhân viên',
            value: stats.totalEmployees,
            icon: Users,
            color: 'bg-green-500'
        },
        {
            title: 'Tổng danh mục',
            value: stats.totalCategories,
            icon: BookOpen,
            color: 'bg-orange-500'
        },
        {
            title: 'Bài viết mới',
            value: dashboardData.growthStats?.BaiVietThangNay || 0,
            icon: Clock,
            color: 'bg-purple-500',
            percentageChange: stats.postGrowth
        },
        {
            title: 'Lượt xem',
            value: dashboardData.growthStats?.LuotXemThangNay || 0,
            icon: TrendingUp,
            color: 'bg-red-500',
            percentageChange: stats.viewGrowth
        }
    ];

    return (
        <div className="p-4 bg-gray-50 min-h-screen">
            <div className="mx-auto space-y-4">
                <div className="bg-white p-6 rounded-lg shadow-lg">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Tổng quan hệ thống
                        </h1>

                        <div className="flex flex-wrap items-center gap-4">
                            <Button variant="outline" onClick={fetchDashboardData}>
                                <Loader2 className="w-4 h-4 mr-2" />
                                Làm mới
                            </Button>

                            <Button variant="outline" onClick={resetFilters}>
                                Reset
                            </Button>

                            <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
                                <SelectTrigger className="w-44">
                                    <Calendar className="w-4 h-4 mr-2" />
                                    <SelectValue placeholder="Chọn thời gian" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7d">7 ngày qua</SelectItem>
                                    <SelectItem value="30d">30 ngày qua</SelectItem>
                                    <SelectItem value="90d">90 ngày qua</SelectItem>
                                    <SelectItem value="1y">1 năm qua</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex gap-4">
                                <DatePicker
                                    selected={dateRange.start}
                                    onChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                                    className="w-36"
                                    placeholder="Từ ngày"
                                />
                                <DatePicker
                                    selected={dateRange.end}
                                    onChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                                    className="w-36"
                                    placeholder="Đến ngày"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                    {loading
                        ? Array(5).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
                        : statCards.map((stat, index) => <StatCard key={index} {...stat} />)
                    }
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {loading ? (
                        <>
                            <ChartSkeleton height="h-72" />
                            <ChartSkeleton height="h-72" />
                        </>
                    ) : (
                        <>
                            <Card className="lg:col-span-2">
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-base font-semibold">
                                        Thống kê bài viết theo tháng
                                    </CardTitle>
                                    <div className="flex gap-2">
                                        <Button
                                            variant={chartType === 'line' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setChartType('line')}
                                        >
                                            Line
                                        </Button>
                                        <Button
                                            variant={chartType === 'bar' ? 'default' : 'outline'}
                                            size="sm"
                                            onClick={() => setChartType('bar')}
                                        >
                                            Bar
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            {chartType === 'line' ? (
                                                <LineChart data={chartData.postsMonthlyData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis yAxisId="left" />
                                                    <YAxis yAxisId="right" orientation="right" />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Line
                                                        yAxisId="left"
                                                        type="monotone"
                                                        dataKey="posts"
                                                        stroke="#0088FE"
                                                        name="Số bài viết"
                                                    />
                                                    <Line
                                                        yAxisId="right"
                                                        type="monotone"
                                                        dataKey="views"
                                                        stroke="#00C49F"
                                                        name="Lượt xem"
                                                    />
                                                </LineChart>
                                            ) : (
                                                <BarChart data={chartData.postsMonthlyData}>
                                                    <CartesianGrid strokeDasharray="3 3" />
                                                    <XAxis dataKey="date" />
                                                    <YAxis />
                                                    <Tooltip />
                                                    <Legend />
                                                    <Bar dataKey="posts" fill="#0088FE" name="Số bài viết" />
                                                    <Bar dataKey="views" fill="#00C49F" name="Lượt xem" />
                                                </BarChart>
                                            )}
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Phân bố bài viết theo danh mục
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={chartData.categoryData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={80}
                                                    label={({ name, value }) => `${name}: ${value}`}
                                                >
                                                    {chartData.categoryData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={COLORS[index % COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">
                                        Top tác giả hoạt động
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={chartData.authorData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" />
                                                <XAxis type="number" />
                                                <YAxis dataKey="name" type="category" width={100} />
                                                <Tooltip />
                                                <Legend />
                                                <Bar dataKey="posts" fill="#8884d8" name="Số bài viết" />
                                                <Bar dataKey="views" fill="#82ca9d" name="Lượt xem" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Bài viết mới nhất
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} className="animate-pulse flex space-x-4">
                                            <div className="h-12 w-12 bg-gray-200 rounded-md"></div>
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="space-y-1">
                                                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    dashboardData.latestPosts.map((post, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-blue-100 rounded-md text-blue-600">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {post.TieuDe}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <span className="mr-2">Tác giả: {post.TacGia}</span>
                                                    <span className="mr-2">•</span>
                                                    <span>Ngày đăng: {new Date(post.NgayDang).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md">
                                                    {post.LuotXem} lượt xem
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-semibold">
                                Bài viết được xem nhiều nhất
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {loading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <div key={i} className="animate-pulse flex space-x-4">
                                            <div className="h-12 w-12 bg-gray-200 rounded-md"></div>
                                            <div className="flex-1 space-y-2 py-1">
                                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                                <div className="space-y-1">
                                                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    dashboardData.mostViewedPosts.map((post, index) => (
                                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                                            <div className="flex-shrink-0 w-12 h-12 flex items-center justify-center bg-green-100 rounded-md text-green-600">
                                                <Award className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {post.TieuDe}
                                                </p>
                                                <div className="flex items-center text-xs text-gray-500 mt-1">
                                                    <span>Ngày đăng: {new Date(post.NgayDang).toLocaleDateString('vi-VN')}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md">
                                                    {post.LuotXem} lượt xem
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;