// LE.txt lugemine mällu
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser"); // vajalik csv lugemiseks ja js objektideks tegemiseks

const DATA_FILE = path.join(__dirname, "LE.txt"); // vajalik, et näidata, kus LE.txt asub ehk server.js-ga samas kaustas
let parts = []; // array, kuhu importida info LE.txt dokumendist

// Funktsioon andmete lugemiseks 
function loadData() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(DATA_FILE)
      .pipe(csv({ separator: '"' })) // eraldi andmed jutumärkides
      .on("data", (row) => {
        results.push(row);
      })
      .on("end", () => {
        parts = results;
        console.log(`Laetud ${parts.length} varuosa mällu.`);
        resolve();
      })
      .on("error", reject);
  });
}

// Laadimine lehe käivitamisel
loadData().catch((err) => {
  console.error("Viga faili lugemisel:", err);
});
