export default async function handler(req, res) {
  // POST 요청만 허용
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { optionA, optionB, emotion } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not set' });
  }

  // Gemini에게 내릴 프롬프트 작성
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
    // Gemini 2.5 Flash API 호출
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { 
          // 응답을 깔끔하게 JSON 객체로 받기 위한 설정
          responseMimeType: "application/json" 
        }
      })
    });

    const data = await response.json();
    
    // Gemini의 텍스트 응답 추출 후 JSON 파싱
    const resultText = data.candidates[0].content.parts[0].text;
    const resultJson = JSON.parse(resultText);

    res.status(200).json(resultJson);
  } catch (error) {
    console.error('Gemini API Error:', error);
    res.status(500).json({ error: 'Failed to generate response' });
  }
}
