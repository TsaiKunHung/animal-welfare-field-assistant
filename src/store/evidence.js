/*
  蒐證用的共用資料 —— F10（拍攝引導）與 F7（照片標籤）吃同一份，避免兩邊各自維護一套。

  設計依據：每個「需要拍照」的蒐證項目，實際到現場並不是拍一張就好，
  而是有一組固定要拍到的角度／部位（例如「拍攝動物全身與特徵」要拍全身、頭部、
  四肢、體態）。系統要把這組角度列出來引導動檢員，拍完再一次做標籤。
  標籤建議也跟著該項目走 —— 拍動物就建議動物身份／健康狀況，拍環境就建議環境／照護狀態。
*/

/* ── 標籤分類（Figma F7「標籤」component set 的 4 個 variant ＋ 未分類） ── */
export const TAG_GROUPS = [
  { key: '動物身份', dot: 'bg-tag-identity' },
  { key: '健康狀況', dot: 'bg-tag-health' },
  { key: '環境', dot: 'bg-tag-env' },
  { key: '照護狀態', dot: 'bg-tag-care' },
]

export const DOT_BY_GROUP = {
  動物身份: 'bg-tag-identity',
  健康狀況: 'bg-tag-health',
  環境: 'bg-tag-env',
  照護狀態: 'bg-tag-care',
  未分類: 'bg-neutral-400',
}

/* 標籤庫（Figma 稿面是貓案，這裡換成本案的米克斯犬情境） */
export const TAG_LIBRARY = {
  動物身份: ['犬·米克斯', '成犬·公', '無頸圈', '有晶片'],
  健康狀況: ['毛髮局部脫落', '精神萎靡', '體態偏瘦', '無明顯外傷'],
  環境: ['陽台鐵籠', '排泄物堆積', '通風不良', '空間不足', '有遮蔽'],
  照護狀態: ['飲水不足', '飼料未補充', '未定期清理'],
}

/* checklist 分組 → F7 的照片分類 */
export const CATEGORY_BY_GROUP = {
  環境紀錄: '環境照片',
  動物狀況: '動物照片',
  飼主資訊: '動物照片',
}

/*
  ── 每個蒐證項目要拍的角度 ──
  shots: 引導清單，動檢員照著一格一格拍；每一格可以拍多張。
  suggest: 拍完進標籤畫面時，優先推薦的標籤（就是這一項最可能用到的）。
*/
export const EVIDENCE_GUIDE = {
  'env-1': {
    shots: [
      { key: 'overall', label: '飼養場所全景', hint: '退到能拍到整個空間的位置，包含地面與牆面' },
      { key: 'cage', label: '籠舍／圍欄整體', hint: '拍出籠舍尺寸與動物可活動範圍' },
      { key: 'shelter', label: '遮蔽與採光', hint: '拍出有無遮陽避雨、日照方向' },
    ],
    suggest: ['陽台鐵籠', '空間不足', '有遮蔽', '通風不良'],
  },
  'env-2': {
    shots: [
      { key: 'floor', label: '地面衛生狀況', hint: '對準排泄物或積水處' },
      { key: 'vent', label: '通風口與開窗', hint: '拍出空氣流通的來源' },
    ],
    suggest: ['排泄物堆積', '通風不良', '未定期清理'],
  },
  'env-3': {
    shots: [
      { key: 'water', label: '飲水容器', hint: '由上往下拍，讓水量看得出來' },
      { key: 'food', label: '食物與飼料', hint: '拍出飼料種類與剩餘量' },
      { key: 'place', label: '供水供食位置', hint: '拍出容器與動物活動範圍的相對位置' },
    ],
    suggest: ['飲水不足', '飼料未補充', '未定期清理'],
  },
  'ani-1': {
    shots: [
      { key: 'full', label: '動物全身側面', hint: '完整入鏡，判斷體型與體態' },
      { key: 'head', label: '頭部與面部特寫', hint: '拍清楚眼、耳、口鼻' },
      { key: 'limb', label: '四肢與尾部', hint: '確認站姿、有無跛行或缺損' },
      { key: 'coat', label: '被毛與體表', hint: '靠近拍毛髮密度與皮膚狀況' },
    ],
    suggest: ['犬·米克斯', '成犬·公', '毛髮局部脫落', '體態偏瘦', '無頸圈'],
  },
  'ani-2': {
    shots: [
      { key: 'posture', label: '動物當下姿態', hint: '拍出趴臥／站立與活動情形' },
      { key: 'react', label: '對呼喚的反應', hint: '呼喚後拍下反應，判斷精神狀態' },
    ],
    suggest: ['精神萎靡', '體態偏瘦'],
  },
  'ani-3': {
    shots: [
      { key: 'wound', label: '可見外傷部位', hint: '有傷口就近拍；沒有也要拍一張佐證' },
      { key: 'skin', label: '皮膚與被毛狀況', hint: '撥開被毛拍皮膚表面' },
    ],
    suggest: ['毛髮局部脫落', '無明顯外傷', '體態偏瘦'],
  },
  'own-1': {
    shots: [{ key: 'doc', label: '飼主證件或聯絡資料', hint: '確認姓名與聯絡方式清晰可辨' }],
    suggest: ['犬·米克斯'],
  },
  'own-2': {
    shots: [
      { key: 'chip', label: '晶片掃描器讀數', hint: '拍到掃描器上的完整號碼' },
      { key: 'animal', label: '被掃描的動物', hint: '證明號碼與這隻動物對應' },
    ],
    suggest: ['有晶片', '犬·米克斯'],
  },
}

/*
  ── 文字紀錄表單 ──
  「記錄／確認」類的蒐證項目不該讓動檢員在現場打一整段字，改成模組化題目：
  radio 單選、checkbox 複選、number 數字、text 填空。
  ai 欄位是「AI 聽到逐字稿對應那一句時會先幫忙填的答案」—— 畫面上顯示紫色，
  動檢員覆核（或自己改）之後才變黑色。系統的定位是 AI 先寫、人做最後審核。
*/
export const RECORD_FORM = {
  'env-2': {
    fields: [
      {
        key: 'shelter',
        type: 'radio',
        label: '遮蔽情形',
        options: ['有遮蔽且完整', '僅局部遮蔽', '無遮蔽'],
      },
      { key: 'vent', type: 'radio', label: '通風情形', options: ['良好', '尚可', '不良'] },
      {
        key: 'hygiene',
        type: 'checkbox',
        label: '衛生狀況（可複選）',
        options: ['排泄物堆積', '地面積水或潮濕', '有明顯異味', '雜物堆積', '尚屬清潔'],
      },
      { key: 'days', type: 'number', label: '推估未清理天數', unit: '天' },
      { key: 'note', type: 'text', label: '補充說明', placeholder: '例如異味來源、堆積位置' },
    ],
    ai: {
      vent: '不良',
      hygiene: ['排泄物堆積', '有明顯異味'],
      note: '地面有排泄物堆積、通風不良，靠近時可聞到明顯異味。',
    },
  },

  'ani-2': {
    fields: [
      { key: 'activity', type: 'radio', label: '活動力', options: ['正常', '偏低', '明顯低落'] },
      {
        key: 'spirit',
        type: 'radio',
        label: '精神狀態',
        options: ['良好', '萎靡', '嗜睡或無反應'],
      },
      {
        key: 'react',
        type: 'checkbox',
        label: '對呼喚的反應（可複選）',
        options: ['會起身走動', '僅抬頭注視', '搖尾或靠近', '完全無反應'],
      },
      { key: 'posture', type: 'radio', label: '主要姿態', options: ['站立', '坐臥', '趴臥不動'] },
      { key: 'note', type: 'text', label: '補充說明', placeholder: '例如觀察時間、環境干擾' },
    ],
    ai: {
      activity: '偏低',
      spirit: '萎靡',
      react: ['完全無反應'],
      posture: '趴臥不動',
      note: '趴著不太動，叫牠也沒什麼反應。',
    },
  },

  'ani-3': {
    fields: [
      {
        key: 'wound',
        type: 'radio',
        label: '是否有可見外傷',
        options: ['無明顯外傷', '有輕微外傷', '有明顯外傷'],
      },
      {
        key: 'symptom',
        type: 'checkbox',
        label: '疾病徵狀（可複選）',
        options: ['毛髮脫落', '皮膚紅腫或結痂', '眼鼻分泌物', '跛行', '明顯消瘦', '未見異常'],
      },
      { key: 'bcs', type: 'number', label: '體態評分 BCS（1–9）', unit: '分' },
      { key: 'note', type: 'text', label: '補充說明', placeholder: '例如部位、範圍' },
    ],
    ai: {},
  },

  'own-1': {
    fields: [
      {
        key: 'identity',
        type: 'radio',
        label: '身分確認方式',
        options: ['證件核對', '口頭陳述', '無法確認'],
      },
      { key: 'onsite', type: 'radio', label: '飼主是否在場', options: ['在場', '未在場'] },
      {
        key: 'attitude',
        type: 'checkbox',
        label: '配合情形（可複選）',
        options: ['配合稽查', '同意受檢', '情緒激動', '拒絕溝通'],
      },
      { key: 'phone', type: 'text', label: '聯絡電話', placeholder: '09XX-XXX-XXX' },
    ],
    ai: {},
  },

  'own-2': {
    fields: [
      {
        key: 'scan',
        type: 'radio',
        label: '晶片掃描結果',
        options: ['掃描成功', '掃描不到訊號', '未植入晶片'],
      },
      { key: 'chip', type: 'text', label: '晶片號碼', placeholder: '15 碼數字' },
      {
        key: 'registry',
        type: 'radio',
        label: '寵物登記比對',
        options: ['查得登記資料', '查無登記資料', '尚未比對'],
      },
      { key: 'note', type: 'text', label: '補充說明' },
    ],
    ai: { scan: '掃描成功', chip: '900115000530794', registry: '尚未比對' },
  },
}

export const recordFormFor = (checklistId) =>
  RECORD_FORM[checklistId] ?? {
    fields: [
      {
        key: 'result',
        type: 'radio',
        label: '查核結果',
        options: ['符合', '部分符合', '不符合'],
      },
      { key: 'note', type: 'text', label: '紀錄內容' },
    ],
    ai: {},
  }

/*
  ── 建議處置方式 / 優良飼養範例 ──
  文字紀錄彈窗右下角那顆按鈕開啟的內容。用途不是給動檢員看的，是**給飼主看的**：
  現場直接把平板轉過去，讓飼主看到「正確做法長什麼樣子」，比口頭勸導有效。
  動檢員也可以列印一張帶 QR 的飼養建議單留給飼主，QR 連到動保網的飼養指南。
*/
export const CARE_GUIDE_URL = 'https://animal.moa.gov.tw/care-guide'

export const CARE_GUIDE = {
  'env-2': {
    title: '飼養環境的清潔與通風',
    lead: '排泄物堆積與通風不良會直接造成皮膚病與呼吸道疾病，也是動保法第 5 條的稽查重點。',
    good: [
      '每日至少清理一次排泄物，地面保持乾燥',
      '飼養空間需有對流，避免密閉陽台或加蓋鐵皮',
      '睡臥區與排泄區分開，睡臥處鋪設可清洗墊材',
      '定期以寵物可用消毒劑清潔地面與器具',
    ],
    bad: ['排泄物累積數日未清', '空間密閉、僅靠單一小窗', '睡覺與排泄在同一區'],
    law: '動保法第 5 條第 2 項：應提供安全、乾淨、通風、排水、適當及適量之遮蔽、照明與溫度之生活環境。',
  },
  'env-3': {
    title: '飲水與食物的正確供給',
    lead: '「二十四小時充足、乾淨之飲水」是法定義務，不是建議事項。',
    good: [
      '飲水需 24 小時不間斷供應，每日換水並清洗水盆',
      '水盆使用不易打翻的重底容器，或固定於籠邊',
      '依體型與年齡定量餵食，剩食當日清除',
      '夏季增加供水點，避免曝曬處放置',
    ],
    bad: ['水盆長期見底或水質混濁', '飼料直接倒在地面', '以剩菜剩飯替代飼料'],
    law: '動保法第 5 條第 2 項：應提供適當、乾淨且無害之食物及二十四小時充足、乾淨之飲水。',
  },
  'ani-2': {
    title: '日常健康觀察與活動需求',
    lead: '精神與活動力下降通常是疾病或飼養環境不當的第一個訊號。',
    good: [
      '每日觀察食慾、飲水量、排泄與活動情形',
      '籠飼者每日提供充分的籠外活動時間',
      '發現精神萎靡、拒食超過一天應就醫',
      '定期驅蟲與預防注射，保留就醫紀錄',
    ],
    bad: ['長期關籠不放風', '以「牠只是懶」帶過異常', '未定期健康檢查'],
    law: '動保法第 5 條第 2 項第 5 款：以籠子飼養寵物者，籠內空間應足供寵物充分伸展，並應提供充分之籠外活動時間。',
  },
  'ani-3': {
    title: '外傷與皮膚問題的處理',
    lead: '皮膚病與外傷放著不處理會快速惡化，也可能構成未提供必要防治。',
    good: [
      '發現傷口、脫毛、紅腫應儘速就醫，勿自行用藥',
      '保持患部乾燥清潔，避免動物持續舔咬',
      '同住動物一併檢查，避免交叉感染',
      '依獸醫指示完成療程，勿症狀稍緩即停藥',
    ],
    bad: ['以人用藥膏塗抹', '等傷口自己好', '只處理一隻、其他不管'],
    law: '動保法第 5 條第 2 項第 3 款：應提供法定動物傳染病之必要防治。',
  },
  'own-1': {
    title: '飼主的法定責任',
    lead: '飼主身分一經確認，動保法上的義務即隨之而來。',
    good: [
      '犬貓出生四個月內完成寵物登記並植入晶片',
      '每年完成狂犬病疫苗注射',
      '變更地址、聯絡方式或轉讓時辦理變更登記',
      '不得棄養；無力飼養應交由收容處所處理',
    ],
    bad: ['未辦理寵物登記', '疫苗過期未補打', '直接把動物丟在收容所門口'],
    law: '動保法第 5 條第 3 項：飼主飼養之動物，除得交送動物收容處所…外，不得棄養。',
  },
  'own-2': {
    title: '寵物登記與晶片',
    lead: '晶片是動物走失後找回來的唯一憑據，登記資料過期等於沒有登記。',
    good: [
      '犬貓四個月齡前完成植入晶片與寵物登記',
      '搬家或換電話後主動更新登記資料',
      '轉讓、死亡、走失都應辦理變更或註銷',
      '可於寵物登記管理資訊網自行查詢與更新',
    ],
    bad: ['有植入晶片但沒登記', '登記電話已停用', '轉讓後沒過戶'],
    law: '動保法第 19 條：中央主管機關指定公告之寵物，其飼主應向直轄市、縣（市）主管機關辦理登記。',
  },
}

export const careGuideFor = (checklistId) =>
  CARE_GUIDE[checklistId] ?? {
    title: '飼主基本照護責任',
    lead: '以下為動保法對飼主的基本要求，可現場向飼主說明。',
    good: [
      '提供乾淨食物與 24 小時充足飲水',
      '提供安全、通風、可遮蔽的生活環境',
      '完成寵物登記與法定疫苗',
      '避免動物遭受騷擾、虐待或傷害',
    ],
    bad: [],
    law: '動保法第 5 條：飼主對於其管領之動物應依規定辦理。',
  }

/* 沒有對應設定的臨時項目：給一組通用角度 */
export const DEFAULT_GUIDE = {
  shots: [
    { key: 'wide', label: '整體情形', hint: '先拍一張看得出前後脈絡的全景' },
    { key: 'close', label: '重點特寫', hint: '再靠近拍要佐證的細節' },
  ],
  suggest: [],
}

export const guideFor = (checklistId) => EVIDENCE_GUIDE[checklistId] ?? DEFAULT_GUIDE

/** 依 checklist 項目算出標籤建議：先放該項目的推薦，再補齊該分類其餘標籤 */
export function suggestedTags(checklistItem) {
  const guide = guideFor(checklistItem?.id)
  const groupOf = (label) =>
    TAG_GROUPS.find((g) => TAG_LIBRARY[g.key].includes(label))?.key ?? '未分類'
  return guide.suggest.map((label) => ({ label, group: groupOf(label) }))
}
