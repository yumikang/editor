#!/usr/bin/env node

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 파일 경로 설정
const ACTIVE_JSON_PATH = path.join(__dirname, '../../website-texts-active.json');
const ANALYSIS_DATA_PATH = path.join(__dirname, '../app/data/themes');

async function loadAnalysisData() {
  const analysisFiles = await fs.readdir(ANALYSIS_DATA_PATH);
  const analysisData = {};
  
  for (const file of analysisFiles) {
    if (file.endsWith('-analysis.json')) {
      const themeName = file.replace('-analysis.json', '');
      const data = await fs.readFile(path.join(ANALYSIS_DATA_PATH, file), 'utf-8');
      analysisData[themeName] = JSON.parse(data);
    }
  }
  
  return analysisData;
}

async function migrateData() {
  try {
    console.log('🔄 마이그레이션 시작...');
    
    // 1. 현재 데이터 읽기
    const activeData = JSON.parse(await fs.readFile(ACTIVE_JSON_PATH, 'utf-8'));
    console.log('✅ 현재 데이터 로드 완료');
    
    // 2. 백업 생성
    const backupPath = ACTIVE_JSON_PATH.replace('.json', `-backup-${Date.now()}.json`);
    await fs.writeFile(backupPath, JSON.stringify(activeData, null, 2));
    console.log(`✅ 백업 생성: ${backupPath}`);
    
    // 3. 분석 데이터 로드
    const analysisData = await loadAnalysisData();
    console.log('✅ 분석 데이터 로드 완료');
    
    // 4. 마이그레이션 실행
    let migratedCount = 0;
    let missingLocationCount = 0;
    
    // 모든 분석 데이터를 하나로 합치기 (여러 테마의 데이터를 모두 확인)
    const allElements = {};
    Object.values(analysisData).forEach(themeData => {
      if (themeData.elements) {
        Object.entries(themeData.elements).forEach(([section, items]) => {
          if (!allElements[section]) {
            allElements[section] = {};
          }
          Object.assign(allElements[section], items);
        });
      }
    });
    
    // 데이터 마이그레이션
    Object.entries(activeData).forEach(([section, items]) => {
      Object.entries(items).forEach(([key, item]) => {
        // applied 필드가 있지만 location이 없는 경우
        if (item.applied && !item.location) {
          missingLocationCount++;
          
          // 분석 데이터에서 매칭되는 항목 찾기
          const analysisItem = allElements[section]?.[key];
          
          if (analysisItem) {
            // location 정보 추가
            if (analysisItem.selector) {
              item.location = analysisItem.selector;
              item.type = analysisItem.type || 'text';
              item.originalContent = analysisItem.content || '';
              migratedCount++;
              console.log(`  ✅ ${section}.${key}: location 추가됨`);
            }
          } else {
            console.log(`  ⚠️  ${section}.${key}: 분석 데이터에서 찾을 수 없음`);
          }
        }
      });
    });
    
    // 5. 마이그레이션된 데이터 저장
    await fs.writeFile(ACTIVE_JSON_PATH, JSON.stringify(activeData, null, 2));
    console.log('✅ 마이그레이션된 데이터 저장 완료');
    
    // 6. 결과 요약
    console.log('\n📊 마이그레이션 결과:');
    console.log(`  - location 없는 applied 항목: ${missingLocationCount}개`);
    console.log(`  - 마이그레이션 성공: ${migratedCount}개`);
    console.log(`  - 마이그레이션 실패: ${missingLocationCount - migratedCount}개`);
    
    // 7. 검증
    const verifiedData = JSON.parse(await fs.readFile(ACTIVE_JSON_PATH, 'utf-8'));
    let validCount = 0;
    let invalidCount = 0;
    
    Object.entries(verifiedData).forEach(([section, items]) => {
      Object.entries(items).forEach(([key, item]) => {
        if (item.applied) {
          if (item.location) {
            validCount++;
          } else {
            invalidCount++;
            console.log(`  ❌ 여전히 location 없음: ${section}.${key}`);
          }
        }
      });
    });
    
    console.log('\n🔍 검증 결과:');
    console.log(`  - 유효한 항목: ${validCount}개`);
    console.log(`  - 무효한 항목: ${invalidCount}개`);
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 실행
migrateData();