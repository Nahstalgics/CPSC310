document.addEventListener("DOMContentLoaded", () => {
	const addBtn = document.getElementById("addSectionBtn");
	const sectionIdInput = document.getElementById("sectionId");
	const sectionFileInput = document.getElementById("sectionFile");
	const sectionsList = document.getElementById("sectionsList");
	const insightDatasetSelect = document.getElementById("insightDataset");
	const loadInsightBtn = document.getElementById("loadInsightBtn");

	const sections = []; // store added sections locally
	let chartInstance = null;

	addBtn.addEventListener("click", () => {
		const sectionId = sectionIdInput.value.trim();
		const file = sectionFileInput.files[0];

		if (!sectionId || !file) {
			alert("Please enter a Section ID and choose a file.");
			return;
		}

		const section = { sectionId, fileName: file.name };
		sections.push(section);

		// Update list UI
		const li = document.createElement("li");
		li.textContent = `${sectionId} - ${file.name}`;

		// Delete button
		const delBtn = document.createElement("button");
		delBtn.textContent = "Delete";
		delBtn.style.marginLeft = "10px";
		delBtn.addEventListener("click", () => {
			const index = sections.indexOf(section);
			if (index > -1) sections.splice(index, 1);
			li.remove();

			// remove from insights dropdown
			updateInsightDropdown();
		});

		li.appendChild(delBtn);
		sectionsList.appendChild(li);

		// Update insights dropdown
		updateInsightDropdown();

		sectionIdInput.value = "";
		sectionFileInput.value = "";
	});

	// Sync dropdown with dataset list
	function updateInsightDropdown() {
		insightDatasetSelect.innerHTML = '<option value="">-- Select a dataset --</option>';

		sections.forEach((sec) => {
			const opt = document.createElement("option");
			opt.value = sec.sectionId;
			opt.textContent = `${sec.sectionId} (${sec.fileName})`;
			insightDatasetSelect.appendChild(opt);
		});
	}

	// Load a simple example chart when user clicks "Load Insight"
	loadInsightBtn.addEventListener("click", () => {
		const chosen = insightDatasetSelect.value;
		if (!chosen) {
			alert("Please choose a dataset.");
			return;
		}

		// Example dummy data (replace with real API data)
		const labels = ["A", "B", "C", "D"];
		const values = [12, 19, 3, 5];

		const ctx = document.getElementById("insightsChart").getContext("2d");

		if (chartInstance) chartInstance.destroy();

		chartInstance = new Chart(ctx, {
			type: "bar",
			data: {
				labels,
				datasets: [
					{
						label: `Insights for ${chosen}`,
						data: values,
					},
				],
			},
		});
	});
});
