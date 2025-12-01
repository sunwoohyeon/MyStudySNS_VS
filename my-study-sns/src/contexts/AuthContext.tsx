"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// 리뷰 데이터 타입
export interface Review {
  scores: {
    accuracy: number;
    clarity: number;
    depth: number;
  };
  comment: string;
}

// Post 타입 (major 속성 포함)
export interface Post {
  id: string;
  title: string;
  text: string;
  author: string;
  major: string; // 작성자 전공
  createdAt: Date | string;
  tag: string;
  board: string;
  usefulScore: number;
  isSolved: boolean;
  reviews: Review[];
  isKnowledgeCard: boolean;
  summary: string | null;
  reports: { userId: string; reason: string }[];
  isHidden: boolean;
}

// 알림 데이터 타입
export interface Notification {
  id: string;
  message: string;
  read: boolean;
  createdAt: Date;
}

interface AuthContextType {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  posts: Post[];
  // Omit에 major 추가
  addPost: (newPost: Omit<Post, 'id' | 'author' | 'major' | 'createdAt' | 'usefulScore' | 'isSolved' | 'reviews' | 'isKnowledgeCard' | 'summary' | 'reports' | 'isHidden'>) => void;
  solvePost: (postId: string, adoptedAnswerText: string) => void;
  addReview: (postId: string, review: Review) => void;
  notifications: Notification[];
  addNotification: (message: string) => void;
  reportPost: (postId: string, reason: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) { throw new Error('useAuth must be used within an AuthProvider'); }
  return context;
}

// 초기 데이터 (createdAt을 Date 객체로 수정, major 추가)
const initialPosts: Post[] = [
  { id: "1", title: "자유게시판 테스트 글입니다.", author: "김코딩", major: "컴퓨터과학", createdAt: new Date(2025, 9, 10, 15, 30), tag: "CS", text: "본문 내용입니다.", usefulScore: 3.5, isSolved: false, reviews: [], isKnowledgeCard: false, summary: null, reports: [], isHidden: false, board: "자유게시판" },
  { id: "2", title: "React 질문있습니다.", author: "이개발", major: "소프트웨어공학", createdAt: new Date(2025, 9, 10, 14, 25), tag: "React", text: "useState에 대한 질문 본문입니다.", usefulScore: 4.2, isSolved: false, reviews: [{scores:{accuracy:5,clarity:4,depth:4},comment:""}], isKnowledgeCard: false, summary: null, reports: [], isHidden: false, board: "질문/답변" },
  { id: "3", title: "캡스톤 디자인 팀원 구해요", author: "박해커", major: "정보보호", createdAt: new Date(2025, 9, 10, 11, 12), tag: "CS", text: "캡스톤 팀원 구하는 글의 본문입니다.", usefulScore: 2.8, isSolved: true, reviews: [], isKnowledgeCard: true, summary: "웹페이지 개발 캡스톤 디자인 프로젝트에 참여할 프론트엔드 및 백엔드 개발자 팀원을 모집합니다.", reports: [], isHidden: false, board: "자유게시판" },
  { id: "4", title: "알고리즘 스터디 노트 공유", author: "나공부", major: "데이터사이언스", createdAt: new Date(2025, 9, 9, 18, 0), tag: "알고리즘", text: "DP 기본 개념 정리입니다.", usefulScore: 5.0, isSolved: true, reviews: [], isKnowledgeCard: true, summary: "Dynamic Programming의 기본 개념과 예제 코드를 공유합니다.", reports: [], isHidden: false, board: "스터디 노트" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return (savedTheme === 'dark' || savedTheme === 'light') ? savedTheme : 'light';
    }
    return 'light';
  });
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const login = () => setIsLoggedIn(true);
  const logout = () => setIsLoggedIn(false);
  const toggleTheme = () => { setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light')); };

  // 새 글 추가 시 가짜 'major' 정보를 포함
  const addPost = (postData: Omit<Post, 'id' | 'author' | 'major' | 'createdAt' | 'usefulScore' | 'isSolved' | 'reviews' | 'isKnowledgeCard' | 'summary' | 'reports' | 'isHidden'>) => {
    const newPost: Post = {
      id: String(Date.now()), 
      author: "나 (가짜 데이터)", 
      major: "컴퓨터학부", // 가짜 전공
      createdAt: new Date(), 
      usefulScore: 0, 
      isSolved: false, 
      reviews: [], 
      isKnowledgeCard: false, 
      summary: null, 
      reports: [], 
      isHidden: false, 
      ...postData,
    };
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  const solvePost = (postId: string, adoptedAnswerText: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post => 
        post.id === postId ? { ...post, isSolved: true, isKnowledgeCard: true, summary: adoptedAnswerText.substring(0, 150) + "..." } : post
      )
    );
  };

  const addReview = (postId: string, review: Review) => {
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          const updatedReviews = [...post.reviews, review];
          let totalScoreSum = 0;
          updatedReviews.forEach(r => { totalScoreSum += (r.scores.accuracy + r.scores.clarity + r.scores.depth); });
          const newUsefulScore = totalScoreSum / (updatedReviews.length * 3);
          let shouldBeKnowledgeCard = post.isKnowledgeCard;
          if (newUsefulScore >= 3.5 && updatedReviews.length >= 2) { shouldBeKnowledgeCard = true; }
          let newSummary = post.summary;
          if (shouldBeKnowledgeCard && !post.isKnowledgeCard) { newSummary = post.text.substring(0, 150) + "..."; }
          return { ...post, reviews: updatedReviews, usefulScore: newUsefulScore, isKnowledgeCard: shouldBeKnowledgeCard, summary: newSummary };
        }
        return post;
      })
    );
  };

  const addNotification = (message: string) => {
    const newNotification: Notification = {
      id: String(Date.now()),
      message,
      read: false,
      createdAt: new Date(),
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  const reportPost = (postId: string, reason: string) => {
    let targetPost: Post | undefined;
    setPosts(prevPosts =>
      prevPosts.map(post => {
        if (post.id === postId) {
          targetPost = post;
          const fakeUserId = `user_${Math.floor(Math.random() * 1000)}`;
          const updatedReports = [...post.reports, { userId: fakeUserId, reason }];
          let shouldBeHidden = post.isHidden;
          if (updatedReports.length >= 3) { shouldBeHidden = true; }
          return { ...post, reports: updatedReports, isHidden: shouldBeHidden };
        }
        return post;
      })
    );
    if (targetPost) {
      if (targetPost.reports.length >= 2 && !targetPost.isHidden) {
           alert("신고가 3회 누적되어 게시물이 숨김 처리됩니다.");
           addNotification(`'${targetPost.title}' 게시물이 신고 누적으로 숨김 처리되었습니다.`);
      } else {
           alert("신고가 접수되었습니다.");
      }
    }
  };

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const value = { isLoggedIn, login, logout, theme, toggleTheme, posts, addPost, solvePost, addReview, notifications, addNotification, reportPost };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}