import fetch from 'node-fetch';

async function test() {
  const url = 'https://raw.githubusercontent.com/MashalMath/joschool-11-arabic-exams/Arabic-S1/Math_s1_unit1_L1_exam1.json';
  try {
    const res = await fetch(url);
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (e) {
    console.error(e);
  }
}

test();
