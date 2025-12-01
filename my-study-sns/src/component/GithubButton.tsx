"use client";

// GitHub 로고 SVG
const GithubIcon = () => (
  <svg viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
    <path d="M8 0C3.58 0 0 3.58 0 8a8.004 8.004 0 005.47 7.59c.4.074.55-.174.55-.388 0-.19-.007-.693-.01-1.36-2.226.483-2.695-1.073-2.695-1.073-.364-.924-.89-1.17-.89-1.17-.727-.497.055-.487.055-.487.803.057 1.225.825 1.225.825.714 1.223 1.872.87 2.328.665.072-.517.28-.87.508-1.07-1.777-.2-3.644-.888-3.644-3.953 0-.873.31-1.588.823-2.148-.083-.202-.357-1.015.078-2.116 0 0 .672-.215 2.2.82A7.673 7.673 0 018 4.845a7.66 7.66 0 011.998.27c1.526-1.035 2.197-.82 2.197-.82.437 1.101.163 1.914.08 2.116.513.56.823 1.275.823 2.148 0 3.073-1.87 3.75-3.65 3.947.288.247.544.734.544 1.48 0 1.068-.01 1.93-.01 2.19 0 .216.148.465.552.386A8.005 8.005 0 0016 8c0-4.42-3.58-8-8-8z" />
  </svg>
);


export default function GithubButton() {
  const onClick = () => {
    // TODO: Firebase GitHub 로그인 연동
    console.log("GitHub 로그인 시도");
  };

  return (
    <button onClick={onClick} className="w-full flex items-center justify-center gap-2 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
      <GithubIcon />
      <span className="font-medium">GitHub으로 계속하기</span>
    </button>
  );
}