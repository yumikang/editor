import type { MetaFunction } from "@remix-run/node";
import { Link } from "@remix-run/react";

export const meta: MetaFunction = () => {
  return [
    { title: "웹사이트 텍스트 에디터" },
    { name: "description", content: "웹사이트 텍스트를 편집하는 도구" },
  ];
};

export default function Index() {
  return (
    <div className="flex items-center justify-center h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">웹사이트 텍스트 에디터</h1>
        <p className="text-gray-600 mb-8">웹사이트의 텍스트를 쉽게 편집하고 관리하세요</p>
        
        <div className="space-y-4">
          <Link
            to="/templates"
            className="inline-block px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors mr-4"
          >
            템플릿 관리
          </Link>
          <Link
            to="/editor"
            className="inline-block px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            에디터 시작하기
          </Link>
        </div>
      </div>
    </div>
  );
}
