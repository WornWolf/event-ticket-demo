document.addEventListener("DOMContentLoaded", () => {
    const searchInput = document.getElementById("searchInput");
    const sortSelect = document.getElementById("sortSelect");
    const tbody = document.querySelector("#eventsTable tbody");
    const allRows = Array.from(tbody.querySelectorAll("tr"));
    const nowTimestamp = Date.now();

    // Filter + Sort
    function renderTable() {
    const query = searchInput.value.trim().toLowerCase();
    const sortValue = sortSelect.value;

    let filteredRows = allRows.filter((row) =>
        row.dataset.title.includes(query)
    );

    filteredRows.sort((a, b) => {
        const priceA = parseFloat(a.dataset.price) || 0;
        const priceB = parseFloat(b.dataset.price) || 0;
        const ticketsA = parseInt(a.dataset.tickets) || 0;
        const ticketsB = parseInt(b.dataset.tickets) || 0;
        const startA = parseInt(a.dataset.start) || 0;
        const startB = parseInt(b.dataset.start) || 0;
        const endA = parseInt(a.dataset.end) || 0;
        const endB = parseInt(b.dataset.end) || 0;
        const lockA = a.dataset.lockstart === "true";
        const lockB = b.dataset.lockstart === "true";

        switch (sortValue) {
        case "priceAsc":
            return priceA - priceB;
        case "priceDesc":
            return priceB - priceA;
        case "ticketsAsc":
            return ticketsA - ticketsB;
        case "ticketsDesc":
            return ticketsB - ticketsA;
        case "startAsc": {
            if (lockA && !lockB) return -1;
            if (!lockA && lockB) return 1;
            if (lockA && lockB) return endA - endB;
            if (startA !== startB) return startA - startB;
            return endA - endB;
        }
        case "startDesc": {
            const realStartA = lockA ? nowTimestamp : startA;
            const realStartB = lockB ? nowTimestamp : startB;
            if (realStartB !== realStartA) return realStartB - realStartA;
            return endB - endA;
        }
        case "createdAsc":
            return (
            (parseInt(a.dataset.created) || 0) -
            (parseInt(b.dataset.created) || 0)
            );
        case "createdDesc":
            return (
            (parseInt(b.dataset.created) || 0) -
            (parseInt(a.dataset.created) || 0)
            );
        default:
            return 0;
        }
    });

    tbody.innerHTML = "";
    filteredRows.forEach((row) => tbody.appendChild(row));
    }

    searchInput.addEventListener("input", renderTable);
    sortSelect.addEventListener("change", renderTable);
    renderTable();

    // 🗑 ระบบลบ modal
    const confirmModal = new bootstrap.Modal(
    document.getElementById("confirmDeleteModal")
    );
    const loadingModal = new bootstrap.Modal(
    document.getElementById("loadingModal")
    );
    const deleteEventName = document.getElementById("deleteEventName");
    let formToDelete = null;

    document.querySelectorAll(".delete-form").forEach((form) => {
    form.addEventListener("submit", (e) => {
        e.preventDefault();
        formToDelete = form;

        const row = form.closest("tr");
        const eventName = row.querySelector(".event-title").textContent;

        // ใส่ตัวหนา
        deleteEventName.innerHTML = `<strong>${eventName}</strong>`;

        confirmModal.show();
    });
    });

    document
    .getElementById("confirmDeleteBtn")
    .addEventListener("click", () => {
        confirmModal.hide();
        loadingModal.show();

        setTimeout(() => {
        if (formToDelete) formToDelete.submit();
        }, 1000);
    });
});
