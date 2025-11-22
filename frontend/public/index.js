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

		// Add to local array
		const section = { sectionId, fileName: file.name };
		sections.push(section);
		console.log("Added Section:", section);

		// Update UI
		const li = document.createElement("li");
		li.textContent = `${sectionId} - ${file.name} `;

		// Add delete button
		const delBtn = document.createElement("button");
		delBtn.textContent = "Delete";
		delBtn.style.marginLeft = "10px";
		delBtn.addEventListener("click", () => {
			// Remove from array
			const index = sections.indexOf(section);
			if (index > -1) sections.splice(index, 1);
			// Remove from UI
			li.remove();
		});

		li.appendChild(delBtn);
		sectionsList.appendChild(li);

		// Reset inputs
		sectionIdInput.value = "";
		sectionFileInput.value = "";
	});
});
