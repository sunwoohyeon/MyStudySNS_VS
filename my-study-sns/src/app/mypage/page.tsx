"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import MainLayout from "@/component/MainLayout";
import Link from "next/link";
import { FiUser, FiEdit2, FiSave, FiAward, FiFileText } from "react-icons/fi";

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

export default function MyPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  
  // 데이터 상태
  const [profile, setProfile] = useState<Profile | null>(null);
  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [stats, setStats] = useState({ totalScore: 0, postCount: 0 });

  // 수정 폼 상태
  const [editForm, setEditForm] = useState({
    username: "",
    schoolName: "",
    major: "",
    doubleMajor: "",
  });

  // 데이터 불러오기
  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/mypage");
      if (res.status === 401) {
        alert("로그인이 필요합니다.");
        router.push("/login");
        return;
      }
      
      if (res.ok) {
        const data = await res.json();
        setProfile(data.profile);
        setMyPosts(data.posts);
        setStats({ totalScore: data.totalScore, postCount: data.postCount });
        
        // 수정 폼 초기값 설정
        setEditForm({
          username: data.profile.username || "",
          schoolName: data.profile.school_name || "",
          major: data.profile.major || "",
          doubleMajor: data.profile.double_major || "",
        });
      }
      setIsLoading(false);
    };
    fetchData();
  }, [router]);

  // 입력 핸들러
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  // 수정 저장 핸들러 (안전 버전)
  const handleUpdate = async () => {
    if (!editForm.username.trim()) return alert("닉네임은 필수입니다.");

    try {
      const res = await fetch("/api/mypage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      // ★ 수정 포인트: 응답이 OK가 아니면 JSON 파싱 전에 에러 처리
      if (!res.ok) {
        const errorText = await res.text(); // JSON이 아닐 수도 있으니 text로 받음
        throw new Error(`서버 오류 (${res.status}): ${errorText}`);
      }

      const result = await res.json(); // OK일 때만 JSON 파싱

      setProfile(result);
      setIsEditing(false);
      alert("프로필이 수정되었습니다.");
      router.refresh(); 

    } catch (e: any) {
      console.error(e);
      // 에러 메시지에서 불필요한 기호 제거하고 깔끔하게 출력
      alert(e.message.replace(/"/g, '')); 
    }
  };

  if (isLoading) return <MainLayout><div className="text-center py-20">로딩 중...</div></MainLayout>;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto w-full py-8 px-4">
        <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">마이페이지</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* --- 좌측: 프로필 카드 --- */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mb-4 shadow-lg">
                  {profile?.username.substring(0, 1)}
                </div>
                
                {!isEditing ? (
                  <>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{profile?.username}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{profile?.school_name}</p>
                  </>
                ) : (
                  <div className="w-full space-y-2">
                     <input 
                      name="username"
                      value={editForm.username}
                      onChange={handleChange}
                      className="w-full p-2 border rounded text-center text-sm font-bold"
                      placeholder="닉네임"
                    />
                    <input 
                      name="schoolName"
                      value={editForm.schoolName}
                      onChange={handleChange}
                      className="w-full p-2 border rounded text-center text-xs"
                      placeholder="학교명"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">이름</span>
                  <span className="font-medium">{profile?.last_name}{profile?.first_name}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">전공</span>
                  {!isEditing ? (
                    <span className="font-medium">{profile?.major}</span>
                  ) : (
                    <input 
                      name="major"
                      value={editForm.major} 
                      onChange={handleChange}
                      className="w-32 p-1 border rounded text-right text-xs"
                    />
                  )}
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-gray-500">복수전공</span>
                  {!isEditing ? (
                    <span className="font-medium text-gray-400">{profile?.double_major || "-"}</span>
                  ) : (
                     <input 
                      name="doubleMajor"
                      value={editForm.doubleMajor} 
                      onChange={handleChange}
                      className="w-32 p-1 border rounded text-right text-xs"
                    />
                  )}
                </div>
              </div>

              <div className="mt-6">
                {!isEditing ? (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="w-full py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <FiEdit2 size={16} /> 프로필 수정
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditing(false)}
                      className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      취소
                    </button>
                    <button 
                      onClick={handleUpdate}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
                    >
                      <FiSave size={16} /> 저장
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 활동 요약 카드 */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <FiAward className="text-yellow-500" /> 내 활동 지표
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
              <p className="text-xs text-center text-gray-400 mt-4">
                게시글을 많이 쓰고 유용한 정보를 공유할수록 점수가 올라갑니다!
              </p>
            </div>
          </div>

          {/* --- 우측: 내 게시글 목록 --- */}
          <div className="md:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <FiFileText className="text-blue-500" />
                <h3 className="font-bold text-gray-900 dark:text-white">내가 작성한 글</h3>
              </div>

              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {myPosts.length > 0 ? (
                  myPosts.map((post) => (
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
                    아직 작성한 글이 없습니다. <br />
                    <Link href="/write" className="text-blue-500 hover:underline mt-2 inline-block">
                      첫 글을 작성해보세요!
                    </Link>
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