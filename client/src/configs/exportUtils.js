import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export const exportToCSV = (data, filename) => {
    if (!data || data.length === 0) return;

    // Define the headers we want to include
    const headers = [
        "Parking Spot",
        "Vehicle Number",
        "From Date",
        "To Date",
        "Status"
    ];

    // Map the data to CSV rows
    const csvContent = [
        headers.join(","),
        ...data.map(booking => {
            const parkingSpot = booking.parkingSlot 
                ? `Slot: ${booking.parkingSlot?.slotNumber || "N/A"},Level: ${booking.parkingSlot?.parkingLevel?.name || "N/A"},Lot: ${booking.parkingSlot?.parkingLevel?.parkingLot?.name || "N/A"}`
                : "N/A";
            
            const row = [
                `"${parkingSpot}"`,
                `"${booking.vehicleNumber || "N/A"}"`,
                `"${formatDateDDMMYYYY(booking.fromDate)}"`,
                `"${formatDateDDMMYYYY(booking.toDate)}"`,
                `"${booking.status || "N/A"}"`
            ];
            return row.join(",");
        })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}.csv`);
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportToPDF = (data, filename, activeTab) => {
    if (!data || data.length === 0) return;
  
    // Initialize jsPDF
    const doc = new jsPDF();
  
    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(33, 37, 41); // Dark gray
    doc.text(`${activeTab.toUpperCase()} BOOKINGS`, 105, 20, { align: "center" });
  
    // Metadata (date, record count)
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Total records: ${data.length}`, 14, 35);
  
    // Prepare table data
    const headers = [
      "Parking Spot",
      "Vehicle",
      "From Date",
      "To Date",
      "Status",
    ];
  
    const tableData = data.map(booking => [
      `Slot: ${booking.parkingSlot?.slotNumber || "N/A"}\nLevel: ${booking.parkingSlot?.parkingLevel?.name || "N/A"}\nLot: ${booking.parkingSlot?.parkingLevel?.parkingLot?.name || "N/A"}`,
      booking.vehicleNumber || "N/A",
      formatDate(booking.fromDate),
      formatDate(booking.toDate),
      booking.status || "N/A",
    ]);
  
    // Generate table
    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 40,
      headStyles: {
        fillColor: [58, 83, 155],  // Header color
        textColor: 255,            // White text
        fontStyle: "bold"
      },
      bodyStyles: {
        textColor: [33, 37, 41],   // Dark gray text
        fontSize: 9
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250] // Light gray alternate rows
      },
      columnStyles: {
        0: { cellWidth: 40 },  // Parking spot
        4: { halign: "center" } // Status
      }
    });
  
    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width / 2,
        doc.internal.pageSize.height - 10,
        { align: "center" }
      );
    }
  
    // Save PDF
    doc.save(`${filename.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB");
};

const formatDateDDMMYYYY = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
};