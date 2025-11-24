// =======================================
// INSIGHTS + CHART.JS SECTION
// =======================================
let currentChart = null;

const datasetSelect = document.getElementById("datasetSelect");
const insightCanvas = document.getElementById("insightChart");

// This should be filled when user uploads datasets
// (You already store datasets in your existing array)
let storedDatasets = [];

// Call this whenever datasets change
function refreshDatasetDropdown() {
	datasetSelect.innerHTML = "";
	for (const ds of storedDatasets) {
		const opt = document.createElement("option");
		opt.value = ds.sectionId; // use whatever ID you use
		opt.textContent = ds.sectionId;
		datasetSelect.appendChild(opt);
	}
}

// Cleanly render chart
function renderChart(type, labels, values) {
	if (currentChart) currentChart.destroy();

	currentChart = new Chart(insightCanvas, {
		type: type,
		data: {
			labels: labels,
			datasets: [
				{
					label: "Insight",
					data: values,
					borderWidth: 1,
				},
			],
		},
		options: {
			responsive: true,
			maintainAspectRatio: false,
		},
	});
}

// EXAMPLE DATA (replace with your filtering)
function getExampleData() {
	return {
		labels: ["A", "B", "C", "D"],
		valuesA: [10, 20, 15, 8],
		valuesB: [4, 6, 9, 3],
		valuesC: [7, 3, 12, 5],
	};
}

// BUTTON 1
document.getElementById("graph1Btn").addEventListener("click", () => {
	const data = getExampleData();
	renderChart("bar", data.labels, data.valuesA);
});

// BUTTON 2
document.getElementById("graph2Btn").addEventListener("click", () => {
	const data = getExampleData();
	renderChart("line", data.labels, data.valuesB);
});

// BUTTON 3
document.getElementById("graph3Btn").addEventListener("click", () => {
	const data = getExampleData();

	// scatter needs {x,y} pairs
	const scatterData = data.valuesC.map((v, i) => ({ x: i, y: v }));
	renderChart("scatter", scatterData, scatterData);
});
