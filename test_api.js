import fetch from 'node-fetch';

(async () => {
  try {
    const res = await fetch('http://localhost:3000/api/generate-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: "FR-A1-002",
        language: "French",
        level: "A1",
        title: "Lesson 2: Daily Life"
      })
    });
    const text = await res.text();
    console.log("Status:", res.status);
    console.log("Body:", text.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
})();
