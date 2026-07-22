export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { optionA, optionB, emotion } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY가 설정되지 않았습니다. Vercel 환경변수를 확인해주세요.' });
  }

  const prompt = `사용자가 두 가지 선택을 두고 고민하고 있습니다.
  - 선택지 A: ${optionA}
  - 선택지 B: ${optionB}
  - 현재 사용자의 감정 및 상황: ${emotion}

  사용자의 감정과 상황에 깊이 공감하는 따뜻한 멘토의 톤으로, 두 선택지 중 현재 상황에 가장 알맞은 하나를 선택하고 그 이유를 설명해주세요.
  
  반드시 아래의 JSON 구조로만 응답해주세요. 마크다운(\`\`\`json 등)은 포함하지 마세요.
  {
    "choice": "A와 B 중 선택한 항목의 내용",
    "reason": "선택한 이유에 대한 따뜻한 조언과 설명"
  }`;

  try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          responseMimeType: "application/json" 
        }
      })
    });

    const data = await response.json();
    
    // 🔥 추가된 에러 방어 로직: API가 정상(200)이 아니면 상세 에러를 로그에 출력합니다.
    if (!response.ok) {
      console.error("Gemini API Error Details:", JSON.stringify(data, null, 2));
      return res.status(500).json({ error: 'Gemini API 호출 중 문제가 발생했습니다.', details: data });
    }

    const resultText = data.candidates[0].content.parts[0].text;
    const resultJson = JSON.parse(resultText);

    res.status(200).json(resultJson);
  } catch (error) {
    console.error('Server Logic Error:', error);
    res.status(500).json({ error: '서버 로직 처리 중 에러가 발생했습니다.', message: error.message });
  }
}
