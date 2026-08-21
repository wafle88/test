# DEJAVU 카드 인쇄 튜닝 노트

IDP SMART-51 카드 프린터(macOS) 로 인쇄할 때 어떤 값이 어디에 걸려 있는지, 결과가 이상할 때 어느 방향으로 조정할지 정리.

## 현재 설정 값 (2026-08-21)

### `src/main.js` — CUPS / lp 옵션

```js
const CARD_PRINTER_NAME = 'IDP_SMART_51_Printer_2';
const CARD_COLOR_MODEL = 'Premium';           // → cardprinter51_p.icm (PPD 매핑)
const CARD_RESIN_EXTRACTION = 'NotUse';       // K resin 패널 사용 안 함
const CARD_SMART_MODE = 'Standard';           // 처리 파이프라인
const CARD_DITHERING = 'Halftone';            // 픽셀 배치 알고리즘

// app.commandLine.appendSwitch
'force-color-profile', 'srgb'                 // Chromium 소스 색공간 강제
```

실행되는 명령:
```bash
lp -d IDP_SMART_51_Printer_2 \
   -o ColorModel=Premium \
   -o SmartResinExtraction=NotUse \
   -o SmartMode=Standard \
   -o SmartDithering=Halftone \
   -t dejavu-card
```
(PDF 는 stdin 으로 전달)

### `src/views/Step04.vue` — 소스 이미지 톤 보정

```js
const PRINT_GAMMA = 0.92;      // 미드톤 살짝 들어올림 (1 미만 = 밝게)
const PRINT_CONTRAST = 0.85;   // 톤 범위 압축 (1 미만 = 부드럽게)
```

LUT 공식:
```js
gammaCorrected  = 255 * (i / 255) ** PRINT_GAMMA
contrastAdjusted = (gammaCorrected - 128) * PRINT_CONTRAST + 128
lut[i] = clamp(contrastAdjusted, 0, 255)
```

## 각 설정이 뭘 하는지

### CUPS/lp 옵션

| 옵션 | 역할 |
|---|---|
| `ColorModel=Premium` | PPD 매핑을 통해 `cardprinter51_p.icm` (Premium 리본용 ICC) 적용. Premium/Standard 두 프로파일이 실질적으론 큰 차이 없음. |
| `SmartResinExtraction=NotUse` | **가장 중요**. K resin 패널 사용 안 함 → 사진 어두운 부분에 K 가 무차별 오버프린트되는 문제 해결. 대신 텍스트 검정 선명도 약간 감소. |
| `SmartMode=Standard` | Partial(기본) 대신 Standard 파이프라인. 눈에 띄는 차이는 없었음. |
| `SmartDithering=Halftone` | Diffusion(기본) 대신 Halftone. 이론상 픽셀 패턴이 다르지만 실제로 큰 차이 안 남. |

### 소스 이미지 보정 (Step04 canvas)

| 상수 | 역할 |
|---|---|
| `PRINT_GAMMA=0.92` | 프린터가 소스보다 어둡게 뽑는 걸 살짝 보상. 미드톤/섀도우가 살짝 밝아짐. |
| `PRINT_CONTRAST=0.85` | 프린터가 대비를 강하게 뽑는 걸 미리 압축해서 완충. 원본의 부드러운 톤 보존. |

### Chromium

| 스위치 | 역할 |
|---|---|
| `force-color-profile=srgb` | M4 맥의 Display P3 화면에서 Chromium 이 P3 로 렌더링 → sRGB 가정한 ICC 와 색공간 불일치 발생. sRGB 로 강제해서 매칭. |

## 증상별 튜닝 방향

| 증상 | 조정 |
|---|---|
| **전체적으로 어둡다** | `PRINT_GAMMA` 낮춤 (0.90 → 0.85) |
| **색이 날아간다 / 채도 낮음** | `PRINT_CONTRAST` 올림 (0.85 → 0.90) / `PRINT_GAMMA` 올림 (0.92 → 0.95) |
| **대비가 너무 강하다** | `PRINT_CONTRAST` 낮춤 (0.85 → 0.80) |
| **검정이 시커멓게 튄다** | `SmartResinExtraction=NotUse` 유지 (이미 적용됨), 그래도 심하면 `SmartBlack=-20~-40` 추가 |
| **텍스트가 흐리다** | `SmartResinExtraction=BlackDots` + `SmartResinLevel=30~50` (K 를 텍스트에만 약하게) |
| **특정 채널만 튄다** (얼굴 붉음 등) | `SmartYellow/Magenta/Cyan/Black=-30~30` 개별 조정 |

## 검토해봤지만 효과 없거나 안 쓰는 것들

- **`ColorModel=Standard`** — Premium 과 실질적 차이 미미
- **`SmartMode=Partial` vs `Standard`** — 사진 콘텐츠엔 차이 안 남
- **`SmartDithering` 변경** — 이 프린터에선 시각적 차이 크지 않음
- **`cardprinter51_p2.icm`** — PPD 에 매핑 안 돼 있어서 `-o ColorModel` 로는 못 부름 (PPD 편집 필요)

## 프린터 파일 위치 참고

```
/Library/Printers/IDP/
├── cardprinter51_p.icm      ← 현재 사용 (Premium ICC)
├── cardprinter51_s.icm      ← Standard ICC
├── cardprinter51_p2.icm     ← PPD 매핑 안 됨
└── cardprinter_smart51_[ps]_[0-9].prn   ← 프린터 커맨드 블롭 (자동 로드)

/usr/libexec/cups/filter/
├── rastertosmart51          ← CUPS 필터
└── commandtosmart51

/etc/cups/ppd/IDP_SMART_51_Printer_2.ppd   ← 옵션 매핑 테이블
```

## 검증 방법

인쇄 후 job 에 옵션이 실제로 적용됐는지 확인:

```bash
LATEST=$(lpstat -W all -o IDP_SMART_51_Printer_2 | tail -1 | awk -F'-' '{print $NF}' | awk '{print $1}')
cat > /tmp/getjob.test << 'EOF'
{
  OPERATION Get-Job-Attributes
  GROUP operation-attributes-tag
  ATTR charset attributes-charset utf-8
  ATTR language attributes-natural-language en
  ATTR uri printer-uri $uri
  ATTR integer job-id $job-id
  ATTR keyword requested-attributes all
  STATUS successful-ok
}
EOF
ipptool -tv "ipp://localhost:631/printers/IDP_SMART_51_Printer_2" \
  -d job-id=$LATEST /tmp/getjob.test | grep -iE 'Smart|Color|Resin'
```

## 테스트 인쇄

`App.vue` dev-nav (우측 하단) 의 버튼:
- **T1** — `test-profile.png` (스튜디오 인물, 밝고 부드러운 톤)
- **T2** — `test-sports.png` (스포츠 사진, 강한 빨강 + 대비)

버튼 눌러서 카메라 촬영 스킵하고 곧바로 Step04 로 점프 → 마스킹 + 인쇄 파이프라인 그대로 실행.

## 관련 이슈

- **`watermark.bmp` 경고**: 드라이버가 `/Users/waffle_m4/watermark.bmp` 를 찾다 실패. 인쇄 결과엔 영향 없음. 신경 쓰이면 `lpoptions -p IDP_SMART_51_Printer_2 -l | grep -i water` 로 옵션 찾아서 끄면 됨.
- **리본 정보**: SS-IDDC-P-YMCKO (Premium 등급). ColorModel=Premium 과 매칭됨.
