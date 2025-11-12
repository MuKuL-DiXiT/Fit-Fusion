import { NextResponse } from 'next/server';

// Mock data for food nutrition
const mockFoodData = {
  '1 cup of rice': {
    calories: 205,
    protein: 4.3,
    carbs: 45,
    fat: 0.4,
  },
  '100g of chicken breast': {
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
  },
  '1 apple': {
    calories: 95,
    protein: 0.5,
    carbs: 25,
    fat: 0.3,
  },
};

// Mock data for exercise calories
const mockExerciseData = {
  '30 minutes of running': {
    calories: 300,
  },
  '1 hour of weightlifting': {
    calories: 250,
  },
  '30 minutes of swimming': {
    calories: 200,
  },
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const query = searchParams.get('query');

  if (!type || !query) {
    return NextResponse.json({ error: 'Missing type or query parameter' }, { status: 400 });
  }

  if (type === 'food') {
  // @ts-expect-error allow dynamic lookup on mock data
    const data = mockFoodData[query.toLowerCase()] || {
      calories: Math.floor(Math.random() * 300) + 50,
      protein: Math.floor(Math.random() * 30),
      carbs: Math.floor(Math.random() * 50),
      fat: Math.floor(Math.random() * 20),
    };
    return NextResponse.json(data);
  }

  if (type === 'exercise') {
  // @ts-expect-error allow dynamic lookup on mock data
    const data = mockExerciseData[query.toLowerCase()] || {
      calories: Math.floor(Math.random() * 400) + 100,
    };
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Invalid type parameter' }, { status: 400 });
}
