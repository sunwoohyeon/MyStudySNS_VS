"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useEffect, useState } from "react";

export default function DebugPage() {
    const supabase = createClientComponentClient();
    const [reviews, setReviews] = useState<any[]>([]);
    const [posts, setPosts] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const { data: reviewsData } = await supabase.from("reviews").select("*");
            setReviews(reviewsData || []);

            const { data: postsData } = await supabase.from("posts").select("id, title");
            setPosts(postsData || []);
        };
        fetchData();
    }, []);

    const handleDeleteAll = async () => {
        if (!confirm("정말 모든 리뷰를 삭제하시겠습니까?")) return;
        const { error } = await supabase.from("reviews").delete().neq("id", 0); // id가 0이 아닌 모든 것 삭제 (전체 삭제)
        if (error) alert("삭제 실패: " + error.message);
        else {
            alert("모든 리뷰가 삭제되었습니다.");
            window.location.reload();
        }
    };

    return (
        <div className="p-10">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Debug: Data Inspection</h1>
                <button onClick={handleDeleteAll} className="bg-red-600 text-white px-4 py-2 rounded font-bold hover:bg-red-700">
                    모든 리뷰 삭제 (초기화)
                </button>
            </div>

            <div className="flex gap-10">
                <div>
                    <h2 className="text-xl font-bold mb-2">Posts Table</h2>
                    <table className="border-collapse border border-gray-400">
                        <thead>
                            <tr>
                                <th className="border border-gray-400 p-2">ID</th>
                                <th className="border border-gray-400 p-2">Title</th>
                            </tr>
                        </thead>
                        <tbody>
                            {posts.map((p) => (
                                <tr key={p.id}>
                                    <td className="border border-gray-400 p-2">{p.id}</td>
                                    <td className="border border-gray-400 p-2">{p.title}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div>
                    <h2 className="text-xl font-bold mb-2">Reviews Table</h2>
                    <table className="border-collapse border border-gray-400">
                        <thead>
                            <tr>
                                <th className="border border-gray-400 p-2">ID</th>
                                <th className="border border-gray-400 p-2">Post ID</th>
                                <th className="border border-gray-400 p-2">User ID</th>
                                <th className="border border-gray-400 p-2">Score</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reviews.map((r) => (
                                <tr key={r.id}>
                                    <td className="border border-gray-400 p-2">{r.id}</td>
                                    <td className="border border-gray-400 p-2">{r.post_id}</td>
                                    <td className="border border-gray-400 p-2">{r.user_id}</td>
                                    <td className="border border-gray-400 p-2">{r.score}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
