const form = document.getElementById("checkinForm");
    if (form) {
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const ticketId = form.querySelector("[name=ticketId]").value;
        const t = form.querySelector("[name=t]").value;

        try {
            const res = await fetch("/ticket/checkin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId, t }),
            });
            const data = await res.json();
            alert(data.message);
            if (data.ok) location.reload();
        } catch (err) {
            console.error(err);
            alert("เกิดข้อผิดพลาดในการเช็กอิน");
        }
    });
}
