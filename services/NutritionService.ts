const GROQ_API_KEY = process.env.EXPO_PUBLIC_GROQ_API_KEY;

export interface NutritionResult {
    food_name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    confidence: 'high' | 'medium' | 'low';
    portion_size: string;
}

export async function analyzeFood(base64Image: string): Promise<NutritionResult> {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${GROQ_API_KEY}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            model: 'meta-llama/llama-4-scout-17b-16e-instruct',
            messages: [
                {
                    role: 'user',
                    content: [
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:image/jpeg;base64,${base64Image}`,
                            },
                        },
                        {
                            type: 'text',
                            text: `You are a nutrition expert. Analyze this food image and return ONLY a valid JSON object with no extra text, no markdown, no code blocks. Just raw JSON like this:
{"food_name":"Chicken Rice Bowl","calories":520,"protein_g":35,"carbs_g":58,"fat_g":12,"confidence":"high","portion_size":"1 medium bowl (350g)"}

Estimate conservatively. If multiple foods are visible, give totals for everything on the plate.`,
                        },
                    ],
                },
            ],
            max_tokens: 200,
        }),
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content.trim();
    const cleaned = content.replace(/```json|```/g, '').trim();
    const result = JSON.parse(cleaned);
    return result as NutritionResult;
}