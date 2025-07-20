import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useSubmit, useFetcher, Link, useSearchParams } from "@remix-run/react";
import { useState, useEffect } from "react";
import * as path from "path";
import * as fs from "fs/promises";
import { ThemeInitializer } from "~/utils/theme-initializer";

interface FontConfig {
  id: string;
  name: string;
  fontFamily: string;
  webfontCode: string;
  active: boolean;
}

interface FontAssignments {
  h1?: string;
  h2?: string;
  h3?: string;
  h4?: string;
  h5?: string;
  h6?: string;
  body?: string;
  button?: string;
  input?: string;
}

interface StyleConfig {
  fonts: FontConfig[];
  fontAssignments?: FontAssignments;
  customCSS?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const theme = url.searchParams.get('theme') || 'agency-redox';
  
  // 테마 초기화 (필요한 파일들이 없으면 자동 생성)
  const themesPath = path.join(process.cwd(), '../themes');
  const initializer = new ThemeInitializer(themesPath);
  await initializer.initializeTheme(theme);
  
  const styleConfigPath = path.join(process.cwd(), `../themes/${theme}/style-config.json`);
  
  let styleConfig: StyleConfig = {
    fonts: [],
    fontAssignments: {},
    customCSS: ""
  };

  try {
    const data = await fs.readFile(styleConfigPath, 'utf-8');
    styleConfig = JSON.parse(data);
    // fontAssignments가 없으면 빈 객체로 초기화
    if (!styleConfig.fontAssignments) {
      styleConfig.fontAssignments = {};
    }
  } catch {
    // 파일이 없으면 기본값 사용
  }

  return json({ styleConfig, theme });
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const action = formData.get("action") as string;
  const theme = formData.get("theme") as string || 'agency-redox';
  
  const styleConfigPath = path.join(process.cwd(), `../themes/${theme}/style-config.json`);

  let styleConfig: StyleConfig = {
    fonts: [],
    fontAssignments: {},
    customCSS: ""
  };

  try {
    const data = await fs.readFile(styleConfigPath, 'utf-8');
    styleConfig = JSON.parse(data);
    // fontAssignments가 없으면 빈 객체로 초기화
    if (!styleConfig.fontAssignments) {
      styleConfig.fontAssignments = {};
    }
  } catch {
    // 파일이 없으면 기본값 사용
  }

  if (action === "addFont") {
    const fontData = {
      id: `font_${Date.now()}`,
      name: formData.get("name") as string,
      fontFamily: formData.get("fontFamily") as string,
      webfontCode: formData.get("webfontCode") as string,
      active: true
    };

    styleConfig.fonts.push(fontData);
  } else if (action === "toggleFont") {
    const fontId = formData.get("fontId") as string;
    const font = styleConfig.fonts.find(f => f.id === fontId);
    if (font) {
      font.active = !font.active;
    }
  } else if (action === "deleteFont") {
    const fontId = formData.get("fontId") as string;
    styleConfig.fonts = styleConfig.fonts.filter(f => f.id !== fontId);
  } else if (action === "updateFont") {
    const fontId = formData.get("fontId") as string;
    const font = styleConfig.fonts.find(f => f.id === fontId);
    if (font) {
      font.name = formData.get("name") as string || font.name;
      font.fontFamily = formData.get("fontFamily") as string || font.fontFamily;
      font.webfontCode = formData.get("webfontCode") as string || font.webfontCode;
    }
  } else if (action === "updateFontAssignments") {
    const assignments = JSON.parse(formData.get("assignments") as string);
    styleConfig.fontAssignments = assignments;
  } else if (action === "updateCustomCSS") {
    styleConfig.customCSS = formData.get("customCSS") as string;
  }

  // 저장
  await fs.writeFile(styleConfigPath, JSON.stringify(styleConfig, null, 2));
  
  // CSS 파일 생성
  await generateCSSFile(styleConfig, theme);

  return json({ success: true });
}

async function generateCSSFile(styleConfig: StyleConfig, theme: string) {
  let css = "/* 자동 생성된 스타일 시트 */\n\n";

  // 웹폰트 코드 추가
  styleConfig.fonts.forEach(font => {
    if (font.active && font.webfontCode) {
      css += `/* ${font.name} */\n${font.webfontCode}\n\n`;
    }
  });

  // 영역별 폰트 적용
  if (styleConfig.fontAssignments) {
    Object.entries(styleConfig.fontAssignments).forEach(([element, fontFamily]) => {
      if (fontFamily) {
        if (element === 'body') {
          css += `body {
  font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
}\n\n`;
        } else if (element === 'button') {
          css += `button, .btn, input[type="submit"], input[type="button"] {
  font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
}\n\n`;
        } else if (element === 'input') {
          css += `input, textarea, select {
  font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
}\n\n`;
        } else {
          css += `${element} {
  font-family: '${fontFamily}', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
}\n\n`;
        }
      }
    });
  }

  // 커스텀 CSS 추가
  if (styleConfig.customCSS) {
    css += `/* 커스텀 CSS */\n${styleConfig.customCSS}\n`;
  }

  // 파일 저장
  const cssPath = path.join(process.cwd(), `../themes/${theme}/custom-styles.css`);
  await fs.writeFile(cssPath, css);
}

export default function StyleGuide() {
  const { styleConfig, theme } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const submit = useSubmit();
  const fetcher = useFetcher();
  
  const [showAddFont, setShowAddFont] = useState(false);
  const [editingFont, setEditingFont] = useState<string | null>(null);
  const [fontForm, setFontForm] = useState({
    name: "",
    fontFamily: "",
    webfontCode: ""
  });
  const [customCSS, setCustomCSS] = useState(styleConfig.customCSS || "");
  const [fontAssignments, setFontAssignments] = useState<FontAssignments>(() => {
    const assignments = styleConfig.fontAssignments || {};
    // 각 키가 문자열이거나 빈 문자열인지 확인
    const cleanAssignments: FontAssignments = {};
    Object.keys(assignments).forEach(key => {
      const value = assignments[key as keyof FontAssignments];
      if (typeof value === 'string') {
        cleanAssignments[key as keyof FontAssignments] = value;
      }
    });
    return cleanAssignments;
  });
  const [isMounted, setIsMounted] = useState(false);

  // 클라이언트 사이드에서만 실행
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // fetcher 응답 처리
  useEffect(() => {
    if (fetcher.data?.success) {
      alert("스타일이 성공적으로 적용되었습니다!");
    }
  }, [fetcher.data]);

  const handleAddFont = () => {
    const formData = new FormData();
    formData.append("action", "addFont");
    formData.append("theme", theme);
    Object.entries(fontForm).forEach(([key, value]) => {
      formData.append(key, value);
    });
    fetcher.submit(formData, { method: "post" });
    setShowAddFont(false);
    setFontForm({
      name: "",
      fontFamily: "",
      webfontCode: ""
    });
  };

  const handleToggleFont = (fontId: string) => {
    const formData = new FormData();
    formData.append("action", "toggleFont");
    formData.append("fontId", fontId);
    formData.append("theme", theme);
    fetcher.submit(formData, { method: "post" });
  };

  const handleDeleteFont = (fontId: string) => {
    if (confirm("이 폰트를 삭제하시겠습니까?")) {
      const formData = new FormData();
      formData.append("action", "deleteFont");
      formData.append("fontId", fontId);
      formData.append("theme", theme);
      fetcher.submit(formData, { method: "post" });
    }
  };

  const handleSaveFontAssignments = () => {
    const formData = new FormData();
    formData.append("action", "updateFontAssignments");
    formData.append("assignments", JSON.stringify(fontAssignments));
    formData.append("theme", theme);
    fetcher.submit(formData, { method: "post" });
  };

  const handleSaveCustomCSS = () => {
    const formData = new FormData();
    formData.append("action", "updateCustomCSS");
    formData.append("customCSS", customCSS);
    formData.append("theme", theme);
    fetcher.submit(formData, { method: "post" });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">스타일 가이드 - {theme}</h1>
          <Link
            to={`/editor?theme=${theme}`}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
          >
            ← 웹사이트 에디터로 돌아가기
          </Link>
        </div>
        
        {/* 폰트 관리 섹션 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">폰트 관리</h2>
            <button
              onClick={() => setShowAddFont(true)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              폰트 추가
            </button>
          </div>

          {/* 폰트 추가 폼 */}
          {showAddFont && (
            <div className="mb-6 p-4 border rounded-lg bg-gray-50">
              <h3 className="font-medium mb-4">새 폰트 추가</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">폰트 이름</label>
                  <input
                    type="text"
                    value={fontForm.name}
                    onChange={(e) => setFontForm({...fontForm, name: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="예: Cafe24 프라우드"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">font-family 이름</label>
                  <input
                    type="text"
                    value={fontForm.fontFamily}
                    onChange={(e) => setFontForm({...fontForm, fontFamily: e.target.value})}
                    className="w-full p-2 border rounded"
                    placeholder="예: Cafe24PROUP"
                  />
                  <p className="text-xs text-gray-500 mt-1">CSS에서 사용할 font-family 이름</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">웹폰트 코드</label>
                  <textarea
                    value={fontForm.webfontCode}
                    onChange={(e) => setFontForm({...fontForm, webfontCode: e.target.value})}
                    className="w-full h-32 p-2 border rounded font-mono text-sm"
                    placeholder={`@font-face {
  font-family: 'Cafe24PROUP';
  src: url('https://fastly.jsdelivr.net/gh/projectnoonnu/2507-1@1.0/Cafe24PROUP.woff2') format('woff2');
  font-weight: normal;
  font-style: normal;
}`}
                  />
                  <p className="text-xs text-gray-500 mt-1">@font-face 코드를 붙여넣으세요</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  onClick={handleAddFont}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  추가
                </button>
                <button
                  onClick={() => setShowAddFont(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-50"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* 폰트 목록 */}
          <div className="space-y-4">
            {styleConfig.fonts.map((font) => (
              <div key={font.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium">{font.name}</h3>
                      <button
                        onClick={() => handleToggleFont(font.id)}
                        className={`px-2 py-1 text-xs rounded ${
                          font.active
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-600"
                        }`}
                      >
                        {font.active ? "활성" : "비활성"}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600">font-family: {font.fontFamily}</p>
                    
                    {/* 미리보기 */}
                    {font.active && isMounted && (
                      <div 
                        className="mt-3 p-3 border rounded bg-gray-50"
                        style={{ fontFamily: `'${font.fontFamily}'` }}
                      >
                        <p>가나다라마바사 ABCDEFG 1234567890</p>
                        <p className="text-2xl">안녕하세요! Hello World!</p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleDeleteFont(font.id)}
                      className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 영역별 폰트 적용 섹션 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">영역별 폰트 적용</h2>
            <button
              onClick={handleSaveFontAssignments}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              저장 및 적용
            </button>
          </div>
          
          {styleConfig.fonts.filter(f => f.active).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>활성화된 폰트가 없습니다.</p>
              <p className="text-sm mt-2">먼저 폰트를 추가하고 활성화하세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "H1 (제목 1)", key: "h1" },
                { label: "H2 (제목 2)", key: "h2" },
                { label: "H3 (제목 3)", key: "h3" },
                { label: "H4 (제목 4)", key: "h4" },
                { label: "H5 (제목 5)", key: "h5" },
                { label: "H6 (제목 6)", key: "h6" },
                { label: "본문 (Body)", key: "body" },
                { label: "버튼 (Button)", key: "button" },
                { label: "입력 필드 (Input)", key: "input" }
              ].map(({ label, key }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1">{label}</label>
                <select
                  value={fontAssignments[key as keyof FontAssignments] || ""}
                  onChange={(e) => {
                    console.log('Select changed:', key, e.target.value);
                    setFontAssignments({
                      ...fontAssignments,
                      [key]: e.target.value
                    });
                  }}
                  className="w-full p-2 border rounded cursor-pointer"
                  style={{ minHeight: '40px' }}
                >
                  <option value="">기본 폰트</option>
                  {styleConfig.fonts && styleConfig.fonts
                    .filter(font => font.active)
                    .map(font => (
                      <option key={font.id} value={font.fontFamily}>
                        {font.name} ({font.fontFamily})
                      </option>
                    ))
                  }
                </select>
              </div>
            ))}
            </div>
          )}
        </div>

        {/* 커스텀 CSS 섹션 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">커스텀 CSS</h2>
          <p className="text-sm text-gray-600 mb-4">
            웹사이트 전체에 적용될 추가 CSS를 입력하세요.
          </p>
          <textarea
            value={customCSS}
            onChange={(e) => setCustomCSS(e.target.value)}
            className="w-full h-64 p-4 border rounded font-mono text-sm"
            placeholder={`/* 예시 */
.custom-heading {
  font-family: var(--secondary-font);
  font-size: 2.5rem;
  color: #333;
}`}
          />
          <div className="mt-4">
            <button
              onClick={handleSaveCustomCSS}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              CSS 저장 및 적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}