document.addEventListener("DOMContentLoaded", () => {
	const addBtn = document.getElementById("addSectionBtn");
	const sectionIdInput = document.getElementById("sectionId");
	const sectionFileInput = document.getElementById("sectionFile");
	const sectionsList = document.getElementById("sectionsList");

	const sections = []; // store added sections locally

	addBtn.addEventListener("click", () => {
		const sectionId = sectionIdInput.value.trim();
		const file = sectionFileInput.files[0];

		if (!sectionId || !file) {
			alert("Please enter a Section ID and choose a file.");
			return;
		}

		// Add to local array (you can replace this with an API call)
		sections.push({ sectionId, fileName: file.name });
		console.log("Added Section:", { sectionId, fileName: file.name });

		// Update the list in the UI
		const li = document.createElement("li");
		li.textContent = `${sectionId} - ${file.name}`;
		sectionsList.appendChild(li);

		// Reset inputs
		sectionIdInput.value = "";
		sectionFileInput.value = "";
	});
});
