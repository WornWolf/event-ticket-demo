document.addEventListener("DOMContentLoaded", function () {
    const canvas = document.getElementById("salesChart");
    const labels = JSON.parse(canvas.dataset.labels || "[]");
    const values = JSON.parse(canvas.dataset.values || "[]");
    if (!canvas) return;

    if (!labels.length) {
      canvas.replaceWith(
        Object.assign(document.createElement("div"), {
          className: "text-muted small text-center py-4",
          innerText: "ยังไม่มีข้อมูลกราฟ",
        })
      );
      return;
    }

    new Chart(canvas, {
      type: "line",
      data: {
        labels,
        datasets: [{
          label: "ยอดขาย (บาท/วัน)",
          data: values,
          tension: 0.3,
          fill: true,
          backgroundColor: "rgba(54, 162, 235, 0.2)",
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 2,
          pointRadius: 2
        }]
      },
      options: {
        plugins: { legend: { display: false } },
        interaction: { mode: "index", intersect: false },
        scales: {
          x: { ticks: { maxTicksLimit: 6 } },
          y: {
            beginAtZero: true,
            ticks: { callback: v => "฿" + Number(v).toLocaleString() }
          }
        }
      }
    });
  });
