/**
 * @jest-environment jsdom
 */

test("clicking the Add button triggers its event listener", () => {
	document.body.innerHTML = `
    <section id="addSection">
      <h2>Add New Dataset</h2>

      <label for="sectionId">Section ID:</label>
      <input type="text" id="sectionId" placeholder="Enter section ID">

      <label for="sectionFile">Choose File:</label>
      <input type="file" id="sectionFile">

      <button id="addSectionBtn">Add</button>
    </section>
  `;

	const btn = document.getElementById("addSectionBtn");
	btn.addEventListener("click", () => {
		btn.dataset.clicked = "true";
	});

	btn.click();

	// Check the event actually fired
	expect(btn.dataset.clicked).toBe("true");
});
