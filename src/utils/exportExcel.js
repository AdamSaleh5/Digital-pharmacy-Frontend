import * as XLSX from 'xlsx'

/**
 * Export an array of objects to an Excel file
 * @param {Array<Object>} data - Rows (each object = row, keys = column headers)
 * @param {string} fileName - File name without extension
 */
export function exportToExcel(data, fileName = 'export') {
  if (!data || data.length === 0) {
    return
  }
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1')
  const name = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  XLSX.writeFile(workbook, name)
}
