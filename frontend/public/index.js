document.addEventListener("DOMContentLoaded", () => {
	console.log("Page loaded.");
	const API_BASE = "http://localhost:4321";
	// === DOM ELEMENTS ===========================
	const addBtn = document.getElementById("addSectionBtn");
	const sectionIdInput = document.getElementById("sectionId");
	const sectionFileInput = document.getElementById("sectionFile");
	const sectionsList = document.getElementById("sectionsList");

	const insightCanvas = document.getElementById("insightChart");

	const graph1Btn = document.getElementById("graph1Btn");
	const graph2Btn = document.getElementById("graph2Btn");
	const graph3Btn = document.getElementById("graph3Btn");
	const graph1Controls = document.getElementById("graph1Controls");
	const graph1DeptSelect = document.getElementById("graph1DeptSelect");

	// === STATE ================================
	let selectedDataset = null;
	let currentChart = null;
	let lastGraphFunction = null; // Track which graph was last displayed

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

			const response = await fetch(`${API_BASE}/dataset/${sectionId}/sections`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/x-zip-compressed",
				},
				body: bytes, // send raw bytes directly
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

	function renderChartOne(labels, values) {
		if (currentChart) currentChart.destroy();

		currentChart = new Chart(insightCanvas, {
			type: "bar",
			data: {
				labels: labels,
				datasets: [
					{
						label: "Section Avg",
						data: values,
						backgroundColor: "#0077cc",
					},
				],
			},
			options: {
				indexAxis: "y", // sideways bar
				responsive: true,
				maintainAspectRatio: false,
			},
		});
	}

	const departments = [
		// couldn't use transformation.
		"aanb",
		"adhe",
		"anat",
		"anth",
		"apbi",
		"appp",
		"apsc",
		"arbc",
		"arch",
		"arcl",
		"arst",
		"arth",
		"asia",
		"asic",
		"astr",
		"astu",
		"atsc",
		"audi",
		"ba",
		"baac",
		"babs",
		"baen",
		"bafi",
		"bahr",
		"bait",
		"bala",
		"bama",
		"bams",
		"bapa",
		"basc",
		"basm",
		"baul",
		"bioc",
		"biof",
		"biol",
		"bmeg",
		"bota",
		"busi",
		"caps",
		"ccst",
		"ceen",
		"cell",
		"cens",
		"chbe",
		"chem",
		"chil",
		"chin",
		"cics",
		"civl",
		"clch",
		"clst",
		"cnps",
		"cnrs",
		"cnto",
		"coec",
		"cogs",
		"cohr",
		"comm",
		"cons",
		"cpen",
		"cpsc",
		"crwr",
		"dani",
		"dent",
		"dhyg",
		"eced",
		"econ",
		"edcp",
		"edst",
		"educ",
		"eece",
		"elec",
		"ends",
		"engl",
		"enph",
		"envr",
		"eosc",
		"epse",
		"etec",
		"fhis",
		"fipr",
		"fish",
		"fist",
		"fmst",
		"fnel",
		"fnh",
		"fnis",
		"food",
		"fopr",
		"fre",
		"fren",
		"frst",
		"gbpr",
		"geob",
		"geog",
		"germ",
		"gpp",
		"grek",
		"grsj",
		"gsat",
		"hebr",
		"hgse",
		"hinu",
		"hist",
		"hunu",
		"iar",
		"igen",
		"info",
		"isci",
		"ital",
		"itst",
		"iwme",
		"japn",
		"jrnl",
		"kin",
		"korn",
		"lais",
		"larc",
		"laso",
		"last",
		"latn",
		"law",
		"lfs",
		"libe",
		"libr",
		"ling",
		"lled",
		"math",
		"mdvl",
		"mech",
		"medg",
		"medi",
		"micb",
		"midw",
		"mine",
		"mrne",
		"mtrl",
		"musc",
		"name",
		"nest",
		"nrsc",
		"nurs",
		"obst",
		"onco",
		"path",
		"pcth",
		"pers",
		"phar",
		"phil",
		"phrm",
		"phth",
		"phys",
		"plan",
		"poli",
		"pols",
		"port",
		"psyc",
		"punj",
		"relg",
		"rgla",
		"rhsc",
		"rmes",
		"rmst",
		"rsot",
		"russ",
		"sans",
		"scan",
		"scie",
		"soci",
		"soil",
		"sowk",
		"span",
		"spha",
		"spph",
		"stat",
		"sts",
		"surg",
		"swed",
		"test",
		"thtr",
		"udes",
		"ufor",
		"urst",
		"ursy",
		"vant",
		"visa",
		"wood",
		"wrds",
		"zool",
	];

	departments.forEach((dept) => {
		const opt = document.createElement("option");
		opt.value = dept;
		opt.textContent = dept.toUpperCase();
		graph1DeptSelect.appendChild(opt);
	});

	async function loadTopSections() {
		const deptName = graph1DeptSelect.value;

		// Validate dataset selection
		if (!selectedDataset) {
			alert("Please select a dataset first.");
			return;
		}

		console.log("Loading top sections for department:", deptName);

		const query = {
			WHERE: {
				IS: {
					[`${selectedDataset}_dept`]: deptName,
				},
			},
			OPTIONS: {
				COLUMNS: [`${selectedDataset}_id`, `${selectedDataset}_avg`],
				ORDER: `${selectedDataset}_avg`,
			},
		};

		try {
			const result = await doQuery(query);

			// Extract data from query results
			// Assuming result is an array of objects with the format:
			// [{sections_id: "...", sections_avg: 85.5}, ...]

			if (!result || result.length === 0) {
				alert("No data found for this department.");
				return;
			}

			// Reverse to get highest averages first, then limit to top 10
			const topSections = result.reverse().slice(0, 10);

			// Extract labels (section IDs) and values (averages)
			const labels = topSections.map((item) => item[`${selectedDataset}_id`]);
			const values = topSections.map((item) => item[`${selectedDataset}_avg`]);

			// Render the chart
			renderChartOne(labels, values);
		} catch (err) {
			console.error("Error loading top sections:", err);
			alert("Failed to load section data. Check console for details.");
		}
	}

	// Helper function to execute queries
	async function doQuery(query) {
		const response = await fetch(`${API_BASE}/query`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(query),
		});

		if (!response.ok) {
			const errText = await response.text();
			throw new Error(`Query failed: ${errText}`);
		}

		const data = await response.json();
		return data.result;
	}

	// Load top instructors by average (for Graph 2) - without TRANSFORMATIONS
	async function loadTopInstructors() {
		const deptName = graph1DeptSelect.value;

		// Validate dataset selection
		if (!selectedDataset) {
			alert("Please select a dataset first.");
			return;
		}

		console.log("Loading top instructors for department:", deptName);

		const query = {
			WHERE: {
				IS: {
					[`${selectedDataset}_dept`]: deptName,
				},
			},
			OPTIONS: {
				COLUMNS: [`${selectedDataset}_instructor`, `${selectedDataset}_avg`],
			},
		};

		try {
			const result = await doQuery(query);

			if (!result || result.length === 0) {
				alert("No data found for this department.");
				return;
			}

			// Manually group by instructor and calculate averages
			const instructorMap = {};

			result.forEach((item) => {
				const instructor = item[`${selectedDataset}_instructor`];
				const avg = item[`${selectedDataset}_avg`];

				// Skip sections without an instructor name (empty, null, undefined, or whitespace)
				if (!instructor || instructor.trim() === "") {
					return;
				}

				if (!instructorMap[instructor]) {
					instructorMap[instructor] = {
						sum: 0,
						count: 0,
					};
				}

				instructorMap[instructor].sum += avg;
				instructorMap[instructor].count += 1;
			});

			// Calculate averages and create array
			const instructorAverages = Object.keys(instructorMap).map((instructor) => ({
				instructor: instructor,
				average: instructorMap[instructor].sum / instructorMap[instructor].count,
			}));

			// Sort by average (descending) and take top 10
			const topInstructors = instructorAverages.sort((a, b) => b.average - a.average).slice(0, 10);

			// Extract labels (instructor names) and values (averages)
			const labels = topInstructors.map((item) => item.instructor);
			const values = topInstructors.map((item) => item.average);

			// Render the chart
			renderChartOne(labels, values);
		} catch (err) {
			console.error("Error loading top instructors:", err);
			alert("Failed to load instructor data. Check console for details.");
		}
	}

	// Load course averages over years (for Graph 3)
	async function loadCourseOverYears() {
		const deptName = graph1DeptSelect.value;

		// Validate dataset selection
		if (!selectedDataset) {
			alert("Please select a dataset first.");
			return;
		}

		// Prompt user for a specific course ID
		const courseId = prompt("Enter a course ID (e.g., 310, 213):");
		if (!courseId || courseId.trim() === "") {
			return;
		}

		console.log(`Loading averages for ${deptName} ${courseId} over years`);

		const query = {
			WHERE: {
				AND: [
					{
						IS: {
							[`${selectedDataset}_dept`]: deptName,
						},
					},
					{
						IS: {
							[`${selectedDataset}_id`]: courseId.trim(),
						},
					},
				],
			},
			OPTIONS: {
				COLUMNS: [`${selectedDataset}_year`, `${selectedDataset}_avg`],
				ORDER: `${selectedDataset}_year`,
			},
		};

		try {
			const result = await doQuery(query);

			if (!result || result.length === 0) {
				alert(`No data found for ${deptName} ${courseId}.`);
				return;
			}

			// Group by year and calculate average for each year
			const yearMap = {};

			result.forEach((item) => {
				const year = item[`${selectedDataset}_year`];
				const avg = item[`${selectedDataset}_avg`];

				// Skip year 1900 (overall sections)
				if (year === 1900) {
					return;
				}

				if (!yearMap[year]) {
					yearMap[year] = {
						sum: 0,
						count: 0,
					};
				}

				yearMap[year].sum += avg;
				yearMap[year].count += 1;
			});

			// Calculate averages and create array, sorted by year
			const yearAverages = Object.keys(yearMap)
				.map((year) => ({
					year: parseInt(year),
					average: yearMap[year].sum / yearMap[year].count,
				}))
				.sort((a, b) => a.year - b.year);

			if (yearAverages.length === 0) {
				alert(`No valid year data found for ${deptName} ${courseId}.`);
				return;
			}

			// Extract labels (years) and values (averages)
			const labels = yearAverages.map((item) => item.year.toString());
			const values = yearAverages.map((item) => item.average);

			// Render as line chart
			renderCourseLineChart(labels, values, `${deptName.toUpperCase()} ${courseId}`);
		} catch (err) {
			console.error("Error loading course over years:", err);
			alert("Failed to load course data. Check console for details.");
		}
	}

	function renderCourseLineChart(labels, values, courseTitle) {
		if (currentChart) currentChart.destroy();

		currentChart = new Chart(insightCanvas, {
			type: "line",
			data: {
				labels: labels,
				datasets: [
					{
						label: `${courseTitle} Average Over Years`,
						data: values,
						borderColor: "#0077cc",
						backgroundColor: "rgba(0, 119, 204, 0.1)",
						borderWidth: 3,
						pointRadius: 5,
						pointBackgroundColor: "#0077cc",
						tension: 0.2, // slight curve to the line
						fill: true,
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				scales: {
					y: {
						beginAtZero: false,
						title: {
							display: true,
							text: "Average Grade",
						},
					},
					x: {
						title: {
							display: true,
							text: "Year",
						},
					},
				},
			},
		});
	}

	// Event listener for Graph 1 button - loads top sections when clicked
	graph1Btn.addEventListener("click", async () => {
		if (!selectedDataset) {
			alert("Please select a dataset first by clicking on a radio button in the 'Added Sections' list.");
			return;
		}

		if (!graph1DeptSelect.value) {
			alert("Please select a department from the dropdown.");
			return;
		}

		lastGraphFunction = loadTopSections; // Remember this graph
		await loadTopSections();
	});

	// Event listener for department dropdown change - auto-update if data already loaded
	graph1DeptSelect.addEventListener("change", async () => {
		// Only auto-update if a dataset is selected, chart exists, and we know which graph to show
		if (selectedDataset && currentChart && lastGraphFunction) {
			await lastGraphFunction();
		}
	});

	// Event listener for Graph 2 button - loads top instructors when clicked
	graph2Btn.addEventListener("click", async () => {
		if (!selectedDataset) {
			alert("Please select a dataset first by clicking on a radio button in the 'Added Sections' list.");
			return;
		}

		if (!graph1DeptSelect.value) {
			alert("Please select a department from the dropdown.");
			return;
		}

		lastGraphFunction = loadTopInstructors; // Remember this graph
		await loadTopInstructors();
	});

	// Event listener for Graph 3 button - loads course over years when clicked
	graph3Btn.addEventListener("click", async () => {
		if (!selectedDataset) {
			alert("Please select a dataset first by clicking on a radio button in the 'Added Sections' list.");
			return;
		}

		if (!graph1DeptSelect.value) {
			alert("Please select a department from the dropdown.");
			return;
		}

		lastGraphFunction = loadCourseOverYears; // Remember this graph
		await loadCourseOverYears();
	});
});
