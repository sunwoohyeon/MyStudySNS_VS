"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import MainLayout from "@/component/MainLayout";
import Link from "next/link";
import { FiAward, FiFileText } from "react-icons/fi";

interface Profile {
    username: string;
    school_name: string;
    major: string;
    double_major: string;
    first_name: string;
    last_name: string;
}

interface Post {
    id: number;
    title: string;
    board: string;
    created_at: string;
    tag: string;
}

export default function UserProfilePage() {
    const params = useParams();
    const userId = params.id;

    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [userPosts, setUserPosts] = useState<Post[]>([]);
    const [stats, setStats] = useState({ totalScore: 0, postCount: 0 });
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/profile/${userId}`);

                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "프로필을 불러오는데 실패했습니다.");
                }

                const data = await res.json();
                setProfile(data.profile);
                setUserPosts(data.posts);
                setStats({ totalScore: data.totalScore, postCount: data.postCount });
            } catch (e: any) {
                console.error(e);
                setError(e.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (userId) {
            fetchData();
        }
    }, [userId]);

    if (isLoading) return <MainLayout><div className="text-center py-20">로딩 중...</div></MainLayout>;
    if (error) return <MainLayout><div className="text-center py-20 text-red-500">{error}</div></MainLayout>;
    if (!profile) return <MainLayout><div className="text-center py-20">사용자를 찾을 수 없습니다.</div></MainLayout>;

    return (
        <MainLayout>
            <div className="max-w-5xl mx-auto w-full py-8 px-4">
                <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">프로필</h1>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    {/* --- 좌측: 프로필 카드 --- */}
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <div className="flex flex-col items-center text-center mb-6">
                                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                                    {profile.username.substring(0, 1)}
                                </div>

                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile.username}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profile.school_name}</p>
                            </div>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500">전공</span>
                                    <span className="font-medium">{profile.major}</span>
                                </div>
                                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                                    <span className="text-gray-500">복수전공</span>
                                    <span className="font-medium text-gray-400">{profile.double_major || "-"}</span>
                                </div>
                            </div>
                        </div>

                        {/* 활동 요약 카드 */}
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <FiAward className="text-yellow-500" /> 활동 지표
                            </h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalScore}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">총 획득 점수</div>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-gray-800 dark:text-gray-200">{stats.postCount}</div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">작성한 글</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- 우측: 작성한 게시글 목록 --- */}
                    <div className="md:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                                <FiFileText className="text-blue-500" />
                                <h3 className="font-bold text-gray-900 dark:text-white">작성한 글</h3>
                            </div>

                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {userPosts.length > 0 ? (
                                    userPosts.map((post) => (
                                        <li key={post.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group">
                                            <Link href={`/post/${post.id}`} className="flex justify-between items-center">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded dark:bg-gray-700 dark:text-gray-300">
                                                            {post.board}
                                                        </span>
                                                        <span className="text-xs text-gray-400">
                                                            {new Date(post.created_at).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-base font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-600 transition">
                                                        {post.title || "제목 없음"}
                                                    </h4>
                                                </div>
                                                <span className="text-gray-300 dark:text-gray-600 group-hover:translate-x-1 transition-transform">
                                                    &rarr;
                                                </span>
                                            </Link>
                                        </li>
                                    ))
                                ) : (
                                    <li className="p-10 text-center text-gray-400">
                                        작성한 글이 없습니다.
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}
