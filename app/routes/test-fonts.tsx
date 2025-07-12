import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import * as path from "path";
import * as fs from "fs/promises";

const STYLE_CONFIG_PATH = path.join(process.cwd(), "../style-config.json");

export async function loader() {
  let styleConfig = { fonts: [], fontAssignments: {} };
  
  try {
    const data = await fs.readFile(STYLE_CONFIG_PATH, 'utf-8');
    styleConfig = JSON.parse(data);
  } catch {
    // 파일이 없으면 기본값
  }
  
  return json({ styleConfig });
}

export default function TestFonts() {
  const { styleConfig } = useLoaderData<typeof loader>();
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">폰트 테스트 페이지</h1>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">현재 등록된 폰트</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(styleConfig.fonts, null, 2)}
        </pre>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">영역별 폰트 설정</h2>
        <pre className="bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(styleConfig.fontAssignments, null, 2)}
        </pre>
      </div>
      
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-2">활성 폰트 목록</h2>
        <ul className="list-disc list-inside">
          {styleConfig.fonts
            .filter((font: any) => font.active)
            .map((font: any) => (
              <li key={font.id}>
                {font.name} (font-family: {font.fontFamily})
              </li>
            ))
          }
        </ul>
      </div>
    </div>
  );
}