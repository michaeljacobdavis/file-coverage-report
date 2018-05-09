const parse = require("byzantine");
const aggregate = require("byzantine/aggregate");
const fs = require("fs");

function readCoverageJson() {
  try {
    const jsonFileContents = fs.readFileSync(
      "coverage/coverage-final.json",
      "utf8"
    );
    return JSON.parse(jsonFileContents);
  } catch (e) {
    return {};
  }
}

const coverages = parse(readCoverageJson());

const formatPercent = n => `${getCoverageEmoji(n)} ${Math.floor(n)}%`;

const multiplyBy100 = n => n * 100;

const getCoverageEmoji = n => {
  if (n < 1) {
    return "😱";
  } else if (n <= 60) {
    return "⚠️";
  } else if (n <= 90) {
    return "✅";
  } else {
    return "🎉";
  }
};

const getCoveragePercent = (covered, all) => {
  if (all === 0) {
    return formatPercent(multiplyBy100(1));
  }
  return formatPercent(multiplyBy100(covered / all));
};

function generateMarkDownTable(headers, body) {
  const tableHeaders = [
    headers.join(" | "),
    headers.map(() => " ---: ").join(" | ")
  ];

  const tablebody = body.map(r => r.join(" | "));
  return tableHeaders.join("\n") + "\n" + tablebody.join("\n");
}

function generateOverallCoverage() {
  const { statements, branches, functions } = aggregate(coverages);
  const overallCoverageTable = generateMarkDownTable(
    ["statements", "branches", "functions"],
    [
      [
        formatPercent(statements),
        formatPercent(branches),
        formatPercent(functions)
      ]
    ]
  );

  return overallCoverageTable;
}

function generateChangeCoverage(changedFiles) {
  const prefix = process.cwd();

  if (!changedFiles.length) {
    return `No files`;
  }
  const fileCoverage = coverages.reduce((coverageMap, entry) => {
    coverageMap[entry.path] = entry;
    return coverageMap;
  }, {});

  return generateMarkDownTable(
    ["file", "statements", "branches", "functions"],
    changedFiles.map(filename => {
      const path = `${prefix}/${filename}`;
      const entry = fileCoverage[path];
      if (!entry) {
        return [filename, "Excluded", "Excluded", "Excluded"];
      }
      return [
        filename,
        getCoveragePercent(entry.statements.covered, entry.statements.all),
        getCoveragePercent(entry.branches.covered, entry.branches.all),
        getCoveragePercent(entry.functions.covered, entry.functions.all)
      ];
    })
  );
}

exports.generateOverallCoverage = generateOverallCoverage;
exports.generateChangeCoverage = generateChangeCoverage;
