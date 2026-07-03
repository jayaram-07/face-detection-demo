const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*<>[]{}';
let text = "REAL-TIME FACE DETECTION";
let iteration = 0;

for (let i = 0; i < 100; i++) {
  let result = text
    .split('')
    .map((char, index) => {
      if (char === ' ') return ' ';
      if (index < iteration) {
        return text[index];
      }
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    })
    .join('');
  
  if (iteration >= text.length) {
    console.log("Finished at iteration", iteration, "result:", result);
    break;
  }
  iteration += 1 / 3;
}
