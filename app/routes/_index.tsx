import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";
import { useState, useEffect } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "CodeB WebCraft Studio" },
    { name: "description", content: "AI 기반 통합 웹사이트 에디터" },
  ];
};

interface RecentProject {
  templateId: string;
  templateName: string;
  lastEdited: string;
  status: 'editing' | 'completed';
  thumbnail?: string;
}

export default function Index() {
  const [showOptions, setShowOptions] = useState(false);
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);

  useEffect(() => {
    // localStorage에서 최근 작업 불러오기
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recentProjects');
      if (recent) {
        const projects = JSON.parse(recent);
        // 최신순 정렬 및 최대 3개만 표시
        const sortedProjects = projects
          .sort((a: RecentProject, b: RecentProject) => 
            new Date(b.lastEdited).getTime() - new Date(a.lastEdited).getTime()
          )
          .slice(0, 3);
        setRecentProjects(sortedProjects);
      }
    }
  }, []);

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}분 전`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}시간 전`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}일 전`;
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center max-w-2xl w-full px-4">
        <h1 className="text-4xl font-light mb-8 tracking-wide">
          <span className="font-bold text-blue-600">CodeB</span> WebCraft Studio
        </h1>
        
        <button
          onClick={() => setShowOptions(!showOptions)}
          className="inline-flex items-center px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-300 transform hover:scale-105 shadow-lg mb-8"
        >
          <span className="text-xl mr-2">🚀</span>
          <span className="text-lg font-medium">Start</span>
        </button>

        {showOptions && (
          <div className="animate-fadeIn space-y-4">
            <div className="flex justify-center gap-4 mb-6">
              <Link
                to="/dashboard"
                className="group px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-blue-500 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="text-xl mr-2">📊</span>
                <span className="font-medium group-hover:text-blue-600">템플릿 관리</span>
                <div className="text-xs text-gray-500 mt-1">대시보드</div>
              </Link>
              
              <Link
                to="/templates"
                className="group px-6 py-3 bg-white border-2 border-gray-300 rounded-lg hover:border-green-500 transition-all duration-300 shadow-sm hover:shadow-md"
              >
                <span className="text-xl mr-2">📝</span>
                <span className="font-medium group-hover:text-green-600">바로 편집하기</span>
                <div className="text-xs text-gray-500 mt-1">템플릿 선택</div>
              </Link>
            </div>

            {recentProjects.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">최근 작업:</h3>
                <div className="space-y-2">
                  {recentProjects.map((project) => (
                    <div key={project.templateId} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">•</span>
                        <span className="font-medium">{project.templateName}</span>
                        <span className="text-sm text-gray-500">({getTimeAgo(project.lastEdited)})</span>
                      </div>
                      <Link
                        to={`/editor/${project.templateId}`}
                        className="text-blue-600 hover:text-blue-700 font-medium hover:underline"
                      >
                        Continue →
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
