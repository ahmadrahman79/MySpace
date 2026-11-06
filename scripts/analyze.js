const fs = require('fs');

function parseSimpleCsv(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const header = parseCsvLine(lines[0]);
  const rows = [];
  let currentLine = '';
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim() && !currentLine) continue;
    currentLine += (currentLine ? '\n' : '') + line;
    const quoteCount = (currentLine.match(/"/g) || []).length;
    if (quoteCount % 2 === 0) {
      const parsed = parseCsvLine(currentLine);
      if (parsed.length >= header.length - 1) {
        const obj = {};
        header.forEach((h, idx) => {
          obj[h.replace(/^\uFEFF/, '').trim()] = parsed[idx] !== undefined ? parsed[idx].trim() : '';
        });
        rows.push(obj);
      }
      currentLine = '';
    }
  }
  return { header: header.map(h => h.replace(/^\uFEFF/, '').trim()), rows };
}

function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i+1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

const tasksData = parseSimpleCsv(fs.readFileSync('extracted_data/DailyTasks/Daily Task Management 2137c205e4c28194a645f2140018944d_all.csv', 'utf8'));
console.log('Task sample with date:', tasksData.rows.slice(0, 5));

const calData = parseSimpleCsv(fs.readFileSync('extracted_data/Kalender/Event And Calendar 2f57c205e4c2800aa7c9c58d01b5d174_New data source 2f57c205e4c280ef8576000b9dc0cec9_all.csv', 'utf8'));
console.log('Cal sample with date:', calData.rows.slice(0, 5));

const noteData = parseSimpleCsv(fs.readFileSync('extracted_data/Note/Notes🤓 2137c205e4c28029872bf32b03c08fe3_all.csv', 'utf8'));
console.log('Note sample:', noteData.rows.slice(0, 5));
