document.addEventListener("DOMContentLoaded", () => {
	const addBtn = document.getElementById("addSectionBtn");
	const sectionIdInput = document.getElementById("sectionId");
	const sectionFileInput = document.getElementById("sectionFile");
	const sectionsList = document.getElementById("sectionsList");
	const insightDatasetSelect = document.getElementById("insightDataset");
	const loadInsightBtn = document.getElementById("loadInsightBtn");

	const sections = []; // store added sections locally
	let chartInstance = null;

	addBtn.addEventListener("click", async () => {
		const sectionId = sectionIdInput.value.trim();
		const file = sectionFileInput.files[0];

		if (!sectionId || !file) {
			alert("Please enter ID + file.");
			return;
		}

		try {
			// Convert file to ArrayBuffer, then to Uint8Array for fetch body
			const arrayBuffer = await file.arrayBuffer();
			const bytes = new Uint8Array(arrayBuffer);

			const response = await fetch(`/dataset/${sectionId}/sections`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/x-zip-compressed",
				},
				body: bytes, // send raw bytes directly
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(`Failed to add dataset: ${errText}`);
			}

			await refreshDatasets();
		} catch (err) {
			console.error(err);
			alert("API error: Could not add dataset.");
		}

		sectionIdInput.value = "";
		sectionFileInput.value = "";
	});

	async function refreshDatasets() {
		try {
			const res = await fetch("/datasets");
			if (!res.ok) throw new Error("Failed to list datasets");

			const data = await res.json(); // { result: [ { id, kind, numRows } ] }
			const datasets = data.result;

			// Clear UI
			sectionsList.innerHTML = "";
			datasetSelect.innerHTML = "";

			datasets.forEach((ds) => {
				const li = document.createElement("li");

				// Display dataset info
				const infoSpan = document.createElement("span");
				infoSpan.textContent = `${ds.id} — ${ds.kind} — ${ds.numRows} rows`;

				// Optional delete button
				const delBtn = document.createElement("button");
				delBtn.textContent = "Delete";
				delBtn.addEventListener("click", async () => {
					try {
						const delRes = await fetch(`/dataset/${ds.id}`, { method: "DELETE" });
						if (!delRes.ok) throw new Error("Failed to delete");
						refreshDatasets();
					} catch (err) {
						console.error(err);
						alert("Could not delete dataset");
					}
				});

				li.appendChild(infoSpan);
				li.appendChild(delBtn);
				sectionsList.appendChild(li);

				// Update dropdown
				const opt = document.createElement("option");
				opt.value = ds.id;
				opt.textContent = ds.id;
				datasetSelect.appendChild(opt);
			});
		} catch (err) {
			console.error(err);
			alert("Could not refresh dataset list.");
		}
	}

	refreshDatasets();
	let currentChart = null;

	const datasetSelect = document.getElementById("datasetSelect");
	const insightCanvas = document.getElementById("insightChart");

	let storedDatasets = [];

	function refreshDatasetDropdown() {
		datasetSelect.innerHTML = "";
		for (const ds of storedDatasets) {
			const opt = document.createElement("option");
			opt.value = ds.sectionId; // use whatever ID you use
			opt.textContent = ds.sectionId;
			datasetSelect.appendChild(opt);
		}
	}

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

	function getExampleData() {
		return {
			labels: ["A", "B", "C", "D"],
			valuesA: [10, 20, 15, 8],
			valuesB: [4, 6, 9, 3],
			valuesC: [7, 3, 12, 5],
		};
	}

	document.getElementById("graph1Btn").addEventListener("click", () => {
		const data = getExampleData();
		renderChart("bar", data.labels, data.valuesA);
	});

	document.getElementById("graph2Btn").addEventListener("click", () => {
		const data = getExampleData();
		renderChart("line", data.labels, data.valuesB);
	});

	document.getElementById("graph3Btn").addEventListener("click", () => {
		const data = getExampleData();

		// scatter needs {x,y} pairs
		const scatterData = data.valuesC.map((v, i) => ({ x: i, y: v }));
		renderChart("scatter", scatterData, scatterData);
	});
});
