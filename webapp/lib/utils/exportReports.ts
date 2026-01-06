/**
 * Export Analytics Reports to PDF/Excel
 */

interface ReportData {
  title: string;
  period: string;
  revenue: {
    total: number;
    orders: number;
    averageOrderValue: number;
  };
  dailyData?: Array<{
    date: string;
    revenue: number;
    orders: number;
  }>;
  popularItems?: Array<{
    name: string;
    orders: number;
    revenue: number;
  }>;
  serviceBreakdown?: Array<{
    type: string;
    revenue: number;
    orders: number;
  }>;
}

/**
 * Export to CSV
 */
export function exportToCSV(data: ReportData): void {
  const rows: string[] = [];
  
  // Header
  rows.push(`${data.title} - ${data.period}`);
  rows.push('');
  
  // Summary
  rows.push('Summary');
  rows.push('Metric,Value');
  rows.push(`Total Revenue,$${data.revenue.total.toFixed(2)}`);
  rows.push(`Total Orders,${data.revenue.orders}`);
  rows.push(`Average Order Value,$${data.revenue.averageOrderValue.toFixed(2)}`);
  rows.push('');
  
  // Daily data
  if (data.dailyData && data.dailyData.length > 0) {
    rows.push('Daily Revenue');
    rows.push('Date,Revenue,Orders');
    data.dailyData.forEach(day => {
      rows.push(`${day.date},$${day.revenue.toFixed(2)},${day.orders}`);
    });
    rows.push('');
  }
  
  // Popular items
  if (data.popularItems && data.popularItems.length > 0) {
    rows.push('Popular Items');
    rows.push('Item Name,Orders,Revenue');
    data.popularItems.forEach(item => {
      rows.push(`"${item.name}",${item.orders},$${item.revenue.toFixed(2)}`);
    });
    rows.push('');
  }
  
  // Service breakdown
  if (data.serviceBreakdown && data.serviceBreakdown.length > 0) {
    rows.push('Service Type Breakdown');
    rows.push('Service Type,Revenue,Orders');
    data.serviceBreakdown.forEach(service => {
      rows.push(`${service.type},$${service.revenue.toFixed(2)},${service.orders}`);
    });
  }
  
  // Create CSV blob and download
  const csv = rows.join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `analytics-report-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export to Excel (XLSX format via CSV)
 * For better Excel support, consider using a library like xlsx or exceljs
 */
export function exportToExcel(data: ReportData): void {
  // For now, use CSV format which Excel can open
  // To implement true XLSX, would need to add 'xlsx' library
  exportToCSV(data);
}

/**
 * Generate PDF report (requires jsPDF)
 * This is a simplified version. For production, install jspdf library
 */
export async function exportToPDF(data: ReportData): Promise<void> {
  try {
    // Check if jsPDF is available
    const jsPDF = (window as any).jspdf?.jsPDF;
    
    if (!jsPDF) {
      console.warn('jsPDF not loaded. Falling back to CSV export.');
      exportToCSV(data);
      return;
    }

    const doc = new jsPDF();
    let yPosition = 20;
    
    // Title
    doc.setFontSize(20);
    doc.text(data.title, 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(data.period, 20, yPosition);
    yPosition += 15;
    
    // Summary
    doc.setFontSize(16);
    doc.text('Summary', 20, yPosition);
    yPosition += 10;
    
    doc.setFontSize(12);
    doc.text(`Total Revenue: $${data.revenue.total.toFixed(2)}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Total Orders: ${data.revenue.orders}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Average Order Value: $${data.revenue.averageOrderValue.toFixed(2)}`, 20, yPosition);
    yPosition += 15;
    
    // Popular Items
    if (data.popularItems && data.popularItems.length > 0) {
      doc.setFontSize(16);
      doc.text('Top 5 Popular Items', 20, yPosition);
      yPosition += 10;
      
      doc.setFontSize(10);
      data.popularItems.slice(0, 5).forEach((item, index) => {
        doc.text(
          `${index + 1}. ${item.name} - ${item.orders} orders - $${item.revenue.toFixed(2)}`,
          20,
          yPosition
        );
        yPosition += 7;
      });
      yPosition += 10;
    }
    
    // Save PDF
    doc.save(`analytics-report-${Date.now()}.pdf`);
    
  } catch (error) {
    console.error('PDF export failed:', error);
    console.warn('Falling back to CSV export');
    exportToCSV(data);
  }
}

/**
 * Print report
 */
export function printReport(data: ReportData): void {
  const printWindow = window.open('', '', 'width=800,height=600');
  
  if (!printWindow) {
    alert('Please allow popups to print the report');
    return;
  }
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${data.title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          padding: 40px;
          max-width: 800px;
          margin: 0 auto;
        }
        h1 { color: #f97316; margin-bottom: 10px; }
        h2 { color: #374151; margin-top: 30px; margin-bottom: 15px; }
        .subtitle { color: #6b7280; margin-bottom: 30px; }
        .summary { 
          background: #fef3c7; 
          padding: 20px; 
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .metric { margin-bottom: 10px; font-size: 16px; }
        .metric strong { display: inline-block; width: 200px; }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 30px;
        }
        th, td { 
          padding: 12px; 
          text-align: left; 
          border-bottom: 1px solid #e5e7eb;
        }
        th { 
          background: #f3f4f6; 
          font-weight: bold;
          color: #374151;
        }
        .footer {
          margin-top: 50px;
          padding-top: 20px;
          border-top: 2px solid #e5e7eb;
          text-align: center;
          color: #6b7280;
          font-size: 12px;
        }
        @media print {
          body { padding: 20px; }
        }
      </style>
    </head>
    <body>
      <h1>${data.title}</h1>
      <p class="subtitle">${data.period}</p>
      
      <h2>Summary</h2>
      <div class="summary">
        <div class="metric"><strong>Total Revenue:</strong> $${data.revenue.total.toFixed(2)}</div>
        <div class="metric"><strong>Total Orders:</strong> ${data.revenue.orders}</div>
        <div class="metric"><strong>Average Order Value:</strong> $${data.revenue.averageOrderValue.toFixed(2)}</div>
      </div>
      
      ${data.popularItems && data.popularItems.length > 0 ? `
        <h2>Popular Items</h2>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Item Name</th>
              <th>Orders</th>
              <th>Revenue</th>
            </tr>
          </thead>
          <tbody>
            ${data.popularItems.map((item, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${item.name}</td>
                <td>${item.orders}</td>
                <td>$${item.revenue.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      ${data.serviceBreakdown && data.serviceBreakdown.length > 0 ? `
        <h2>Service Type Breakdown</h2>
        <table>
          <thead>
            <tr>
              <th>Service Type</th>
              <th>Revenue</th>
              <th>Orders</th>
            </tr>
          </thead>
          <tbody>
            ${data.serviceBreakdown.map(service => `
              <tr>
                <td>${service.type}</td>
                <td>$${service.revenue.toFixed(2)}</td>
                <td>${service.orders}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : ''}
      
      <div class="footer">
        <p>Generated by Smart Menu Analytics Dashboard</p>
        <p>${new Date().toLocaleString()}</p>
      </div>
      
      <script>
        window.onload = function() {
          window.print();
          // Close window after printing (optional)
          // window.onafterprint = function() { window.close(); }
        }
      </script>
    </body>
    </html>
  `;
  
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * Format report data from API response
 */
export function formatReportData(
  revenueStats: any,
  popularItems: any[],
  period: string
): ReportData {
  return {
    title: 'Restaurant Analytics Report',
    period: period,
    revenue: {
      total: revenueStats?.summary?.total_revenue || 0,
      orders: revenueStats?.summary?.total_orders || 0,
      averageOrderValue: revenueStats?.summary?.average_order_value || 0
    },
    dailyData: revenueStats?.daily_data || [],
    popularItems: popularItems.map(item => ({
      name: item.name,
      orders: item.orders_count,
      revenue: item.revenue
    })),
    serviceBreakdown: revenueStats?.service_breakdown || []
  };
}

