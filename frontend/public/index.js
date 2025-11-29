document.addEventListener("DOMContentLoaded", () => {
	console.log("Page loaded.");

	// === DOM ELEMENTS ===========================
	const addBtn = document.getElementById("addSectionBtn");
	const sectionIdInput = document.getElementById("sectionId");
	const sectionFileInput = document.getElementById("sectionFile");
	const sectionsList = document.getElementById("sectionsList");

	const insightCanvas = document.getElementById("insightChart");

	const graph1Btn = document.getElementById("graph1Btn");
	const graph2Btn = document.getElementById("graph2Btn");
	const graph3Btn = document.getElementById("graph3Btn");

	// === STATE ================================
	let selectedDataset = null;
	let currentChart = null;

	// === ADD DATASET ==========================
	addBtn.addEventListener("click", async () => {
		const sectionId = sectionIdInput.value.trim();
		const file = sectionFileInput.files[0];

		if (!sectionId || !file) {
			alert("Please enter an ID and upload a file.");
			return;
		}

		try {
			const arrayBuffer = await file.arrayBuffer();
			const bytes = new Uint8Array(arrayBuffer);

			const response = await fetch(`/dataset/${sectionId}/sections`, {
				method: "PUT",
				headers: { "Content-Type": "application/x-zip-compressed" },
				body: bytes,
			});

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(`Failed to add: ${errText}`);
			}

			await refreshDatasets();
		} catch (err) {
			console.error(err);
			alert("API error: Could not add dataset.");
		}

		sectionIdInput.value = "";
		sectionFileInput.value = "";
	});

	// === REFRESH DATASETS ======================
	async function refreshDatasets() {
		try {
			const res = await fetch("/datasets");
			if (!res.ok) throw new Error("Failed to list datasets");

			const data = await res.json();
			const datasets = data.result;

			// Clear UI
			sectionsList.innerHTML = "";

			datasets.forEach((ds) => {
				const li = document.createElement("li");

				// Create radio for selecting dataset
				const radio = document.createElement("input");
				radio.type = "radio";
				radio.name = "datasetSelectRadio";
				radio.value = ds.id;
				radio.style.marginRight = "10px";

				radio.addEventListener("change", () => {
					selectedDataset = ds.id;
					console.log("Selected dataset:", selectedDataset);
				});

				// Info label
				const infoSpan = document.createElement("span");
				infoSpan.textContent = `${ds.id} — ${ds.kind} — ${ds.numRows} rows`;

				// Delete button
				const delBtn = document.createElement("button");
				delBtn.textContent = "Delete";
				delBtn.style.marginLeft = "10px";

				delBtn.addEventListener("click", async () => {
					try {
						const delRes = await fetch(`/dataset/${ds.id}`, { method: "DELETE" });
						if (!delRes.ok) throw new Error("Failed to delete dataset");
						await refreshDatasets();
					} catch (err) {
						console.error(err);
						alert("Could not delete dataset.");
					}
				});

				li.appendChild(radio);
				li.appendChild(infoSpan);
				li.appendChild(delBtn);
				sectionsList.appendChild(li);

				// Update dropdown
				const opt = document.createElement("option");
				opt.value = ds.id;
				opt.textContent = ds.id;
			});
		} catch (err) {
			console.error(err);
			alert("Could not refresh dataset list.");
		}
	}

	// Initial load
	refreshDatasets();

	// === CHART RENDERER =========================
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
						borderWidth: 2,
						pointRadius: type === "scatter" ? 5 : 3,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
			},
		});
	}

	// === EXAMPLE DATA (Temporary) ================
	function getExampleData() {
		return {
			labels: ["A", "B", "C", "D"],
			valuesA: [10, 20, 15, 8],
			valuesB: [4, 6, 9, 3],
			valuesC: [7, 3, 12, 5],
		};
	}

	function getSelectedDataset() {
		if (!selectedDataset) return null;
		return selectedDataset;
	}

	async function loadDepartments(datasetID) {
		const deptKey = `${datasetID}_dept`;

		const query = {
			WHERE: {},
			OPTIONS: {
				COLUMNS: [deptKey],
				ORDER: deptKey,
			},
			TRANSFORMATIONS: {
				GROUP: [deptKey],
				APPLY: [],
			},
		};

		const res = await fetch("/query", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(query),
		});

		const data = await res.json();
		return data.result.map((r) => r[deptKey]);
	}

	async function loadTopCourses(datasetID, dept) {
		const deptKey = `${datasetID}_dept`;
		const idKey = `${datasetID}_id`;
		const avgKey = `${datasetID}_avg`;

		const query = {
			WHERE: { EQ: { [deptKey]: dept } },
			OPTIONS: {
				COLUMNS: [idKey, deptKey, avgKey],
				ORDER: { dir: "DOWN", keys: [avgKey] },
			},
		};

		const res = await fetch("/query", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(query),
		});

		const data = await res.json();
		return data.result;
	}

	graph1Btn.addEventListener("click", async () => {
		const datasetID = getSelectedDataset();
		if (!datasetID) {
			alert("Please select a dataset first.");
			return;
		}

		console.log("Graph 1: Using dataset:", datasetID);

		// Step 1: Load all departments
		const departments = await loadDepartments(datasetID);
		console.log("Departments:", departments);

		// Step 2: Populate dropdown
		const dropdown = document.getElementById("deptDropdown");
		dropdown.innerHTML = "";
		departments.forEach((dept) => {
			const opt = document.createElement("option");
			opt.value = dept;
			opt.textContent = dept.toUpperCase();
			dropdown.appendChild(opt);
		});

		// Step 3: When user picks a department → fetch + render
		dropdown.onchange = async () => {
			const selectedDept = dropdown.value;
			console.log("Graph 1: Selected dept:", selectedDept);

			const results = await loadTopCourses(datasetID, selectedDept);
			console.log("Top courses:", results);

			const idKey = `${datasetID}_id`;
			const avgKey = `${datasetID}_avg`;

			const labels = results.map((r) => r[idKey]);
			const values = results.map((r) => r[avgKey]);

			// Horizontal bar chart
			renderChart("bar-horizontal", labels, values);
		};

		alert("Select a department from the dropdown to generate the graph.");
	});

	graph2Btn.addEventListener("click", () => {
		const data = getExampleData();
		renderChart("line", data.labels, data.valuesB);
	});

	graph3Btn.addEventListener("click", () => {
		const data = getExampleData();
		const scatterPoints = data.valuesC.map((v, i) => ({ x: i, y: v }));
		renderChart("scatter", scatterPoints, scatterPoints);
	});
});
