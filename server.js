// LE.txt lugemine mällu
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser"); // vajalik csv lugemiseks ja js objektideks tegemiseks
const express = require("express"); // express serveri jaoks

const DATA_FILE = path.join(__dirname, "LE.txt"); // vajalik, et näidata, kus LE.txt asub ehk server.js-ga samas kaustas
let parts = []; // array, kuhu importida info LE.txt dokumendist

// Funktsioon andmete lugemiseks 
async function loadData() {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(DATA_FILE)
      .pipe(csv({ 
        separator: '\t',
        headers: ['seerianumber','toote_nimi','laoj22k1','laoj22k2','laoj22k3','laoj22k4','laoj22k5','col8','hind','kommentaar','hind_koos_km']
       })) // eraldi andmed jutumärkides
      .on("data", (row) => {
        // 9. veerg – hind
        const val9 = row.hind;
        if (val9 !== undefined && val9 !== null && val9 !== "") {
          row.hind = parseFloat(val9.replace(",", ".")); // teisenda arvuks
        } else {
          row.hind = val9; // säilita originaal
        }

        // 11. veerg – hind koos km
        const val11 = row.hind_koos_km;
        if (val11 !== undefined && val11 !== null && val11 !== "") {
          row.hind_koos_km = parseFloat(val11.replace(",", ".")); // teisenda arvuks
        } else {
          row.hind_koos_km = val11; // säilita originaal
        }
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

const app = express ();
//lisame kõik andmed json-i, mis localhostis port 3300
app.get("/", (req, res) => {
  res.json(parts);
});
app.get("/spare-parts", (req, res) => {
  let results = parts;

  const { sn, name, page = 1, limit = 30, sort } = req.query;
  //sorteerimine seerianumbri järgi
  if (sn) {
    results = results.filter(
      (item) => item.seerianumber === sn
    );
  }
  //sorteerimine nime järgi
  if (name) {
    const lowerName = name.toLowerCase();
    results = results.filter(
      (item) =>
        item.toote_nimi && item.toote_nimi.toLowerCase().includes(lowerName)
    );
  }

  if (sort) {
    const desc = sort.startsWith("-");
    const field = desc ? sort.substring(1) : sort;

    results.sort((a, b) => {
      const valA = a[field];
      const valB = b[field];

      if (!isNaN(valA) && !isNaN(valB)) {
        return desc ? valB - valA : valA - valB;
      }

      return desc
        ? String(valB).localeCompare(String(valA))
        : String(valA).localeCompare(String(valB));
    });
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 30;
  const start = (pageNum -1) * limitNum;
  const end = start + limitNum;

  const pagedResults = results.slice(start, end);

  res.json({
    total: results.length,
    page: pageNum,
    perPage: limitNum,
    data: pagedResults,
  });
});



const PORT=3300;
loadData().then(() => {
  app.listen(PORT, () => console.log(`Server töötab http://localhost:${PORT}`));
});